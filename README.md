# Lustry — V8 catalogue and manufacturing enquiries

The existing luxury V8 frontend is retained: an ivory, near-black, champagne-gold identity with original Lustry branding and existing forest accents. This is a static website; Supabase hosts the existing enquiry backend.

- Work branch: `v8-preview`.
- Production branch: `main` (release approval required).
- Production domain: https://lustry.in
- Existing preview: https://lustryhelpline-afk.github.io/lustry-website/
- New Workers preview: https://v8-preview-lustry-website.lustryhelpline.workers.dev (its enquiry origin still needs backend allowlist approval).

## Local development

Node.js 22 or newer is required.

```sh
npm ci
npm run check
npm run build:preview
npm run deploy:dry-run
npm run preview
```

The local Wrangler preview serves the built public bundle on port 8787. See [DEPLOYMENT.md](DEPLOYMENT.md) for Cloudflare Workers commands, dashboard configuration, preview isolation and production safeguards. No framework rebuild or new hosting provider is needed.

## Implemented behaviour

- Searchable catalogue, category/style filters, sorting, product detail and a visitor-local demo bag.
- T-Shirts contains Round Neck, Polo, Oversized and Dry-Fit; Polo is not a main category.
- Hoodies & Sweatshirts, Bags & Backpacks, and a quotation-only Corporate Merchandise section.
- Manufacturing enquiry starts at 25 pieces; discounts are 100–199: 5%, 200–499: 20%, 500+: 25%.
- Estimator reads active category pricing from the existing `product_prices` table. It explicitly remains category-level, not an approved specification-specific quote.
- Existing `submit-order` request contract and checked-in function remain unchanged. A saved reference is required before showing a successful enquiry.
- Callback popup, manual trigger, consent, configured endpoint and request payload are preserved, with stronger browser validation and duplicate-submit handling.
- Chat uses the existing optional AI endpoint when it returns a valid reply and otherwise falls back to clearly labelled FAQs. No paid service is provisioned.
- Browser-only Design Studio for T-shirts, totes and backpacks: styles, fabric/GSM, colour, logo/reference image, text, placement, front/back preview, design brief and handoff to manufacturing enquiry.

## Retail and artwork boundaries

All current catalogue products have unconfirmed inventory. Numeric retail prices are marked demo prices; they are not approved Lustry offers. Quantity 1 is allowed in the demo bag, but no retail order or payment is created. Checkout remains disabled. No same-day delivery or stock claim is made.

Studio images are local previews only. PNG/JPEG/WebP files stay in the visitor's browser, are not stored in browser storage, and are not uploaded or sent with the enquiry. Only the text/specification brief transfers through session storage. AI image generation is not connected; mockups are never labelled production-ready artwork. Original files must be coordinated with Lustry after enquiry submission.

The demo bag uses local storage. Studio-to-enquiry transfer uses session storage and is read only when explicitly arriving from the studio. Neither stores customer contact details.

## Supabase configuration

`js/config.js` is intentionally public and contains only the project URL, public publishable key, function names and contact details. Preserve the existing Supabase project and business workflow. Private service-role keys, AI keys and payment credentials must never be added to frontend code.

No database migration or Supabase function deployment is part of this revision. The uploaded V8.2 ZIP contains additional callback/AI source and proposed SQL not present in the baseline repository. Those are reference material, not evidence that their schemas or deployment settings match the live service. Do not run them blindly.

The checked-in `submit-order` source specifies a single origin, while live preflights observed both existing origins being accepted. Reconcile the deployed function source/settings before any future backend release. New Workers preview URLs also need their exact origin checked against that live policy.

## Verification

```sh
npx playwright install chromium
npm test
```

`npm test` builds preview assets and runs browser regression tests with external requests blocked and backend responses mocked. To use an existing browser, set `LUSTRY_CHROMIUM_PATH` to its executable. No real enquiry/callback is submitted by these tests. Local syntax/reference checks and Wrangler dry runs do not require Cloudflare credentials.

See [LAUNCH-READINESS.md](LAUNCH-READINESS.md) for the changes, test evidence and remaining launch dependencies. See [ASSET_GUIDE.md](ASSET_GUIDE.md) for the actual asset layout. Production publishing, DNS changes, checkout and paid services require explicit owner approval.
