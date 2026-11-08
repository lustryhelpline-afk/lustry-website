# Callback production repair — V8.3.1

The owner reported a real callback submission failure on the launched website. Inspection confirmed that the frontend pointed to `callback-request`, while the project had only the working `submit-order` function and no callback table.

## Repair

- Added the private `public.callback_requests` table with an applied, recorded migration. Existing enquiry/pricing/media tables and `submit-order` v4 are untouched.
- Enabled RLS, revoked public/anon/authenticated access, and granted service-role SELECT/INSERT only. No public policies; no outbound/webhook triggers.
- Added `callback-request` v1 with gateway JWT verification enabled, matching production/www/GitHub Pages/stable Workers origins.
- Validates name, Indian mobile number, optional quantity, consent, honeypot, payload size and optional request ID. Phones normalize to +91; no customer payloads are logged.
- Returns success/reference only after a confirmed insert. Identical request-ID retries return the existing reference; changed details cannot overwrite another saved request.
- Frontend now requires a saved reference, shows it to the customer, and reuses an in-memory request ID after an unconfirmed response. Name/phone are not persisted in browser storage.
- Callback modal content scrolls within the viewport while its 44px close control stays reachable on short/enlarged/narrow layouts.

## Verified

- 59 isolated callback backend tests plus 25 existing enquiry tests pass, all backend traffic mocked.
- 20 browser regression groups pass, including reference confirmation, idempotent retry and short/narrow/enlarged modal checks.
- Live positive callback POST without the new optional request ID (legacy-client compatibility): HTTP201, saved UUID confirmed in the database.
- Retried the same normalized request with its stored request ID: HTTP200 with the same saved UUID; exactly one matching row existed.
- The clearly marked synthetic verification row was deleted by its exact UUID/request ID/name/note, removing one row only. No screenshot/customer contact details were replayed; no calls/messages/notifications were sent. Other requests are untouched.
- Four allowed-origin preflights pass; denied origin returns403. Public Data API read of callback_requests is denied. RLS/ACL metadata confirms no public/authenticated read/write permissions; service-only insert/select succeeds.
- Security advisor has only expected informational RLS-without-policy notices for intentionally private tables: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Requests are visible to the owner in Supabase’s callback_requests table. This saves the callback request; it does not place an automated telephone call. Production callback data must be retained/reviewed according to Lustry’s approved operational and privacy policies.

## Release/rollback

The source/migration is excluded from both public asset deployments. Publish the tested frontend through v8-preview then fast-forward main to the same reviewed commit, using the existing approved Cloudflare production command. If a frontend rollback is needed, restore the preceding Worker version; the backend stays compatible with the old popup payload. Do not drop the table or delete real leads as a rollback step.
