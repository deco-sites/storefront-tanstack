// QA card (parity sweep, search-autocomplete): typing in the search popup must suggest products.
import { expect, test } from "@playwright/test";

test("typing a product name in the search popup shows a matching suggestion", async ({ page }) => {
  await page.goto("/");
  const firstCard = page.locator('main a[href*="/products/"]').filter({ hasText: /\S/ }).first();
  const listed = await firstCard.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  test.skip(!listed, "home shows no product to search for");
  const name = (await firstCard.innerText()).split("\n")[0]!.replace(/R\$.*/, "").trim();
  await page.getByText("Search products, brands...").first().click();
  const input = page.getByPlaceholder("What are you looking for?");
  await input.pressSequentially(name.split(" ")[0]!, { delay: 80 });
  // Suggestions render inside the search popup, below the input.
  const popup = page.locator(".modal").filter({ has: input });
  await expect(popup.locator('a[href*="/products/"]').first()).toBeVisible({ timeout: 10_000 });
});
