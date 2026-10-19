// QA card (parity sweep, sweeper): a double-click on "Add to cart" must add one unit, not two.
import { expect, test } from "@playwright/test";

test("double-clicking Add to cart on a PDP puts one unit in the cart", async ({ page }) => {
  // Reach an in-stock product the way a shopper would: the first card of the Men listing.
  await page.goto("/men");
  const card = page.locator('a[href*="/products/"]').first();
  const listed = await card.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  test.skip(!listed, "Men listing has no products");
  await page.goto((await card.getAttribute("href"))!);
  const add = page.getByRole("button", { name: "Add to cart", exact: true });
  const buyable = await add.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  test.skip(!buyable, "product has no Add to cart button (out of stock?)");
  await add.dblclick();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3_000);
  // Read the cart as the server holds it, not the optimistic UI.
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Increase quantity" }).first().waitFor({ state: "attached" });
  const qty = page.getByRole("button", { name: "Increase quantity" }).first().locator("xpath=preceding-sibling::span[1]");
  await expect(qty).toHaveText("1");
});
