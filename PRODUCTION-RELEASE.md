# Owner-approved Lustry production release

The owner explicitly requested “final website launched karo yani live” on 9 November 2026 (Asia/Kolkata). This authorizes promoting the reviewed catalogue/manufacturing-enquiry website from `v8-preview` to `main` and deploying it to the existing `lustry-website` Worker and `lustry.in` domain. It does not enable payments, paid AI services, unverified stock, or DNS changes.

## Release basis

- Reviewed preview source: `864b5130b31a652c6c879640fd79fdde004ad8a7`.
- Previous production branch head: `bf9bfbb74e9d61fa306ff96ab8761dd146c2dc4b`.
- Production is a fast-forward promotion of the existing V8 history plus the reviewed release safeguards. No existing main commits should be overwritten.
- Supabase `submit-order` v4 is already ACTIVE following separate CORS-only approval. Website deployment does not redeploy functions, change schemas or alter its secrets/JWT settings.
- Retail prices and imagery remain clearly illustrative; checkout is disabled. The Studio is a local mockup editor, not an active AI generator or production artwork approval.

## Cloudflare command

The owner previously installed a temporary production hard-stop. For this explicitly approved release, the Deploy command must be:

```sh
npm run deploy:production -- --approve-production
```

Keep Version command `npm run deploy:preview` and root `/`. The existing Build command `npm run check && npm run build:preview` can remain: the guarded production wrapper now explicitly rebuilds production assets before invoking Wrangler, even if the platform skips custom-build hooks. This prevents preview `noindex` headers/robots from reaching production.

The production command checks `main` plus the approval flag, builds fresh public-only assets and uses `wrangler deploy --keep-vars`. Existing Worker variables are preserved. No routes/custom domains are supplied in the config; retain the existing domain bindings.

## Checks before activation

- Source reference/syntax checks, 25 isolated backend tests and 17 browser regression groups.
- Production dry-run from a `main` worktree, with no remote upload.
- Production bundle contains root index rewrite, real nested404 page and security headers; preview `X-Robots-Tag` and disallow-all robots must be absent. Cart/product HTML retains its intentional noindex.
- No Supabase, documentation, tests, tooling, package metadata, local secrets or unused root files in `dist/`.
- Confirm source heads immediately before leased fast-forward promotion.

## Verification after activation

Check the Cloudflare build for the exact `main` SHA and confirm actual production deployment success. Then check `https://lustry.in`, homepage/catalogue/Studio assets, robots/security headers, deep404, private-path404, HTTPS/domain bindings, and enquiry preflight/invalid-payload validation. Do not create a real customer enquiry as a deployment smoke test.

The current execution environment has sometimes received Cloudflare403 responses and Chromium certificate-trust errors; distinguish those access limits from an observed application error. Do not claim verified public rendering if only a build succeeded.

## Rollback

Cloudflare retains earlier Worker versions. If the release fails its functional checks, use Deployments to select the previously active version and restore its traffic. Record/retain that previous deployment in the dashboard before activation. Keep the current DNS and Supabase function unchanged. The old `main` source predates the new deployment scripts, so reverting the branch alone is not a verified Worker rollback procedure.

No payment integration or confirmed retail stock/prices is introduced by this release. Company-approved commercial data and policy content remain operational launch dependencies.
