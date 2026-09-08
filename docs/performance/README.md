Performance optimization — 7 September 2026

Photo clarity follow-up: the user found the initial derivatives too soft. The
generator now uses WebP/JPEG quality 94, a 1200-pixel minimum responsive candidate
(or the source width for smaller originals), and candidates up to 3200 pixels.
JPEG fallbacks now extend to 2400 pixels. Fixed product heroes use 2400 pixels
on desktop and 1600 on mobile. The homepage hero uses its original JPEG, avoiding
another lossy encoding. This intentionally prioritizes clarity over minimum
payload. The measurements and encoding discussion below describe the initial
optimization pass; see `sharpness-follow-up.md` for the subsequent measurements.

The website remains static HTML, CSS and JavaScript. No runtime dependencies,
framework, deployment change, or original photograph deletion was introduced.

| Local measurement | Before desktop | After desktop | Before mobile | After mobile |
| --- | ---: | ---: | ---: | ---: |
| Full-page resource transfer, after scrolling | 24.99 MiB | 1.43 MiB | 24.99 MiB | 1.02 MiB |
| Lighthouse initial-page transfer | 15,598 KiB | 936 KiB | 11,705 KiB | 832 KiB |
| Simulated LCP | 6.04 s | 1.18 s | 34.53 s | 5.72 s |
| Speed Index | 1.06 s | 0.57 s | 3.61 s | 3.01 s |
| Total Blocking Time | 0 ms | 0 ms | 0 ms | 0 ms |
| CLS | 0.00033 | 0.00073 | 0 | 0.00018 |
| Observed LCP resource discovery delay | 791 ms | 70 ms | 342 ms | 11 ms |

Full-page resource transfer fell 94.3% on desktop and 95.9% on mobile. It includes
resource transferSize values, including response headers, and excludes the HTML
navigation itself. Initial Lighthouse transfer includes only resources requested
during its recording; native lazy loading makes that dependent on the viewport.

These are paired local measurements, not a rerun of the supplied production
PageSpeed report. Lighthouse 12.8.2 used simulated throttling against an
uncompressed localhost server. Desktop used 1440×900/1× and mobile Lighthouse
used its default mobile settings. The separate full-scroll browser check used
1440×900/1× and 390×844/2×. Local timings, especially simulated mobile LCP, must
not be compared directly with the supplied 3.3-second production LCP. A fresh
production PageSpeed run after deployment is still necessary. All raw metric
values, settings, LCP attribution and long-task entries are in measurements.json.

The confirmed homepage LCP element was `.hero-image`, whose forest bench image
was a CSS background. The original 1600×1066 JPEG was 546 KiB. The request waited
for stylesheet discovery, competing with eager lower-page images and external
font/plugin requests. Six featured-card originals, up to 6000×4000 or
4000×6000 pixels, account for about 19.85 MiB alone. The cabinet card was
4425 KiB, lounge chair 4103 KiB, hallway table 3967 KiB, platform bench
3398 KiB and foyer bench 2517 KiB. Their desktop boxes are about 605×403 pixels.
The eager workbench photograph added 1560 KiB; two copies of the joinery PNG
were 944 KiB each. A hidden legacy About section also loaded a portrait.
The supplied summary cannot establish the exact phase breakdown of its 3.3 s
or attribute its single long task; the local trace supplies separate evidence.

Implemented changes:

- `index.html`: HTML-discoverable, eager, high-priority responsive hero; AVIF,
  WebP and JPEG alternatives; lazy loading below the fold; explicit dimensions;
  removed hidden legacy sections and obsolete image markup. Removed unused
  Modernizr, Appear, Owl Carousel, Flaticon and Toastify requests. Preserved
  the existing page content, product destinations, metadata and anchor IDs.
- All 14 content HTML pages: responsive photograph sources, JPEG fallbacks,
  dimensions, asynchronous decoding and ordered deferred scripts. The three
  redirect pages remain unchanged. Full originals load only when a product
  lightbox is opened through `data-full-src`.
- `assets/images/optimized/`: content-named derivatives for 38 referenced
  photographs, generally 480/800/1200/1600/2400 pixels wide without upscaling.
  WebP quality 88; JPEG fallback quality 90. The manifest records originals,
  dimensions, generated widths and bytes. `image-inventory.csv` inventories all
  103 source images, including unreferenced photographs retained in place.
- The forest hero uses AVIF quality 65 because quality-88 WebP was larger than
  its JPEG. Desktop AVIF is 412 KiB; mobile is 246 KiB. The mobile source removes
  only the sides already outside the original centered cover crop, retaining
  the original full height and visible detail. WebP/JPEG remain fallbacks.
- `assets/css/style.css` and `product-pages.css`: preserve image boxes and crop
  rules with picture wrappers. Explicitly hide source elements so they do not
  participate in grid/flex layout. Five product heroes retain their intentional
  fixed-background effect; matching media-specific HTML preloads and image URLs
  make those requests discoverable early, with no duplicate transfers.
- `assets/css/fonts.css`, local Poppins WOFF2 files and `Poppins-OFL.txt`: retain
  the used 300–700 weight range, Latin glyphs and font license; use font-display
  swap. Preload weight 600 used by navigation. Product pages continue using their
  existing system fonts. No external Google Fonts stylesheet remains.
- `site-animations.css` and `site-icons.css`: only the two used entrance
  animations and two used Font Awesome icons, with font-display swap. The
  original libraries remain available as reference. This removes about 81 KiB
  of blocking CSS compared with loading the full animation and icon libraries.
  Bootstrap and Bootsnav remain because navigation depends on them.
- `assets/js/custom.js`: remove unused carousel initialization, preserve the
  original exponential anchor easing locally, and start entrance animations at
  DOM readiness instead of waiting for all photographs. `luke.js` uses the
  existing snackbar styling for the legacy contact confirmation. The current
  contact form submission and success callback remain intact.
- `assets/js/product-gallery.js`: find images through picture wrappers and open
  original photographs for zoom inspection.

Verification:

- Before/after image geometry comparisons on 13 interior pages at both
  viewports pass within 2 CSS pixels (rounding); homepage desktop/mobile
  screenshots were inspected for crop, typography and responsive layout.
- No broken local HTML references, broken image requests, JavaScript exceptions,
  duplicate resource requests, or horizontal overflow in homepage checks.
- All ten product lightboxes load originals, zoom to 150%, close with Escape;
  mobile navigation opens; homepage anchor scrolling and return-to-top pass.
  Contact confirmation displays. No actual form submission was sent.
- All JavaScript files pass `node --check`; `git diff --check` passes. There is
  no pre-existing build command or test suite. The small development scripts
  under `scripts/` reproduce the asset generation, audits and checks.
- The final mobile trace has one 80 ms document task; TBT remains 0 ms. There
  was no actionable JavaScript attribution justifying a navigation rewrite.
- There is no existing minification pipeline. Editable CSS/JS remain readable;
  unused library removal was preferred to introducing a build solely for the
  reported 3 KiB CSS and 2 KiB JS minification opportunities.

Hosting follow-up:

Live HEAD requests show `Server: cloudflare`, HTML with
`public, max-age=0, must-revalidate`, and images/CSS with
`public, max-age=14400, must-revalidate`. This repository has an Apache
`.htaccess` and a GitHub remote but does not establish which origin or Cloudflare
deployment consumes server configuration. No speculative `_headers` or Apache
cache rules were added. Configure the actual Cloudflare/origin deployment:

- Permit one-year immutable caching only for generated image filenames matching
  `/assets/images/optimized/*-<12 hex characters>-*.(avif|webp|jpg)`.
- Keep HTML revalidating. Keep unversioned CSS/JS and `manifest.json` on short
  caching/revalidation; do not give the whole assets directory immutable caching.
- Verify Brotli/gzip delivery of text assets and correct AVIF/WebP MIME types.
  Rerun production PageSpeed on desktop/mobile after deployment and CDN refresh.

Reproduction (development only): install `sharp@0.35.4`,
`playwright-core@1.63.0`, and `lighthouse@12.8.2` into a temporary tools directory;
set NODE_PATH to its node_modules. Node 22.14.0 and installed Chrome were used.
No node_modules or downloaded runtime is included in the website.

```text
node scripts/generate-images.cjs
node scripts/audit-performance.cjs <site-root> <results-directory>
node scripts/verify-site.cjs <before-snapshot-root> <verification-directory>
node scripts/report-performance.cjs <directory-containing-before-after-verification>
```

Keep image originals and the manifest. When changing encoding policy, update the
generator's hash recipe/version and update HTML/CSS references to regenerated
filenames. The mobile hero crop is intentionally specific to the current forest
photograph and layout; revisit it if either changes. The audit scripts run a
loopback-only static server and close Chrome and the server when finished.

Technical references: [LCP discovery and prioritization](https://web.dev/articles/optimize-lcp),
[responsive images](https://web.dev/learn/design/responsive-images), and
[responsive preloading](https://web.dev/articles/preload-responsive-images).
