import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceAudit} from '../scripts/audit-oxymitter-source.mjs';
import {SIMULATIONS,validateCatalog,CATEGORIES} from '../public/assets/js/simulations/catalog.js';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('M7 exactly one canonical runtime, unique catalog identity and valid taxonomy',()=>{
 validateCatalog(SIMULATIONS);const labs=SIMULATIONS.filter(x=>x.id==='oxymitter-4000');assert.equal(labs.length,1);
 const l=labs[0];assert.equal(l.lab,'03');assert.equal(l.href,'/simulations/oxymitter-4000/');assert.equal(l.status,'available');
 assert.deepEqual(l.categoryIds,['analyzers','field-skills']);assert.deepEqual(l.topicIds,['oxygen','gas-analysis','calibration','fault-finding','troubleshooting']);
 for(const id of l.topicIds)assert.ok(CATEGORIES.filter(c=>l.categoryIds.includes(c.id)).some(c=>c.topicIds.includes(id)));
 assert.equal(existsSync(new URL('simulator-foundations/oxymitter-4000/',root)),false);
 const html=read('public/simulations/oxymitter-4000/index.html');assert.doesNotMatch(html,/__oxymitter|LOCAL DEVELOPMENT/);
 for(const f of ['page','calibration-page','diagnostic-page','training-page','hardening-page'])assert.ok(html.includes(`/assets/js/simulations/oxymitter-4000/ui/${f}.mjs`));
});
test('M7 public shell is anonymous and noindex until release; sitemap remains gated',()=>{
 const html=read('public/simulations/oxymitter-4000/index.html');for(const token of ['id="siteHeader"','id="siteFooter"','data-public-learning="true"','class="sim-page oxymitter-page"','aria-label="Breadcrumb"','tabindex="-1"','href="#training"','/assets/js/includes.js','https://www.instmates.com/simulations/oxymitter-4000/','property="og:title"','property="og:description"','property="og:url"','href="/favicon.ico"','content="noindex,nofollow"'])assert.ok(html.includes(token),token);
 assert.doesNotMatch(read('public/sitemap.xml'),/oxymitter-4000/);assert.match(read('public/simulations/index.html'),/oxymitter-4000/);
 assert.doesNotMatch(html,/firebase|analytics|gtag|https:\/\/(?:fonts|cdn)/i);
 const dir='public/assets/js/simulations/oxymitter-4000/';for(const f of [...readdirSync(new URL(dir,root)).filter(x=>x.endsWith('.mjs')),...readdirSync(new URL(dir+'ui/',root)).map(x=>'ui/'+x)])assert.doesNotMatch(read(dir+f),/localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|XMLHttpRequest|firebase|firestore/);
});
test('M7 technical files retain M6 hashes with only the declared training-data import relocation',async()=>{
 const evidence=JSON.parse(read('docs/33-oxymitter-4000-integrity.json'));
 assert.deepEqual((await sourceAudit()).records,JSON.parse(read('docs/32-oxymitter-4000-source-audit.json')).records);
 for(const [path,hash] of Object.entries(evidence.historicalArtifacts))assert.equal(createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex'),hash,path);
 for(const f of evidence.runtime.filter(f=>f.kind==='module')){
  let content=read(f.to);if(f.normalization)content=content.replace('./ui/view-model.mjs','./dev/view-model.mjs');
  assert.equal(createHash('sha256').update(content).digest('hex'),f.beforeSha256,f.to);
 }
});
