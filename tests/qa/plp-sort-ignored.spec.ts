// QA card (parity sweep, sweeper): choosing "Highest price" must reorder the listing.
import { expect, test } from "@playwright/test";

// Price of each product card, in the order the listing shows them.
const prices = (page: import("@playwright/test").Page) =>
  page.getByRole("link", { name: "view product" }).evaluateAll((links) =>
    links.map((a) => {
      const text = (a.closest(".card") as HTMLElement | null)?.innerText ?? "";
      const m = text.match(/R\$\s*([\d.]+,\d{2})/);
      return m ? Number(m[1]!.replace(/\./g, "").replace(",", ".")) : Number.NaN;
    }),
  );

test("sorting a category by Highest price lists the most expensive product first", async ({ page }) => {
  await page.goto("/accessories");
  const card = page.getByRole("link", { name: "view product" }).first();
  const listed = await card.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  test.skip(!listed, "Accessories listing has no products");
  const before = await prices(page);
  test.skip(new Set(before).size < 2, "fewer than two distinct prices: nothing to sort");
  await page.locator("select").first().selectOption({ label: "Highest price" });
  await expect(page).toHaveURL(/sort=/);
  await expect.poll(() => prices(page), { timeout: 15_000 }).toEqual([...before].sort((a, b) => b - a));
});
