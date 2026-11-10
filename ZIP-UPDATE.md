# Owner ZIP integration — 10 November 2026

Imported the owner's lustry-website-updated.zip over production source afdf4001831a06eb065a9e2baf7276cfadc3e937, retaining its new navy/orange theme, 137 catalogue entries, 101 bag photographs and expanded categories. Supabase functions, migrations, project keys, bulk pricing logic and Cloudflare domain configuration are unchanged.

## Corrections before release

- All category filters now cover the full visible catalogue; added jerseys, accessories, gifts and stationery routes work on the homepage and shop.
- Removed unverified InStock/Product Offer schema and blanket 1/3-day delivery promises. Prices remain explicitly indicative because every supplied product has inventory_confirmed:false and its price field is demo_price.
- The supplied Google Merchant feed remains in the original attachment only. It is not deployed or submitted: its stock and delivery claims require Lustry confirmation first.
- Preserved eight earlier catalogue references for old URLs and saved demo bags. Seven are hidden from new browsing; the earlier Oversized T-shirt remains visible so all required T-shirt styles are available. Total: 145 stored references, 138 visible styles.
- Set prices and quantity labels distinguish a piece from a retail pack. Bulk enquiries still start at 25 pieces and pack enquiries round up to a valid set quantity.
- New-product quotation links preserve the exact SKU and use existing supported enquiry categories. Unknown materials require selection rather than assuming a fabric. Compatible Tote Studio links use the tote template; arbitrary bag models do not claim a matching backpack mockup.
- Added White swatches, restored demo-total labels, and explain saved selections omitted after a catalogue update.
- Fixed Studio/footer/offer contrast, kept printed bag details visible with contain-fit images, and corrected desktop campaign-button clipping at 768–1440px. Product details also wrap safely at 320px with wider fallback fonts, and indicative price units render correctly.
- CI reuses the hosted runner's installed Chrome/Chromium, with the existing Playwright installation as fallback; all test and deployment checks remain enabled.

## Validation

- 84 isolated backend tests passed; no real lead was created.
- 37 browser regression groups passed, including all seven product categories, the 101 bag image URLs, pack calculations, legacy references/cart, quote routing, Studio, callback, consent, discount boundaries and disabled checkout.
- Source reference/syntax and whitespace checks passed. Actual-font screenshots reviewed on mobile and desktop; campaign controls remain within their cards.
- Guarded Wrangler dry-runs and public-only bundle checks are performed before release; hosted verification checks the exact published source.
