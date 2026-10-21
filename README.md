# Lustry Custom Order Platform — Starter

A static frontend for GitHub Pages plus Supabase Edge Functions and PostgreSQL schema for quotation requests and AI support.

## Included

- Premium responsive marketing site and product category pages
- Product-specific options for T-shirts/polos, hoodies, jackets, pittu bags/backpacks, tote/promotional bags, pens and bag tags
- Indicative estimate with quantity slabs: 25–49 2%, 50–99 4%, 100–249 6%, 250–499 9%, 500–999 12%, 1,000+ 15%
- Minimum quantity validation (25 pieces)
- Optional size breakdown validation
- Quote request form, consent checkbox, coupon capture
- Supabase Edge Function to validate request data and recompute estimate on the server before saving
- AI support Edge Function; API key stays server-side
- English/Hindi navigation-label demo (not a complete translation)
- SQL schema for orders and coupon records

## Important limitations before production

This is a starter, not a finished production commerce system. Before accepting real orders:
1. Replace every `[ADD ...]` placeholder in `index.html` with verified company details.
2. Verify the actual price table, GSM availability, product/material options, MOQ and discount slabs with your production team. The starter prices are example values, not validated Lustry prices.
3. Configure a private artwork storage bucket and upload flow. The current UI deliberately does not submit files.
4. Build an authenticated admin dashboard to view requests, change statuses and approve a final quote. The schema has no public order-reading policies by design.
5. Configure rate limiting / bot protection, email notifications, privacy policy, terms, cancellation/returns policy, data retention and consent language.
6. Configure coupon issuance only after qualifying orders and gift inventory rules are defined. This starter records and checks coupon metadata for review but does not automatically grant gifts or apply a coupon discount.
7. Complete all-language translations and have them reviewed by fluent speakers.
8. Test on mobile, with screen readers, and with realistic orders before publishing.

## 1. Publish frontend to GitHub Pages

- Create a GitHub repository, for example `lustry-platform`.
- Upload `index.html`, `styles.css`, `app.js`, and `config.js` to the repository root.
- In `config.js`, set `supabaseUrl` and `supabaseAnonKey` to your Supabase project URL and public anon/publishable key.
- In GitHub, open **Settings → Pages**, select deploy from branch, choose `main` and `/ (root)`, and save.
- Never place `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, payment secrets, or email-provider secrets in frontend files or GitHub Pages.

## 2. Configure Supabase database

- Create a Supabase project.
- Open SQL Editor and run `supabase/schema.sql`.
- The `orders` and `coupons` tables have RLS enabled and no public table access. Orders are inserted by the server-side function using the service-role key.
- Do not add public SELECT policies to orders. Build authenticated admin access separately.

## 3. Deploy Edge Functions

Install the Supabase CLI and sign in, then from this project folder:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy submit-order
supabase functions deploy ai-support
```

Set secrets using the CLI (replace values locally; do not commit them):

```bash
supabase secrets set SUPABASE_URL=https://YOUR-PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
supabase secrets set OPENAI_MODEL=gpt-4.1-mini
supabase secrets set ALLOWED_ORIGIN=https://YOUR-GITHUB-USERNAME.github.io
```

If using a custom domain, set `ALLOWED_ORIGIN` to that exact origin. The code defaults to `*` only for initial local testing if the secret is missing; set the production origin explicitly and consider stricter origin handling. Configure function JWT verification/CORS according to your chosen deployment; do not disable database security.

## 4. Company details you must supply

- Exact legal company name (confirm whether “Lustry Pvt Ltd” is the registered name)
- Public business email and phone/WhatsApp
- Business address and business hours
- GSTIN/CIN only if applicable and verified
- Real base prices by product/style/material/GSM/branding
- Actual available GSM and materials per product
- Manufacturing lead times, shipping zones and payment terms
- Approved privacy, cancellation, returns and terms policies
- Real project photos and client logos with permission
- Reward/coupon eligibility, coupon value, expiry and gift inventory

## 5. Pricing model

Current example base unit prices:
- T-shirt/polo: ₹120
- Hoodie: ₹360
- Jacket: ₹550
- Pittu backpack: ₹240
- Tote bag: ₹65
- Pens/bag tags: ₹25

The estimate adds configured material, GSM/thickness and branding amounts, then applies the quantity slab to the subtotal. All values are placeholders and should be replaced by Lustry's approved cost/pricing sheet. The server recomputes the price from its own configuration; it does not trust the browser's displayed total.

## 6. Features intentionally not represented as complete

- Online payment / checkout
- Customer login and order history
- Admin quote approval interface
- Artwork uploads and private storage
- Email/SMS/WhatsApp automation
- Coupon issuance after order completion, gift redemption and coupon stacking rules
- Full multilingual translation
- Live product mockup editor

These require additional backend and operational decisions. The customer-facing wording is deliberately transparent that the online price is an estimate and the final quotation is approved by Lustry.


## Brand logo, photos, fabrics, clients and videos

The website now includes an editorial product photo gallery, material library, client-logo section, and video section. See `assets/ASSET_GUIDE.md` for exact filenames and where to place your own files. In short:

- Brand logo: `assets/lustry-logo.png`
- Product photos: `assets/products/tshirts.jpg`, `hoodies.jpg`, `bags.jpg`, `branding-detail.jpg`, `accessories.jpg`
- Client logos: `assets/clients/client-01.png` through `client-06.png`
- Videos: `assets/videos/production.mp4`, `materials.mp4`, `finished-orders.mp4`

The page displays design placeholders until matching image/video files are provided. Fabric names and GSM ranges in the new material section are sample guidance only; verify them against the materials you actually source before publishing. Only display client logos with permission.
