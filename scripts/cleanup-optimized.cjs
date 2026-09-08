// Remove only generated derivatives that are no longer referenced by the site.
// Original source photographs are outside this directory and are untouched.
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const optimizedRoot = path.join(root, 'assets', 'images', 'optimized');
const files = fs.readdirSync(root).filter(file => file.endsWith('.html'))
  .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
  .concat(fs.readFileSync(path.join(root, 'assets', 'css', 'product-pages.css'), 'utf8'))
  .join('\n');
const referenced = new Set([...files.matchAll(/(?:assets\/images\/optimized\/|\.\.\/images\/optimized\/)([^"'\s),]+)/g)].map(match => match[1]));
const removed = [];
for (const file of fs.readdirSync(optimizedRoot)) {
  if (file === 'manifest.json' || referenced.has(file)) continue;
  const absolute = path.join(optimizedRoot, file);
  if (path.dirname(absolute) !== optimizedRoot) throw new Error(`Unexpected cleanup target: ${absolute}`);
  fs.unlinkSync(absolute);
  removed.push(file);
}
const manifestPath = path.join(optimizedRoot, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const entry of Object.values(manifest)) {
  for (const key of ['variants', 'avif', 'mobileAvif']) {
    if (!entry[key]) continue;
    entry[key] = entry[key].filter(item => fs.existsSync(path.join(root, item.src)));
  }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Removed ${removed.length} unreferenced generated derivatives.`);
