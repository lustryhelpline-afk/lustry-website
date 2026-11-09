# Minimal storefront refresh — 9 November 2026

Requested by the owner after the initial production launch: a lighter, professional, product-first interface, visible categories on mobile, real reference photography and a subtle animated seasonal background.

## Result

- Compact shared navigation with always-visible, horizontally scrollable category links, a collapsible search, bag, explicit callback and more menu. Correct direct phone +91 92673 73084 and separate WhatsApp +91 91190 76674 remain accessible.
- Homepage categories filter the product grid in place. T-shirt styles remain Round Neck, Polo, Oversized and Dry-Fit. Catalogue navigation uses the same category row; URL state survives reload.
- Local photographic references replace illustrated product imagery in the browsing flow. They are labelled as references; product specification, pricing and stock need Lustry confirmation. The curated home view shows eight styles; category filters include all relevant catalogue entries. Source records: PHOTO-SOURCES.md.
- Small New Year 2027 planning link and pastel campaign block. Existing bulk discounts are stated with exact quantity tiers and quotation terms: 100–199 5%, 200–499 20%, 500+ 25%. No new retail sale, deadline or coupon is claimed.
- Slow ambient background animation respects reduced-motion preference. Inline SVG navigation arrows avoid missing font glyphs.
- Removed automatic callback interruption, duplicate support strips, persistent mobile action bars, floating WhatsApp/chat launchers and decorative homepage calculator. Callback and FAQ assistant remain available explicitly; quick view remains keyboard accessible.
- Online checkout stays disabled. Product details and demo bag retain clearly labelled reference prices. Database, pricing lookup, enquiry and callback saving logic are unchanged.

## Validation

- Source references, JavaScript syntax and whitespace checks.
- Existing isolated backend suite: 84 tests passed; live backend was not used for these UI tests.
- Browser regression suite expanded for first-screen mobile products, category and style persistence, shared catalogue navigation, search, manual support, no timed popup, reduced motion, offer terms and short-viewport support controls.
- Mobile and desktop screenshots visually inspected. Public-only Cloudflare build and guarded Wrangler dry-run verified before release.

The previous main commit, before this refresh, is 2cfd06fe51c5c113014325250f0c03263f0bd082. No DNS, Supabase function or paid-service configuration is part of this change.
