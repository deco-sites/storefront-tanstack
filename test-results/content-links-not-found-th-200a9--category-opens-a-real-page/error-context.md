# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: content-links-not-found.spec.ts >> the PDP breadcrumb category opens a real page
- Location: tests/qa/content-links-not-found.spec.ts:19:1

# Error details

```
Error: /the-herd opens Not Found

expect(locator).toBeHidden() failed

Locator:  getByText('Not Found!', { exact: true })
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - /the-herd opens Not Found getByText('Not Found!', { exact: true }) with timeout 5000ms
  - waiting for getByText('Not Found!', { exact: true })
    14 × locator resolved to <span>Not Found!</span>
       - unexpected value "visible"

```

```yaml
- text: Not Found!
```

# Test source

```ts
  1  | // QA card (parity sweep, sweeper): "See all" links and the PDP breadcrumb must not open "Not Found!".
  2  | import { expect, test } from "@playwright/test";
  3  | 
  4  | async function expectRealPage(page: import("@playwright/test").Page, href: string) {
  5  |   await page.goto(href);
  6  |   await page.waitForLoadState("networkidle");
> 7  |   await expect(page.getByText("Not Found!", { exact: true }), `${href} opens Not Found`).toBeHidden();
     |                                                                                          ^ Error: /the-herd opens Not Found
  8  | }
  9  | 
  10 | test("home and footer 'See all' links open a real page", async ({ page }) => {
  11 |   await page.goto("/");
  12 |   const seeAll = page.getByRole("link", { name: "See all" });
  13 |   await seeAll.first().waitFor({ timeout: 15_000 });
  14 |   const hrefs = [...new Set(await seeAll.evaluateAll((as) => as.map((a) => a.getAttribute("href")!)))];
  15 |   expect(hrefs.length).toBeGreaterThan(0);
  16 |   for (const href of hrefs) await expectRealPage(page, href);
  17 | });
  18 | 
  19 | test("the PDP breadcrumb category opens a real page", async ({ page }) => {
  20 |   await page.goto("/men");
  21 |   const card = page.locator('a[href*="/products/"]').first();
  22 |   const listed = await card.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  23 |   test.skip(!listed, "Men listing has no products");
  24 |   await page.goto((await card.getAttribute("href"))!);
  25 |   // The breadcrumb is the list whose first link is "Home"; its second link is the product's category.
  26 |   const home = page.getByRole("link", { name: "Home", exact: true }).first();
  27 |   await home.waitFor({ timeout: 15_000 });
  28 |   const crumbs = page.locator(":is(ul,ol)").filter({ has: home }).first().getByRole("link");
  29 |   const href = await crumbs.nth(1).getAttribute("href");
  30 |   expect(href).toBeTruthy();
  31 |   await expectRealPage(page, href!);
  32 | });
  33 | 
```