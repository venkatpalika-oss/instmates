/** Local measurement-lifecycle acceptance harness; installs nothing. GM_CHROMIUM_PATH may select an
 * existing browser. GM_EVIDENCE_DIR must be outside this repository.
 * Optional GM_AXE_MODULE selects an already available axe Playwright module.
 * Exit 2 = browser prerequisite unavailable; exit 1 = failed product assertion.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../',import.meta.url));
const publicRoot=path.join(root,'public');
const output=path.resolve(process.env.GM_EVIDENCE_DIR||'/tmp/instmates-gas-metering-evidence');
const within=(base,target)=>target===base||target.startsWith(`${base}${path.sep}`);
assert.ok(!within(root,output),'Evidence must remain outside repository');
let chromium,browser;
try {
 ({chromium}=require('playwright'));
 browser=await chromium.launch({headless:true,...(process.env.GM_CHROMIUM_PATH?{executablePath:process.env.GM_CHROMIUM_PATH}:{})});
} catch(error) {
 console.error('BROWSER QA PENDING — ENVIRONMENT PREREQUISITE');
 console.error(error.message);
 process.exit(2);
}
let server;
const checks=[],errors=[],external=[];
try {
 await mkdir(output,{recursive:true});
 assert.ok(!within(await realpath(root),await realpath(output)),'Evidence resolves outside repository');
 server=createServer(async(req,res)=>{
  try {
   let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(pathname.endsWith('/')) pathname+='index.html';
   const target=path.resolve(publicRoot,`.${pathname}`);
   if(!within(publicRoot,target)){res.writeHead(403).end();return;}
   const data=await readFile(target);
   const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
   res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(data);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin!==base){external.push(route.request().url());return route.abort();}
  return route.continue();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',request=>errors.push(`Request failed: ${request.url()}`));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const check=name=>checks.push(name);
 await page.goto(`${base}/simulations/gas-metering-skid/`);
 await page.waitForSelector('.gm-equipment:not([hidden])');
 await page.waitForSelector('.mobile-bottom-nav');
 assert.equal(await page.locator('h1').count(),1);
 assert.equal(await page.locator('[data-detail]:visible').count(),1);
 assert.equal(await page.locator('.gm-equipment [aria-pressed=true]').getAttribute('data-equipment'),'meter');
 assert.ok(await page.locator('.gm-skid img').evaluate(img=>img.complete&&img.naturalWidth>0));
 check('initial page, equipment selection, shared shell and local SVG');
 const buttons=page.locator('button[data-equipment]');
 for(let i=0;i<await buttons.count();i++){
  const button=buttons.nth(i), id=await button.getAttribute('data-equipment');
  await button.focus();await page.keyboard.press(i%2?'Space':'Enter');
  assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-detail]:visible').getAttribute('data-detail'),id);
  assert.equal(await page.locator('.gm-equipment [aria-pressed=true]').count(),1);
  assert.ok(await button.evaluate(el=>el===document.activeElement));
  assert.ok(await button.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
 }
 check('all equipment keyboard activation, selection, focus retention');
 assert.ok((await page.locator('[data-result]').allTextContents()).every(x=>x==='—'));
 assert.equal(await page.locator('main input').count(),4);
 assert.equal(await page.locator('main select').count(),1);
 assert.equal(await page.locator('main canvas').count(),0);
 assert.equal(await page.locator('.gm-nav a').count(),5);
 check('unrelated placeholders remain absent; only authorized measurement controls active');
 const entry=page.locator('#gm-pressure-entry'), bias=page.locator('#gm-pressure-bias');
 const reset=page.getByRole('button',{name:'Reset lesson',exact:true});
 const expectChain=async values=>{
  for(const [i,stage] of ['process','observation','transmitted','selected'].entries()){
   for(const el of await page.locator(`[data-pressure="${stage}"]`).all()) assert.equal(await el.textContent(),`${values[i]} kPa (absolute)`);
  }
 };
 const pressureChecks=async()=>{
  await reset.click();await expectChain([300,300,300,300]);
  await entry.fill('250');await page.getByRole('button',{name:'Apply pressure',exact:true}).click();await expectChain([250,250,250,250]);
  await bias.check();await expectChain([250,270,270,270]);
  await entry.fill('400');await entry.press('Enter');await expectChain([400,420,420,420]);
  await bias.focus();await page.keyboard.press('Space');assert.equal(await bias.isChecked(),false);await expectChain([400,400,400,400]);
  await reset.click();await bias.check();await expectChain([300,320,320,320]);
  for(const draft of ['', '250.0','2e2','2,50','250 kPa','250x','199','401','NaN','Infinity']){
   await entry.fill(draft);await entry.press('Enter');
   assert.equal(await entry.getAttribute('aria-invalid'),'true');
   assert.ok((await page.locator('#gm-pressure-error').textContent()).includes('Draft not applied'));
   await expectChain([300,320,320,320]);
  }
  await reset.click();await expectChain([300,300,300,300]);
  assert.equal(await entry.inputValue(),'300');assert.equal(await bias.isChecked(),false);
  assert.equal(await entry.getAttribute('aria-invalid'),'false');assert.equal(await page.locator('#gm-pressure-error').textContent(),'');
 };
 const tempEntry=page.locator('#gm-temperature-entry'), tempBias=page.locator('#gm-temperature-bias');
 const switchLesson=async name=>{const button=page.locator(`[data-lesson="${name}"]`);await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');};
 const expectTemperature=async values=>{
  for(const [i,stage] of ['process','observation','transmitted','selected'].entries())for(const el of await page.locator(`[data-temperature="${stage}"]`).all())assert.equal(await el.textContent(),`${values[i]} °C`);
 };
 const temperatureChecks=async()=>{
  await reset.click();await expectTemperature([30,30,30,30]);
  await entry.fill('250');await entry.press('Enter');await bias.check();
  await switchLesson('temperature');await tempBias.check();await expectTemperature([30,32,32,32]);await expectChain([250,270,270,270]);
  await tempEntry.fill('25');await tempEntry.press('Enter');await expectTemperature([25,27,27,27]);await expectChain([250,270,270,270]);
  await tempBias.focus();await tempBias.press('Space');await expectTemperature([25,25,25,25]);
  await tempBias.check();await tempEntry.fill('40');await page.getByRole('button',{name:'Apply temperature',exact:true}).click();await expectTemperature([40,42,42,42]);
  await switchLesson('pressure');await bias.uncheck();await entry.fill('300');await entry.press('Enter');await expectTemperature([40,42,42,42]);
  await entry.fill('bad');await entry.press('Enter');
  await switchLesson('temperature');
  for(const draft of ['', '+25','-25','25.0','2e1','0x20','2,5','25 °C','NaN','Infinity','19','41']){
   await tempEntry.fill(draft);await tempEntry.press('Enter');assert.equal(await tempEntry.getAttribute('aria-invalid'),'true');await expectTemperature([40,42,42,42]);
  }
  await tempBias.uncheck();await expectTemperature([40,40,40,40]);assert.equal(await tempEntry.inputValue(),'41');assert.equal(await tempEntry.getAttribute('aria-invalid'),'true');
  await switchLesson('pressure');assert.equal(await entry.inputValue(),'bad');assert.equal(await entry.getAttribute('aria-invalid'),'true');
  await switchLesson('temperature');assert.equal(await tempEntry.inputValue(),'41');assert.equal(await tempEntry.getAttribute('aria-invalid'),'true');
  assert.ok(await page.locator('#flow-computer [data-pressure="selected"]').isVisible());assert.ok(await page.locator('#flow-computer [data-temperature="selected"]').isVisible());
  for(const control of [tempEntry,page.getByRole('button',{name:'Apply temperature',exact:true}),page.locator('#gm-temperature-lesson .gm-bias-toggle')]){
   await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();assert.ok(box.width>=44&&box.height>=44);assert.ok(box.x>=0&&box.x+box.width<=page.viewportSize().width+1);
  }
  await reset.focus();const before=await page.evaluate(()=>scrollY);await reset.press('Enter');
  assert.ok(await reset.evaluate(el=>el===document.activeElement));assert.ok(Math.abs((await page.evaluate(()=>scrollY))-before)<=1,'reset viewport stable');
  await expectChain([300,300,300,300]);await expectTemperature([30,30,30,30]);
  assert.equal(await page.locator('[data-lesson="pressure"]').getAttribute('aria-pressed'),'true');
  assert.equal(await tempEntry.inputValue(),'30');assert.equal(await entry.inputValue(),'300');assert.equal(await tempBias.isChecked(),false);assert.equal(await bias.isChecked(),false);
  for(const name of ['temperature','pressure']){assert.equal(await page.locator(`#gm-${name}-entry`).getAttribute('aria-invalid'),'false');assert.equal(await page.locator(`#gm-${name}-error`).textContent(),'');}
 };
 const gcProfile=page.locator('#gm-gc-profile'),gcStart=page.locator('#gm-gc-start'),gcAdvance=page.locator('#gm-gc-advance');
 const gcText=id=>page.locator(`#gm-gc-${id}`).textContent();
 const expectGC=async(id,pattern)=>assert.match(await gcText(id),pattern);
 const gcSnapshot=()=>page.locator('[id^="gm-gc-"]').evaluateAll(elements=>elements.map(el=>({id:el.id,text:el.textContent,value:el.value,disabled:el.disabled})));
 const measurementSnapshot=()=>page.locator('[data-pressure],[data-temperature],#gm-pressure-entry,#gm-temperature-entry,#gm-pressure-bias,#gm-temperature-bias,#gm-pressure-error,#gm-temperature-error,[data-lesson]').evaluateAll(elements=>elements.map(el=>({id:el.id,text:el.textContent,value:el.value,checked:el.checked,invalid:el.getAttribute('aria-invalid'),selected:el.getAttribute('aria-pressed')})));
 const gcChecks=async()=>{
  await reset.click();
  assert.equal(await gcProfile.inputValue(),'A');await expectGC('tick',/^Simulation step: 0$/);await expectGC('current',/^IDLE/);
  await expectGC('sample-identity',/^No captured sample$/);
  for(const prefix of ['result','input']){await expectGC(`${prefix}-identity`,/^No GC result yet$/);await expectGC(`${prefix}-composition`,/^—$/);await expectGC(`${prefix}-age`,/^Sample age: —$/);}
  // A: native keyboard start/advance and exact first completion.
  await gcStart.focus();assert.ok(await gcStart.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));await gcStart.press('Enter');
  assert.equal(await gcStart.isDisabled(),true);assert.equal(await gcStart.getAttribute('aria-describedby'),'gm-gc-start-help');await expectGC('start-help',/unavailable.*two simulation steps/);
  await expectGC('sample-identity',/^Profile A/);await gcAdvance.focus();await gcAdvance.press('Space');
  await expectGC('tick',/^Simulation step: 1$/);await expectGC('current',/^ANALYZING/);await expectGC('result-identity',/^No GC result yet$/);
  await gcAdvance.click();await expectGC('tick',/^Simulation step: 2$/);await expectGC('current',/^COMPLETE/);
  for(const prefix of ['result','input']){await expectGC(`${prefix}-identity`,/^Analysis #1 — Profile A$/);await expectGC(`${prefix}-composition`,/Methane 80 mole %.*Ethane 10 mole %.*Nitrogen 10 mole %/);await expectGC(`${prefix}-age`,/^Sample age: 2 simulation steps$/);}
  // B: model changes while the sample remains A; PT/TT drafts, errors and biases survive.
  await reset.click();await entry.fill('bad');await entry.press('Enter');await bias.check();
  await switchLesson('temperature');await tempBias.check();await tempEntry.fill('bad');await tempEntry.press('Enter');
  const measurements=await measurementSnapshot();
  await gcStart.click();await gcProfile.focus();await gcProfile.press('ArrowDown');await gcProfile.press('Tab');assert.equal(await gcProfile.inputValue(),'B');
  await expectGC('process-composition',/Methane 60 mole %/);await expectGC('sample-composition',/Methane 80 mole %/);
  await gcAdvance.click();await gcAdvance.click();await expectGC('result-identity',/^Analysis #1 — Profile A$/);await expectGC('input-identity',/^Analysis #1 — Profile A$/);
  assert.deepEqual(await measurementSnapshot(),measurements);
  // C: separate current analysis and prior completed/selected records.
  await gcStart.click();await expectGC('current',/^ANALYZING.*Analysis #2, Profile B/);await expectGC('sample-identity',/^Profile B/);
  await expectGC('result-identity',/^Analysis #1 — Profile A$/);await expectGC('input-identity',/^Analysis #1 — Profile A$/);
  const gcBefore=await gcSnapshot();
  await tempEntry.fill('25');await tempEntry.press('Enter');await tempBias.uncheck();await switchLesson('pressure');await entry.fill('250');await entry.press('Enter');await bias.uncheck();await switchLesson('temperature');
  assert.deepEqual(await gcSnapshot(),gcBefore);
  await gcAdvance.click();await expectGC('result-identity',/^Analysis #1 — Profile A$/);await gcAdvance.click();
  for(const prefix of ['result','input']){await expectGC(`${prefix}-identity`,/^Analysis #2 — Profile B$/);await expectGC(`${prefix}-composition`,/Methane 60 mole %.*Ethane 20 mole %.*Nitrogen 20 mole %/);await expectGC(`${prefix}-age`,/^Sample age: 2 simulation steps$/);}
  const composition=await gcText('input-composition');await gcAdvance.click();await expectGC('input-age',/^Sample age: 3 simulation steps$/);assert.equal(await gcText('input-composition'),composition);
  assert.doesNotMatch(await page.locator('#gas-quality,#gm-gc-input').allTextContents().then(x=>x.join(' ')),/\b(?:FRESH|STALE|GOOD|HEALTHY|OK)\b/);
  for(const control of [gcProfile,gcStart,gcAdvance]){
   await control.focus();const box=await control.boundingBox();assert.ok(box.width>=44&&box.height>=44);assert.ok(box.x>=0&&box.x+box.width<=page.viewportSize().width+1);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Reset in progress: both listeners, retained focus and stable viewport.
  await gcStart.click();await reset.focus();const scrollBefore=await page.evaluate(()=>scrollY);await reset.press('Space');
  assert.ok(await reset.evaluate(el=>el===document.activeElement));assert.ok(Math.abs((await page.evaluate(()=>scrollY))-scrollBefore)<=1,'GC shared reset viewport stable');
  await expectGC('current',/^IDLE/);await expectGC('tick',/^Simulation step: 0$/);assert.equal(await gcProfile.inputValue(),'A');await expectGC('sample-identity',/^No captured sample$/);
  for(const prefix of ['result','input']){await expectGC(`${prefix}-identity`,/^No GC result yet$/);await expectGC(`${prefix}-age`,/^Sample age: —$/);}
  await expectChain([300,300,300,300]);await expectTemperature([30,30,30,30]);assert.equal(await bias.isChecked(),false);assert.equal(await tempBias.isChecked(),false);
 };
 const assembleButton=page.locator('#gm-input-set-assemble');
 const setText=id=>page.locator(`#gm-input-set-${id}`).textContent();
 const capturedSnapshot=()=>page.locator('#gm-input-set-records').textContent();
 const inputSetChecks=async()=>{
  await reset.click();
  assert.equal(await setText('status'),'No input set assembled');
  await expectChain([300,300,300,300]);await expectTemperature([30,30,30,30]);await expectGC('input-identity',/^No GC result yet$/);
  assert.equal(await assembleButton.evaluate(el=>el.tagName),'BUTTON');
  await assembleButton.focus();assert.ok(await assembleButton.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
  await assembleButton.press('Enter');
  assert.ok(await assembleButton.evaluate(el=>el===document.activeElement));
  assert.equal(await page.locator('#gm-input-set-status').getAttribute('role'),'status');
  assert.match(await setText('status'),/^Set #1 — INCOMPLETE$/);
  assert.equal(await setText('integrity'),'STRUCTURALLY_VALID');assert.match(await setText('issues'),/Missing: GC/);
  assert.match(await setText('pressure'),/300000 Pa \(absolute\).*Source: PT/);assert.match(await setText('temperature'),/30 °C.*Source: TT/);
  assert.equal(await setText('gc'),'GC: UNAVAILABLE — no composition');
  const first=await capturedSnapshot();
  await gcStart.click();await gcAdvance.click();await gcAdvance.click();assert.equal(await capturedSnapshot(),first);
  await assembleButton.focus();await assembleButton.press('Space');
  assert.match(await setText('status'),/^Set #2 — COMPLETE$/);assert.equal(await setText('integrity'),'STRUCTURALLY_VALID');
  assert.match(await setText('gc'),/^Analysis #1 — Profile A/);assert.equal(await setText('age'),'Sample age at assembly: 2 GC simulation steps');
  assert.match(await setText('gc-provenance'),/Age evaluated at GC tick 2/);
  const second=await capturedSnapshot();
  await entry.fill('250');await entry.press('Enter');await bias.check();
  await switchLesson('temperature');await tempEntry.fill('25');await tempEntry.press('Enter');await tempBias.check();
  await gcAdvance.click();await gcProfile.selectOption('B');assert.equal(await capturedSnapshot(),second);
  await gcStart.click();await gcAdvance.click();await gcAdvance.click();assert.equal(await capturedSnapshot(),second);
  // Preserve invalid drafts/errors and active lesson while reading accepted state.
  await tempEntry.fill('bad');await tempEntry.press('Enter');await switchLesson('pressure');await entry.fill('bad');await entry.press('Enter');await switchLesson('temperature');
  const liveMeasurements=await measurementSnapshot(),liveGc=await gcSnapshot();
  await assembleButton.click();
  assert.deepEqual(await measurementSnapshot(),liveMeasurements);assert.deepEqual(await gcSnapshot(),liveGc);
  assert.match(await setText('status'),/^Set #3 — COMPLETE$/);assert.match(await setText('gc'),/^Analysis #2 — Profile B/);
  assert.equal(await setText('integrity'),'STRUCTURALLY_VALID');assert.match(await setText('pressure'),/270000 Pa.*quality: GOOD/);assert.match(await setText('temperature'),/27 °C.*quality: GOOD/);
  assert.match(await setText('bias'),/PT teaching bias: ON.*TT teaching bias: ON/);
  const sectionText=await page.locator('#gm-input-set').textContent();
  for(const label of ['Snapshot — not automatically updated','Temporal alignment: Not established','Calculation eligibility: Not evaluated'])assert.ok(sectionText.includes(label));
  assert.doesNotMatch(sectionText,/\b(?:BAD|FAULTY|UNHEALTHY|HEALTHY)\b/);
  await assembleButton.focus();const box=await assembleButton.boundingBox();assert.ok(box.width>=44&&box.height>=44);assert.ok(box.x>=0&&box.x+box.width<=page.viewportSize().width+1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  for(const id of ['pressure','temperature','gc','age','completeness','integrity']){
   const el=page.locator(`#gm-input-set-${id}`);assert.ok(await el.isVisible());assert.ok(await el.evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  }
  await page.screenshot({path:path.join(output,`input-set-${page.viewportSize().width}.png`),fullPage:true});
  await reset.focus();const scrollBefore=await page.evaluate(()=>scrollY);await reset.press('Enter');
  assert.ok(await reset.evaluate(el=>el===document.activeElement));assert.ok(Math.abs((await page.evaluate(()=>scrollY))-scrollBefore)<=1,'input-set shared reset viewport stable');
  assert.equal(await setText('status'),'No input set assembled');assert.equal(await page.locator('#gm-input-set-records').isVisible(),false);
  await expectChain([300,300,300,300]);await expectTemperature([30,30,30,30]);await expectGC('tick',/^Simulation step: 0$/);await expectGC('current',/^IDLE/);await expectGC('input-identity',/^No GC result yet$/);
  assert.equal(await bias.isChecked(),false);assert.equal(await tempBias.isChecked(),false);
  await assembleButton.click();assert.match(await setText('status'),/^Set #1 — INCOMPLETE$/);
  await reset.click();
 };
 const massButton=page.locator('#gm-molar-mass-calculate');
 const massText=id=>page.locator(`#gm-molar-mass-${id}`).textContent();
 const massSnapshot=()=>page.locator('#gm-molar-mass').textContent();
 const massChecks=async()=>{
  await reset.click();
  assert.equal(await massText('status'),'No calculation yet');assert.equal(await massText('value'),'—');
  assert.equal(await page.locator('#gm-molar-mass-status').getAttribute('role'),'status');
  await massButton.focus();assert.ok(await massButton.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
  await massButton.press('Enter');assert.match(await massText('status'),/GC_UNAVAILABLE/);assert.equal(await massText('value'),'—');
  await gcStart.click();await gcAdvance.click();await gcAdvance.click();
  await assembleButton.click();
  const setBefore=await page.locator('#gm-input-set').textContent(),gcBefore=await gcSnapshot(),measureBefore=await measurementSnapshot();
  await massButton.focus();await massButton.press('Space');
  assert.ok(await massButton.evaluate(el=>el===document.activeElement));assert.equal(await massText('value'),'18.642 kg/kmol');
  assert.match(await massText('source'),/Analysis #1.*Profile A/);
  assert.deepEqual(await gcSnapshot(),gcBefore);assert.deepEqual(await measurementSnapshot(),measureBefore);
  assert.equal(await page.locator('#gm-input-set').textContent(),setBefore);
  const resultA=await massSnapshot();
  await entry.fill('250');await entry.press('Enter');await bias.check();
  await switchLesson('temperature');await tempEntry.fill('25');await tempEntry.press('Enter');await tempBias.check();
  await gcAdvance.click();await gcProfile.selectOption('B');await gcStart.click();
  assert.equal(await massSnapshot(),resultA);
  await massButton.click();assert.equal(await massText('value'),'18.642 kg/kmol');assert.match(await massText('source'),/Analysis #1/);
  const pending=await massSnapshot();await gcAdvance.click();await gcAdvance.click();assert.equal(await massSnapshot(),pending);
  await massButton.click();assert.equal(await massText('value'),'21.242 kg/kmol');assert.match(await massText('source'),/Analysis #2.*Profile B/);
  assert.equal(await page.locator('#gm-input-set').textContent(),setBefore);
  const resultB=await massSnapshot();await gcProfile.selectOption('A');await gcAdvance.click();assert.equal(await massSnapshot(),resultB);
  for(const label of ['Temporal alignment: Not established','Calculation eligibility: Not evaluated'])assert.ok(setBefore.includes(label));
  await massButton.focus();const box=await massButton.boundingBox();assert.ok(box.width>=44&&box.height>=44);assert.ok(box.x>=0&&box.x+box.width<=page.viewportSize().width+1);
  for(const id of ['value','source','identity','provenance'])assert.ok(await page.locator(`#gm-molar-mass-${id}`).evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await page.screenshot({path:path.join(output,`molar-mass-${page.viewportSize().width}.png`),fullPage:true});
  // Test-only provider interception: no product fault hook or live state mutation.
  await page.evaluate(()=>{
   document.getElementById('gm-gc-controls').addEventListener('gm-gc-snapshot',event=>{
    event.stopImmediatePropagation();event.detail.receive({gc:Object.freeze({quality:'INVALID'})});
   },{capture:true,once:true});
  });
  await massButton.click();assert.match(await massText('status'),/No calculation — INVALID_GC_METADATA/);
  for(const id of ['value','source','identity','provenance'])assert.equal(await massText(id),'—');
  await massButton.click();assert.equal(await massText('value'),'21.242 kg/kmol');
  const oldIdentity=await massText('identity');
  await reset.focus();const scrollBefore=await page.evaluate(()=>scrollY);await reset.press('Enter');
  assert.ok(await reset.evaluate(el=>el===document.activeElement));assert.ok(Math.abs((await page.evaluate(()=>scrollY))-scrollBefore)<=1,'molar mass reset viewport stable');
  assert.equal(await massText('status'),'No calculation yet');
  for(const id of ['value','source','identity','provenance'])assert.equal(await massText(id),'—');
  await gcStart.click();await gcAdvance.click();await gcAdvance.click();await massButton.click();
  assert.notEqual(await massText('identity'),oldIdentity);assert.match(await massText('identity'),/calculation-1/);
  await reset.click();
 };
 await pressureChecks();check('pressure apply, bias, Enter, Space, invalid drafts and reset');
 await temperatureChecks();check('temperature, independent chains, lesson switching and focus-stable shared reset');
 await gcChecks();check('GC A/B/C, snapshot provenance, prior result separation, age, independent states and shared reset');
 await massChecks();check('captured molar mass, A/B, pending delivery, immutable display, rejection, identity and isolation');
 await inputSetChecks();check('explicit input sets, provenance, age, biases, immutable display, independence and reset');
 for(const button of await buttons.all()){
  await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-detail]:visible').getAttribute('data-detail'),await button.getAttribute('data-equipment'));
 }

 for(const width of [1440,1024,768,320,390,430]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width}`);
  for(let i=0;i<await buttons.count();i++){
   const button=buttons.nth(i);await button.focus();
   const b=await button.boundingBox();assert.ok(b.width>=44&&b.height>=44,`target ${width}`);
   assert.ok(b.x>=0&&b.x+b.width<=width+1,`clipping ${width}`);
   assert.ok(b.y>=0&&b.y+b.height<=900,`focus visibility ${width}`);
  }
  await massChecks();
  if(width===1440||width<=430){
   await pressureChecks();await temperatureChecks();await gcChecks();await inputSetChecks();
   for(const control of [entry,page.getByRole('button',{name:'Apply pressure',exact:true}),reset,page.locator('#gm-pressure-lesson .gm-bias-toggle')]){
    await control.scrollIntoViewIfNeeded();const b=await control.boundingBox();
    assert.ok(b.width>=44&&b.height>=44);assert.ok(b.x>=0&&b.x+b.width<=width+1);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  if(width<=430){
   const top=async selector=>(await page.locator(selector).boundingBox()).y;
   assert.ok(await top('.gm-skid-panel')<await top('.gm-instruments'));
   assert.ok(await top('.gm-instruments')<await top('.gm-summary'));
   assert.equal(await page.locator('.mobile-bottom-nav').evaluate(el=>getComputedStyle(el).position),'static');
  }
  for(const anchor of await page.locator('.gm-nav a').all()){
   const id=(await anchor.getAttribute('href')).slice(1);await anchor.click();
   const b=await page.locator(`#${id}`).boundingBox();assert.ok(b.y>=-1&&b.y<900,`anchor ${id} ${width}`);
  }
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:path.join(output,`page-${width}.png`),fullPage:true});
 }
 check('six viewport reflows, target sizes, anchors and mobile ordering');
 await page.setViewportSize({width:390,height:400});await buttons.last().focus();
 await massButton.focus();const massShort=await massButton.boundingBox();assert.ok(massShort.y>=0&&massShort.y+massShort.height<=400);
 await buttons.last().focus();
 const short=await buttons.last().boundingBox();assert.ok(short.y>=0&&short.y+short.height<=400);
 check('short viewport focused control visible');
 await page.setViewportSize({width:320,height:900});
 await gcStart.click();await gcAdvance.click();await gcAdvance.click();await massButton.click();
 // Emulated text enlargement; not physical-browser zoom certification.
 await page.addStyleTag({content:'html{font-size:200%!important}'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:path.join(output,'text-enlarged-320.png'),fullPage:true});
 check('200 percent root text enlargement at 320');
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.ok(await page.locator('main').evaluate(el=>el.getAnimations({subtree:true}).length===0));
 check('reduced motion, no continuous animation');
 let accessibility='NOT RUN — axe unavailable';
 let axeModule=process.env.GM_AXE_MODULE;
 if(!axeModule){try{axeModule=require.resolve('@axe-core/playwright');}catch{}}
 if(axeModule){
  const {default:AxeBuilder}=require(axeModule);const result=await new AxeBuilder({page}).include('#main').analyze();
  await writeFile(path.join(output,'accessibility.json'),JSON.stringify(result.violations,null,2));
  assert.deepEqual(result.violations,[]);accessibility='PASS — main content only';check('axe main region');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);check('no runtime, console, resource or external-request errors');
 const report={status:'PASS',browser:browser.version(),checks,errors,external,accessibility,limitations:['Screenshot comparison requires human review','Root font enlargement is not browser zoom','No physical-device or manual screen-reader certification']};
 await writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} catch(error){
 console.error('BROWSER ASSERTION FAIL',error);
 await writeFile(path.join(output,'failure.json'),JSON.stringify({checks,errors,external,error:error.message},null,2)).catch(()=>{});process.exitCode=1;
} finally {
 await browser.close();
 if(server)await new Promise(resolve=>server.close(resolve));
}
