// Local functional and layout checks, using a temporary Playwright installation.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
(async () => {
  const roots = [process.argv[2], process.cwd()].map(p => path.resolve(p));
  const out = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const match = /^\/(before|after)(\/.*)$/.exec(url.pathname);
    if (!match) { res.writeHead(404); res.end(); return; }
    const root = roots[match[1] === 'before' ? 0 : 1];
    let file = path.resolve(root, '.' + decodeURIComponent(match[2]));
    if (file === root) file += '/index.html';
    if (!path.extname(file)) file += '.html';
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(file);
    res.setHeader('Content-Type', ({'.html':'text/html', '.css':'text/css','.js':'text/javascript','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2'})[ext] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const results = [];
  try {
    for (const mobile of [false,true]) {
      const context = await browser.newContext({ viewport: mobile ? { width:390,height:844 } : { width:1440,height:900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile:mobile });
      const page = await context.newPage();
      let errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if(r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
      for (const file of fs.readdirSync('.').filter(p => p.endsWith('.html') && fs.readFileSync(p,'utf8').includes('<main'))) {
        const layouts = [];
        for (const version of ['before','after']) {
          errors = [];
          await page.goto(`${origin}/${version}/${file}`, { waitUntil:'networkidle' });
          await page.waitForTimeout(1100);
          for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 750) { await page.evaluate(y => scrollTo(0,y),y); await page.waitForTimeout(50); }
          await page.waitForTimeout(400);
          layouts.push(await page.evaluate(() => [...document.querySelectorAll('main img')].map(i => { const r=i.getBoundingClientRect(); return {alt:i.alt,x:r.x,y:r.y+scrollY,width:r.width,height:r.height}; })));
          if (version === 'after') {
            const broken = await page.evaluate(() => [...document.images].filter(i=> i.getAttribute('src') && (!i.complete || !i.naturalWidth)).map(i=>i.src));
            const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(r=>r.name));
            const duplicates = resources.filter((r,i) => resources.indexOf(r)!==i);
            await page.evaluate(() => scrollTo(0,0));
            await page.waitForTimeout(200);
            if (file.includes('wf08') || file.includes('pillar') || file.includes('reef')) await page.screenshot({path:path.join(out,`${mobile?'mobile':'desktop'}-${file}.png`)});
            let lightbox = null;
            if (await page.locator('.product-hero img').count()) {
              await page.locator('.product-hero img').dispatchEvent('click');
              await page.locator('.image-lightbox__stage img').evaluate(i=>i.decode());
              await page.locator('[data-zoom-in]').click();
              lightbox = { source:await page.locator('.image-lightbox__stage img').getAttribute('src'), zoom:await page.locator('.image-lightbox__level').textContent() };
              await page.keyboard.press('Escape');
              if(await page.locator('.image-lightbox').isVisible()) errors.push('Lightbox did not close');
            }
            if(mobile && await page.locator('.navbar-toggle').count()) { await page.locator('.navbar-toggle').click(); await page.waitForTimeout(400); if(!await page.locator('#navbar-menu').isVisible()) errors.push('Mobile menu did not open'); }
            results.push({ file,mobile,errors:[...errors],broken,duplicates,lightbox,layoutBefore:layouts[0],layoutAfter:layouts[1] });
          }
        }
      }
      errors=[];
      await page.goto(`${origin}/after/index.html?callback=contact`,{waitUntil:'networkidle'});
      await page.waitForTimeout(1200);
      await page.screenshot({path:path.join(out,`${mobile?'mobile':'desktop'}-home.png`)});
      const title = await page.locator('.header-text h2').evaluate(e=>({opacity:getComputedStyle(e).opacity,rect:e.getBoundingClientRect().toJSON(),font:getComputedStyle(e).fontFamily}));
      const confirmation = await page.locator('#snackbar').textContent();
      if(mobile) await page.locator('.navbar-toggle').click();
      await page.locator('a[href="#CustomFurniture"]').click();
      await page.waitForTimeout(1500);
      const anchor = await page.evaluate(()=>Math.abs(document.getElementById('CustomFurniture').getBoundingClientRect().top)<5);
      await page.locator('.return-to-top').click();
      await page.waitForTimeout(500);
      const returned = await page.evaluate(()=>scrollY<5);
      results.push({file:'index.html',mobile,errors,title,confirmation,anchor,returned});
      await context.close();
    }
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results.map(({layoutBefore,layoutAfter,...r})=>({...r,layoutChanged:layoutBefore?.some((b,i)=> ['x','y','width','height'].some(k=>Math.abs(b[k]-layoutAfter[i]?.[k])>2))})),null,2));
    const failures = results.filter(r => r.errors.length || r.broken?.length || r.duplicates?.length || r.anchor === false || r.returned === false || r.layoutBefore?.some((b,i)=> ['x','y','width','height'].some(k=>Math.abs(b[k]-r.layoutAfter[i]?.[k])>2)));
    if (failures.length) throw new Error(`Verification failed for ${failures.length} page/viewport combinations.`);
  } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
