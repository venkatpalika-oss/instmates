/** Optional local browser acceptance suite. Requires Playwright + Chromium.
 * Starts a loopback-only static server by default; no production requests are allowed.
 * Environment: CAL_BASE_URL, CAL_EVIDENCE_DIR, CAL_CHROMIUM_PATH, CAL_CHROMIUM_MODULE,
 * CAL_AXE_MODULE (optional @axe-core/playwright module path).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
let server;
if (!process.env.CAL_BASE_URL) {
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
const base=process.env.CAL_BASE_URL || `http://127.0.0.1:${server.address().port}`;
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Local server required');
const output=process.env.CAL_EVIDENCE_DIR || '/tmp/instmates-pressure-evidence';
await mkdir(output,{recursive:true});
let options={headless:true};
if(process.env.CAL_CHROMIUM_PATH) options.executablePath=process.env.CAL_CHROMIUM_PATH;
if(process.env.CAL_CHROMIUM_MODULE) {
 const { default:packaged }=await import(process.env.CAL_CHROMIUM_MODULE);
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
const check=name=>checks.push(name);
const shot=async name=>{await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${output}/${name}.png`,fullPage:true});};
const fill=async(id,v)=>page.locator('#'+id).fill(String(v));
const cycle=async()=>{for(let i=0;i<9;i++){await page.locator('#apply-target').click();await page.locator('#record').click();}};
const {default:AxeBuilder}=require(process.env.CAL_AXE_MODULE || '@axe-core/playwright');
try {
 await page.goto(base+'/simulations/pressure-transmitter-calibration/');
 await page.waitForFunction(()=>document.getElementById('measured')?.textContent==='4.000 mA');
 await page.waitForSelector('.mobile-bottom-nav',{state:'attached'});
 assert.equal(await page.locator('h1').innerText(),'Pressure Transmitter Calibration');check('initial bench and public shell');
 await cycle();assert.match(await page.locator('#found-summary').innerText(),/Complete · PASS/);assert.equal(await page.locator('#found-records li').count(),9);check('healthy nine-point run');await shot('healthy-run');
 await page.locator('#reset').click();await page.locator('#scenario').selectOption('zero');await shot('zero-error');await cycle();const original=await page.locator('#found-records').innerText();await shot('completed-as-found');await fill('zeroAdjustment','');assert.ok(await page.locator('#record').isDisabled());assert.ok(await page.locator('#zeroAdjustment').isEnabled());await fill('zeroAdjustment',-.16);await page.locator('#as-left').click();await cycle();assert.match(await page.locator('#left-summary').innerText(),/Complete · PASS/);assert.equal(await page.locator('#found-records').innerText(),original);check('immutable as-found and fresh corrected as-left');await shot('completed-as-left');
 await page.locator('#reset-adjustments').click();assert.equal(await page.locator('#zeroAdjustment').inputValue(),'0');assert.equal(await page.locator('#found-records').innerText(),original);check('reset adjustments preserves as-found');await page.locator('#scenario').selectOption('span');assert.equal(await page.locator('#history li').count(),18);check('scenario change retains completed evidence');
 await page.locator('#reset').click();await page.locator('#record').click();await fill('configuredUrv',20);assert.match(await page.locator('#run-status').innerText(),/invalidated/);assert.ok(await page.locator('#record').isDisabled());await page.locator('#restart').click();assert.equal(await page.locator('#found-records li').count(),0);assert.equal(await page.locator('#history li').count(),1);check('configuration invalidation and archived evidence');
 for(const scenario of ['span','nonlinear','range']){await page.locator('#scenario').selectOption(scenario);await fill('requested',5);await shot(scenario==='range'?'wrong-range':scenario);}
 await page.locator('#scenario').selectOption('nonlinear');await cycle();assert.match(await page.locator('#found-summary').innerText(),/FAIL/);assert.match(await page.locator('#found-records li').nth(0).innerText(),/PASS/);assert.match(await page.locator('#found-records li').nth(2).innerText(),/FAIL/);check('nonlinearity fails intermediate points with healthy endpoints');
 await page.locator('#reset').click();await page.locator('#scenario').selectOption('application');await page.locator('#record').click();await fill('requested',2.5);assert.ok(await page.locator('#record').isDisabled());await fill('requested',2.7);assert.ok(await page.locator('#record').isEnabled());await fill('requested',5);assert.equal(await page.locator('#expected').innerText(),'11.680 mA');assert.equal(await page.locator('#error').innerText(),'0.000 mA');check('missed source target never becomes transmitter error');
 await fill('urv',0);assert.ok(await page.locator('#record').isDisabled());assert.equal(await page.locator('#measured').innerText(),'—');await fill('urv',10);check('invalid input clears readings');
 await page.locator('#reset').click();await fill('requested',6);await page.locator('#start-challenge').click();assert.ok(await page.locator('#requested').isVisible());assert.ok(!await page.locator('#coefficients').isVisible());assert.ok(!await page.locator('#adjustments').isVisible());await fill('requested',5);assert.equal(await page.locator('#measured').innerText(),'12.160 mA');await shot('challenge-mode');
 for(const answer of ['zero','span','combined','nonlinear','range','application']){await page.locator('#diagnosis').selectOption(answer);await page.locator('#challenge-form button[type=submit]').click();assert.match(await page.locator('#challenge-feedback').innerText(),/Correct/);if(answer!=='application')await page.locator('#next-challenge').click();}
 await page.locator('#exit-challenge').click();assert.equal(await page.locator('#requested').inputValue(),'6');check('six challenges preserve pressure controls and restore sandbox');
 for(const width of [1440,768,430,390,360,320]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if([1440,768,390,320].includes(width))await shot(`lab-${width}`);await page.locator('#requested').evaluate(e=>e.blur());await page.locator('#requested').focus();const bounds=await page.locator('#requested').boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<=900);assert.ok(await page.locator('#record').evaluate(e=>e.getBoundingClientRect().height>=44));}check('six viewport widths, visible focused control and touch targets');
 await page.locator('#requested').focus();await page.keyboard.press('ArrowUp');assert.equal(await page.locator('#requested').inputValue(),'6.01');check('keyboard pressure control');
 await page.setViewportSize({width:720,height:500});await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('reflow-200');await page.evaluate(()=>document.documentElement.style.fontSize='');check('200 percent text reflow');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#record').evaluate(e=>getComputedStyle(e).animationName),'none');check('reduced-motion static comprehension');
 const accessibility=[];for(const width of [1440,320]){await page.setViewportSize({width,height:900});const r=await new AxeBuilder({page}).include('#main').analyze();accessibility.push({width,violations:r.violations});assert.deepEqual(r.violations,[]);}await writeFile(`${output}/accessibility.json`,JSON.stringify(accessibility,null,2));check('axe desktop and mobile');
 assert.ok(await page.locator('img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth>0)));check('local equipment loaded');
 await page.goto(base+'/simulations/');await page.waitForSelector('.sim-card');assert.equal(await page.locator('.sim-card').count(),3);assert.equal(await page.locator('#lab-count').innerText(),'3 working simulations');assert.equal(await page.locator('#process-measurement .sim-card[href="/labs/desalter/"]').count(),1);assert.match(await page.locator('.sim-card[href="/simulations/pressure-transmitter-calibration/"]').innerText(),/AVAILABLE · LAB 02/);await page.setViewportSize({width:1440,height:1000});await shot('catalog-three-simulations');await page.locator('.sim-card[href="/simulations/pressure-transmitter-calibration/"]').click();await page.waitForSelector('#record');check('catalog lab identity and working destination');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);check('zero runtime console resource and external requests');
 await writeFile(`${output}/browser-results.json`,JSON.stringify({passed:checks.length,checks,errors,external},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
