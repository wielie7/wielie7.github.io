Photo clarity follow-up

The initial optimization looked too soft to the user. Photographic clarity now
takes priority over the smallest possible download.

- Regenerated WebP photographs at quality 94, increased from 88. JPEG fallbacks
  also use quality 94 and extend to 2400 pixels.
- Removed 480/800-pixel responsive choices. The minimum is now 1200 pixels,
  except photographs whose originals are smaller. Added 3200-pixel choices for
  large or high-density displays, without upscaling originals.
- Product backgrounds and their matching preloads now use 2400 pixels on
  desktop and 1600 on mobile, preserving the existing positioning and effect.
- The homepage desktop hero uses its original JPEG, without another lossy
  encoding. Its 1600×1066 source remains the maximum available detail; further
  improvement on very large screens would require a higher-resolution original.
- The homepage now supplies a dedicated 960×1066 high-quality AVIF crop for
  mobile viewports. It covers the same centered portion of the photograph as the
  desktop image's existing `object-fit: cover` crop, but avoids scaling a wide
  landscape source into the tall mobile box.
- Full-resolution lightbox originals, crop rules, navigation, and lazy loading
  remain in place. New generated filenames prevent reuse of the older cached
  derivatives. Original photographs were not overwritten or deleted.

The local desktop browser now selects 1200-pixel files for the 605-pixel product
cards. Full-scroll resource transfer is 2,876,007 bytes (2.74 MiB) on desktop
and 3,495,213 bytes (3.33 MiB) on mobile, versus the original 26,208,413 bytes
(24.99 MiB). The first optimized pass was smaller, at 1.43/1.02 MiB; this is an
intentional quality tradeoff. Homepage browser checks report no image failures,
console exceptions, or horizontal overflow. JavaScript syntax and diff checks
pass. Detailed product checks are recorded in sharpness-verification.json.

Changed: responsive source references in the content HTML pages,
`assets/css/product-pages.css`, the image manifest and generated derivatives,
and `scripts/generate-images.cjs`. The one-time reference migration is retained
as `scripts/update-image-quality.cjs`; its argument is the previous manifest.
Do not rerun that migration with a mismatched manifest. The earlier performance
report remains a record of the initial optimization, not the current encoding
settings or payload.
