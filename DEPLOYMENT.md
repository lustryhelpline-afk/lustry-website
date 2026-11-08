# Lustry Cloudflare Workers deployment

The website is a static catalogue and enquiry frontend. Supabase continues to host the existing enquiry backend. This configuration neither deploys Supabase functions nor changes the database.

## Repository-defined configuration

- Worker application name: `lustry-website`.
- Production branch: `main`; development and preview branch: `v8-preview`.
- Node.js: 22 or newer. Wrangler is pinned in `package-lock.json`.
- Worker compatibility date: `2026-11-08`.
- Static asset directory: `dist/`; no Worker entry point is needed for this static site.
- HTML handling: `none`, preserving the existing `.html` URLs. A generated `_redirects` rule rewrites `/` to `/index.html` with status 200.
- Unknown routes: the bundled `404.html`, with a real HTTP 404 response. The build makes its links root-relative for missing nested URLs.
- Preview URLs: enabled. Version preview URL availability also depends on the account/Worker configuration returned by Cloudflare.

## Install and validate

```sh
npm ci
npm run check
npx playwright install chromium
npm test
npm run build:preview
npm run deploy:dry-run
```

`deploy:dry-run` validates deployment configuration and prepares the upload locally; it does not upload a version or deploy. `npm run deploy:preview -- --dry-run` also exercises the exact preview-version command without uploading. A successful dry run does not establish account permissions, correct dashboard settings, or a successful remote deployment.

`npm test` builds preview assets and runs the browser regression suite against an ephemeral local server. It mocks Supabase calls and does not create customer enquiries or callbacks. Use `LUSTRY_CHROMIUM_PATH` to select an existing Chromium binary; otherwise install Playwright's browser as shown above. `LUSTRY_TEST_BASE` may point to a running local Wrangler server for additional Worker-specific checks.

To run the Worker asset server locally after building:

```sh
npm run preview
```

The GitHub Actions workflow only performs checks, a preview build and a local dry run. It contains no deployment step or production credentials.

## Public asset boundary

The build starts from an empty `dist/` and copies an explicit list of public HTML pages, `robots.txt`, `sitemap.xml`, CSS and JavaScript files, and supported image/font/video files from `assets/`. It rejects symlinks and ignores hidden files and unsupported extensions within public directories. New website pages require adding their names to `scripts/build.mjs`.

The repository root is **not** an asset directory. Never use `--assets .` or set an asset path to the repository root. Supabase functions, migrations, package/deployment files, documentation, ZIP uploads, Git metadata, local secrets, and unused root `app.js`, `styles.css` and `config.js` are excluded from the bundle.

`js/config.js` is intentionally public. It may contain only the Supabase public/publishable key, project URL and approved contact details. Service-role keys, AI provider keys, Cloudflare tokens and payment secrets belong in server-side secret storage, never frontend files.

`_headers` supplies browser security headers. It intentionally does not restrict external script/style/image hosts yet, because the existing site uses inline styles, Google Fonts and illustrative external imagery. Its CSP currently blocks framing, plugins and an off-origin document base. Extend that policy only after checking all existing frontend integrations.

## Preview upload — no production traffic change

From `v8-preview`, after authenticated Cloudflare access is configured:

```sh
npm run deploy:preview
```

This validates and builds preview assets, then runs `wrangler versions upload`. It creates a version and its available preview URL; it does **not** run `wrangler deploy` or switch the active production version. Do not promote a preview build to production: preview assets include `X-Robots-Tag: noindex, nofollow, noarchive` and a disallow-all `robots.txt`.

### Release guard and connected-build limitation

The Wrangler custom build runs `scripts/wrangler-build.mjs`. Direct Wrangler commands without a wrapper-provided mode marker fail before building/uploading assets, including a normal `WORKERS_CI=1 wrangler deploy` on `v8-preview`. The hook checks the actual `WRANGLER_COMMAND`: the preview marker permits only `versions upload`, and a production marker permits only `deploy` from `main`. The production marker is emitted by the wrapper only after its explicit approval flag is present. Local preview and dry-run wrappers have their own fixed commands and markers.

This is a guard for the tested Wrangler command path, **not a guarantee that an unknown Cloudflare dashboard integration cannot deploy**. Cloudflare's documentation states that Workers Builds does not honor Wrangler custom-build settings. A dashboard command that bypasses the custom build or replaces the config can therefore bypass this hook. Current Wrangler can also override the configured Worker name with the CI-provided Worker name; renaming this configuration to a preview Worker does not reliably isolate a connected production build.

Before updating any branch that triggers the existing connected Cloudflare build, inspect or disable that integration and confirm that `v8-preview` uses only `npm run deploy:preview`, never a production deployment command. Do not publish a branch update as a way to discover what its unknown deployment command does. Until this is verified, source ZIPs or unattached review commits can be prepared without triggering a branch build. Dashboard/build-log access remains required to establish that remote safety boundary.

For Cloudflare Workers Builds, inspect and explicitly set the non-production branch command to `npm run deploy:preview`. Disable any default non-production command that runs `wrangler deploy`. Do not assume that a dashboard field named “preview” implies deployment isolation. Preserve the configured project root and use this repository as that root. Detached CI checkouts use Cloudflare's documented `WORKERS_CI_BRANCH` (when `WORKERS_CI=1`) or GitHub Actions branch metadata for the branch guard; a locally checked-out branch takes precedence.

No Cloudflare account secret is required for local checks or dry runs. Remote version upload requires a correctly scoped account credential or existing authenticated CLI session. Never commit that credential.

## Production — owner approval required

No production change is approved by this setup. After the owner explicitly approves a release and the reviewed changes have reached `main`, rebuild for production and deploy with:

```sh
npm run deploy:production -- --approve-production
```

The script refuses production deployment on any other branch and without the explicit flag. It runs checks and calls Wrangler with the production marker; the custom build then creates fresh production assets. Keep production automatic deployment disabled unless the owner explicitly approves it. The connected-build limitation described above still applies.

Retain existing Cloudflare custom-domain bindings. Do not add routes, alter DNS, move the domain, or change the Worker audience as part of this configuration repair.

## Diagnose the existing Cloudflare build failure

The audited branch previously had no package/build script, Wrangler configuration, static output directory or committed deployment workflow. These omissions are fixed by the repository setup, but they do not prove the exact reason for a past Cloudflare failure. Before declaring that incident resolved, inspect the actual failing build log and dashboard settings:

1. Confirm connected repository, root directory, application name and branch.
2. Check Node version, install command (`npm ci`) and the first failing log line.
3. Use `npm run build` for production asset builds or `npm run build:preview` for previews; do not use a nonexistent framework output path such as `build/`.
4. Confirm Wrangler reads `wrangler.jsonc` and uses `dist/`, with no stale `--assets` override or nonexistent entry-point argument.
5. Check production and non-production deployment commands separately. Preview must use version upload, not production deployment.
6. Check account authentication, Workers version-preview availability and permissions.
7. Confirm the returned preview URL serves pages/assets, returns a real 404 for missing URLs, and does not serve backend/source files.
8. Test existing enquiry CORS from the exact new preview origin. The existing working production/GitHub Pages enquiry flow must remain unchanged. A Worker preview hostname is a new origin; if rejected, approve and reconcile an exact origin allowlist in the backend rather than replacing the working function blindly.

Outstanding remote checks: dashboard/build-log inspection, Cloudflare version upload and preview HTTP checks, and enquiry submission from that exact preview origin. No production deployment or DNS change is necessary to perform these preview checks.

## Confirmed dashboard migration and Pages boundary

The owner supplied a screenshot showing the new Build command `npm run check && npm run build:preview`, Version command `npm run deploy:preview` and root `/`. The production Deploy command was replaced with a `node -e` stop command so automatic production releases remain blocked pending approval. This intentionally replaces the former `public/` copy and `--assets ./public` overrides. Explicitly building preview assets in the build step also covers Workers Builds paths that skip Wrangler custom-build hooks.

GitHub Pages still uses its existing Jekyll build from the source branch. `_config.yml` excludes backend/source, package/deployment metadata, documentation, tools/tests and unused root files. Confirm its actual build output and source-path404 responses after changes. Do not add `.nojekyll` while this source-root deployment is used: it bypasses exclusions. A future switch to an Actions Pages artifact should publish the already allowlisted `dist/` folder.

The owner subsequently approved a separate CORS-only Supabase release. `submit-order` v4 now explicitly allows the stable Workers branch alias, preserving existing production/GitHub Pages origins and all business logic. Twelve safe live validation checks passed; no valid enquiry was inserted. Use the stable alias, not changing version URLs, for enquiry-origin verification. See `supabase/RELEASE-CORS.md` for the recorded approval scope and rollback baseline.
