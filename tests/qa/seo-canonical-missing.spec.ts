// QA card (parity sweep, audit-seo): every page must declare <link rel="canonical"> in the server HTML.
import { expect, test } from "@playwright/test";

for (const path of ["/", "/men"]) {
  test(`${path} serves a canonical link`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    expect(html).toMatch(/<link[^>]+rel="canonical"/);
  });
}
