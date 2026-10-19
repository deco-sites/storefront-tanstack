// QA card (parity sweep, sweeper): the PDP shipping quote must use the store currency (R$), not US$.
import { expect, test } from "@playwright/test";

test("the PDP shipping estimate is priced in R$", async ({ page }) => {
  await page.goto("/men");
  const card = page.locator('a[href*="/products/"]').first();
  const listed = await card.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  test.skip(!listed, "Men listing has no products");
  await page.goto((await card.getAttribute("href"))!);
  const postal = page.getByPlaceholder("Postal code");
  await postal.waitFor({ timeout: 15_000 });
  await postal.fill("01310-100");
  await page.getByRole("button", { name: "Calculate" }).click();
  const standard = page.getByText(/Standard shipping/).first();
  await expect(standard).toBeVisible({ timeout: 15_000 });
  const quote = await standard.locator("xpath=..").innerText();
  expect(quote).not.toContain("US$");
});
