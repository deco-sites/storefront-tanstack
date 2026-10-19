// QA card (parity sweep, menu-links): the "Women" menu category must list products.
import { expect, test } from "@playwright/test";

test("the Women category from the header lists at least one product", async ({ page }) => {
  await page.goto("/");
  await page.locator("header").getByRole("link", { name: "Women", exact: true }).first().click();
  await expect(page).toHaveURL(/\/women/);
  await expect(page.locator('main a[href*="/products/"]').first()).toBeVisible({ timeout: 15_000 });
});
