// QA card (parity sweep, sweeper): opening the bag must not scroll the page to the footer.
import { expect, test } from "@playwright/test";

test("opening the minicart keeps the page where the shopper was", async ({ page }) => {
  await page.goto("/");
  const bag = page.getByLabel("open cart");
  await bag.waitFor({ timeout: 15_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await bag.click();
  await expect(page.getByText("Your bag", { exact: true })).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
});
