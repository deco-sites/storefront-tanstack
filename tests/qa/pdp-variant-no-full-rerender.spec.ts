// QA card (parity rerender): choosing a size on the PDP must update the product, not re-render the page.
import { expect, test } from "@playwright/test";

test("choosing another size keeps the header mounted and never blanks the page", async ({ page }) => {
  const res = await page.goto("/products/yuzu-bucket-hat-48014290518193");
  test.skip(!res || res.status() >= 400, "product no longer in the catalog");
  const size = page.getByText("Adult", { exact: true }).first();
  const offered = await size.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  test.skip(!offered, "size Adult no longer offered");

  // Tag the live header element and watch for any frame where the product title disappears.
  await page.evaluate(() => {
    const w = window as unknown as { __header?: Element | null; __titleGone?: boolean };
    w.__header = document.querySelector("header");
    w.__titleGone = false;
    const title = () => Boolean(document.querySelector("h1")?.textContent?.trim());
    new MutationObserver(() => {
      if (!title()) w.__titleGone = true;
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });

  await size.click();
  await expect(page).toHaveURL(/48014290550961/);
  await page.waitForTimeout(2_500);

  const state = await page.evaluate(() => {
    const w = window as unknown as { __header?: Element | null; __titleGone?: boolean };
    return { sameHeader: w.__header === document.querySelector("header") && Boolean(w.__header?.isConnected), titleGone: w.__titleGone };
  });
  expect(state.sameHeader, "header was unmounted and rebuilt").toBe(true);
  expect(state.titleGone, "the product title disappeared (skeleton/blank page) during the switch").toBe(false);
});
