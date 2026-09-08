// Development-only audit. Requires playwright-core and lighthouse in NODE_PATH.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

(async () => {
  const root = path.resolve(process.argv[2] || '.');
  const output = path.resolve(process.argv[3] || 'performance-results');
  fs.mkdirSync(output, { recursive: true });
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (file === root) file = path.join(root, 'index.html');
    if (!path.extname(file)) file += '.html';
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--remote-debugging-port=9222'] });
  try {
    const lighthouse = (await import(pathToFileURL(require.resolve('lighthouse')).href)).default;
    for (const mobile of [false, true]) {
      const name = mobile ? 'mobile' : 'desktop';
      const run = await lighthouse(url, { port: 9222, output: 'json', onlyCategories: ['performance'], ...(mobile ? {} : { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } }) });
      fs.writeFileSync(path.join(output, `${name}-lighthouse.json`), run.report);
      console.log(name, JSON.stringify(Object.fromEntries(['largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift','total-byte-weight'].map(k => [k, run.lhr.audits[k].displayValue]))));
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200); // Compare the completed entrance animation.
      await page.screenshot({ path: path.join(output, `${name}-hero.png`) });
      for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 650) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(100); }
      await page.waitForTimeout(1200);
      const details = await page.evaluate(() => ({
        images: [...document.images].map(i => ({ src: i.currentSrc, width: i.width, height: i.height, complete: i.complete, naturalWidth: i.naturalWidth })),
        resources: performance.getEntriesByType('resource').map(r => ({ url: r.name, bytes: r.transferSize, duration: r.duration })),
        overflow: document.documentElement.scrollWidth > innerWidth
      }));
      await page.screenshot({ path: path.join(output, `${name}-full.png`), fullPage: true });
      fs.writeFileSync(path.join(output, `${name}-browser.json`), JSON.stringify({ errors, ...details }, null, 2));
      console.log(name, 'browser errors:', errors, 'full-page transfer:', details.resources.reduce((n,r) => n+r.bytes,0));
      await context.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exit(1); });
