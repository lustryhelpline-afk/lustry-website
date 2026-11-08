# Lustry public assets

The working website uses these existing directories:

- `assets/`: Lustry JPG logos/wordmark and original SVG product illustrations.
- `css/`: active V8 styling layers and the scoped Design Studio stylesheet.
- `js/`: public configuration, demo catalogue, interactions and browser-only studio.

The wordmark is `assets/lustry-wordmark.jpg`; the full logo is `assets/lustry-original-logo.jpg`. Product illustrations include `tee-ivory.svg`, `tee-charcoal.svg`, `tee-forest.svg`, `polo-forest.svg`, `polo-navy.svg`, `hoodie-olive.svg`, `hoodie-charcoal.svg`, `backpack.svg`, `tote-earth.svg` and `tote-ivory.svg`.

Stock-photo URLs in `index.html` and `js/catalog.js` are illustrative. They must not be represented as confirmed inventory, manufacturing facilities or completed client work. Product cards start from local SVGs, with optional external imagery; the original homepage photo enhancer remains in use. Confirm external image licences and use real approved Lustry photography for launch.

When adding original images, use supported image extensions in `assets/`, meaningful alt text, optimized dimensions and permissions from any identifiable clients. Do not add private customer artwork or internal records. Client logos and media tables are not automatically consumed by the current gallery; those sections remain honest placeholders until approved assets are supplied.

`npm run build` creates an allowlisted public `dist/` directory. Supabase source, docs, archives, Git files, secrets and unused root starter files are excluded. Never deploy the repository root as static assets.
