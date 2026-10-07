/** Local-only learner acceptance; never contacts Firebase or creates a preview.
 * Requires Playwright + Chromium. Optional env: DESALTER_PLAYWRIGHT_MODULE,
 * DESALTER_CHROMIUM_MODULE (packaged Chromium), DESALTER_CHROMIUM_PATH,
 * DESALTER_EVIDENCE_DIR. Evidence defaults to /tmp/instmates-desalter-evidence.
 * Clock acceleration and seeded scenario selection are TEST-ONLY; app is unmodified.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.DESALTER_PLAYWRIGHT_MODULE || 'playwright');
const root=fileURLToPath(new URL('../public/',import.meta.url));
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  let file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file!==resolve(root)&&!file.startsWith(root.endsWith(sep)?root:root+sep))return res.writeHead(403).end();
  if((await stat(file)).isDirectory()){
   if(!url.pathname.endsWith('/'))return res.writeHead(301,{Location:url.pathname+'/'+url.search}).end();
   file=resolve(file,'index.html');
  }
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.json':'application/json','.mp4':'video/mp4'})[extname(file)]||'application/octet-stream'}).end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const output=process.env.DESALTER_EVIDENCE_DIR || '/tmp/instmates-desalter-evidence';
await mkdir(output,{recursive:true});
const options={headless:true};
if(process.env.DESALTER_CHROMIUM_PATH)options.executablePath=process.env.DESALTER_CHROMIUM_PATH;
if(process.env.DESALTER_CHROMIUM_MODULE){const {default:packaged}=await import(process.env.DESALTER_CHROMIUM_MODULE);options.executablePath=await packaged.executablePath();options.args=packaged.args.filter(arg=>!['--single-process','--disable-web-security','--allow-running-insecure-content'].includes(arg));}
let browser;
const checks=[],results=[],errors=[],external=[],smoke=[];
const check=name=>{checks.push(name);console.log('PASS '+name);};
const views=['processView','dcsView','esdView','trendsView','alarmsView','trainingView'];
const forbidden='[data-mode="developer"],.devOnly,.devCeBtn,.coreLevelBtn,#faultBtn,#testBtn,#ceTestHarness,#m1CeRegistry,#engineeringView,#settingsView,[data-tab="engineering"]';
async function watch(context,strict=true){
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin!==base){external.push({url:route.request().url(),strict});return route.abort();}
  return route.continue();
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);
 page.on('requestfailed',r=>errors.push({kind:'resource',message:r.url()+' '+r.failure()?.errorText,strict}));
 page.on('pageerror',e=>errors.push({kind:'runtime',message:e.message,strict}));
 page.on('console',m=>{if(m.type()==='error')errors.push({kind:'console',message:m.text(),strict});});
 page.on('response',r=>{if(r.status()>=400)errors.push({kind:'http',message:`${r.status()} ${r.url()}`,strict});});
 return page;
}
async function publicOnly(page){
 assert.equal(await page.locator(forbidden).count(),0);
 assert.deepEqual(await page.locator('.nav[data-view]').evaluateAll(es=>es.map(e=>e.dataset.view)),views);
 assert.deepEqual(await page.locator('.view').evaluateAll(es=>es.map(e=>e.id)),views);
 assert.deepEqual(await page.locator('.mode[data-mode]').evaluateAll(es=>es.map(e=>e.dataset.mode)),['normal','training']);
 assert.equal(await page.evaluate(()=>['inject','runTests','setCoreLevel','runCoreSequence','installM1CeRegistryPanel','M1_CE_VERIFICATION'].filter(k=>typeof window[k]!=='undefined').length),0);
}
async function nav(page,view){await page.locator(`[data-view="${view}"]`).click();assert.ok(await page.locator('#'+view).isVisible());if(view==='esdView')assert.equal(await page.locator('#ceLogic').evaluate(e=>getComputedStyle(e).flexDirection),'column');await publicOnly(page);}
// Read the existing deterministic state; never create or export a second model.
async function visualizationAgrees(page){
 const actual=await page.evaluate(()=>{
  const key=Object.keys(CE).find(k=>CE[k].label===S.tripCause);
  const process=document.querySelector('#processView .process');
  return {values:channelValues(),hh:channels(),threshold:ENG.lahh,voted:voteTrip(channels()),
   mainVote:document.getElementById('vote2').textContent,compact:document.getElementById('voteMiniTxt').textContent,
   dots:['A','B','C'].map(id=>document.getElementById('vd'+id).classList.contains('hh')),
   compactTrip:document.getElementById('voteMini').classList.contains('trip'),
   esd:document.getElementById('ceLogicState').textContent,tripped:S.tripped,powerTrip:S.powerTrip,uvClosed:S.uvClosed,
   effects:key?CE[key].effects:[],stage:document.getElementById('pceStage').textContent,
   stageTrip:document.getElementById('pceStage').classList.contains('trip'),
   tripClass:document.getElementById('processView').classList.contains('v21-tripped'),
   isolated:document.getElementById('processView').classList.contains('v23-isolated'),
   stopped:document.getElementById('v23ProcessStopped').classList.contains('on'),
   processStopped:process.classList.contains('tripStopped'),
   power:document.getElementById('powertxt').textContent,
   inlet:document.getElementById('inletSdvtxt').textContent,
   outlet:document.getElementById('outletSdvtxt').textContent,
   exportedState:typeof window.S!=='undefined'||typeof window.CE!=='undefined'};
 });
 assert.deepEqual(actual.hh,actual.values.map(v=>v>=actual.threshold));
 assert.equal(actual.mainVote,actual.hh.filter(Boolean).length+'/3');
 assert.equal(actual.compact,actual.mainVote);assert.deepEqual(actual.dots,actual.hh);
 assert.equal(actual.compactTrip,actual.voted);assert.equal(actual.esd,actual.tripped?'INITIATED':'CLEAR');
 assert.equal(actual.exportedState,false,'state must remain lexical');
 assert.equal(actual.stageTrip,actual.tripped);
 assert.equal(actual.tripClass,actual.tripped);
 assert.equal(actual.isolated,actual.uvClosed);
 assert.equal(actual.stopped,actual.uvClosed);
 assert.equal(actual.processStopped,actual.uvClosed);
 assert.equal(actual.power,actual.powerTrip?'TRIPPED':'RUN');
 assert.equal(actual.inlet,actual.uvClosed?'CLOSED':'OPEN');
 assert.equal(actual.outlet,actual.uvClosed?'CLOSED':'OPEN');
 if(actual.tripped){
  assert.doesNotMatch(actual.stage,/NORMAL|NO PROTECTION INITIATOR/);
  assert.match(actual.stage,/INITIATOR DETECTED|VOTE SATISFIED|PROTECTION LOGIC ACTIVE|VERIFIED EFFECTS/);
  assert.deepEqual(actual.effects,['POWER_TRIP','INLET_SDV_CLOSE','OUTLET_SDV_CLOSE']);
  assert.equal(actual.powerTrip,true);assert.equal(actual.uvClosed,true);
 }else assert.equal(actual.stage,'SIGNAL STATUS — NORMAL / NO PROTECTION INITIATOR ACTIVE');
 await publicOnly(page);
}
async function clean(page,running){
 const actual=await page.evaluate(()=>({level:S.level,tripped:S.tripped,powerTrip:S.powerTrip,uvClosed:S.uvClosed,mode:S.mode,running:S.running,id:S.scenario.id,bias:S.channelBias,faults:S.instrumentFaults,history:S.history.length}));
 assert.deepEqual(actual,{level:650,tripped:false,powerTrip:false,uvClosed:false,mode:'normal',running,id:'',bias:[0,0,0],faults:{},history:1});
 await visualizationAgrees(page);
}
async function beginScenario(page){
 await page.locator('[data-mode="training"]').click();await nav(page,'trainingView');
 await page.locator('#hiddenScenarioStart').click();
 assert.match(await page.locator('#scenarioBanner').innerText(),/SCENARIO ACTIVE/);
 assert.ok(await page.locator('#scenarioStabilizeBtn').isDisabled());
 assert.ok(!(await page.locator('#scenarioDebriefBtn').isVisible()));
 assert.ok(!(await page.locator('#channelExperiment').isVisible()));
 await publicOnly(page);
}
async function investigate(page){
 for(const view of views.filter(v=>v!=='trainingView'))await nav(page,view);
 await nav(page,'dcsView');
 await page.locator('#inspectProtection').click();
 assert.ok(await page.locator('#modalback').isVisible());
 for(const channel of ['A','B','C']){
  await page.locator(`.invSelect[data-ch="${channel}"]`).click();
  await page.locator('[data-action="compare"]').click();
  await page.locator('[data-action="history"]').click();
 }
 await page.locator('[data-action="vote"]').click();
 const evidence=await page.evaluate(()=>S.scenario.investigation);
 assert.deepEqual(evidence.compare,['A','B','C']);assert.deepEqual(evidence.history,['A','B','C']);assert.equal(evidence.voteSoe,true);
 await page.locator('#modalClose').click();await nav(page,'trainingView');
 assert.equal(await page.locator('#scenarioEvidence').innerText(),'5/5');
}
async function recover(page,choice){
 await investigate(page);
 await page.locator(`.diagBtn[data-diag="${choice==='interface'?'instrument':'interface'}"]`).click();
 assert.ok(await page.locator('#scenarioStabilizeBtn').isDisabled());
 await page.locator(`.diagBtn[data-diag="${choice}"]`).click();
 assert.ok(await page.locator('#scenarioStabilizeBtn').isEnabled());
 await page.locator('#scenarioStabilizeBtn').click();
 await page.clock.runFor(20000);
 assert.equal(await page.evaluate(()=>S.scenario.outcome),'RECOVERED');
 await page.locator('#scenarioDebriefBtn').click();
 assert.match(await page.locator('#scenarioDebrief').innerText(),/RECOVERED/);
 assert.equal(await page.evaluate(()=>S.scenario.score),90); // full evidence minus one wrong attempt
 await publicOnly(page);
}
try{
 browser=await chromium.launch(options);
 // Static identity must survive disabled JavaScript.
 const nojs=await browser.newContext({javaScriptEnabled:false});const np=await watch(nojs);
 await np.goto(base+'/labs/desalter/');
 assert.ok(await np.locator('.publicBoundary').isVisible());assert.match(await np.locator('.brand').innerText(),/InstMates — Desalter Training Simulator/);
 await publicOnly(np);await nojs.close();check('identity, boundary and absent developer DOM with JavaScript disabled');
 for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:430,height:932}]){
  const context=await browser.newContext({viewport});const page=await watch(context);
  await context.addInitScript(()=>{Math.random=()=>0.1;}); // choose S01 via the real public start button
  await page.clock.install();await page.goto(base+'/labs/desalter/');await page.clock.pauseAt(new Date(Date.now()+1000));
  await publicOnly(page);await clean(page,false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document overflow');
  await page.locator('#voteMini').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/process-${viewport.width}.png`,fullPage:true});
  const scroll=page.locator('.processScroll');
  assert.ok(await scroll.evaluate(e=>e.clientWidth<=innerWidth));
  if(viewport.width<1200){await scroll.evaluate(e=>e.scrollLeft=e.scrollWidth);assert.ok(await scroll.evaluate(e=>e.scrollLeft>0));}
  // Every retained equipment target opens a reachable dialog, including narrow layouts.
  for(const key of ['vessel','ifaceControl','ifaceProtect','inletSdv','outletSdv','lv81','power']){
   if(key==='ifaceControl'||key==='ifaceProtect'){
    await nav(page,'dcsView');
    await page.locator(key==='ifaceProtect'?'#inspectProtection':'button[onclick="openEquip(\'ifaceControl\')"]').click();
   }else{await nav(page,'processView');await page.locator(`[data-equip="${key}"]`).first().click();}
   assert.ok(await page.locator('#modalContent').isVisible());
   const box=await page.locator('.modal').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=viewport.height+1);
   await page.locator('[data-tab="logic"]').click();assert.ok((await page.locator('#modalContent').innerText()).length>10);
   await page.locator('[data-tab="overview"]').click();
   await page.locator('#modalClose').click();
  }
  // Keyboard navigation follows the same public handlers.
  await page.locator('[data-view="dcsView"]').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#dcsView').isVisible());
  await nav(page,'processView');await page.locator('#startBtn').click();await page.clock.runFor(1000);
  assert.ok(await page.evaluate(()=>S.t>=4&&S.history.length>1));
  await nav(page,'trendsView');assert.ok(await page.locator('#trendLarge').isVisible());
  await nav(page,'dcsView');assert.equal(await page.locator('#dcsPv').innerText(),'650 mm');
  await page.screenshot({path:`${output}/dcs-${viewport.width}.png`,fullPage:true});
  await nav(page,'processView');await page.locator('#resetBtn').click();await clean(page,false);
  await beginScenario(page);await page.clock.runFor(3000);await recover(page,'interface');
  await page.screenshot({path:`${output}/debrief-${viewport.width}.png`,fullPage:true});
  await page.locator('#scenarioReplayBtn').click();
  assert.equal(await page.evaluate(()=>S.scenario.id),'');assert.equal(await page.evaluate(()=>S.mode),'training');
  assert.ok(!(await page.locator('#scenarioDebrief').isVisible()));
  await page.locator('#hiddenScenarioStart').click();assert.equal(await page.evaluate(()=>S.scenario.active),true);
  await nav(page,'processView');await page.locator('#normalBtn').click();await clean(page,true);
  await beginScenario(page);await nav(page,'processView');await page.locator('#resetBtn').click();await clean(page,false);
  await page.screenshot({path:`${output}/reset-${viewport.width}.png`,fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Select the existing disagreement scenario through the public start button.
  await page.evaluate(()=>{Math.random=()=>0.9;});
  await beginScenario(page);await nav(page,'processView');await page.clock.runFor(2000);
  await visualizationAgrees(page);assert.equal(await page.locator('#voteMiniTxt').innerText(),'1/3');
  assert.equal(await page.evaluate(()=>S.tripped),false);
  await page.locator('#voteMini').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/process-single-${viewport.width}.png`,fullPage:true});
  await nav(page,'processView');await page.locator('#normalBtn').click();await clean(page,true);
  await page.evaluate(()=>{Math.random=()=>0.1;});
  // Exercise the genuine trip and both reset paths at every supported viewport.
  await beginScenario(page);await nav(page,'processView');
  for(let i=0;i<72;i++){await page.clock.runFor(500);await visualizationAgrees(page);}
  assert.equal(await page.evaluate(()=>S.tripped),true);
  assert.match(await page.locator('#pceStage').innerText(),/VERIFIED EFFECTS/);
  await page.locator('#voteMini').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/process-tripped-${viewport.width}.png`,fullPage:true});
  await page.locator('#resetBtn').click();await clean(page,false);
  await page.clock.runFor(4000);await visualizationAgrees(page);
  await page.locator('#voteMini').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/process-reset-${viewport.width}.png`,fullPage:true});
  await beginScenario(page);await nav(page,'processView');await page.clock.runFor(33000);
  await visualizationAgrees(page);assert.equal(await page.evaluate(()=>S.tripped),true);
  await nav(page,'processView');await page.locator('#normalBtn').click();await clean(page,true);
  await page.clock.runFor(4000);await visualizationAgrees(page);
  results.push({viewport,status:'PASS',scenario:'S01 recovery, trip visualization, replay, tripped Reset and Normal Operation',equipmentDialogs:7});
  await context.close();check(`${viewport.width}x${viewport.height}: six views, seven dialogs, trends, investigation, recovery/debrief, trip visualization/state agreement, replay and resets`);
 }
 // Real browser time verifies SMIL independently of the accelerated model clock.
 for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:430,height:932}]){
  const cx=await browser.newContext({viewport});const p=await watch(cx);await p.goto(base+'/labs/desalter/');
  const motion=async active=>{
   await p.waitForFunction(active=>{const svgs=[...document.querySelectorAll('#processView .process svg')].filter(s=>s.querySelector('animateMotion'));return svgs.length>0&&svgs.every(s=>s.animationsPaused()===!active);},active);
   const sample=()=>p.evaluate(()=>[...document.querySelectorAll('#processView .process svg')].filter(s=>s.querySelector('animateMotion')).map(s=>({id:s.id,time:s.getCurrentTime()})));
   const a=await sample();await p.waitForTimeout(180);const b=await sample();
   for(const x of a){const y=b.find(y=>y.id===x.id);assert.ok(y);if(active)assert.ok(y.time>x.time);else assert.equal(y.time,x.time);}
  };
  const snap=async name=>p.screenshot({path:`${output}/p2-${viewport.width}-${name}.png`,fullPage:true});
  await motion(false);await snap('ready');await p.locator('#startBtn').click();await motion(true);
  await p.evaluate(()=>{window.announcementChanges=0;new MutationObserver(ms=>window.announcementChanges+=ms.length).observe(document.getElementById('labFeedback'),{childList:true,subtree:true,characterData:true});});
  await p.locator('#raiseBtn').click();await p.waitForTimeout(100);const changes=await p.evaluate(()=>window.announcementChanges);const level=await p.evaluate(()=>S.level);
  await p.waitForTimeout(1100);assert.ok(await p.evaluate(v=>S.level>v,level));assert.equal(await p.evaluate(()=>window.announcementChanges),changes);assert.ok(changes>0);
  await p.locator('#pauseBtn').click();await motion(false);const frozen=await p.evaluate(()=>[S.level,S.lv,S.t,S.elapsedMs,S.history]);await p.waitForTimeout(500);assert.deepEqual(await p.evaluate(()=>[S.level,S.lv,S.t,S.elapsedMs,S.history]),frozen);assert.match(await p.locator('#labFeedback').innerText(),/Paused/);await snap('paused');
  await p.locator('#startBtn').click();await motion(true);await p.waitForFunction(t=>S.t>t,frozen[2]);await snap('resumed');
  await p.locator('#resetBtn').click();await motion(false);await clean(p,false);
  await p.locator('#startBtn').click();for(const c of ['A','B'])await p.locator(`.labBias[data-channel="${c}"]`).selectOption('high');await visualizationAgrees(p);assert.equal(await p.evaluate(()=>S.running),false);await motion(false);assert.match(await p.locator('#labFeedback').innerText(),/protection active/);await snap('trip');
  await p.locator('#normalBtn').click();await clean(p,true);await motion(true);await p.locator('#resetBtn').click();await clean(p,false);await motion(false);await snap('reset');await publicOnly(p);
  await cx.close();check(`P2 ${viewport.width}x${viewport.height}: real-time SVG READY/run/pause/resume/trip/reset; transition-only announcements`);
 }
 // M1: every experiment uses public input controls; state is read only for assertions.
 for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:430,height:932}]){
  const cx=await browser.newContext({viewport});const p=await watch(cx);
  await cx.addInitScript(()=>{Math.random=()=>0.1;});
  await p.clock.install();await p.goto(base+'/labs/desalter/');await p.clock.pauseAt(new Date(Date.now()+1000));
  const snap=async name=>{await nav(p,'processView');await p.locator('.simulationLab').scrollIntoViewIfNeeded();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:`${output}/m1-${viewport.width}-${name}.png`,fullPage:true});};
  const bias=async(c,value='high')=>p.locator(`.labBias[data-channel="${c}"]`).selectOption(value);
  const fresh=async()=>{await nav(p,'processView');await p.locator('#resetBtn').click();await clean(p,false);await p.locator('#startBtn').click();};
  await clean(p,false);await snap('normal');
  for(const c of ['A','B','C']){
   await fresh();await bias(c);await p.clock.runFor(500);await visualizationAgrees(p);
   assert.deepEqual(await p.evaluate(()=>({pv:S.level,values:channelValues(),trip:S.tripped})),{pv:650,values:['A','B','C'].map(x=>x===c?1850:650),trip:false});
   assert.match(await p.locator('#labSummary').innerText(),/Vote 1\/3 — 2oo3 NOT SATISFIED/);
   if(c==='A')await snap('single');
   await bias(c,'normal');assert.equal(await p.locator('#voteMiniTxt').innerText(),'0/3');
   await bias(c);await p.locator('#clearBiasBtn').click();assert.deepEqual(await p.evaluate(()=>S.instrumentFaults),{});
  }
  for(const pair of [['A','B'],['A','C'],['B','C']]){
   await fresh();for(const c of pair)await bias(c);await p.clock.runFor(4000);await visualizationAgrees(p);
   assert.deepEqual(await p.evaluate(()=>[S.level,channels().filter(Boolean).length,S.tripped,S.powerTrip,S.uvClosed]),[650,2,true,true,true]);
   for(const id of ['startBtn','pauseBtn','raiseBtn','removeDisturbanceBtn','clearBiasBtn'])assert.ok(await p.locator('#'+id).isDisabled());
   assert.equal(await p.locator('.labBias:disabled').count(),3);
   await nav(p,'dcsView');assert.equal(await p.locator('#dcsPv').innerText(),'650 mm');assert.equal(await p.locator('#dcsPowerState').innerText(),'TRIPPED');
   await nav(p,'alarmsView');assert.match(await p.locator('#logMirror').innerText(),/C&E protective initiator asserted/);
   await snap('pair-'+pair.join(''));
  }
  await fresh();await p.locator('#raiseBtn').click();await p.clock.runFor(3000);
  assert.ok(await p.evaluate(()=>S.level>650&&S.lv>50));await snap('disturbance');
  await p.locator('#pauseBtn').click();assert.equal(await p.locator('#readyBadge').innerText(),'PAUSED');const frozen=await p.evaluate(()=>[S.level,S.lv,S.t,S.elapsedMs,S.history,S.instrumentFaults]);
  await p.clock.runFor(3000);assert.deepEqual(await p.evaluate(()=>[S.level,S.lv,S.t,S.elapsedMs,S.history,S.instrumentFaults]),frozen);
  assert.ok(await p.locator('#raiseBtn').isDisabled());assert.equal(await p.locator('.labBias:disabled').count(),3);
  for(const view of views.slice(0,5))await nav(p,view);await snap('paused');
  assert.equal(await p.locator('#startBtn').innerText(),'Resume');await p.locator('#startBtn').click();await p.clock.runFor(1000);
  assert.ok(await p.evaluate(t=>S.t>t,frozen[2]));
  const before=await p.evaluate(()=>S.level);await p.locator('#removeDisturbanceBtn').click();assert.equal(await p.evaluate(()=>S.level),before);
  await p.clock.runFor(20000);assert.ok(await p.evaluate(()=>Math.abs(S.level-650)<35&&!S.tripped));
  await fresh();await p.locator('#raiseBtn').click();await p.clock.runFor(27000);
  assert.ok(await p.evaluate(()=>S.level>=1500&&S.level<1700&&!S.tripped));
  await nav(p,'dcsView');assert.match(await p.locator('#lahStageState').innerText(),/ALARM ONLY/);
  await p.clock.runFor(10000);await visualizationAgrees(p);assert.equal(await p.locator('#voteMiniTxt').innerText(),'3/3');await snap('process-trip');
  await p.locator('#normalBtn').click();await clean(p,true);await p.locator('#resetBtn').click();await clean(p,false);await snap('reset');
  await p.locator('#startBtn').click();await bias('A');await p.locator('#raiseBtn').click();await p.clock.runFor(1000);await p.locator('#pauseBtn').click();
  await p.locator('[data-mode="training"]').click();
  assert.deepEqual(await p.evaluate(()=>[S.mode,S.running,S.fault,S.level,S.instrumentFaults,S.scenario.id]),['training',false,false,650,{},'']);
  await p.locator('#hiddenScenarioStart').click();await p.clock.runFor(1000);await snap('training');assert.ok(await p.locator('#raiseBtn').isDisabled());
  await p.locator('[data-mode="normal"]').click();await clean(p,false);
  for(const el of await p.locator('.simulationLab button,.simulationLab select').all()){const box=await el.boundingBox();assert.ok(box.height>=44);}
  await cx.close();check(`M1 ${viewport.width}x${viewport.height}: 0/3, every single and pair, process trip, recovery, pause, resets, mode isolation and visual evidence`);
 }
 // S02: real start button with controlled randomness, no direct fault injection.
 const c2=await browser.newContext({viewport:{width:1440,height:900}});await c2.addInitScript(()=>{Math.random=()=>0.9;});const p2=await watch(c2);
 await p2.clock.install();await p2.goto(base+'/labs/desalter/');await p2.clock.pauseAt(new Date(Date.now()+1000));
 await beginScenario(p2);await p2.clock.runFor(2000);await nav(p2,'processView');assert.ok(!(await p2.locator('#channelExperiment').isVisible()));
 assert.equal(await p2.evaluate(()=>S.scenario.id),'CORE-S02');assert.equal(await p2.evaluate(()=>S.level),650);
 assert.equal(await p2.evaluate(()=>channels().filter(Boolean).length),1);assert.equal(await p2.evaluate(()=>S.tripped),false);
 await recover(p2,'instrument');assert.equal(await p2.evaluate(()=>Object.keys(S.instrumentFaults).length),0);
 assert.match(await p2.locator('#scenarioDebrief').innerText(),/1\/3 vote only/);
 await p2.screenshot({path:`${output}/s02-recovered.png`,fullPage:true});await c2.close();check('S02: one-channel HH remains 1/3 without trip; investigation, diagnosis, stabilization and debrief');
 // Unmitigated S01 exercises actual threshold crossing and trip effects.
 const ct=await browser.newContext({viewport:{width:1440,height:900}});await ct.addInitScript(()=>{Math.random=()=>0.1;});const pt=await watch(ct);
 await pt.clock.install();await pt.goto(base+'/labs/desalter/');await pt.clock.pauseAt(new Date(Date.now()+1000));await beginScenario(pt);
 await pt.clock.runFor(27000);await nav(pt,'dcsView');
 assert.ok(await pt.evaluate(()=>S.level>=1500&&S.level<1700&&!S.tripped));
 assert.match(await pt.locator('#lahStageState').innerText(),/ALARM ONLY/);assert.equal(await pt.locator('#dcsPowerState').innerText(),'RUN');
 await nav(pt,'processView');await pt.locator('#ackBtn').click();assert.equal(await pt.evaluate(()=>S.alarmAck),true);
 await visualizationAgrees(pt);
 for(let i=0;i<24;i++){await pt.clock.runFor(500);await visualizationAgrees(pt);}
 assert.equal(await pt.evaluate(()=>S.scenario.outcome),'TRIPPED');
 assert.deepEqual(await pt.evaluate(()=>[S.powerTrip,S.uvClosed,channels().filter(Boolean).length]),[true,true,3]);
 assert.equal(await pt.locator('#powertxt').innerText(),'TRIPPED');assert.equal(await pt.locator('#inletSdvtxt').innerText(),'CLOSED');assert.equal(await pt.locator('#outletSdvtxt').innerText(),'CLOSED');
 await nav(pt,'esdView');assert.equal(await pt.locator('#ceLogicState').innerText(),'INITIATED');assert.equal(await pt.locator('#liveCeRows .active').count(),1);
 assert.match(await pt.locator('#soeEffect').innerText(),/POWER UNIT TRIP/);await pt.screenshot({path:`${output}/esd-tripped.png`,fullPage:true});
 await nav(pt,'alarmsView');const log=await pt.locator('#logMirror').innerText();assert.match(log,/Interface LAH reached/);assert.match(log,/C&E protective initiator asserted/);assert.match(log,/DS-SDV-102 CLOSE/);assert.match(log,/TRAINING OUTCOME/);
 await nav(pt,'trendsView');assert.ok(await pt.evaluate(()=>S.history.length>30));
 await nav(pt,'trainingView');await pt.locator('#scenarioDebriefBtn').click();assert.match(await pt.locator('#scenarioDebrief').innerText(),/TRIPPED/);
 await nav(pt,'processView');await pt.locator('#normalBtn').click();await clean(pt,true);await pt.clock.runFor(4000);
 assert.equal(await pt.evaluate(()=>S.tripped),false);await ct.close();check('S01: LAH alarm-only, acknowledge, HH/2oo3 trip, all final effects, live C&E, SOE, trend, debrief and trip reset');
 // Loopback routing emulates directory canonicalization only, not Firebase certification.
 const cr=await browser.newContext();const pr=await watch(cr);
 for(const path of ['/labs/desalter','/labs/desalter/','/labs/desalter/?utm_source=linkedin&utm_medium=social&utm_campaign=desalter_launch']){
  const response=await pr.goto(base+path);assert.equal(response.status(),200);await publicOnly(pr);
  assert.equal(new URL(pr.url()).pathname,'/labs/desalter/');
  if(path.includes('?'))assert.equal(new URL(pr.url()).search,new URL(base+path).search);
  await pr.reload();await publicOnly(pr);assert.equal(await pr.evaluate(()=>S.scenario.id),'');
 }
 await cr.close();check('local slash/no-slash route, UTM query retention and reload');
 // Existing anonymous labs use their real local assets; no outside requests allowed.
 const cs=await browser.newContext();const ps=await watch(cs);
 await ps.goto(base+'/simulations/');await ps.waitForSelector('.sim-card');assert.equal(await ps.locator('.sim-card').count(),3);
 await ps.goto(base+'/simulations/4-20ma-loop/');await ps.locator('#pv').fill('10');assert.equal(await ps.locator('#tx-reading').innerText(),'20.00 mA');
 await ps.goto(base+'/simulations/pressure-transmitter-calibration/');await ps.waitForFunction(()=>document.getElementById('measured')?.textContent==='4.000 mA');await ps.locator('#record').click();assert.equal(await ps.locator('#found-records li').count(),1);
 await cs.close();check('three-entry catalog, 4–20 mA response and pressure observation smoke checks');
 // Homepage is unchanged; external Firebase/auth is deliberately not exercised locally.
 const ch=await browser.newContext();const ph=await watch(ch,false);await ph.goto(base+'/');await ph.waitForSelector('#siteHeader a');
 assert.ok(await ph.locator('h1').first().isVisible());smoke.push({page:'homepage',localContent:'PASS',externalAuth:'NOT TESTED — network intentionally blocked'});await ch.close();check('homepage local content and shared navigation smoke check');
 assert.deepEqual(errors.filter(e=>e.strict),[]);assert.deepEqual(external.filter(e=>e.strict),[]);check('zero runtime, console, HTTP or external-request failures for Desalter and existing labs');
 console.log(JSON.stringify({passed:checks.length,viewports:results,errors:errors.filter(e=>e.strict),homepageLimitations:smoke},null,2));
}finally{
 await writeFile(`${output}/results.json`,JSON.stringify({checks,viewports:results,errors,external,smoke},null,2));
 if(browser)await browser.close();await new Promise(r=>server.close(r));
}
