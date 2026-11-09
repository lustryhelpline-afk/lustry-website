# Lustry Classic storefront — 9 November 2026

The owner approved a fuller, professional shopping layout inspired by Printo's category navigation and campaign structure, with Lustry's own classic luxury colour palette. The brand logo, real reference photography and working enquiry system remain in place. No competitor copy or imagery was imported.

## Result

- Warm ivory, deep navy and champagne detailing, restrained Cormorant display headings and readable Manrope interface text. The shared theme covers navigation, catalogue, product details, forms, cart, Studio, callback and FAQ.
- Desktop catalogue search is visible in the header. Mobile keeps compact navigation and an explicit search toggle. Correct calling number +91 92673 73084 remains separate from WhatsApp +91 91190 76674.
- Four photographic category shortcuts: T-Shirts; Hoodies & Sweatshirts; Bags & Backpacks; Corporate Merchandise. Round Neck, Polo, Oversized and Dry-Fit remain under T-Shirts.
- Paired apparel and bags campaigns, a curated four-style apparel edit, a separate bags collection and a quotation-only corporate merchandise panel. Custom manufacturing and the local Design Studio each have a clear route.
- Category filters retain URL state and reveal the matching catalogue while hiding discovery campaigns. Clearing the filter restores the full storefront. All campaign, collection and service links use existing working pages.
- New Year 2027 planning uses existing approved bulk tiers: 100–199 5%, 200–499 20%, 500+ 25%. Estimate and final-quotation terms remain explicit. No retail coupon, deadline or delivery claim was added.
- Ambient colour motion respects reduced-motion preference. No automatic popup, persistent mobile action bar or floating launcher returns. Manual callback, quick view and FAQ remain accessible.
- Photographs are references rather than verified Lustry inventory. Source records are in PHOTO-SOURCES.md. Displayed product specifications, availability and prices need Lustry confirmation. Online checkout is disabled; the product-detail and demo-bag prices remain labelled as demonstration values.

## Validation

- Local-reference checks, public JavaScript syntax and git whitespace checks.
- Existing isolated backend suite: 84 tests passed; no live enquiry or callback was created for this redesign.
- Expanded browser suite: 30 groups covering visual categories, campaign navigation, separate collections, desktop search, filter persistence, bulk/Studio handoff, callback safeguards, FAQ, offer terms and reduced motion. Responsive checks include 320, 390, 768, 1024 and 1440 pixels.
- Actual mobile and desktop screenshots reviewed, including live-font rendering. All product photos are served locally.
- Preview and production Wrangler dry-runs and public-only bundle checks are completed before promotion. Hosted checks validate the exact released commit.

The previous production source is c3e20f5fa830a75e380bb73a01c1d80850ba0541. This change does not alter DNS, domain routes, Supabase functions, database logic or paid services. The separately reported www redirect still requires verification of the owner's Cloudflare rule.
