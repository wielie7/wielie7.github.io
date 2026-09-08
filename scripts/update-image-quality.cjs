// Apply regenerated image URLs without changing layout or lightbox originals.
const fs = require('node:fs');
const path = require('node:path');
const old = JSON.parse(fs.readFileSync(process.argv[2]));
const next = JSON.parse(fs.readFileSync('assets/images/optimized/manifest.json'));
const files = fs.readdirSync('.').filter(f => f.endsWith('.html')).concat('assets/css/product-pages.css');
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const css = file.endsWith('.css');
  const fixed = css || text.includes('product-hero--fixed');
  for (const [source, before] of Object.entries(old)) {
    const after = next[source];
    const local = p => css ? p.replace('assets/', '../') : p;
    text = text.split(local(before.fallback)).join(local(after.fallback));
    // Responsive lists retain accurate width descriptors; fixed heroes and
    // their matching preload URLs get larger, identical resources.
    for (const variant of before.variants) {
      const targetWidth = fixed ? (variant.width >= 1600 ? 2400 : 1600) : variant.width;
      const replacement = after.variants.find(v => v.width >= targetWidth) || after.variants.at(-1);
      text = text.split(local(variant.src)).join(local(replacement.src));
    }
    if (!css) text = text.replace(/<source\b[^>]*type="image\/webp"[^>]*>/g, tag => {
      if (!tag.includes(after.variants[0].src.replace(/-\d+\.webp$/, '-'))) return tag;
      if (!tag.includes('sizes=')) return tag;
      return tag.replace(/srcset="[^"]*"/, `srcset="${after.variants.map(v => `${v.src} ${v.width}w`).join(', ')}"`);
    });
  }
  if (file === 'index.html') {
    text = text.replace(/(<div class="hero-image">)<picture>[\s\S]*?(<img[^>]+>)<\/picture>/, (_, div, img) => div + img.replace(/src="[^"]+"/, 'src="assets/images/about/outdoor-bench-forest.jpg"'));
    // The workshop photograph is also cropped to cover a tall section.
    text = text.replace(/(<source[^>]+workbench[^>]+sizes=")100vw/, '$1max(100vw, 110vh)');
  }
  fs.writeFileSync(file, text);
}
console.log('Updated responsive photographs and matching fixed-hero preloads.');
