import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const base='43217d4a355b4476b85d06be753993adac049de5';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original=p=>git('show',base+':'+p);
const ledger=[
  [
    "R02",
    "public/knowledge/field/pressure/index.html",
    "/knowledge/field/pressure/case-study-zero-shift.html",
    "/knowledge/field/pressure/pressure-case-study-zero-shift/"
  ],
  [
    "R03",
    "public/knowledge/field/pressure/pressure-failures.html",
    "/knowledge/field/pressure/case-study-zero-shift.html",
    "/knowledge/field/pressure/pressure-case-study-zero-shift/"
  ],
  [
    "R04",
    "public/knowledge/field/signals/4-20ma/index.html",
    "/knowledge/field/signals/4-20ma/wiring.html",
    "/knowledge/field/signals/4-20ma/loop-wiring/"
  ],
  [
    "R07",
    "public/knowledge/field/signals/4-20ma/wiring-types.html",
    "/knowledge/field/signals/4-20ma/basics.html",
    "/knowledge/field/signals/4-20ma/420ma-basics/"
  ],
  [
    "R08",
    "public/knowledge/gc/gc-basics.html",
    "/knowledge/gc/gc-timing.html",
    "/knowledge/gc/gc-timing-chromatogram/"
  ],
  [
    "R10",
    "public/knowledge/gc/index.html",
    "/knowledge/gc/gc-timing.html",
    "/knowledge/gc/gc-timing-chromatogram/"
  ],
  [
    "R11",
    "public/legal.html",
    "index.html",
    "/"
  ]
];
const targets={
  "/knowledge/field/pressure/pressure-case-study-zero-shift/": [
    "public/knowledge/field/pressure/pressure-case-study-zero-shift.html",
    "Case Study \u2013 Zero Shift After Maintenance | InstMates"
  ],
  "/knowledge/field/signals/4-20ma/loop-wiring/": [
    "public/knowledge/field/signals/4-20ma/loop-wiring.html",
    "4\u201320 mA Loop Wiring | InstMates"
  ],
  "/knowledge/field/signals/4-20ma/420ma-basics/": [
    "public/knowledge/field/signals/4-20ma/420ma-basics.html",
    "4\u201320 mA Basics | InstMates Field Instrumentation"
  ],
  "/knowledge/gc/gc-timing-chromatogram/": [
    "public/knowledge/gc/gc-timing-chromatogram.html",
    "GC Timing vs Chromatogram | InstMates Knowledge Hub"
  ],
  "/": [
    "public/index.html",
    "InstMates \u2013 Field Troubleshooting, Technical Knowledge & Community for Instrument and Analyzer Professionals"
  ]
};
const preHashes={
  "public/knowledge/field/pressure/index.html": "8322d040fed61024f296445352ec79a4bfd5d3938cbc4d2bde071ae9cd0d73c5",
  "public/knowledge/field/pressure/pressure-failures.html": "662b87d84e337c6ece1e23200cedc83433d649b29320ddb04ed8c331263b1f44",
  "public/knowledge/field/signals/4-20ma/index.html": "656bc0aa31082f4df1cfa6f29ab0d6d803b0b17f9d7459e0bc11ce6ef63f3518",
  "public/knowledge/field/signals/4-20ma/wiring-types.html": "6027919152b179413458f8d75c36e518e9696e89b1a49bfc69a4fd3446f8f66a",
  "public/knowledge/gc/gc-basics.html": "22e652405590c0722932eb5993f7418d65b1d7f063f319cd2deb0d8c3d693966",
  "public/knowledge/gc/index.html": "c3b3e1055fb34b6ca78c54161f9c5c5d250a3dc8dfe500b8058b6312eb675217",
  "public/legal.html": "88e1418758dd82537861adbd777379fb0a1738210bd19d70612e6e9a149ae4bd"
};

test('exact seven accepted ledger IDs and distinct callers',()=>{
 assert.deepEqual(ledger.map(e=>e[0]),['R02','R03','R04','R07','R08','R10','R11']);
 assert.equal(new Set(ledger.map(e=>e[1])).size,7);
});
for(const [id,p,old,dest] of ledger) test(`${id}: exact correction and unchanged surrounding bytes`,()=>{
 const before=original(p),after=read(p),from=`href="${old}"`,to=`href="${dest}"`;
 assert.equal(createHash('sha256').update(before).digest('hex'),preHashes[p]);
 assert.equal(before.split(from).length,2);
 assert.ok(!after.includes(from));assert.ok(after.includes(to));
 assert.equal(after,before.replace(from,to));
 const [target,title]=targets[dest];
 assert.equal(git('ls-files','--error-unmatch',target).trim(),target);
 const html=read(target);assert.ok(html.includes(`<title>${title}</title>`));
 assert.ok(html.includes(`rel="canonical" href="https://www.instmates.com${dest}"`));
 assert.equal(html,original(target),'target content must remain unchanged');
 const links=s=>[...s.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before).map(u=>u===old?dest:u));
 for(const forbidden of ['/videos','/simulations/gas-metering-skid']){
  assert.deepEqual(links(after).filter(u=>u.startsWith(forbidden)),links(before).filter(u=>u.startsWith(forbidden)));
 }
});
test('Legal Home remains root-relative on raw and clean routes',()=>{
 assert.match(read('public/legal.html'),/<a href="\/">Home<\/a>/);
 for(const path of ['/legal.html','/legal/']) assert.equal(new URL('/',`https://www.instmates.com${path}`).pathname,'/');
});
test('protected tracked content, modes and HTML route inventory unchanged',()=>{
 const callers=new Set(ledger.map(e=>e[1]));
 const entries=git('ls-tree','-rz',base).split('\0').filter(Boolean).map(line=>line.split('\t'));
 for(const [meta,p] of entries){
  if(callers.has(p))continue;
  const [mode,,oid]=meta.split(' ');
  assert.equal(git('hash-object',p).trim(),oid,p);
  assert.equal(git('ls-files','-s','--',p).split(' ')[0],mode,p+' index mode');
  if(process.platform!=='win32')assert.equal(Boolean(statSync(new URL('../'+p,import.meta.url)).mode&0o111),mode==='100755',p+' working mode');
 }
 const walk=p=>readdirSync(new URL('../'+p,import.meta.url),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
 assert.deepEqual(walk('public').filter(p=>p.endsWith('.html')).sort(),entries.map(e=>e[1]).filter(p=>p.startsWith('public/')&&p.endsWith('.html')).sort());
});
test('remaining ledger callers and Desalter/catalog explicitly protected',()=>{
 for(const p of ['public/explore.html','public/knowledge/field/signals/4-20ma/scaling-calculation.html','public/knowledge/field/signals/4-20ma/troubleshooting.html','public/knowledge/gc/gc-sampling-system.html','public/sitemap.xml','public/labs/desalter/index.html','public/simulations/index.html']) assert.equal(read(p),original(p),p);
});
test('reviewed base retained without integrating P1B.3/P1B.4 bytes',()=>{
 // Accepted preservation objects remain separate; the checkout must not acquire their repairs.
 for(const p of ['public/includes/header.html','public/knowledge/laboratory/index.html'])assert.equal(read(p),original(p),p);
 assert.equal(git('merge-base',base,'HEAD').trim(),base);
});
