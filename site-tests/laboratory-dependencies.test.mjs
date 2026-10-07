import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const base='43217d4a355b4476b85d06be753993adac049de5';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original=p=>git('show',base+':'+p);
const hash=s=>createHash('sha256').update(s).digest('hex');
const jsonld=s=>[...s.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const callers=[
  "public/knowledge/index.html",
  "public/knowledge/laboratory/bias-linearity-lod-loq/index.html",
  "public/knowledge/laboratory/calibration-master-guide/index.html",
  "public/knowledge/laboratory/control-charts-spc/index.html",
  "public/knowledge/laboratory/control-charts-spc/worked-example/index.html",
  "public/knowledge/laboratory/flash-point-analyzer/astm-d56/index.html",
  "public/knowledge/laboratory/flash-point-analyzer/astm-d93/index.html",
  "public/knowledge/laboratory/flash-point-analyzer/index.html",
  "public/knowledge/laboratory/flash-point-analyzer/troubleshooting/index.html",
  "public/knowledge/laboratory/index.html",
  "public/knowledge/laboratory/iso-17025-audit-preparation/index.html",
  "public/knowledge/laboratory/iso-17025-clause-breakdown/index.html",
  "public/knowledge/laboratory/measurement-uncertainty/index.html",
  "public/knowledge/laboratory/measurement-uncertainty/worked-example/index.html",
  "public/knowledge/laboratory/rsd-accuracy-precision/index.html"
];
const ledger=[
  {
    "caller": "public/knowledge/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/flash-point-analyzer/",
    "corrected": "/knowledge/laboratory/flash-point-analyzer/"
  },
  {
    "caller": "public/knowledge/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/calibration-master-guide/",
    "corrected": "/knowledge/laboratory/calibration-master-guide/"
  },
  {
    "caller": "public/knowledge/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/iso-17025-audit-preparation/",
    "corrected": "/knowledge/laboratory/iso-17025-audit-preparation/"
  },
  {
    "caller": "public/knowledge/laboratory/bias-linearity-lod-loq/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/calibration-master-guide/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/control-charts-spc/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/control-charts-spc/worked-example/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/control-charts-spc/worked-example/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/control-charts-spc/",
    "corrected": "/knowledge/laboratory/control-charts-spc/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/astm-d56/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/astm-d56/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/flash-point-analyzer/",
    "corrected": "/knowledge/laboratory/flash-point-analyzer/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/astm-d93/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/astm-d93/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/flash-point-analyzer/",
    "corrected": "/knowledge/laboratory/flash-point-analyzer/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/flash-point-analyzer/troubleshooting/",
    "corrected": "/knowledge/laboratory/flash-point-analyzer/troubleshooting/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/troubleshooting/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/troubleshooting/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/flash-point-analyzer/",
    "corrected": "/knowledge/laboratory/flash-point-analyzer/"
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/gc-lab-fundamentals/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/hplc-fundamentals/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/uv-vis-principle/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/icp-analysis/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/toc-analyzer/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/elemental-analyzer/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/karl-fischer/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/automatic-titrator/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/ph-conductivity/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/lab-troubleshooting-master/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/iso-17025-audit-preparation/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/iso-17025-clause-breakdown/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/measurement-uncertainty/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/measurement-uncertainty/worked-example/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/measurement-uncertainty/worked-example/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/measurement-uncertainty/",
    "corrected": "/knowledge/laboratory/measurement-uncertainty/"
  },
  {
    "caller": "public/knowledge/laboratory/rsd-accuracy-precision/index.html",
    "type": "navigation",
    "old": "/knowledge/analyzers/laboratory/",
    "corrected": "/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/",
    "corrected": "https://www.instmates.com/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/bias-linearity-lod-loq/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/",
    "corrected": "https://www.instmates.com/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/bias-linearity-lod-loq/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/bias-linearity-lod-loq/",
    "corrected": "https://www.instmates.com/knowledge/laboratory/bias-linearity-lod-loq/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/",
    "corrected": "https://www.instmates.com/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/flash-point-analyzer/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/flash-point-analyzer/",
    "corrected": "https://www.instmates.com/knowledge/laboratory/flash-point-analyzer/"
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/",
    "corrected": "https://www.instmates.com/knowledge/laboratory/"
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/gc-lab-fundamentals/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/hplc-fundamentals/",
    "corrected": null
  },
  {
    "caller": "public/knowledge/laboratory/index.html",
    "type": "metadata:JSON-LD",
    "old": "https://www.instmates.com/knowledge/analyzers/laboratory/uv-vis-principle/",
    "corrected": null
  }
];
const targets={
  "/knowledge/laboratory/flash-point-analyzer/": "Flash Point Analyzer \u2013 Principle, ASTM Methods & Troubleshooting | InstMates",
  "/knowledge/laboratory/calibration-master-guide/": "Laboratory Analyzer Calibration \u2013 Master Technical Guide | InstMates",
  "/knowledge/laboratory/iso-17025-audit-preparation/": "ISO 17025 Audit Preparation \u2013 Laboratory Technical Guide | InstMates",
  "/knowledge/laboratory/": "Laboratory Analyzers \u2013 GC, HPLC, UV-Vis & Analytical Fundamentals | InstMates",
  "/knowledge/laboratory/control-charts-spc/": "Control Charts & Statistical Process Control (SPC) \u2013 Laboratory Guide | InstMates",
  "/knowledge/laboratory/flash-point-analyzer/troubleshooting/": "Flash Point Analyzer \u2013 Troubleshooting Decision Tree | InstMates",
  "/knowledge/laboratory/measurement-uncertainty/": "Measurement Uncertainty \u2013 Laboratory Technical Guide | InstMates",
  "/knowledge/laboratory/bias-linearity-lod-loq/": "Bias vs Linearity vs LOD & LOQ \u2013 Laboratory Technical Guide | InstMates"
};
const removedBlocks=[
  ",\n    \"hasPart\": [\n      {\n        \"@type\": \"WebPage\",\n        \"name\": \"GC \u2013 Laboratory Fundamentals\",\n        \"url\": \"https://www.instmates.com/knowledge/analyzers/laboratory/gc-lab-fundamentals/\"\n      },\n      {\n        \"@type\": \"WebPage\",\n        \"name\": \"HPLC \u2013 Components & Calibration\",\n        \"url\": \"https://www.instmates.com/knowledge/analyzers/laboratory/hplc-fundamentals/\"\n      },\n      {\n        \"@type\": \"WebPage\",\n        \"name\": \"UV-Vis \u2013 Principle & Maintenance\",\n        \"url\": \"https://www.instmates.com/knowledge/analyzers/laboratory/uv-vis-principle/\"\n      }\n    ]",
  "    <p>\n      Deep dive:\n      <a href=\"/knowledge/analyzers/laboratory/gc-lab-fundamentals/\">\n        GC \u2013 Laboratory Fundamentals & Troubleshooting\n      </a>\n    </p>",
  "    <p>\n      Full guide:\n      <a href=\"/knowledge/analyzers/laboratory/hplc-fundamentals/\">\n        HPLC \u2013 Components, Calibration & Faults\n      </a>\n    </p>",
  "    <p>\n      Learn more:\n      <a href=\"/knowledge/analyzers/laboratory/uv-vis-principle/\">\n        UV-Vis \u2013 Principle & Maintenance\n      </a>\n    </p>",
  "  <section class=\"panel\">\n    <h2>Other Critical Lab Analyzers</h2>\n\n    <div class=\"grid grid-2\">\n\n      <div class=\"card\">\n        <h3>Elemental & Chemical Analysis</h3>\n        <ul class=\"checklist\">\n          <li>\n            <a href=\"/knowledge/analyzers/laboratory/icp-analysis/\">\n              ICP \u2013 Inductively Coupled Plasma\n            </a>\n          </li>\n          <li>\n            <a href=\"/knowledge/analyzers/laboratory/toc-analyzer/\">\n              TOC Analyzer \u2013 Total Organic Carbon\n            </a>\n          </li>\n          <li>\n            <a href=\"/knowledge/analyzers/laboratory/elemental-analyzer/\">\n              Elemental Analyzer \u2013 CHNS\n            </a>\n          </li>\n        </ul>\n      </div>\n\n      <div class=\"card\">\n        <h3>Moisture & Reaction Based</h3>\n        <ul class=\"checklist\">\n          <li>\n            <a href=\"/knowledge/analyzers/laboratory/karl-fischer/\">\n              Karl Fischer \u2013 Moisture Analysis\n            </a>\n          </li>\n          <li>\n            <a href=\"/knowledge/analyzers/laboratory/automatic-titrator/\">\n              Automatic Titrator\n            </a>\n          </li>\n          <li>\n            <a href=\"/knowledge/analyzers/laboratory/ph-conductivity/\">\n              pH & Conductivity Lab Systems\n            </a>\n          </li>\n        </ul>\n      </div>\n\n    </div>\n\n  </section>",
  "    <p>\n      Decision logic:\n      <a href=\"/knowledge/analyzers/laboratory/lab-troubleshooting-master/\">\n        Laboratory Analyzer Troubleshooting \u2013 Master Guide\n      </a>\n    </p>"
];
const baselineHashes={
  "public/knowledge/index.html": "960a834d2b9edc9116a7924ae29879938ac28d896f875bb1527c61530336d839",
  "public/knowledge/laboratory/bias-linearity-lod-loq/index.html": "5ac68216ea20f9387e1186cd41c9431f54cda6267c20d00311cba869db6fd045",
  "public/knowledge/laboratory/calibration-master-guide/index.html": "ebe4acc1c8e7abe79d2cb7bbe93b0881285bc7872865efbf3cc45e6895ba5417",
  "public/knowledge/laboratory/control-charts-spc/index.html": "e53ed2f88eb2955f1749511d6c22f5ec9d3c78cb05a83a55fa6ba82149767184",
  "public/knowledge/laboratory/control-charts-spc/worked-example/index.html": "2550c35e256d4534e84660fba921e3eac6665487017c844551b2de58407e1880",
  "public/knowledge/laboratory/flash-point-analyzer/astm-d56/index.html": "89d82a5bcb371539d39472f4249bd9370b12b829ebdcf2e9215a594b316eb19d",
  "public/knowledge/laboratory/flash-point-analyzer/astm-d93/index.html": "6af8f6b943e612327e36536ef44db485846e360269a92ce75c9a4b453120518a",
  "public/knowledge/laboratory/flash-point-analyzer/index.html": "de00b4f072aa68afd5fc37da525e67d286474a45f8516c0110be514818fc003f",
  "public/knowledge/laboratory/flash-point-analyzer/troubleshooting/index.html": "e6379853a0d95dbdc577322dc1d34da3916197430548605e5a672308ad1429ef",
  "public/knowledge/laboratory/index.html": "7c119345c7b6e3ed4ff92034dd8b18dab58f3d565fb553c15a1eb0b35169d1ae",
  "public/knowledge/laboratory/iso-17025-audit-preparation/index.html": "774ac625c832fed244faa2d91354675848d665205f2dfff97938b144b5067238",
  "public/knowledge/laboratory/iso-17025-clause-breakdown/index.html": "32826d9befd0080e568863536f6c3b9ccc9dc990a3c90150ae6c99e707ff2ae4",
  "public/knowledge/laboratory/measurement-uncertainty/index.html": "ae508035a1ad881ee9552fba7dd1903d7924cbeff4f497c1525f1670f7cc467e",
  "public/knowledge/laboratory/measurement-uncertainty/worked-example/index.html": "c30a90dc3b8a3961e39f91b82afac5ee7bc716e6c643ac7ff24e17007205952a",
  "public/knowledge/laboratory/rsd-accuracy-precision/index.html": "905ba680e834942da0b3ff961097f3f7c9e377a013072a15060f9a8f54fc49ab"
};

test('exact accepted ledger: 15 callers, 28 corrections, 13 removals',()=>{
 assert.equal(callers.length,15); assert.equal(ledger.length,41);
 assert.equal(new Set(ledger.map(e=>e.caller+'|'+e.type+'|'+e.old)).size,41);
 assert.equal(ledger.filter(e=>e.corrected).length,28);
 assert.equal(ledger.filter(e=>!e.corrected).length,13);
 assert.deepEqual([...new Set(ledger.map(e=>e.caller))].sort(),callers);
});
for(const [i,e] of ledger.entries()) test(`ledger ${i+1}: ${e.type} ${e.old}`,()=>{
 const source=read(e.caller); assert.ok(original(e.caller).includes('"'+e.old+'"'));
 assert.ok(!source.includes(e.old));
 if(e.corrected){
  assert.ok(source.includes('"'+e.corrected+'"'));
  const route=e.corrected.replace('https://www.instmates.com','');
  assert.ok(Object.hasOwn(targets,route));
  const p='public'+route+'index.html';
  assert.equal(git('ls-files','--error-unmatch',p).trim(),p);
  assert.ok(read(p).includes('<title>'+targets[route]+'</title>'));
  assert.ok(read(p).includes('rel="canonical" href="https://www.instmates.com'+route+'"'));
 }
});
for(const p of callers) test(`only accepted transformations and valid JSON-LD: ${p}`,()=>{
 let expected=original(p); assert.equal(hash(expected),baselineHashes[p]);
 if(p==='public/knowledge/laboratory/index.html') for(const block of removedBlocks){
  assert.equal(expected.split(block).length,2); expected=expected.replace(block,'');
 }
 for(const e of ledger.filter(e=>e.caller===p&&e.corrected)) expected=expected.replaceAll('"'+e.old+'"','"'+e.corrected+'"');
 assert.equal(read(p),expected,'unrelated educational content or reference changed');
 assert.ok(!read(p).includes('/knowledge/analyzers/laboratory/'));
 for(const obj of jsonld(read(p))){assert.equal(obj['@context'],'https://schema.org');assert.ok(obj['@type']);}
 const refs=s=>[...s.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
 const allowed=new Set(refs(original(p)).concat(ledger.filter(e=>e.caller===p&&e.corrected).map(e=>e.corrected)));
 for(const dest of refs(read(p))) assert.ok(allowed.has(dest),dest);
 assert.ok(!/\/(?:videos|simulations\/gas-metering-skid)(?:\/|\.html|["'])/.test(read(p)));
});
test('F10 advertisements removed without empty structural shells',()=>{
 const s=read('public/knowledge/laboratory/index.html');
 for(const e of ledger.filter(e=>!e.corrected)) assert.ok(!s.includes(e.old.split('/').filter(Boolean).at(-1)));
 for(const b of removedBlocks) assert.ok(!s.includes(b));
 const objects=jsonld(s);assert.equal(objects.length,2);
 assert.equal(objects[0]['@type'],'CollectionPage');assert.ok(!Object.hasOwn(objects[0],'hasPart'));
 assert.equal(objects[1]['@type'],'BreadcrumbList');assert.equal(objects[1].itemListElement.length,4);
 const emptyShells=html=>[...html.matchAll(/<(h[1-6]|ul|section|div)\b[^>]*>\s*<\/\1>/g)].map(m=>m[0]);
 assert.deepEqual(emptyShells(s),emptyShells(original('public/knowledge/laboratory/index.html')),'no new empty shells; retain shared include mount points');
 assert.ok(s.includes('<svg'));assert.ok(s.includes('<li>Baseline drift</li>'));
 assert.ok(s.includes('<li>Pump pressure fluctuation (HPLC)</li>'));
});
test('route inventory and protected tracked bytes/modes unchanged',()=>{
 const tracked=git('ls-tree','-rz',base).split('\0').filter(Boolean);
 for(const line of tracked){
  const [meta,p]=line.split('\t');if(callers.includes(p)) continue;
  assert.equal(git('hash-object',p).trim(),meta.split(' ')[2],p);
  assert.equal(git('ls-files','-s','--',p).split(' ')[0],meta.split(' ')[0],p+' index mode');
  if(process.platform!=='win32') assert.equal(Boolean(statSync(new URL('../'+p,import.meta.url)).mode & 0o111),meta.startsWith('100755'),p+' working mode');
 }
 const walk=p=>readdirSync(new URL('../'+p,import.meta.url),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
 assert.deepEqual(walk('public').filter(p=>p.endsWith('.html')).sort(),tracked.map(l=>l.split('\t')[1]).filter(p=>p.startsWith('public/')&&p.endsWith('.html')).sort());
 // This checkout starts at reviewed main, not P1B.3. Preserve its baseline header;
 // do not integrate the separate accepted navigation repair to satisfy this test.
 assert.equal(read('public/includes/header.html'),original('public/includes/header.html'));
 assert.equal(read('public/simulations/index.html'),original('public/simulations/index.html'));
 assert.equal(read('public/labs/desalter/index.html'),original('public/labs/desalter/index.html'));
});
