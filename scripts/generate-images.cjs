// Run with Sharp available in NODE_PATH. Originals are never overwritten.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

(async () => {
  const manifestPath = 'assets/images/optimized/manifest.json';
  const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : {};
  const html = fs.readdirSync('.').filter(p => p.endsWith('.html')).map(p => fs.readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, '')).join('\n');
  const sources = new Set([...Object.keys(old), ...[...html.matchAll(/(?:src|data-full-src)="(assets\/images\/(?!optimized\/)[^"]+)"/g)].map(m => m[1]), 'assets/images/about/outdoor-bench-forest.jpg']);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const manifest = {};
  for (const source of sources) {
    const input = fs.readFileSync(source);
    const meta = await sharp(input).metadata();
    const rotated = meta.orientation >= 5 && meta.orientation <= 8;
    const width = rotated ? meta.height : meta.width;
    const height = rotated ? meta.width : meta.height;
    const hash = crypto.createHash('sha256').update(input).update('webp-q94-jpeg-q94-v2').digest('hex').slice(0, 12);
    const base = `assets/images/optimized/${path.parse(source).name}-${hash}`;
    const variants = [];
    for (const size of [...new Set([1200, 1600, 2400, 3200, Math.min(width, 3200)].filter(n => n <= width))].sort((a,b) => a-b)) {
      const file = `${base}-${size}.webp`;
      if (!fs.existsSync(file)) await sharp(input).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 94, effort: 6 }).toFile(file);
      variants.push({ width: size, src: file, bytes: fs.statSync(file).size });
    }
    const fallback = `${base}-fallback.jpg`;
    if (!fs.existsSync(fallback)) await sharp(input).rotate().resize({ width: Math.min(width, 2400), withoutEnlargement: true }).flatten({ background: '#fff' }).jpeg({ quality: 94, mozjpeg: true }).toFile(fallback);
    const avif = [];
    const mobileAvif = [];
    if (source.endsWith('/outdoor-bench-forest.jpg')) {
      for (const size of [800, 1200, 1600]) {
        const file = `${base}-${size}-q65.avif`;
        if (!fs.existsSync(file)) await sharp(input).rotate().resize({ width: size }).avif({ quality: 65, effort: 6 }).toFile(file);
        avif.push({ width: size, src: file, bytes: fs.statSync(file).size });
      }
      // Mobile hero: retain the central 960 pixels. With a 60vw image box,
      // max-width 768px and min-height 600px, the removed sides are always
      // outside the existing centered cover crop. Keep the full source height.
      for (const size of [480, 800, 960]) {
        const file = `${base}-mobile-${size}-q90.avif`;
        if (!fs.existsSync(file)) await sharp(input).extract({ left: 320, top: 0, width: 960, height: 1066 }).resize({ width: size }).avif({ quality: 90, effort: 6 }).toFile(file);
        mobileAvif.push({ width: size, src: file, bytes: fs.statSync(file).size });
      }
    }
    manifest[source] = { width, height, originalBytes: input.length, fallback, variants, ...(avif.length ? { avif, mobileAvif } : {}) };
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generated responsive derivatives for ${sources.size} photographs.`);
})().catch(error => { console.error(error); process.exit(1); });
