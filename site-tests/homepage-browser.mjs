/** Homepage V2 local acceptance. No production requests/writes.
 * node site-tests/homepage-browser.mjs
 * HOME_CHROMIUM_PATH: optional Chromium executable.
 * HOME_AXE_MODULE: required @axe-core/playwright path if not installed locally.
 * HOME_EVIDENCE_DIR: evidence destination outside repository (default /tmp/instmates-home-evidence).
 * External SDKs are intercepted with deterministic signed-out/empty/error fixtures.
 * Existing auth/header/home code executes; no Firebase connection is made.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const {default:AxeBuilder}=require(process.env.HOME_AXE_MODULE || '@axe-core/playwright');
const root=fileURLToPath(new URL('../public/',import.meta.url));
const output=process.env.HOME_EVIDENCE_DIR || '/tmp/instmates-home-evidence';
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(file!==root.replace(/\/$/,'') && !file.startsWith(root)) {res.writeHead(403).end();return;}
  try { if((await stat(file)).isDirectory())file=path.join(file,'index.html'); }
  catch { file=file.replace(/\/$/,'')+'.html'; }
  const data=await readFile(file);
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.HOME_CHROMIUM_PATH?{executablePath:process.env.HOME_CHROMIUM_PATH}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const errors=[],networkErrors=[],blocked=[],checks=[],accessibility=[];
let fixture='empty';
const auth=`export const getAuth=()=>({currentUser:null}), browserLocalPersistence={},browserSessionPersistence={};
export const onAuthStateChanged=(a,cb)=>{queueMicrotask(()=>cb(null));return ()=>{}};
export const createUserWithEmailAndPassword=()=>{throw Error('Forbidden test write')},signInWithEmailAndPassword=createUserWithEmailAndPassword,signOut=createUserWithEmailAndPassword,setPersistence=createUserWithEmailAndPassword;`;
const fsStub=()=>`export const getFirestore=()=>({}),collection=(db,name)=>({name}),query=(...args)=>args,where=(...a)=>a,orderBy=(...a)=>a,limit=x=>x;
export const getDocs=async()=>{${fixture==='error'?"throw Object.assign(Error('Fixture unavailable'),{code:'fixture-unavailable'});":"return {docs:[]};"}};
export const getCountFromServer=async()=>({data:()=>({count:0})});
export const doc=(...a)=>a,getDoc=async()=>({exists:()=>false}),serverTimestamp=()=>null;
export const setDoc=()=>{throw Error('Forbidden test write')},addDoc=setDoc;`;
await context.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.origin===base)return route.continue();
 blocked.push(u.href);
 let body='',contentType='text/javascript';
 if(u.pathname.endsWith('/firebase-app.js'))body='export const getApps=()=>[],initializeApp=()=>({});';
 else if(u.pathname.endsWith('/firebase-auth.js'))body=auth;
 else if(u.pathname.endsWith('/firebase-firestore.js'))body=fsStub();
 else if(u.pathname.endsWith('/firebase-storage.js'))body='export const getStorage=()=>({});';
 else if(u.hostname==='fonts.googleapis.com')contentType='text/css';
 else if(u.hostname!=='www.googletagmanager.com')throw Error(`Unexpected external request ${u}`);
 return route.fulfill({status:200,contentType,headers:{"access-control-allow-origin":"*"},body});
});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)networkErrors.push(`${r.status()} ${r.url()}`);});
const check=name=>checks.push(name);
const shot=async(name,fullPage=false)=>page.screenshot({path:`${output}/${name}.png`,fullPage});
const overflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(await page.evaluate(()=>({width:innerWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))}))));
const axe=async(name)=>{
 const result=await new AxeBuilder({page}).include('#main').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 accessibility.push({name,violations:result.violations});
 await writeFile(`${output}/accessibility.json`,JSON.stringify(accessibility,null,2));
 assert.equal(result.violations.length,0,JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));
};
try {
 await page.goto(base+'/');await page.waitForSelector('body.auth-ready');
 await page.waitForSelector('[data-home=discussions][aria-busy=false]');
 assert.equal(await page.locator('h1').innerText(),'A Community for Instrument & Analyzer Professionals');
 assert.equal(await page.locator('.hm-cta a').count(),2);
 assert.equal(await page.getByRole('link',{name:'Explore Knowledge',exact:true}).getAttribute('href'),'/knowledge/');
 assert.equal(await page.getByRole('link',{name:'Try the Simulator',exact:true}).getAttribute('href'),'/simulations/4-20ma-loop/');
 check('mandatory H1 and two real hero CTAs');
 assert.ok(await page.locator('.main-nav').isVisible());
 assert.ok(await page.locator('.main-nav a[href="/simulations/"]').isVisible());
 assert.ok(await page.locator('.main-nav a[href="/login.html"]').isVisible());check('shared desktop navigation and signed-out account actions');
 assert.match(await page.locator('[data-home=discussions]').innerText(),/No discussions yet/);
 assert.doesNotMatch(await page.locator('[data-home=discussions]').innerText(),/Ask the first|post now/i);check('honest empty community state and no immediate posting promise');
 // Verify real local destinations rather than only href strings.
 for(const href of new Set(await page.locator('main a[href^="/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href'))))) {
  const response=await context.request.get(base+href);assert.ok(response.ok(),`broken promoted route: ${href}`);
 }
 check('every promoted internal destination returns successfully');
 for(const width of [1440,768,430,390,360,320]) {
  await page.setViewportSize({width,height:width>768?1000:844});await page.evaluate(()=>scrollTo(0,0));
  await overflow();
  if(width<=430) {
   assert.equal(await page.locator('.mobile-bottom-nav').isVisible(),false);
   const h=await page.locator('.hm-hero').boundingBox();const pathway=await page.locator('.hm-pathway').boundingBox();
   assert.ok(h.height-pathway.height<470 && h.height<570,`hero including pathway too tall at ${width}: ${h.height}`);
   for(const a of await page.locator('.hm-cta a,.hm-pathway a').all())assert.ok((await a.boundingBox()).height>=44);
  }
  // Trigger below-fold lazy imagery before the full-page capture.
  await page.locator('#watch').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.querySelectorAll('#watch img')].every(i=>i.complete&&i.naturalWidth));
  await page.locator('#watch img').evaluateAll(es=>Promise.all(es.map(i=>i.decode())));
  await page.evaluate(()=>scrollTo(0,0));
  await shot(`home-${width}`,true);await shot(`hero-${width}`);
 }
 check('six explicit viewports: overflow, compact mobile hero, touch targets and no bottom overlay');
 await page.setViewportSize({width:390,height:844});
 await page.locator('.mobile-menu summary').focus();await page.keyboard.press('Enter');
 assert.ok(await page.locator('.mobile-menu a[href="/simulations/"]').isVisible());await shot('mobile-menu');
 await page.keyboard.press('Enter');check('shared native mobile menu operates by keyboard');
 await page.locator('.hm-pathway a[href="#simulate"]').click();
 const top=await page.locator('#simulate').evaluate(e=>e.getBoundingClientRect().top);
 const headerBottom=await page.locator('.siteHeader').evaluate(e=>e.getBoundingClientRect().bottom);
 assert.ok(top>=headerBottom,'anchor hidden under header');await shot('simulator-spotlight');check('simulator anchor visible below sticky header');
 assert.deepEqual(await page.locator('.hm-signal strong').allTextContents(),['Process','Transmitter','Loop','PLC/DCS','Display']);
 assert.equal(await page.locator('.hm-signal img').evaluateAll(es=>es.every(i=>i.complete&&i.naturalWidth>0)),true);check('five-step simulator artwork and sequence load');
 await page.locator('.hm-spotlight .hm-btn').click();
 await page.waitForFunction(()=>document.getElementById('loop-reading')?.textContent==='12.00 mA');check('launch action reaches working simulator');
 await page.goto(base+'/');await page.waitForSelector('body.auth-ready');
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'hm-skip');
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'main');check('keyboard skip link reaches main');
 await page.locator('.hm-cta a').first().focus();
 assert.equal(await page.locator('.hm-cta a').first().evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
 assert.ok(await page.locator('.hm-cta a').first().evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=document.querySelector('.siteHeader').getBoundingClientRect().bottom&&r.bottom<=innerHeight}));
 await shot('keyboard-focus');check('visible keyboard focus and unobscured hero action');
 await page.locator('.hm-topic-disclosure summary').focus();await page.keyboard.press('Enter');
 assert.ok(await page.locator('.hm-topic-disclosure').evaluate(e=>e.open));await overflow();check('topic disclosure keyboard behavior');
 await axe('mobile expanded topics');check('axe WCAG main: mobile expanded topics');
 await page.locator('#connect').scrollIntoViewIfNeeded();await shot('lower-page');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollTo(0,0));
 assert.ok(await page.locator('main *').evaluateAll(es=>es.every(e=>getComputedStyle(e).animationName==='none')));
 await shot('reduced-motion');check('reduced motion: all content visible without animation');
 await page.setViewportSize({width:640,height:450}); // 1280px desktop at 200% browser zoom yields 640 CSS px.
 await overflow();await shot('reflow-200-percent',true);check('200% equivalent CSS reflow at 640px, plus 320px narrow reflow');
 await page.setViewportSize({width:1440,height:1000});await axe('desktop');check('axe WCAG main: desktop');
 const fullAxe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 await writeFile(`${output}/accessibility-shared-shell.json`,JSON.stringify(fullAxe.violations,null,2));
 assert.equal(fullAxe.violations.length,0,JSON.stringify(fullAxe.violations.map(v=>v.id)));
 check('axe WCAG full page including shared shell: zero violations');
 const noJS=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block',viewport:{width:320,height:844}});
 await noJS.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.fulfill({status:200,body:''}));
 const fallback=await noJS.newPage();await fallback.goto(base+'/');
 assert.ok(await fallback.locator('h1').isVisible());assert.ok(await fallback.locator('#simulate').isVisible());
 assert.equal(await fallback.locator('.hm-cta a').count(),2);
 await noJS.close();check('without JavaScript: hero, spotlight and real primary links remain');
 fixture='error';await page.reload();await page.waitForSelector('[data-home=discussions][aria-busy=false]');
 assert.match(await page.locator('[data-home=discussions]').innerText(),/could not be loaded/);
 assert.match(await page.locator('[data-home=people]').innerText(),/could not be loaded/);check('service failure: honest fallback links remain');
 for(const img of await page.locator('main img').all())await img.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.querySelectorAll('main img')].every(i=>i.complete&&i.naturalWidth));check('all homepage images load');
 assert.deepEqual(errors,[]);assert.deepEqual(networkErrors,[]);check('zero runtime, console or local HTTP errors');
 await writeFile(`${output}/browser-results.json`,JSON.stringify({passed:checks.length,checks,errors,networkErrors,interceptedExternal:blocked,scope:'Local Chromium; signed-out empty/error Firebase fixtures; external fonts and analytics replaced with empty responses. No production connection.'},null,2));
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
} catch(error) {console.error({errors,networkErrors,blocked});throw error;} finally {await browser.close();await new Promise(r=>server.close(r));}
