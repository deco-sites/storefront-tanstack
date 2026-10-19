// QA card (parity sweep, a11y-axe image-alt / audit-images): every image on the home needs an alt attribute.
import { expect, test } from "@playwright/test";

test("home images all carry an alt attribute", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const total = await page.locator("img").count();
  expect(total).toBeGreaterThan(5); // floor: a page that rendered no images proves nothing
  const missing = await page.locator("img:not([alt])").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).src));
  expect(missing).toEqual([]);
});
