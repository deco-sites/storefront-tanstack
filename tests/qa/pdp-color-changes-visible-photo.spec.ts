// QA card: choosing a color must change the photo the shopper SEES, not just the DOM order.
// Asserts on the image actually painted in the main gallery slot (in the viewport and on top
// at its centre) — the earlier test read the first <img> in the DOM and passed while the
// screen kept showing the yellow hat.
import { expect, type Page, test } from "@playwright/test";

const visibleMainPhoto = (page: Page) =>
  page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const shown = [...document.querySelectorAll("img")].filter((img) => {
      const r = img.getBoundingClientRect();
      if (r.width < 300 || r.left < 0 || r.right > vw || r.top >= vh || r.bottom <= 0) return false;
      const top = document.elementFromPoint(r.left + r.width / 2, Math.max(1, Math.min(vh - 1, r.top + r.height / 2)));
      return !!top && (top === img || img.contains(top) || top.contains(img));
    });
    shown.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
    return shown[0]?.currentSrc ?? "";
  });

test("choosing Lilac shows the lilac photo in the main gallery slot", async ({ page }) => {
  const res = await page.goto("/products/yuzu-bucket-hat-48014290518193");
  test.skip(!res || res.status() >= 400, "product no longer in the catalog");
  const lilac = page.getByText("Lilac", { exact: true }).first();
  test.skip(!(await lilac.waitFor({ timeout: 15_000 }).then(() => true, () => false)), "Lilac no longer offered");
  await expect.poll(() => visibleMainPhoto(page)).not.toBe("");
  await lilac.click();
  await expect.poll(() => visibleMainPhoto(page), { timeout: 10_000 }).toMatch(/lila/);
  await page.getByText("Steam White", { exact: true }).first().click();
  await expect.poll(() => visibleMainPhoto(page), { timeout: 10_000 }).toMatch(/steam/);
});
