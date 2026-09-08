const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
(async () => {
  const auditRoot = process.argv[2];
  fs.mkdirSync('docs/performance', { recursive: true });
  const summary = {};
  for (const version of ['before','after']) {
    summary[version] = {};
    for (const device of ['desktop','mobile']) {
      const report = JSON.parse(fs.readFileSync(path.join(auditRoot,version,`${device}-lighthouse.json`)));
      const browser = JSON.parse(fs.readFileSync(path.join(auditRoot,version,`${device}-browser.json`)));
      summary[version][device] = {
        lighthouseVersion: report.lighthouseVersion,
        settings: report.configSettings,
        metrics: Object.fromEntries(['largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift','total-byte-weight'].map(k=>[k,report.audits[k].numericValue])),
        lcpBreakdown: report.audits['lcp-breakdown-insight']?.details,
        longTasks: report.audits['long-tasks']?.details?.items,
        fullPageResourceBytes: browser.resources.reduce((n,r)=>n+r.bytes,0),
        errors: browser.errors,
        images: browser.images
      };
    }
  }
  fs.writeFileSync('docs/performance/measurements.json', JSON.stringify(summary,null,2)+'\n');
  fs.copyFileSync(path.join(auditRoot,'verification/verification.json'), 'docs/performance/verification.json');
  const files = fs.readdirSync('assets/images',{recursive:true}).map(p=>'assets/images/'+p.replaceAll('\\','/')).filter(p=>!p.includes('/optimized/') && /\.(jpe?g|png)$/.test(p));
  const htmlFiles = fs.readdirSync('.').filter(p=>p.endsWith('.html'));
  const manifest = JSON.parse(fs.readFileSync('assets/images/optimized/manifest.json'));
  const lines = [['source','width','height','original_bytes','referenced_by_pages','generated_widths']];
  for(const file of files) {
    const m = await sharp(file).metadata();
    const entry = manifest[file];
    const used = htmlFiles.filter(p=> {const html=fs.readFileSync(p,'utf8');return html.includes(file) || (entry && html.includes(entry.fallback));});
    lines.push([file,m.width,m.height,fs.statSync(file).size,used.join('; '),entry?.variants.map(v=>v.width).join('; ')||'']);
  }
  fs.writeFileSync('docs/performance/image-inventory.csv',lines.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n')+'\n');
  const missing=[];
  for(const page of htmlFiles) {
    const html=fs.readFileSync(page,'utf8').replace(/<!--[\s\S]*?-->/g,'');
    for(const m of html.matchAll(/(?:src|href|data-full-src)="([^"]+)"|srcset="([^"]+)"/g)) {
      for(let target of m[2] ? m[2].split(',').map(s=>s.trim().split(/\s+/)[0]) : [m[1]]) {
        if(/^(?:https?:|mailto:|tel:|#)/.test(target)) continue;
        target=target.split(/[?#]/)[0];
        if(target==='./' || !target) continue;
        if(!path.extname(target)) target+='.html';
        if(!fs.existsSync(target)) missing.push({page,target});
      }
    }
  }
  console.log(JSON.stringify({ sourceImages:files.length, optimizedSources:Object.keys(manifest).length, missingLocalReferences:missing, fullPageBytes:{ before:summary.before.desktop.fullPageResourceBytes,desktop:summary.after.desktop.fullPageResourceBytes,mobile:summary.after.mobile.fullPageResourceBytes } },null,2));
  if(missing.length) process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
