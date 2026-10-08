/**
 * Runs one harness case (page, flow or text) in Playwright and returns the
 * artifacts: screenshots (PNG buffers) and a JSON snapshot.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DETERMINISM = fs.readFileSync(path.join(here, "determinism.js"), "utf8");

const VOLATILE_HEADERS_DEFAULT = ["date", "connection", "keep-alive", "transfer-encoding", "content-length", "x-request-id", "x-trace-id", "server-timing", "age", "etag", "report-to", "nel", "cf-ray", "x-cache", "x-cache-reason", "set-cookie"];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MASKED_HEADERS = new Set(["x-cache-version"]);

export function headerSnapshot(headers, ignore) {
  const skip = new Set([...VOLATILE_HEADERS_DEFAULT, ...(ignore ?? [])].map((h) => h.toLowerCase()));
  const out = {};
  for (const k of Object.keys(headers).map((h) => h.toLowerCase()).sort()) {
    if (skip.has(k)) continue;
    // Per-build id (git sha of the build): presence is asserted, value masked.
    out[k] = MASKED_HEADERS.has(k) ? "<build-id>" : headers[k];
  }
  const sc = headers["set-cookie"];
  if (sc) out["set-cookie(names)"] = sc.split("\n").map((c) => c.split("=")[0].trim()).sort();
  return out;
}

/** Extract SEO-relevant <head> data + JSON-LD from an HTML string (runs in page). */
function extractSeoInPage(html) {
  const doc = html == null ? document : new DOMParser().parseFromString(html, "text/html");
  const KEEP_LINK = new Set(["canonical", "alternate", "icon", "shortcut icon", "apple-touch-icon", "manifest", "prev", "next", "preconnect", "dns-prefetch"]);
  const head = {
    lang: doc.documentElement.getAttribute("lang"),
    dataTheme: doc.documentElement.getAttribute("data-theme"),
    title: doc.title,
    meta: [...doc.querySelectorAll("meta")]
      .map((m) => {
        const o = {};
        for (const a of ["charset", "name", "property", "http-equiv", "itemprop", "content"]) if (m.hasAttribute(a)) o[a] = m.getAttribute(a);
        return o;
      })
      .filter((o) => Object.keys(o).length),
    links: [...doc.querySelectorAll("link[rel]")]
      .filter((l) => KEEP_LINK.has(l.getAttribute("rel").toLowerCase()))
      .map((l) => {
        const o = { rel: l.getAttribute("rel"), href: l.getAttribute("href") };
        for (const a of ["hreflang", "type", "sizes", "media", "crossorigin"]) if (l.hasAttribute(a)) o[a] = l.getAttribute(a);
        return o;
      }),
  };
  const jsonLd = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
    try {
      return JSON.parse(s.textContent);
    } catch {
      return { __unparseable: s.textContent };
    }
  });
  return { head, jsonLd };
}

/** Stand-in for the lilstts SDK (window.stonks): records calls instead of sending beacons. */
const ANALYTICS_STUB = `(() => {
  const rec = (e) => { try { window.__parityAnalytics(e); } catch {} };
  const sorted = (o) => o && typeof o === "object" ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]])) : o;
  window.stonks = {
    view: (props) => rec({ type: "view", path: location.pathname + location.search, props: sorted(props) }),
    event: (name, props) => rec({ type: "event", name, path: location.pathname + location.search, props: sorted(props) }),
  };
})();`;

/**
 * Analytics calls -> snapshot. Pageviews keep their order (one per load / SPA
 * navigation). Events are compared as a sorted, de-duplicated set: view-type
 * events fire from IntersectionObservers, so their count and order depend on
 * scroll timing, while *which* events fire with *which* payloads is the contract.
 */
function analyticsSnapshot(calls) {
  const views = calls.filter((c) => c.type === "view").map((c) => ({ path: c.path, props: c.props }));
  const events = [...new Set(calls.filter((c) => c.type === "event").map((c) => JSON.stringify({ name: c.name, path: c.path, props: c.props })))].sort().map((s) => JSON.parse(s));
  return { views, events };
}

function normalize(value, origin) {
  const s = JSON.stringify(value);
  return JSON.parse(s.split(origin).join("{origin}").split(encodeURIComponent(origin)).join("{origin}"));
}

/**
 * Network-quiet tracker. Playwright's "networkidle" counts a request as in
 * flight until its body is consumed; this site's wishlist invoke returns 404s
 * whose bodies the client never reads, so networkidle would never fire. Here a
 * request is done once its response headers arrive (or it fails).
 */
function trackNetwork(page) {
  const inflight = new Set();
  let lastChange = Date.now();
  const add = (r) => { inflight.add(r); lastChange = Date.now(); };
  const del = (r) => { if (inflight.delete(r)) lastChange = Date.now(); };
  page.on("request", add);
  page.on("response", (res) => del(res.request()));
  page.on("requestfinished", del);
  page.on("requestfailed", del);
  page.__parityQuiet = async (timeout = 30_000, quietMs = 600) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (inflight.size === 0 && Date.now() - lastChange >= quietMs) return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  };
}

async function settle(page, opts = {}) {
  const idle = async (timeout = 30_000) => {
    await page.__parityQuiet(timeout);
  };
  await idle();
  if (opts.scroll !== false) {
    // Walk the page so IntersectionObserver-deferred sections and lazy images
    // load; repeat while deferred content keeps growing the page.
    const step = Math.floor((page.viewportSize()?.height ?? 800) * 0.8);
    let lastH = -1;
    for (let round = 0; round < 6; round++) {
      const h0 = await page.evaluate(() => document.documentElement.scrollHeight);
      if (h0 === lastH) break;
      for (let y = 0; y <= h0; y += step) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(120);
      }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await idle(30_000);
      lastH = h0;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await idle();
  await page.evaluate(async () => {
    await document.fonts.ready;
    const imgs = [...document.images];
    await Promise.all(
      imgs.map(async (img) => {
        img.loading = "eager";
        if (!img.complete) await new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); setTimeout(r, 10_000); });
        try { await img.decode(); } catch {}
      }),
    );
  });
  // Layout must be stable: same height on consecutive frames.
  let last = -1;
  for (let i = 0; i < 20; i++) {
    const h = await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(document.documentElement.scrollHeight)))));
    if (h === last) break;
    last = h;
    await page.waitForTimeout(150);
  }
  await idle(5_000);
}

export function makeContextOptions(manifest, vpName) {
  const vp = manifest.viewports[vpName];
  return {
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor ?? 1,
    isMobile: !!vp.isMobile,
    hasTouch: !!vp.hasTouch,
    userAgent: vp.userAgent,
    locale: manifest.locale ?? "en-US",
    timezoneId: manifest.timezone ?? "UTC",
    colorScheme: "light",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  };
}

/**
 * @param {object} p
 * @param {import('playwright').Browser} p.browser
 * @param {object} p.manifest
 * @param {object} p.kase  expanded case
 * @param {string} p.baseURL
 * @param {"record"|"replay"} p.mode
 * @param {string} p.harPath
 */
export async function runCase({ browser, manifest, kase, baseURL, mode, harPath, log }) {
  const origin = new URL(baseURL).origin;
  const screenshots = [];
  const snapshot = { id: kase.id };

  if (kase.kind === "text") {
    const ctx = await browser.newContext({ userAgent: manifest.viewports.desktop.userAgent });
    const res = await ctx.request.get(baseURL + kase.path, { maxRedirects: 0, failOnStatusCode: false });
    const headers = res.headers();
    snapshot.status = res.status();
    snapshot.headers = headerSnapshot(headers, manifest.ignoreHeaders);
    const ct = headers["content-type"] ?? "";
    const body = await res.text();
    if (/html/.test(ct) && !kase.keepHtml) snapshot.body = "(html omitted; covered by screenshots)";
    else snapshot.body = body;
    await ctx.close();
    return { screenshots, snapshot: normalize(snapshot, origin) };
  }

  const ctx = await browser.newContext(makeContextOptions(manifest, kase.viewport));
  await ctx.clock.setFixedTime(new Date(manifest.fixedTime));
  await ctx.addInitScript({ content: DETERMINISM.replaceAll("__PARITY__", JSON.stringify({ seed: manifest.randomSeed })) });

  const thirdParty = new Set();
  const isThirdParty = (u) => /^https?:/.test(u) && !u.startsWith(origin);
  // Route precedence: the LAST registered handler runs first.
  // 3rd: in replay, a third-party request the HAR does not have is aborted
  //      and listed (routeFromHAR's own notFound:"abort" hangs the request).
  const harMisses = new Set();
  const thirdPartyRe = new RegExp(`^(?!${escapeRe(origin)})https?://`);
  if (mode !== "record") {
    await ctx.route(thirdPartyRe, (route) => {
      const u = new URL(route.request().url());
      harMisses.add(`${route.request().method()} ${u.origin}${u.pathname}`);
      return route.abort("internetdisconnected");
    });
  }
  // 2nd: replay (or record, in record mode) from the per-case HAR.
  await ctx.routeFromHAR(harPath, {
    url: thirdPartyRe,
    update: mode === "record",
    updateContent: "embed",
    updateMode: "minimal",
    notFound: "fallback",
  });
  // 1st: blocked hosts (analytics) never leave the browser, in either mode.
  for (const pattern of manifest.thirdParty?.block ?? []) {
    await ctx.route(pattern, (route) => route.abort("blockedbyclient"));
  }
  // 0th: the analytics SDK script is replaced by a recorder exposing the same
  // `window.stonks.{view,event}` API, so the analytics contract (pageviews on
  // load + SPA navigations, DECO.events forwarded with params) is snapshotted
  // without any beacon leaving the browser.
  const analytics = [];
  if (manifest.analyticsStub?.script) {
    await ctx.exposeBinding("__parityAnalytics", (_src, entry) => { analytics.push(entry); });
    await ctx.route(manifest.analyticsStub.script, (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: ANALYTICS_STUB }));
  }
  ctx.on("request", (r) => {
    if (!isThirdParty(r.url())) return;
    const u = new URL(r.url());
    thirdParty.add(`${r.method()} ${u.origin}${u.pathname}`);
  });

  const page = await ctx.newPage();
  trackNetwork(page);
  if (process.env.PARITY_DEBUG) {
    const t0 = Date.now();
    const ts = () => ((Date.now() - t0) / 1000).toFixed(1);
    page.on("request", (r) => log(`    ${ts()} > ${r.method()} ${r.url().slice(0, 120)}`));
    page.on("requestfinished", (r) => log(`    ${ts()} < ${r.url().slice(0, 120)}`));
    page.on("requestfailed", (r) => log(`    ${ts()} x ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
  }
  page.setDefaultTimeout(30_000);
  const flowSnap = {};
  let n = 0;

  const capture = async (name, opts = {}) => {
    await settle(page, opts);
    // Visual stability: keep shooting until two consecutive frames are
    // byte-identical (drawers/badges settling after a click).
    const shoot = () => page.screenshot({ fullPage: opts.fullPage !== false, animations: "disabled", caret: "hide", scale: "css" });
    let buf = await shoot();
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(250);
      const next = await shoot();
      if (next.equals(buf)) break;
      buf = next;
    }
    const dom = await page.evaluate(extractSeoInPage, null);
    const u = new URL(page.url());
    screenshots.push({ name, buf });
    flowSnap[name] = { url: u.pathname + u.search, title: dom.head.title };
    n++;
    return dom;
  };

  const gotoAndRecord = async (p) => {
    const res = await page.goto(baseURL + p, { waitUntil: "load" });
    const html = res ? await res.text().catch(() => null) : null;
    return { res, html };
  };

  try {
    if (kase.kind === "page") {
      const { res, html } = await gotoAndRecord(kase.path);
      snapshot.status = res?.status() ?? null;
      snapshot.headers = res ? headerSnapshot(await res.allHeaders(), manifest.ignoreHeaders) : null;
      snapshot.ssr = html ? await page.evaluate(extractSeoInPage, html) : null;
      const dom = await capture("page", { fullPage: kase.fullPage !== false });
      snapshot.dom = dom;
      const u = new URL(page.url());
      snapshot.finalUrl = u.pathname + u.search;
    } else if (kase.kind === "flow") {
      snapshot.steps = flowSnap;
      snapshot.values = {};
      for (const step of kase.steps) {
        if (step.viewports && !step.viewports.includes(kase.viewport)) continue;
        const [op, arg] = Object.entries(step).find(([k]) => !["fullPage", "timeout", "scroll", "optional", "viewports"].includes(k));
        const t = step.timeout ?? 30_000;
        try {
          switch (op) {
            case "goto": {
              const { res } = await gotoAndRecord(arg);
              snapshot.values[`status:${arg}`] = res?.status() ?? null;
              await settle(page, { scroll: false });
              break;
            }
            case "click": await page.locator(arg).first().click({ timeout: t }); break;
            case "fill": await page.locator(arg[0]).first().fill(arg[1], { timeout: t }); break;
            case "type": await page.locator(arg[0]).first().pressSequentially(arg[1], { delay: 30, timeout: t }); break;
            case "press": await page.locator(arg[0]).first().press(arg[1], { timeout: t }); break;
            case "select": await page.locator(arg[0]).first().selectOption(arg[1], { timeout: t }); break;
            case "check": await page.locator(arg).first().check({ timeout: t }); break;
            case "hover": await page.locator(arg).first().hover({ timeout: t }); break;
            case "waitFor": await page.locator(arg).first().waitFor({ state: "visible", timeout: t }); break;
            case "waitForURL": await page.waitForURL(arg, { timeout: t }); break;
            case "settle": await settle(page, { scroll: step.scroll }); break;
            case "capture": await capture(arg, { fullPage: step.fullPage, scroll: step.scroll }); break;
            case "url": { const u = new URL(page.url()); snapshot.values[arg] = u.pathname + u.search; break; }
            case "attr": {
              const v = await page.locator(arg.selector).first().getAttribute(arg.attr, { timeout: t });
              snapshot.values[arg.name] = v;
              break;
            }
            case "text": {
              snapshot.values[arg.name] = (await page.locator(arg.selector).first().innerText({ timeout: t })).trim();
              break;
            }
            case "count": {
              snapshot.values[arg.name] = await page.locator(arg.selector).count();
              break;
            }
            default: throw new Error(`unknown step op ${op}`);
          }
        } catch (err) {
          if (step.optional) { snapshot.values[`skipped:${op}`] = true; continue; }
          throw new Error(`step ${JSON.stringify(step)} failed: ${err.message.split("\n")[0]}`);
        }
      }
    }
  } finally {
    if (manifest.analyticsStub?.script) snapshot.analytics = analyticsSnapshot(analytics);
    snapshot.thirdPartyRequests = [...thirdParty].sort();
    if (harMisses.size) snapshot.harMisses = [...harMisses].sort();
    await ctx.close(); // flushes HAR in record mode
  }
  return { screenshots, snapshot: normalize(snapshot, origin) };
}
