/** Optional local browser acceptance suite. Requires Playwright + Chromium.
 * Starts a loopback-only static server by default; no production requests are allowed.
 * Environment: SIM_BASE_URL, SIM_EVIDENCE_DIR, SIM_CHROMIUM_PATH, SIM_CHROMIUM_MODULE,
 * SIM_AXE_MODULE (optional @axe-core/playwright module path).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
let server;
if (!process.env.SIM_BASE_URL) {
 server=createServer(async(req,res)=>{
  try {
   const path=new URL(req.url,'http://localhost').pathname;
   const file=new URL(`../public${path}${path.endsWith('/')?'index.html':''}`,import.meta.url);
   if(!file.pathname.startsWith(new URL('../public/',import.meta.url).pathname)) {res.writeHead(403).end();return;}
   const data=await readFile(file);
   const ext=file.pathname.split('.').pop();
   res.setHeader('Content-Type',({html:'text/html',js:'text/javascript',css:'text/css',png:'image/png',ico:'image/x-icon',svg:'image/svg+xml'})[ext]||'application/octet-stream');
   res.end(data);
  } catch {res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
}
const base=process.env.SIM_BASE_URL || `http://127.0.0.1:${server.address().port}`;
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Local server required');
const output=process.env.SIM_EVIDENCE_DIR || '/tmp/instmates-sim-evidence';
await mkdir(output,{recursive:true});
let options={headless:true};
if(process.env.SIM_CHROMIUM_PATH) options.executablePath=process.env.SIM_CHROMIUM_PATH;
if(process.env.SIM_CHROMIUM_MODULE) {
 const { default:packaged }=await import(process.env.SIM_CHROMIUM_MODULE);
 options={...options,executablePath:await packaged.executablePath(),args:packaged.args};
}
const browser=await chromium.launch(options);
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const page=await context.newPage();
const errors=[],external=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await context.route('**/*',route=>{
 if(new URL(route.request().url()).origin !== new URL(base).origin) {external.push(route.request().url());return route.abort();}
 return route.continue();
});
const check=(name)=>checks.push(name);
const eq=async(id,value)=>assert.equal(await page.locator(`#${id}`).innerText(),value,id);
const set=async(id,value)=>page.locator(`#${id}`).fill(String(value));
try {
 await page.goto(`${base}/simulations/4-20ma-loop/`);
 await page.waitForFunction(()=>document.getElementById('display-reading').textContent==='5.00 bar');
 await page.waitForSelector('.mobile-bottom-nav',{state:'attached'});
 await eq('loop-reading','12.00 mA');check('initial calculation and shared shell');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/simulator-desktop.png`,fullPage:true});
 for(const [pv,current] of [[0,'4.00 mA'],[2.5,'8.00 mA'],[5,'12.00 mA'],[7.5,'16.00 mA'],[10,'20.00 mA']]) {await set('pv',pv);await eq('loop-reading',current);}check('five-point live input');
 await set('lrv',-50);await set('urv',150);await set('pv',0);await page.locator('#match-range').click();await eq('loop-reading','8.00 mA');await eq('display-reading','0.00 bar');check('arbitrary range and matching DCS');
 await page.locator('#reset').click();
 await set('urv',0);assert.equal(await page.locator('#input-error').isVisible(),true);await eq('display-reading','—');
 await set('urv',10);await eq('display-reading','5.00 bar');await set('pv','');await eq('display-reading','—');await set('pv',5);check('invalid inputs clear stale readings and recover');
 for(const [fault,loop,input,display] of [
  ['open','0.00 mA','0.00 mA','BAD SIGNAL'],['short','12.00 mA','0.00 mA','BAD SIGNAL'],
  ['stuck','4.00 mA','4.00 mA','0.00 bar'],['zero','13.00 mA','13.00 mA','5.63 bar'],
  ['span','12.80 mA','12.80 mA','5.50 bar'],['scaling','12.00 mA','12.00 mA','2.50 bar']]) {
  await page.locator('#fault').selectOption(fault);await eq('loop-reading',loop);await eq('input-reading',input);await eq('display-reading',display);
 }
 check('all injected fault modes');
 await eq('card-process','5.00 bar');await eq('card-ideal','12.00 mA');await eq('card-loop','12.00 mA');await eq('card-dcs','2.50 bar');
 assert.ok(await page.locator('#display-node').evaluate(e=>e.classList.contains('node-warning')));
 assert.ok(await page.locator('#signal-path').evaluate(e=>e.classList.contains('flowing')));
 check('scaling fault keeps current active and highlights receiver/display');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/scaling-fault-desktop.png`,fullPage:true});
 await page.locator('#reset').click();
 await page.locator('#fault').selectOption('open');
 assert.ok(await page.locator('.wire-open-contact').isVisible());
 assert.equal(await page.locator('#signal-path').evaluate(e=>e.classList.contains('flowing')),false);
 assert.equal(await page.locator('.wire-movement').evaluate(e=>getComputedStyle(e).opacity),'0');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/open-loop-desktop.png`,fullPage:true});
 await page.locator('#fault').selectOption('short');assert.ok(await page.locator('.bypass-path').isVisible());
 await eq('loop-reading','12.00 mA');await eq('input-reading','0.00 mA');
 check('open path stops all flow; bypass preserves series current');
 await page.locator('#fault').selectOption('stuck');
 const oldNeedle=await page.locator('#pressure-needle').getAttribute('style');
 await set('pv',8);await eq('loop-reading','4.00 mA');await eq('expected-reading','Ideal: 16.80 mA');
 assert.notEqual(await page.locator('#pressure-needle').getAttribute('style'),oldNeedle);
 check('process gauge moves while stuck current stays fixed');
 await set('urv',0);await eq('card-process','—');await eq('card-loop','—');await eq('card-dcs','—');
 assert.equal(await page.locator('#signal-path').getAttribute('data-fault'),'invalid');
 check('invalid input clears new equipment and card readings');
 await page.locator('#reset').click();
 await page.locator('#fault').selectOption('scaling');
 await page.locator('#match-range').click();await eq('display-reading','5.00 bar');
 await page.locator('#fault').selectOption('normal');await page.locator('#mode').selectOption('manual');await set('manual',16);await eq('display-reading','7.50 bar');await set('manual',24);await eq('display-reading','BAD SIGNAL');check('forced current and bad quality');
 await page.locator('#reset').click();await page.locator('#pv-slider').focus();await page.keyboard.press('ArrowRight');await eq('loop-reading','12.02 mA');check('keyboard slider changes model');
 await page.locator('#diagnostics summary').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#diagnostics').evaluate(e=>e.open));check('keyboard diagnostic reveal');
 await page.locator('#reset').click();await set('pv',6);await page.locator('#start-challenge').click();
 assert.equal(await page.locator('#controls').isVisible(),false);assert.equal(await page.locator('#diagnostics').isVisible(),false);
 assert.equal(await page.locator('#challenge-feedback').innerText(),'');
 assert.equal(await page.locator('#signal-path').getAttribute('data-fault'),'challenge');
 assert.equal(await page.locator('#display-node').evaluate(e=>e.classList.contains('node-warning')),false);
 check('challenge visuals do not name or highlight the diagnosis');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/challenge-desktop.png`,fullPage:true});
 await page.locator('#challenge-form button[type=submit]').click();assert.match(await page.locator('#challenge-feedback').innerText(),/Choose/);
 for(const [answer,correct] of [['scaling',true],['scaling',false],['open',true]]) {
  await page.locator(`input[name=diagnosis][value=${answer}]`).check();await page.locator('#challenge-form button[type=submit]').click();
  assert.match(await page.locator('#challenge-feedback').innerText(),correct ? /Correct first/ : /Reconsider/);
  if(answer!=='open') await page.locator('#next-challenge').click();
 }
 await page.locator('#exit-challenge').click();await eq('process-reading','6.00 bar');check('three challenges, deferred answer, feedback, sandbox restoration');
 await page.locator('#reset').click();
 for(const width of [320,360,390,430,768,820,1024,1440]) {
  await page.setViewportSize({width,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}: ${JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right}))))}`);
 }
 check('no horizontal overflow at eight widths');
 await page.setViewportSize({width:390,height:844});
 await page.locator('.mobile-menu summary').focus();await page.keyboard.press('Enter');
 assert.ok(await page.locator('.mobile-menu a[href="/simulations/"]').isVisible());
 await page.keyboard.press('Enter');check('native mobile menu keyboard operation');
 await eq('mobile-loop','12.00 mA');await eq('mobile-dcs','5.00 bar');
 assert.ok(await page.locator('.sim-mobile-readout').isVisible());check('mobile live readout stays available beside controls');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/simulator-mobile.png`,fullPage:true});
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/simulator-mobile-viewport.png`});
 const nodes=await page.locator('.signal-node').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()));
 assert.ok(nodes.every((n,i)=>i===0 || n.top>=nodes[i-1].bottom));
 check('mobile equipment follows vertical process-to-display order');
 // Verify actual focus geometry, not just presence of the mobile readout.
 for (const width of [320,360,390,430]) {
  await page.setViewportSize({width,height:844});
  await page.locator('#reset').click();
  await page.locator('.sim-mobile-jumps a[href="#controls"]').click();
  assert.ok(await page.locator('#controls').evaluate(e=>e.getBoundingClientRect().top>=0));
  for (const id of ['lrv','urv','unit','pv','pv-slider','mode','dcsLrv','dcsUrv','match-range','fault']) {
   await page.locator(`#${id}`).focus();
   const visible=await page.locator(`#${id}`).evaluate(e=>{
    const r=e.getBoundingClientRect(), bar=document.querySelector('.sim-mobile-readout').getBoundingClientRect();
    return r.top>=bar.bottom && r.bottom<=innerHeight && bar.top>=0 && bar.bottom<=innerHeight;
   });
   assert.ok(visible,`readout and focused ${id} visible at ${width}`);
  }
  assert.equal(await page.locator('.mobile-bottom-nav').evaluate(e=>getComputedStyle(e).position),'static');
  assert.ok(await page.locator('.signal-path').evaluate(e=>e.getBoundingClientRect().height<850));
  await set('pv',8);await eq('mobile-process','8.00 bar');await eq('mobile-ideal','16.80 mA');await eq('mobile-loop','16.80 mA');await eq('mobile-dcs','8.00 bar');
  await page.locator('#fault').selectOption('open');await eq('mobile-loop','0.00 mA');await eq('mobile-dcs','BAD SIGNAL');
  if(width===320) await page.screenshot({path:`${output}/fault-controls-320.png`});
  await set('pv','');for (const id of ['mobile-process','mobile-ideal','mobile-loop','mobile-dcs']) await eq(id,'—');
  await page.locator('#reset').click();
  await page.locator('#pv').focus();await page.locator('#pv').evaluate(e=>e.scrollIntoView({block:'center'}));
  await page.screenshot({path:`${output}/controls-${width}.png`});
 }
 check('320–430px: compact path, visible focus, four live values, fault and invalid cleanup, no fixed bottom overlap');
 await page.setViewportSize({width:390,height:400});
 assert.equal(await page.locator('.sim-mobile-readout').evaluate(e=>getComputedStyle(e).position),'static');
 await page.locator('#pv').focus();await page.locator('#pv').evaluate(e=>e.scrollIntoView({block:'center'}));
 assert.ok(await page.locator('#pv').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
 check('short viewport releases sticky readout for input space');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#start-challenge').click();
 assert.equal(await page.locator('.sim-mobile-readout').isVisible(),false);
 assert.ok(await page.locator('input[name=diagnosis]:focus').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
 await page.screenshot({path:`${output}/challenge-mobile.png`});
 await page.locator('#exit-challenge').click();
 check('mobile challenge hides contextual readout and keeps focused answer visible');

 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.current-track i').evaluate(e=>getComputedStyle(e).animationName),'none');check('reduced motion disables signal animation');
 assert.equal(await page.locator('.wire-movement').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.equal(await page.locator('.wire-movement').evaluate(e=>getComputedStyle(e).opacity),'1');
 check('reduced motion keeps static active wire cue');
 if(process.env.SIM_AXE_MODULE) {
  const {default:AxeBuilder}=require(process.env.SIM_AXE_MODULE);
  const result=await new AxeBuilder({page}).include('#main').analyze();
  await writeFile(`${output}/accessibility.json`,JSON.stringify(result.violations,null,2));
  assert.equal(result.violations.length,0,JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
  check('axe automated accessibility: simulator main');
 }
 await page.goto(`${base}/simulations/`);await page.waitForSelector('.category');
 assert.equal(await page.locator('.catalog-tags').count(),2);
 assert.equal(await page.locator('#categories a').count(),0);
 assert.equal(await page.locator('img').evaluateAll(es=>es.every(e=>e.complete && e.naturalWidth>0)),true);
 check('local images load and subject areas have no fake links');
 assert.equal(await page.locator('.category').count(),4);assert.equal(await page.locator('.sim-card').count(),2);
 await page.setViewportSize({width:1440,height:1100});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/landing-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/landing-mobile.png`,fullPage:true});
 if(process.env.SIM_AXE_MODULE) {
  const {default:AxeBuilder}=require(process.env.SIM_AXE_MODULE);
  const result=await new AxeBuilder({page}).include('#main').analyze();assert.equal(result.violations.length,0,JSON.stringify(result.violations.map(v=>v.id)));check('axe automated accessibility: landing main');
 }
 await page.locator('.sim-card a[href="/simulations/4-20ma-loop/"]').click();await page.waitForFunction(()=>document.getElementById('display-reading')?.textContent==='5.00 bar');check('catalog links to working simulation');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);check('zero external requests, HTTP errors, console errors or runtime errors');
 await writeFile(`${output}/browser-results.json`,JSON.stringify({checks,errors,external},null,2));
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
} finally {await browser.close(); if(server) await new Promise(resolve=>server.close(resolve));}
