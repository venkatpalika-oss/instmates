import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { toCurrent, fromCurrent, percentOfRange } from '../public/assets/js/simulations/linear.js';
import { DEFAULTS, simulate, CHALLENGES, FAULTS } from '../public/assets/js/simulations/loop-model.js';
import { SIMULATIONS, CATEGORIES } from '../public/assets/js/simulations/catalog.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const run=patch=>simulate({...DEFAULTS,...patch});
for(const [percent,ma] of [[0,4],[25,8],[50,12],[75,16],[100,20]]) test(`${percent}% produces ${ma} mA across arbitrary ranges`,()=>{
 for(const [low,high] of [[0,10],[-50,150],[20,120],[2.5,3.75],[-120,-20]]) {
  const pv=low+(high-low)*percent/100; close(toCurrent(pv,low,high),ma); close(fromCurrent(ma,low,high),pv); close(percentOfRange(pv,low,high),percent);
 }
});
test('reverse conversion round trips non-integer ranges and out-of-range values',()=>{
 for(let i=-10;i<=110;i++) {const pv=-2.7+i*.19; close(fromCurrent(toCurrent(pv,-2.7,16.3),-2.7,16.3),pv);}
 close(fromCurrent(0,0,10),-2.5);
});
test('invalid/equal/reversed/nonfinite ranges fail without NaN readings',()=>{
 for(const [l,h] of [[0,0],[10,0],[NaN,10],[0,Infinity]]) {
  assert.throws(()=>toCurrent(5,l,h),RangeError); assert.throws(()=>fromCurrent(12,l,h),RangeError);
 }
 for(const patch of [{lrv:10},{dcsUrv:0},{pv:NaN},{pv:1e7},{manual:25},{stuck:-1},{zero:5},{span:51},{mode:'bad'},{fault:'missing'}]) assert.throws(()=>run(patch),RangeError);
});
test('normal model agrees at midpoint and all five reference points',()=>{
 for(const pv of [0,2.5,5,7.5,10]) {const r=run({pv});close(r.displayed,pv);close(r.tx,r.input);assert.equal(r.quality,'GOOD');}
});
test('open loop: command survives, measured current is zero, indication invalid',()=>{
 const r=run({fault:'open'});close(r.tx,12);close(r.loop,0);close(r.input,0);assert.equal(r.displayed,null);assert.equal(r.quality,'BAD');close(r.rawDcs,-2.5);
});
test('specified input bypass short preserves series current but gives zero receiver current',()=>{
 const r=run({fault:'short'});close(r.loop,12);close(r.input,0);assert.equal(r.displayed,null);
});
test('stuck 4 mA is valid zero indication despite changing PV',()=>{
 for(const pv of [0,5,10]) {const r=run({fault:'stuck',stuck:4,pv});close(r.loop,4);close(r.displayed,0);assert.equal(r.quality,'GOOD');}
});
test('zero shift is additive in mA; span error multiplies only live span',()=>{
 close(run({fault:'zero',zero:1}).tx,13);close(run({fault:'zero',zero:-1}).tx,11);
 close(run({fault:'span',span:10}).tx,12.8);close(run({fault:'span',span:10,pv:0}).tx,4);
 close(run({fault:'span',span:-25,pv:10}).tx,16);
});
test('DCS scaling affects indication only and can be corrected',()=>{
 const r=run({fault:'scaling',dcsUrv:5});close(r.loop,12);close(r.displayed,2.5);assert.ok(r.scalingMismatch);
 close(run({fault:'scaling',dcsUrv:10}).displayed,5);
});
test('forced current controls loop independently of PV and bypasses zero/span errors',()=>{
 for(const fault of ['normal','zero','span']) {const r=run({mode:'manual',manual:16,pv:1,fault});close(r.tx,16);close(r.displayed,7.5);}
 close(run({mode:'manual',manual:16,fault:'open'}).loop,0);
});
test('saturation and receiver quality boundaries are explicit',()=>{
 let r=run({pv:-10});close(r.expected,-12);close(r.tx,3.8);assert.ok(r.saturated);assert.equal(r.quality,'OUT OF RANGE');
 r=run({pv:20});close(r.tx,20.5);assert.ok(r.saturated);
 for(const ma of [0,3.79,20.51,24]) assert.equal(run({mode:'manual',manual:ma}).displayed,null);
 for(const ma of [3.8,4,20,20.5]) assert.notEqual(run({mode:'manual',manual:ma}).displayed,null);
});
test('challenge scenarios have modeled evidence and independent expected outcomes',()=>{
 assert.equal(CHALLENGES.length,3);assert.equal(Object.keys(FAULTS).length,7);
 const results=CHALLENGES.map(c=>run(c.state));close(results[0].displayed,2.5);close(results[1].expected,16);close(results[1].loop,4);assert.equal(results[2].displayed,null);
});
test('catalog publishes only working routes and four honest categories',()=>{
 assert.equal(CATEGORIES.length,4);assert.equal(SIMULATIONS.length,3);
 for(const s of SIMULATIONS) assert.ok(existsSync(new URL(`../public${s.href}index.html`,import.meta.url)));
});
test('learning pages isolate Firebase, retain shared shell and offer progressive fallback',()=>{
 for(const p of ['simulations/index.html','simulations/4-20ma-loop/index.html']) {
  const html=readFileSync(new URL(`../public/${p}`,import.meta.url),'utf8');
  assert.match(html,/data-public-learning="true"/);assert.match(html,/<noscript>/);assert.match(html,/id="siteHeader"/);assert.match(html,/id="siteFooter"/);assert.match(html,/rel="canonical"/);
  assert.doesNotMatch(html,/firebase\.js|header-auth\.js|auth-guard\.js/);
 }
 const loader=readFileSync(new URL('../public/assets/js/includes.js',import.meta.url),'utf8');
 assert.match(loader,/dataset\.publicLearning !== "true" && !document\.body\.dataset\.authLoaded/);
});


test('Desalter discovery uses the existing classification and public route',()=>{
 const entry=SIMULATIONS.find(s=>s.id==='desalter');
 assert.equal(entry.title,'Desalter Training Simulator');assert.equal(entry.category,'Process measurement');
 assert.equal(entry.href,'/labs/desalter/');assert.equal(entry.lab,'DESALTER');
 assert.deepEqual(entry.topics,['Level','Control loops','Fault diagnosis']);
 assert.deepEqual(SIMULATIONS.slice(0,2).map(s=>[s.lab,s.href]),[['01','/simulations/4-20ma-loop/'],['02','/simulations/pressure-transmitter-calibration/']]);
 const html=readFileSync(new URL('../public/simulations/index.html',import.meta.url),'utf8');
 assert.match(html.match(/<noscript>[\s\S]*?<\/noscript>/)[0],/href="\/labs\/desalter\/"/);
});
