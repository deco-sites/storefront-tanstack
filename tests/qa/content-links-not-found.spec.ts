// QA card (parity sweep, sweeper): "See all" links and the PDP breadcrumb must not open "Not Found!".
import { expect, test } from "@playwright/test";

async function expectRealPage(page: import("@playwright/test").Page, href: string) {
  await page.goto(href);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Not Found!", { exact: true }), `${href} opens Not Found`).toBeHidden();
}

test("home and footer 'See all' links open a real page", async ({ page }) => {
  await page.goto("/");
  const seeAll = page.getByRole("link", { name: "See all" });
  await seeAll.first().waitFor({ timeout: 15_000 });
  const hrefs = [...new Set(await seeAll.evaluateAll((as) => as.map((a) => a.getAttribute("href")!)))];
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) await expectRealPage(page, href);
});

test("the PDP breadcrumb category opens a real page", async ({ page }) => {
  await page.goto("/men");
  const card = page.locator('a[href*="/products/"]').first();
  const listed = await card.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  test.skip(!listed, "Men listing has no products");
  await page.goto((await card.getAttribute("href"))!);
  // The breadcrumb is the list whose first link is "Home"; its second link is the product's category.
  const home = page.getByRole("link", { name: "Home", exact: true }).first();
  await home.waitFor({ timeout: 15_000 });
  const crumbs = page.locator(":is(ul,ol)").filter({ has: home }).first().getByRole("link");
  const href = await crumbs.nth(1).getAttribute("href");
  expect(href).toBeTruthy();
  await expectRealPage(page, href!);
});
