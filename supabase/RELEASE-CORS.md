# Approved preview enquiry CORS release

Project: `wpchzqmhngeokfzelsaf`. Function: `submit-order`. Baseline inspected version: **3**. Approved deployed version: **4**, ACTIVE, `verify_jwt: true`. The owner explicitly approved the CORS-only live update on 9 November 2026 (Asia/Kolkata).

## Exact change

The repository first reconciles the existing deployed v3 source, including its final request/response wrapper and existing origin allowlist. The approved release adds exactly one entry to that allowlist:

```text
https://v8-preview-lustry-website.lustryhelpline.workers.dev
```

Production (`https://lustry.in`, `https://www.lustry.in`), GitHub Pages and existing comma-separated `ALLOWED_ORIGIN` entries remain allowed. Unknown/lookalike origins receive no browser CORS permission. Arbitrary Workers hosts and changing version URLs are not automatically allowed; use the stable branch alias for enquiry testing.

The request handler, pricing lookup, 25-piece MOQ, discount tiers, consent validation, insertion payload, server secrets and confirmation/error responses are byte-for-byte unchanged from live v3. No database migration, RLS change, key rotation, JWT setting change, checkout/payment or paid service is involved. CORS is a browser response policy, not an abuse-prevention or authorization mechanism.

## Verification completed

- Inspected live function source and metadata through the connected Supabase account.
- Safe live invalid-payload POST, using the website's existing public configuration: HTTP400 with the expected name/email validation message. This demonstrates that the current public-key/JWT gateway path reaches the existing function; no auth/key change is justified.
- Existing GitHub Pages origin gets its exact CORS header; the Workers branch alias currently does not. No valid live customer enquiry was created.
- `npm run test:backend`: 25 isolated VM tests, all backend fetches mocked. Tests cover allowed/unknown origins, configured comma-separated origins, method/contact/consent/MOQ checks, quantity discount boundaries, save payloads and error/unconfirmed responses.
- The `supabase` directory is excluded from both Cloudflare public assets and GitHub Pages output.

## Approved deployment and verification

The owner explicitly approved replacing the live function with this CORS-only update. Immediately before deployment, live v3 source and metadata were re-read and confirmed unchanged. Version 4 was deployed with entrypoint `index.ts` and `verify_jwt: true`; a subsequent source read matched the exact reviewed one-line candidate.

All 12 live checks passed: OPTIONS and invalid-payload POST for production, www, GitHub Pages, the stable Workers alias, `https://example.com` and an unrelated Worker hostname. Allowed origins receive their exact CORS header; denied origins receive none. All invalid POSTs return the original HTTP400 name/email validation error before database access. No valid customer record was created.

For any later release, re-read the live source before replacing it and get approval for changes beyond this scope. Rollback baseline: the exact reconciled v3 source at commit `ab122f17fbbcf4a490b0b9f4b82618dc0f530592`, preserving `verify_jwt: true`. Website production deployment, `main`, DNS and database schema were not changed.

## Other observations

The project is ACTIVE_HEALTHY. Security advisories reported only informational RLS-without-policy notices for `client_logos` and `media_assets`; these tables remain private and no public policies were added. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

The project function inventory currently lists `submit-order` only. The existing callback frontend remains preserved; a deployed `callback-request` endpoint is not established by this inspection. The optional AI endpoint is also not listed. Do not present mocked callback/chat tests as proof of live persistence or an active paid AI service.
