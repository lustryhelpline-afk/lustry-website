# Preview enquiry CORS release candidate

Project: `wpchzqmhngeokfzelsaf`. Function: `submit-order`. Inspected live version: **3**, ACTIVE, `verify_jwt: true`.

## Exact change

The repository first reconciles the existing deployed v3 source, including its final request/response wrapper and existing origin allowlist. The candidate then adds exactly one entry to that allowlist:

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

## Release boundary

**Candidate only: not deployed to live Supabase.** The owner's original instruction requires explicit approval for production deployment. Deploying an Edge Function replaces the live version at its public URL immediately, so connecting the account or saving preview source does not by itself remove that release restriction.

After owner approval, deploy the exact reviewed `supabase/functions/submit-order/index.ts`, entrypoint `index.ts`, preserving `verify_jwt: true`. Immediately repeat OPTIONS and invalid-payload POST checks for production, www, GitHub Pages, stable Workers alias and a denied origin. The checks must confirm both the CORS header and original validation behavior without creating customer records.

Before release, re-read the live version and source. If they changed after v3, rebase this one-line change on that newer source rather than overwriting other work. Rollback uses the reconciled deployed-v3 source from the commit immediately preceding the origin-addition commit, with the same `verify_jwt: true` setting.

## Other observations

The project is ACTIVE_HEALTHY. Security advisories reported only informational RLS-without-policy notices for `client_logos` and `media_assets`; these tables remain private and no public policies were added. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

The project function inventory currently lists `submit-order` only. The existing callback frontend remains preserved; a deployed `callback-request` endpoint is not established by this inspection. The optional AI endpoint is also not listed. Do not present mocked callback/chat tests as proof of live persistence or an active paid AI service.
