/** Optional local browser acceptance suite. Requires Playwright + Chromium.
 * Starts a loopback-only static server by default; no production requests are allowed.
 * Environment: CAT_BASE_URL, CAT_EVIDENCE_DIR, CAT_CHROMIUM_PATH, CAT_CHROMIUM_MODULE,
 * CAT_AXE_MODULE (optional @axe-core/playwright module path).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
let server;
if (!process.env.CAT_BASE_URL) {
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
const base=process.env.CAT_BASE_URL || `http://127.0.0.1:${server.address().port}`;
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Local server required');
const output=process.env.CAT_EVIDENCE_DIR || '/tmp/instmates-catalog-evidence';
await mkdir(output,{recursive:true});
let options={headless:true};
if(process.env.CAT_CHROMIUM_PATH) options.executablePath=process.env.CAT_CHROMIUM_PATH;
if(process.env.CAT_CHROMIUM_MODULE) {
 const { default:packaged }=await import(process.env.CAT_CHROMIUM_MODULE);
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
 await page.goto(`${base}/simulations/`);await page.waitForSelector('.sim-card');await page.waitForSelector('.mobile-bottom-nav',{state:'attached'});
 assert.equal(await page.locator('h1').innerText(),'Learn by doing.');assert.equal(await page.locator('#lab-count').innerText(),'3 labs available now');
 assert.equal(await page.locator('.sim-card').count(),3);assert.equal(await page.locator('#categories a').count(),0);assert.equal(await page.locator('input,select').count(),0);check('compact available-first catalog with no unnecessary controls');
 for(const width of [1440,768,430,390,360,320]) {
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const first=await page.locator('.sim-card').first().boundingBox();assert.ok(first.y<500,'first lab discoverable quickly');
  for(const a of await page.locator('.sim-card a').all()) {
   assert.ok((await a.boundingBox()).height>=44);await a.focus();
   assert.ok(await a.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
  }
  if(width<=768) assert.equal(await page.locator('.mobile-bottom-nav').evaluate(e=>getComputedStyle(e).position),'static');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${output}/catalog-${width}.png`,fullPage:true});check(`layout, actions and focus clearance ${width}`);
 }
 await page.locator('.sim-card a').first().focus();await page.keyboard.press('Tab');assert.ok(await page.locator('.sim-card a').nth(1).evaluate(e=>e===document.activeElement));await page.screenshot({path:`${output}/keyboard-focus.png`});check('keyboard card navigation');
 await page.setViewportSize({width:640,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0)});await page.screenshot({path:`${output}/reflow-200.png`,fullPage:true});await page.evaluate(()=>document.documentElement.style.fontSize='');check('200% text enlargement at 640 CSS px');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.sim-card').count(),3);check('reduced motion keeps full content');
 await page.locator('.mobile-menu summary').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('.mobile-menu a[href="/simulations/"]').isVisible());await page.keyboard.press('Enter');check('shared mobile menu remains keyboard usable');
 await page.locator('#subject-heading').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/subject-areas.png`});
 const {default:AxeBuilder}=require(process.env.CAT_AXE_MODULE);const audits=[];
 for(const width of [1440,320]) {await page.setViewportSize({width,height:900});const result=await new AxeBuilder({page}).analyze();audits.push({width,violations:result.violations});}
 await writeFile(`${output}/accessibility.json`,JSON.stringify(audits,null,2));assert.ok(audits.every(a=>a.violations.length===0),JSON.stringify(audits.map(a=>({width:a.width,violations:a.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))}))));check('whole-page axe desktop/mobile');
 for(const n of [2,5,10,25]) {
  await page.evaluate(async n=>{const {SIMULATIONS}=await import('/assets/js/simulations/catalog.js');const {renderCatalog}=await import('/assets/js/simulations/catalog-page.js');const labs=Array.from({length:n},(_,i)=>({...SIMULATIONS[i%2],id:`fixture-${i}`,lab:String(i+1).padStart(2,'0'),href:`/simulations/fixture-${i}/`,categoryIds:['measurement','field-skills','measurement']}));labs.push({...SIMULATIONS[0],id:'future',lab:'99',status:'planned',href:undefined});renderCatalog(document.getElementById('available-labs'),labs);},n);
  assert.equal(await page.locator('.sim-card').count(),n);assert.equal(await page.locator('.sim-card a').count(),n);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check(`real renderer ${n} synthetic labs; unpublished omitted`);
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${output}/synthetic-25.png`,fullPage:true});
 await page.reload();await page.waitForSelector('.sim-card');
 assert.ok(await page.locator('img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth>0)));
 for(const route of ['/simulations/4-20ma-loop/','/simulations/pressure-transmitter-calibration/','/simulations/oxymitter-4000/']) {await page.locator(`.sim-card a[href="${route}"]`).click();assert.equal(new URL(page.url()).pathname,route);await page.goBack();await page.waitForSelector('.sim-card');}check('real routes and images');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);check('zero runtime console resource or external-request errors');
 await writeFile(`${output}/browser-results.json`,JSON.stringify({passed:checks.length,checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
} finally {await browser.close();if(server) await new Promise(resolve=>server.close(resolve));}
