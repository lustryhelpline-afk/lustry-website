# Lustry V8.3 preview — readiness and handoff

Prepared 9 November 2026 (Asia/Kolkata). Baseline: `v8-preview` commit `fbb2773ec977dff2dda33b514a6d9ad941fdd221`.

## Source reconciliation

The uploaded `Lustry-Luxe-V8-2-Popup-Fixed (2).zip` was extracted into a separate workspace and compared byte-for-byte. All active HTML, CSS, JavaScript, assets, and `submit-order` source matched the baseline branch. The upload also includes extra setup documents, callback/AI function sources and proposed SQL migrations. Those files were reviewed as reference material; their instructions were not treated as release authorization and no SQL or function was deployed.

The owner confirmed the callback works. The existing popup, manual trigger, endpoint, public configuration, request shape and success path are preserved. Mocked browser tests verify its interaction and response handling. Live record creation was not performed, so end-to-end delivery is not newly certified here. Earlier 404 OPTIONS responses describe what this environment observed, not proof that the owner's reported flow is broken.

## Implemented

- Preserved V8 page structure, logos, typography, animations and visual identity.
- Added public-only static build and explicit Cloudflare Workers asset configuration, pinned toolchain, compatibility date, root URL rewrite, real nested 404 handling, security headers, preview noindex and branch-guarded commands.
- Preview command uploads a version; it does not switch production traffic. No automated deployment is added to CI. The normal Wrangler path also validates a command-bound release marker before building assets. Workers Builds can bypass custom builds, so the connected dashboard remains an independent release boundary.
- Added a browser-only Product Design Studio: four T-shirt styles, tote and backpack; fabric/GSM, colour, local logo/reference preview, editable text/placement/scale and front/back view. It downloads a text brief and carries specifications into the existing manufacturing enquiry form. No remote upload or AI generation occurs.
- Added a quotation-only Corporate Merchandise category and the missing Dry-Fit manufacturing style; Polo remains inside T-Shirts.
- Hardened visitor-local demo cart against malformed storage, invalid variants, excessive quantities, duplicated rows and HTML injection; selection changes retain entered quantity.
- Rejects missing/empty/negative pricing instead of converting null values to a misleading zero estimate. Category-based estimate caveats remain explicit; existing backend pricing logic is unchanged.
- Added optional size-breakdown validation, enquiry duplicate-submit prevention and a timeout with accurate unconfirmed-save wording.
- Preserved callback flow while improving quantity/name validation, timeout handling and duplicate-submit protection.
- Improved chat focus/accessibility, serialized requests and FAQ fallback labelling; moved quick view outside product links.
- Fixed narrow 320px header layout without hiding overflow; no-JavaScript contact guidance, favicon, sitemap cleanup and noindex for demo cart/product-detail pages.
- Replaced outdated starter documentation with current setup and asset instructions.
- Added GitHub Pages Jekyll exclusions for backend source, internal docs, package/deployment metadata, tests/tools and unused root files. Pages previously published the source root; the new exclusions preserve public URLs without changing Pages settings. This is a known exclusion list, not the Cloudflare build allowlist; do not bypass it with `.nojekyll`.

## Verification

- `npm run check`: passed; all 11 HTML pages, CSS local references and public JavaScript syntax checked.
- `npm test`: 17 browser regression groups passed, zero failed. Backend responses are mocked and all external requests blocked. Covers filters/search, cart corruption/CRUD, selection state, merchandise path, discount boundaries, invalid prices, MOQ/consent, confirmed/unconfirmed/error enquiries, callback validation/duplicate prevention, local artwork validation, full Studio brief transfer, expired metadata, sizes and responsive layouts.
- Desktop/mobile visual review: original homepage and new Studio, with viewport checks at 320, 390, 768, 1024 and 1440px. Narrow header issue found and fixed.
- Callback/chat/quick-view focused mocked checks passed: duplicate calls blocked, keyboard focus restored and nested interactive controls removed.
- `npm run deploy:dry-run`: passed using Wrangler 4.158.0. No upload or deployment occurred.
- The same 17/17 browser groups also passed against the local Wrangler server and its actual security headers/CSP.
- Local Wrangler asset checks: root and public pages/assets return 200; missing nested pages and private/backend/docs/package/Git/test/unused-root paths return 404. Preview indexing/security headers are present.
- Production guard refuses deployment from `v8-preview` even with an approval flag.
- Release guard checks passed: raw CI deploy dry-run rejected; a preview marker cannot authorize deploy; wrapped deploy dry-run and wrapped preview version dry-run pass without upload. The local guarded preview returns HTTP200/noindex.
- `git diff --check`: passed. No changes to `supabase/functions/submit-order/index.ts`, root `config.js`, or `js/config.js`.

## Remaining launch dependencies

1. Cloudflare dashboard and failing build log: inspect actual install/build commands, branch mapping, account permissions and non-production deployment command. The previous repository omissions are fixed locally; the exact historical dashboard failure cannot be proven without its logs.
2. Authenticated preview upload and HTTP verification at the returned URL. Check enquiry CORS from that exact preview origin; do not replace the deployed working backend blindly.
3. Reconcile checked-in `submit-order` CORS with the live deployment before any future backend release. The live service accepted preflights for production and GitHub Pages although the checked-in file specifies a single origin.
4. Category-level pricing remains the existing implementation: first active category row, not fabric/GSM-specific matching. A separately reviewed backend change and approved pricing data are required for accurate specification-specific estimates.
5. All nine retail products still have unconfirmed inventory; eight carry explicitly demo prices. Approved prices/specifications/photos and eligibility are needed before retail offers. Checkout/payment stay disabled; no same-day delivery is promised.
6. Owner-approved privacy/business policies, abuse controls, database RLS/grants and enquiry operations require live account review. No legal terms or operational commitments were invented.
7. Gallery/client sections need original approved assets. No customer/client identities were fabricated.
8. AI image generation and private artwork upload remain future integrations. They require provider/storage selection, security review and explicit paid-service approval. Current mockups are illustrative, never approved production artwork.

## Remote access and release state

GitHub clone/read succeeded. An initial CLI push dry run returned `could not read Username`. The owner subsequently connected GitHub and repository write permission was confirmed. Read-only GitHub checks revealed that pushes to `v8-preview` also invoke the existing Cloudflare integration. Source was initially saved as an unattached review commit while its deployment command was unknown. The owner subsequently supplied a dashboard screenshot showing Build command `npm run check && npm run build:preview`, Version command `npm run deploy:preview`, root `/`, and the production command replaced by a `node -e` blocking script (its full text is clipped in the screenshot). This evidence clears source publication to the authorized `v8-preview` branch. The owner identifies `main` as production; it must remain unchanged. The first published preview commit `06dbaebe86c29939b4e75e9c1a43f2acd7e3b463` passed Cloudflare Workers, GitHub Pages and all Website checks. Cloudflare returned alias https://v8-preview-lustry-website.lustryhelpline.workers.dev and version https://82283cb4-lustry-website.lustryhelpline.workers.dev. The subsequent Pages exclusion correction requires its own remote build verification. Shared browser control is not exposed in this chat; screenshots and GitHub checks provide the account evidence. No new branch is created. No merge, production deployment, DNS change, Supabase change or paid service activation is part of this release.

Read-only GET of GitHub Pages configuration matched the existing Supabase project/function names. A later production GET returned HTTP403/error1010 from this environment, so production frontend equality is not established. This is an access observation, not a claim that the public website is universally down.

See `DEPLOYMENT.md` for preview and future approved production commands. Never deploy a preview noindex build as production; rebuild using the production path only after release approval.

## Remote preview observations

The Cloudflare build succeeded and returned version/alias URLs. Direct GETs from this execution environment return HTTP403 (as also observed for production), and its Chromium does not trust the intercepted certificate, so live Workers rendering and HTTP boundary checks could not be newly verified from this machine. Local Wrangler HTTP/browser checks and hosted GitHub Actions checks passed. This access observation does not establish universal website failure.

Read-only `submit-order` preflights accepted the existing `https://lustry.in` and `https://lustryhelpline-afk.github.io` origins. Both new Workers preview origins returned HTTP200 without `Access-Control-Allow-Origin`, so browser enquiry POSTs from those origins are currently blocked. No live enquiry or callback record was created. Add only the intended exact preview origin after inspecting the live function/configuration; preserve existing allowed origins, database logic and service secrets. Supabase account access is needed to reconcile the deployed source before a minimal CORS change.

## Connected Supabase inspection and CORS candidate

The live `submit-order` function is ACTIVE version 3 with `verify_jwt: true`. Its source matches the original business handler but adds an exact-origin response wrapper. This deployed source is now reconciled in the repository; the only candidate behavior change adds the stable Workers branch alias to its allowlist. After the owner explicitly approved the CORS-only live update, the exact reviewed function was deployed as ACTIVE version 4 with JWT verification preserved. See `supabase/RELEASE-CORS.md` for the exact scope, verification and rollback baseline.

A safe invalid-payload live POST returned the expected HTTP400 name/email error using the existing website public key; authentication reaches the function and needs no change. Twenty-five isolated backend tests passed with every database call mocked. No valid live enquiry, migration, JWT/key change or database write was made. Actual project function inventory lists only `submit-order`; existing callback UI remains preserved, while live callback persistence and AI service availability are not certified.

## Final approved CORS release status

The owner explicitly approved the CORS-only live update. Supabase `submit-order` v4 is ACTIVE; JWT verification remains true and its source exactly matches the reviewed one-entry allowlist addition over deployed v3. Twelve live OPTIONS/invalid-payload POST checks passed across four allowed and two denied origins. No valid customer enquiry record was created and no schema/key/pricing/business-logic change occurred. This supersedes the earlier pre-release CORS observations above.

The preview source has 25 isolated backend checks and 17 browser regression groups passing in hosted CI, plus successful Cloudflare and GitHub Pages preview builds. Production website/main/DNS remain unchanged. Approved product prices/inventory/assets, legal/operational policy content and verification of any separate callback service still remain business launch dependencies; checkout and AI generation remain disabled as requested.

## Website production launch authorization

The owner subsequently explicitly approved publishing the final website live. The release promotes reviewed source from `v8-preview` to `main` without rewriting existing main history, then uses the existing Cloudflare Worker/domain. A fresh production build before Wrangler prevents inherited preview indexing restrictions, and `--keep-vars` preserves existing dashboard variables. Actual release/build state is available in GitHub/Cloudflare for the final main SHA. See `PRODUCTION-RELEASE.md`; payment, AI services, schemas and DNS are outside this release.
