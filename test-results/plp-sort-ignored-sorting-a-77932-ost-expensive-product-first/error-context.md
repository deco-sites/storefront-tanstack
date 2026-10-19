# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plp-sort-ignored.spec.ts >> sorting a category by Highest price lists the most expensive product first
- Location: tests/qa/plp-sort-ignored.spec.ts:14:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 5
+ Received  + 5

  Array [
+   289,
+   189,
+   329,
+   349,
+   389,
    689,
    589,
    449,
-   389,
-   349,
-   329,
-   289,
-   189,
  ]

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e6]:
        - list [ref=e8]:
          - listitem [ref=e9]:
            - paragraph [ref=e11]:
              - text: Hurry, offer ends soon! Save 10% today with code
              - strong [ref=e12]: NEW10
        - checkbox "Toggle searchbar Close search icon button"
        - generic [ref=e13]:
          - generic [ref=e14]:
            - link "Store logo" [ref=e16] [cursor=pointer]:
              - /url: /
              - img "Deco Storefront" [ref=e17]
            - generic "search icon button" [ref=e18]: Search products, brands...
            - generic [ref=e22]:
              - link "Login" [ref=e23] [cursor=pointer]:
                - /url: /login
                - generic [ref=e26]: Sign in
              - generic "open cart" [ref=e27]:
                - generic [ref=e28] [cursor=pointer]
          - list [ref=e32]:
            - listitem [ref=e33]:
              - link "Deals" [ref=e34] [cursor=pointer]:
                - /url: /deals
            - listitem [ref=e35]:
              - link "Valentine's Day" [ref=e36] [cursor=pointer]:
                - /url: /valentines-day
            - listitem [ref=e37]:
              - link "Women" [ref=e38] [cursor=pointer]:
                - /url: /women
            - listitem [ref=e39]:
              - link "Men" [ref=e40] [cursor=pointer]:
                - /url: /men
            - listitem [ref=e41]:
              - link "Clearance" [ref=e42] [cursor=pointer]:
                - /url: /clearance
            - listitem [ref=e43]:
              - link "Activities" [ref=e44] [cursor=pointer]:
                - /url: /activities
      - generic [ref=e47]:
        - list [ref=e49]:
          - listitem [ref=e50]:
            - link "Home" [ref=e51] [cursor=pointer]:
              - /url: /
          - listitem [ref=e52]:
            - link "accessories" [ref=e53] [cursor=pointer]:
              - /url: /accessories
        - checkbox [aria-hidden] [ref=e54]
        - generic [ref=e55]:
          - complementary [ref=e56]:
            - generic [ref=e57]: Filters
            - list [ref=e58]:
              - listitem [ref=e59]:
                - generic [ref=e60]: Availability
                - list [ref=e61]:
                  - link "In stock (8)" [ref=e62] [cursor=pointer]:
                    - /url: /accessories?filter.v.availability=In+stock
                    - checkbox [aria-hidden] [ref=e63]
                    - generic [ref=e64]: In stock
                    - generic [ref=e65]: (8)
                  - link "Out of stock" [ref=e66] [cursor=pointer]:
                    - /url: /accessories?filter.v.availability=Out+of+stock
                    - checkbox [aria-hidden] [ref=e67]
              - listitem [ref=e69]:
                - generic [ref=e70]: Product type
                - list [ref=e71]:
                  - link "Capybara wear (8)" [ref=e72] [cursor=pointer]:
                    - /url: /accessories?filter.p.product_type=Capybara+wear
                    - checkbox [aria-hidden] [ref=e73]
                    - generic [ref=e74]: Capybara wear
                    - generic [ref=e75]: (8)
              - listitem [ref=e76]:
                - generic [ref=e77]: More filters
                - list [ref=e78]:
                  - link "capy-2026 (8)" [ref=e79] [cursor=pointer]:
                    - /url: /accessories?filter.p.tag=capy-2026
                    - checkbox [aria-hidden] [ref=e80]
                    - generic [ref=e81]: capy-2026
                    - generic [ref=e82]: (8)
                  - link "new (3)" [ref=e83] [cursor=pointer]:
                    - /url: /accessories?filter.p.tag=new
                    - checkbox [aria-hidden] [ref=e84]
                    - generic [ref=e85]: new
                    - generic [ref=e86]: (3)
                  - link "onsen (2)" [ref=e87] [cursor=pointer]:
                    - /url: /accessories?filter.p.tag=onsen
                    - checkbox [aria-hidden] [ref=e88]
                    - generic [ref=e89]: onsen
                    - generic [ref=e90]: (2)
                  - link "rio (3)" [ref=e91] [cursor=pointer]:
                    - /url: /accessories?filter.p.tag=rio
                    - checkbox [aria-hidden] [ref=e92]
                    - generic [ref=e93]: rio
                    - generic [ref=e94]: (3)
                  - link "sol (3)" [ref=e95] [cursor=pointer]:
                    - /url: /accessories?filter.p.tag=sol
                    - checkbox [aria-hidden] [ref=e96]
                    - generic [ref=e97]: sol
                    - generic [ref=e98]: (3)
              - listitem [ref=e99]:
                - generic [ref=e100]: Brand
                - list [ref=e101]:
                  - link "deco (8)" [ref=e102] [cursor=pointer]:
                    - /url: /accessories?filter.p.vendor=deco
                    - checkbox [aria-hidden] [ref=e103]
                    - generic [ref=e104]: deco
                    - generic [ref=e105]: (8)
          - generic [ref=e106]:
            - generic [ref=e108]:
              - generic [ref=e109]: 12 of 8 results
              - generic [ref=e110]: Sort by
              - combobox "Sort by" [ref=e111]:
                - option "relevance:desc"
                - option "price:asc"
                - option "price:desc" [selected]
            - generic [ref=e112]:
              - generic [ref=e113]:
                - figure [ref=e114]:
                  - link "view product" [ref=e115] [cursor=pointer]:
                    - /url: /products/largo-sunglasses-48014291206321
                    - img "Largo Sunglasses in Tortoise/Green, worn by Tião, an adult capybara, close-up." [ref=e116]
                    - img "Largo Sunglasses in Lime/Smoke, worn by Tião, an adult capybara, close-up." [ref=e117]
                  - generic [ref=e118]:
                    - generic [ref=e119]: Notify me
                    - generic [ref=e120]: 0 % off
                  - button "Add to wishlist" [ref=e122] [cursor=pointer]
                - link "Largo Sunglasses R$ 289,00" [ref=e125] [cursor=pointer]:
                  - /url: /products/largo-sunglasses-48014291206321
                  - text: Largo Sunglasses
                  - generic [ref=e126]: R$ 289,00
                - list [ref=e128]:
                  - listitem [ref=e129]:
                    - 'radio "Color: Tortoise/Green" [checked] [ref=e130] [cursor=pointer]':
                      - generic [ref=e131]: Tortoise/Green
                  - listitem [ref=e132]:
                    - 'radio "Color: Lime/Smoke" [ref=e133] [cursor=pointer]':
                      - generic [ref=e134]: Lime/Smoke
                - button "Add to Cart" [ref=e136] [cursor=pointer]
              - generic [ref=e137]:
                - figure [ref=e138]:
                  - link "view product" [ref=e139] [cursor=pointer]:
                    - /url: /products/yuzu-bucket-hat-48014290518193
                    - img "Yuzu Bucket Hat in Yuzu, worn by Tião, an adult capybara, front view, a yuzu beside the paws." [ref=e140]
                    - img "Yuzu Bucket Hat in Steam White, worn by Tião, an adult capybara, close-up." [ref=e141]
                  - generic [ref=e142]:
                    - generic [ref=e143]: Notify me
                    - generic [ref=e144]: 0 % off
                  - button "Add to wishlist" [ref=e146] [cursor=pointer]
                - link "Yuzu Bucket Hat R$ 189,00" [ref=e149] [cursor=pointer]:
                  - /url: /products/yuzu-bucket-hat-48014290518193
                  - text: Yuzu Bucket Hat
                  - generic [ref=e150]: R$ 189,00
                - list [ref=e152]:
                  - listitem [ref=e153]:
                    - 'radio "Color: Yuzu" [checked] [ref=e154] [cursor=pointer]':
                      - generic [ref=e155]: Yuzu
                  - listitem [ref=e156]:
                    - 'radio "Color: Steam White" [ref=e157] [cursor=pointer]':
                      - generic [ref=e158]: Steam White
                  - listitem [ref=e159]:
                    - 'radio "Color: Lilac" [ref=e160] [cursor=pointer]':
                      - generic [ref=e161]: Lilac
                - button "Add to Cart" [ref=e163] [cursor=pointer]
              - generic [ref=e164]:
                - figure [ref=e165]:
                  - link "view product" [ref=e166] [cursor=pointer]:
                    - /url: /products/passeio-grazing-vest-48014291337393
                    - img "Passeio Grazing Vest in Sand, worn by Tião, an adult capybara, three-quarter view." [ref=e167]
                    - img "Passeio Grazing Vest in Marigold, worn by Tião, an adult capybara, front view, a sprig of grass in the side pocket." [ref=e168]
                  - generic [ref=e169]:
                    - generic [ref=e170]: Notify me
                    - generic [ref=e171]: 0 % off
                  - button "Add to wishlist" [ref=e173] [cursor=pointer]
                - link "Passeio Grazing Vest R$ 329,00" [ref=e176] [cursor=pointer]:
                  - /url: /products/passeio-grazing-vest-48014291337393
                  - text: Passeio Grazing Vest
                  - generic [ref=e177]: R$ 329,00
                - list [ref=e179]:
                  - listitem [ref=e180]:
                    - 'radio "Color: Sand" [checked] [ref=e181] [cursor=pointer]':
                      - generic [ref=e182]: Sand
                  - listitem [ref=e183]:
                    - 'radio "Color: Marigold" [ref=e184] [cursor=pointer]':
                      - generic [ref=e185]: Marigold
                - button "Add to Cart" [ref=e187] [cursor=pointer]
              - generic [ref=e188]:
                - figure [ref=e189]:
                  - link "view product" [ref=e190] [cursor=pointer]:
                    - /url: /products/passo-four-paw-sandals-48014291534001
                    - img "Passo Four-Paw Sandals in Terracotta, worn by Tião, an adult capybara, front view." [ref=e191]
                    - img "Passo Four-Paw Sandals in Charcoal, worn by Tião, an adult capybara, front view." [ref=e192]
                  - generic [ref=e193]:
                    - generic [ref=e194]: Notify me
                    - generic [ref=e195]: 0 % off
                  - button "Add to wishlist" [ref=e197] [cursor=pointer]
                - link "Passo Four-Paw Sandals R$ 349,00" [ref=e200] [cursor=pointer]:
                  - /url: /products/passo-four-paw-sandals-48014291534001
                  - text: Passo Four-Paw Sandals
                  - generic [ref=e201]: R$ 349,00
                - list [ref=e203]:
                  - listitem [ref=e204]:
                    - 'radio "Color: Terracotta" [checked] [ref=e205] [cursor=pointer]':
                      - generic [ref=e206]: Terracotta
                  - listitem [ref=e207]:
                    - 'radio "Color: Charcoal" [ref=e208] [cursor=pointer]':
                      - generic [ref=e209]: Charcoal
                - button "Add to Cart" [ref=e211] [cursor=pointer]
              - generic [ref=e212]:
                - figure [ref=e213]:
                  - link "view product" [ref=e214] [cursor=pointer]:
                    - /url: /products/sol-linen-poncho-48014290223281
                    - img "Sol Linen Poncho in Sand, worn by Tião, an adult capybara, front view." [ref=e215]
                    - img "Sol Linen Poncho in Lime, worn by Tião, an adult capybara, three-quarter side view." [ref=e216]
                  - generic [ref=e217]:
                    - generic [ref=e218]: Notify me
                    - generic [ref=e219]: 0 % off
                  - button "Add to wishlist" [ref=e221] [cursor=pointer]
                - link "Sol Linen Poncho R$ 389,00" [ref=e224] [cursor=pointer]:
                  - /url: /products/sol-linen-poncho-48014290223281
                  - text: Sol Linen Poncho
                  - generic [ref=e225]: R$ 389,00
                - list [ref=e227]:
                  - listitem [ref=e228]:
                    - 'radio "Color: Sand" [checked] [ref=e229] [cursor=pointer]':
                      - generic [ref=e230]: Sand
                  - listitem [ref=e231]:
                    - 'radio "Color: Lime" [ref=e232] [cursor=pointer]':
                      - generic [ref=e233]: Lime
                  - listitem [ref=e234]:
                    - 'radio "Color: Bone" [ref=e235] [cursor=pointer]':
                      - generic [ref=e236]: Bone
                - button "Add to Cart" [ref=e238] [cursor=pointer]
              - generic [ref=e239]:
                - figure [ref=e240]:
                  - link "view product" [ref=e241] [cursor=pointer]:
                    - /url: /products/onsen-waffle-robe-48014290813105
                    - img "Onsen Waffle Robe in Steam White, worn by Tião, an adult capybara, front view." [ref=e242]
                    - img "Onsen Waffle Robe in Lilac, worn by Tião, an adult capybara, front view." [ref=e243]
                  - generic [ref=e244]:
                    - generic [ref=e245]: Notify me
                    - generic [ref=e246]: 0 % off
                  - button "Add to wishlist" [ref=e248] [cursor=pointer]
                - link "Onsen Waffle Robe R$ 689,00" [ref=e251] [cursor=pointer]:
                  - /url: /products/onsen-waffle-robe-48014290813105
                  - text: Onsen Waffle Robe
                  - generic [ref=e252]: R$ 689,00
                - list [ref=e254]:
                  - listitem [ref=e255]:
                    - 'radio "Color: Steam White" [checked] [ref=e256] [cursor=pointer]':
                      - generic [ref=e257]: Steam White
                  - listitem [ref=e258]:
                    - 'radio "Color: Lilac" [ref=e259] [cursor=pointer]':
                      - generic [ref=e260]: Lilac
                - button "Add to Cart" [ref=e262] [cursor=pointer]
              - generic [ref=e263]:
                - figure [ref=e264]:
                  - link "view product" [ref=e265] [cursor=pointer]:
                    - /url: /products/rio-raincoat-48014289928369
                    - img "Rio Raincoat in Deep Green, worn by Tião, an adult capybara, front view." [ref=e266]
                    - img "Rio Raincoat in Marigold, worn by Tião, an adult capybara, front view." [ref=e267]
                  - generic [ref=e268]:
                    - generic [ref=e269]: Notify me
                    - generic [ref=e270]: 0 % off
                  - button "Add to wishlist" [ref=e272] [cursor=pointer]
                - link "Rio Raincoat R$ 589,00" [ref=e275] [cursor=pointer]:
                  - /url: /products/rio-raincoat-48014289928369
                  - text: Rio Raincoat
                  - generic [ref=e276]: R$ 589,00
                - list [ref=e278]:
                  - listitem [ref=e279]:
                    - 'radio "Color: Deep Green" [checked] [ref=e280] [cursor=pointer]':
                      - generic [ref=e281]: Deep Green
                  - listitem [ref=e282]:
                    - 'radio "Color: Marigold" [ref=e283] [cursor=pointer]':
                      - generic [ref=e284]: Marigold
                  - listitem [ref=e285]:
                    - 'radio "Color: Lime" [ref=e286] [cursor=pointer]':
                      - generic [ref=e287]: Lime
                - button "Add to Cart" [ref=e289] [cursor=pointer]
              - generic [ref=e290]:
                - figure [ref=e291]:
                  - link "view product" [ref=e292] [cursor=pointer]:
                    - /url: /products/boia-swim-vest-48014291009713
                    - img "Boia Swim Vest in Lime/Green, worn by Tião, an adult capybara, front view." [ref=e293]
                    - img "Boia Swim Vest in Pool Mint, worn by Tião, an adult capybara, front view." [ref=e294]
                  - generic [ref=e295]:
                    - generic [ref=e296]: Notify me
                    - generic [ref=e297]: 0 % off
                  - button "Add to wishlist" [ref=e299] [cursor=pointer]
                - link "Boia Swim Vest R$ 449,00" [ref=e302] [cursor=pointer]:
                  - /url: /products/boia-swim-vest-48014291009713
                  - text: Boia Swim Vest
                  - generic [ref=e303]: R$ 449,00
                - list [ref=e305]:
                  - listitem [ref=e306]:
                    - 'radio "Color: Lime/Green" [checked] [ref=e307] [cursor=pointer]':
                      - generic [ref=e308]: Lime/Green
                  - listitem [ref=e309]:
                    - 'radio "Color: Pool Mint" [ref=e310] [cursor=pointer]':
                      - generic [ref=e311]: Pool Mint
                - button "Add to Cart" [ref=e313] [cursor=pointer]
      - generic [ref=e317]:
        - generic [ref=e318]:
          - generic [ref=e319]: Get top deals, latest trends, and more.
          - generic [ref=e320]: Receive our news and promotions in advance. Enjoy and get 10% off your first purchase. For more information click here.
        - generic [ref=e321]:
          - textbox "Enter your email address" [ref=e322]
          - button "Sign up" [ref=e323] [cursor=pointer]
      - generic [ref=e327]:
        - list [ref=e328]:
          - listitem [ref=e329]:
            - link "Our Company" [ref=e330] [cursor=pointer]:
              - /url: "#"
            - list [ref=e331]:
              - listitem [ref=e332]:
                - link "About us" [ref=e333] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e334]:
                - link "Our blog" [ref=e335] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e336]:
                - link "Stores" [ref=e337] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e338]:
                - link "Work with us" [ref=e339] [cursor=pointer]:
                  - /url: "#"
          - listitem [ref=e340]:
            - link "Orders & Purchases" [ref=e341] [cursor=pointer]:
              - /url: "#"
            - list [ref=e342]:
              - listitem [ref=e343]:
                - link "Check order status" [ref=e344] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e345]:
                - link "Return and exchanges" [ref=e346] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e347]:
                - link "Product retail" [ref=e348] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e349]:
                - link "Gift cards" [ref=e350] [cursor=pointer]:
                  - /url: "#"
          - listitem [ref=e351]:
            - link "Support & Services" [ref=e352] [cursor=pointer]:
              - /url: "#"
            - list [ref=e353]:
              - listitem [ref=e354]:
                - link "Support Center" [ref=e355] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e356]:
                - link "Schedule a service" [ref=e357] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e358]:
                - link "Contact us" [ref=e359] [cursor=pointer]:
                  - /url: "#"
          - listitem [ref=e360]:
            - link "Support & Services" [ref=e361] [cursor=pointer]:
              - /url: "#"
            - list [ref=e362]:
              - listitem [ref=e363]:
                - link "Support Center" [ref=e364] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e365]:
                - link "Schedule a service" [ref=e366] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e367]:
                - link "Contact us" [ref=e368] [cursor=pointer]:
                  - /url: "#"
        - generic [ref=e369]:
          - list [ref=e370]:
            - listitem [ref=e371]:
              - link [ref=e372] [cursor=pointer]:
                - /url: "#"
                - img "facebook" [ref=e373]
            - listitem [ref=e374]:
              - link [ref=e375] [cursor=pointer]:
                - /url: "#"
                - img "Instagram" [ref=e376]
            - listitem [ref=e377]:
              - link [ref=e378] [cursor=pointer]:
                - /url: "#"
                - img "Pinterest" [ref=e379]
            - listitem [ref=e380]:
              - link [ref=e381] [cursor=pointer]:
                - /url: "#"
                - img "X" [ref=e382]
          - list [ref=e383]:
            - listitem [ref=e384]:
              - img "Paypal" [ref=e385]
            - listitem [ref=e386]:
              - img "Mastercard" [ref=e387]
            - listitem [ref=e388]:
              - img "Maestro" [ref=e389]
            - listitem [ref=e390]:
              - img "Google Pay" [ref=e391]
            - listitem [ref=e392]:
              - img "Elo" [ref=e393]
            - listitem [ref=e394]:
              - img "Diners" [ref=e395]
            - listitem [ref=e396]:
              - img "Apple Pay" [ref=e397]
            - listitem [ref=e398]:
              - img "Amex" [ref=e399]
            - listitem [ref=e400]:
              - img "Visa" [ref=e401]
        - separator [ref=e402]
        - generic [ref=e403]:
          - list [ref=e404]:
            - listitem [ref=e405]:
              - link "Privacy Policy" [ref=e406] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e407]:
              - link "Terms and Conditions" [ref=e408] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e409]:
              - link "Cookies Policy" [ref=e410] [cursor=pointer]:
                - /url: "#"
          - generic [ref=e411]: TM & © 2023 Deco Storefront, Inc.
          - generic [ref=e415]:
            - generic [ref=e416]: Powered by
            - link "Powered by deco.cx" [ref=e417] [cursor=pointer]:
              - /url: https://deco.cx?utm_source=storefront-tanstack
              - generic [ref=e418]: Powered by
              - generic [ref=e419]: deco.cx
  - checkbox [aria-hidden] [ref=e420]
  - generic "Close cart"
  - complementary "Cart" [ref=e421]:
    - generic [ref=e422]:
      - generic [ref=e423]:
        - heading "Your bag" [level=2] [ref=e424]
        - generic "Close cart" [ref=e425] [cursor=pointer]
      - generic [ref=e428]:
        - generic [ref=e429]: Your bag is empty
        - generic [ref=e430] [cursor=pointer]: Choose products
```

# Test source

```ts
  1  | // QA card (parity sweep, sweeper): choosing "Highest price" must reorder the listing.
  2  | import { expect, test } from "@playwright/test";
  3  | 
  4  | // Price of each product card, in the order the listing shows them.
  5  | const prices = (page: import("@playwright/test").Page) =>
  6  |   page.getByRole("link", { name: "view product" }).evaluateAll((links) =>
  7  |     links.map((a) => {
  8  |       const text = (a.closest(".card") as HTMLElement | null)?.innerText ?? "";
  9  |       const m = text.match(/R\$\s*([\d.]+,\d{2})/);
  10 |       return m ? Number(m[1]!.replace(/\./g, "").replace(",", ".")) : Number.NaN;
  11 |     }),
  12 |   );
  13 | 
  14 | test("sorting a category by Highest price lists the most expensive product first", async ({ page }) => {
  15 |   await page.goto("/accessories");
  16 |   const card = page.getByRole("link", { name: "view product" }).first();
  17 |   const listed = await card.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  18 |   test.skip(!listed, "Accessories listing has no products");
  19 |   const before = await prices(page);
  20 |   test.skip(new Set(before).size < 2, "fewer than two distinct prices: nothing to sort");
  21 |   await page.locator("select").first().selectOption({ label: "Highest price" });
  22 |   await expect(page).toHaveURL(/sort=/);
> 23 |   await expect.poll(() => prices(page), { timeout: 15_000 }).toEqual([...before].sort((a, b) => b - a));
     |                                                              ^ Error: expect(received).toEqual(expected) // deep equality
  24 | });
  25 | 
```