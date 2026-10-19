// QA card: changing the color must keep the size the shopper chose.
import { expect, test } from "@playwright/test";

test("Adult, then Lilac, lands on Lilac / Adult — not back on Pup", async ({ page }) => {
  const res = await page.goto("/products/yuzu-bucket-hat-48014290518193"); // Yuzu / Pup
  test.skip(!res || res.status() >= 400, "product no longer in the catalog");
  const adult = page.getByText("Adult", { exact: true }).first();
  test.skip(!(await adult.waitFor({ timeout: 15_000 }).then(() => true, () => false)), "size Adult no longer offered");
  await adult.click();
  await expect(page).toHaveURL(/48014290550961/); // Yuzu / Adult
  await page.getByText("Lilac", { exact: true }).first().click();
  await expect(page).toHaveURL(/48014290747569/); // Lilac / Adult (Lilac / Pup is 48014290714801)
});
