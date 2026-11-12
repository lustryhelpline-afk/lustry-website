# Storefront reference photography

## Current product concepts — 12 November 2026

The 36 visible non-bag products now each use a separately generated, unbranded OpenAI `image_gen` concept in `assets/products/<product-id>.webp`. These replace the shared reference photographs and illustrations on their product cards, details, cart images and quick views. All 138 visible products have distinct image paths and distinct SHA-256 file contents, including the existing 102 bag images.

Generated images use descriptive alternative text, with no image-overlay badges. Product details and quick views explain that they are AI-generated concepts, not verified production photographs. Images illustrate the product type; actual fabric, GSM, colour, construction, artwork, stock and final price require Lustry confirmation. These images are not production-ready artwork and do not establish environmental certifications.

Each concept was generated separately on a warm-white studio background without logos, copied from its preserved original PNG, and encoded to WebP at its original 1254 × 1254 dimensions for website delivery. No cropping or retouching was applied. The 36 delivered images total 3,476,452 bytes. No Google image search assets were used for this update.

| Collection | Individual product-image filenames (under `assets/products/`, `.webp`) |
| --- | --- |
| T-shirts, polos and oversized | `rn-cotton`, `rn-dry`, `rn-eco`, `rn-ultra`, `polo-dry`, `polo-eco`, `polo-ultra`, `polo-men`, `polo-emb`, `os-tee` |
| Hoodies, sweatshirt and jackets | `hd-custom`, `hd-eco`, `hd-emb`, `sw-crew`, `jk-eco`, `jk-embeco`, `hd-ultra`, `jk-high` |
| Sports jerseys | `js-v1`, `js-v2`, `js-polo`, `js-rn` |
| Cap, rainwear and umbrellas | `cap`, `rainsuit`, `raincoat`, `umb-fold`, `umb-long` |
| Bottle and gifts | `sipper`, `photoprint`, `frame` |
| Print and stationery | `vcard`, `vcard-shape`, `booklet`, `sticker`, `label`, `mailer` |

Category navigation can show a thumbnail of its own product; a different product never shares that product image. Historical reference photos below remain available for campaign illustrations and legacy product links. Their source records continue to apply only to those photographs.

## Historical reference photography

These photographs illustrate product categories. They are not photographs of verified Lustry inventory, approved production samples, or guaranteed product specifications. The storefront should display: **“Reference photography. Final product, colour and availability confirmed with Lustry.”**

The first four image endpoints were already referenced by the existing catalogue. Three further relevant photographs were added as recorded below. Local copies were downloaded on 9 November 2026 with Unsplash's image endpoint requesting `auto=format&fit=crop&w=900&q=85`. Each file was visually reviewed. No generative imagery was used, and no Lustry branding was added to the photographs. Image service resizing/formatting was requested in the URL; the downloaded files were not otherwise edited.

| Local asset | Exact downloaded source | Verified visual content |
| --- | --- | --- |
| `assets/photos/reference-round-neck.jpg` | https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85 | White round-neck T-shirt worn by a person; no visible clothing brand. |
| `assets/photos/reference-hoodie.jpg` | https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85 | Grey pullover hoodie viewed from the rear outdoors; a small drone appears in the background. |
| `assets/photos/reference-backpack.jpg` | https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85 | Navy backpack against a neutral wall; another manufacturer's small yellow label is visible. Do not describe this as a Lustry-made product photograph. |
| `assets/photos/reference-tote.jpg` | https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85 | Plain brown tote-style shopping bag on a neutral background. Its photographed material is not verified as the catalogue's non-woven fabric. |
| `assets/photos/reference-black-tee.jpg` | https://images.unsplash.com/photo-1610502778270-c5c6f4c7d575?auto=format&fit=crop&w=900&q=85 | Three plain black crew-neck garments hanging against a white background; the centre garment has short sleeves. Reference for the T-shirt collection; the fit is not verified as oversized. |
| `assets/photos/reference-polo.jpg` | https://images.unsplash.com/photo-1669791777450-d1ab3816c26d?auto=format&fit=crop&w=900&q=85 | Person wearing a plain white, short-sleeve collared polo against a dark studio background. |
| `assets/photos/reference-sweatshirt.jpg` | https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=85 | Plain white crew-neck sweatshirt in a neutral flat-lay arrangement. Fabric composition and GSM are not verified. |

Further photo-page source records checked on 9 November 2026:

- Black garments: [Ryan Hoffman — black crew neck T-shirt](https://unsplash.com/photos/black-crew-neck-t-shirt-Cs4GVbMqKGY). The photo page describes the image as free under the Unsplash License.
- White polo: [Mediamodifier — a man sitting on a stool](https://unsplash.com/photos/a-man-sitting-on-a-stool-Fp1pb_cqlNM). The photo page describes the image as free under the Unsplash License.
- White sweatshirt: the exact Unsplash image endpoint and visible image were verified. Photographer identity and an original photo-page URL have not been established; no photographer or release claim is made.

The endpoints establish the retrieval source; they do not establish photographer names, model/property releases, ownership by Lustry, or the underlying product's availability. This document makes no new licensing or release claim. General Unsplash terms are available at https://unsplash.com/license; retain an asset's original source record when replacing it with owner-approved product photography.

The existing oversized-T-shirt endpoint (`photo-1529139574466-a303027c1d8b`) was also inspected and rejected: it depicts a fashion portrait with conspicuous third-party clothing branding rather than a clear, plain oversized T-shirt. The previous sweatshirt endpoint (`photo-1578681994506-b8f463449011`) depicts a black branded sweatshirt and was replaced by the plain white sweatshirt reference above. Neither rejected image was added to these public assets.

## Classic commerce campaign references — 9 November 2026

Two additional real photographs were downloaded for category/campaign illustration. They are not Lustry production photography or evidence that a pictured item, material, packaging or colour is available. No brand artwork was added. The downloaded images were not edited; sizing/quality were requested through the image-service URL.

| Local asset | Exact downloaded source | Verified visual content and use |
| --- | --- | --- |
| `assets/photos/newclassic-apparel-rack.jpg` | https://images.unsplash.com/photo-1666358062771-c806651d3bf7?auto=format&fit=crop&w=1000&q=82 | Four T-shirts in black, white, navy and beige on a black rack, white studio background. This same image endpoint was referenced by the original V8 homepage hero. A small non-Lustry garment mark is visible; use as general apparel reference, not as a photographed Lustry collection. Photographer and original photo-page URL have not been established; no new ownership or release claim is made. Downloaded JPEG: 1000×667, 41,804 bytes. |
| `assets/photos/newclassic-gifting.jpg` | https://images.unsplash.com/photo-1544377208-215a63786183?auto=format&fit=crop&w=1000&q=82 | Real flatlay with a white gift box, red ribbon, notebook/desk accessories and gold details against a black background. Suitable for a corporate-gifting reference panel; does not establish actual gift-kit contents or packaging. Downloaded JPEG: 1000×594, 60,692 bytes. |

The gifting photo's primary page is [NORTHFOLK — white gift box with red ribbon beside pencil, scissors, and tape dispenser](https://unsplash.com/photos/white-gift-box-with-red-ribbon-beside-pencil-scissors-and-tape-dispenser-Ts0g6PHe1q0). The page was checked on 9 November 2026 and describes the image as free under the Unsplash License, published 9 December 2018. The image endpoint was obtained from that page's image link. This source record does not imply Lustry ownership, a photographer endorsement, or confirmed production specifications.
