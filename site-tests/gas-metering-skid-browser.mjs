/** Local M1 acceptance harness; installs nothing. GM_CHROMIUM_PATH may select an
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
 assert.equal(await page.locator('main input,main select,main canvas').count(),0);
 assert.equal(await page.locator('.gm-nav a').count(),5);
 check('placeholders and no active engineering controls');
 for(const width of [1440,1024,768,320,390,430]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width}`);
  for(let i=0;i<await buttons.count();i++){
   const button=buttons.nth(i);await button.focus();
   const b=await button.boundingBox();assert.ok(b.width>=44&&b.height>=44,`target ${width}`);
   assert.ok(b.x>=0&&b.x+b.width<=width+1,`clipping ${width}`);
   assert.ok(b.y>=0&&b.y+b.height<=900,`focus visibility ${width}`);
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
 const short=await buttons.last().boundingBox();assert.ok(short.y>=0&&short.y+short.height<=400);
 check('short viewport focused control visible');
 await page.setViewportSize({width:320,height:900});
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
