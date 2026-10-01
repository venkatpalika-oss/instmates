// Shared-chrome, navigation, accessibility and transport acceptance on the canonical route.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {startServer} from '../scripts/serve-oxymitter-dev.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const {default:AxeBuilder}=require(process.env.OXY_AXE_MODULE||'@axe-core/playwright');
const {server,url}=await startServer();let browser;
const evidence={layouts:[],axe:[],requests:[],errors:[],failed:[],warnings:[]};
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});evidence.browser=browser.version();
 const context=await browser.newContext(),page=await context.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());if(m.type()==='warning')evidence.warnings.push(m.text());});
 page.on('requestfailed',r=>evidence.failed.push(r.url()));page.on('response',r=>{if(r.status()>=400)evidence.failed.push(r.url());});
 await context.route('**/*',r=>{assert.equal(new URL(r.request().url()).origin,new URL(url).origin);return r.continue();});
 page.on('response',async r=>{const body=await r.body().catch(()=>null);evidence.requests.push({path:new URL(r.url()).pathname,bytes:body?.length??0,status:r.status()});});
 await page.goto(url);await page.waitForSelector('.mobile-bottom-nav',{state:'attached'});await page.waitForSelector('#training-assessment');
 assert.equal(await page.locator('script[src*="auth"],script[src*="firebase"]').count(),0);
 assert.equal(await page.locator('#siteHeader .siteHeader').count(),1);assert.equal(await page.locator('#siteFooter .siteFooter').count(),1);
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'sim-skip');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'training');
 await mkdir('/tmp/oxymitter-m7-shell',{recursive:true});
 for(const width of [1440,1024,768,430,390,360,320]){
  await page.setViewportSize({width,height:1000});
  const mobile=width<=768;
  if(mobile){await page.locator('.mobile-menu>summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.mobile-menu').getAttribute('open'),'');assert.ok(await page.locator('.mobile-menu-nav a[href="/simulations/"]').isVisible());}
  const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,fixed:[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&['fixed','sticky'].includes(getComputedStyle(e).position)).map(e=>e.className),header:getComputedStyle(document.querySelector('.siteHeader')).position,bottom:getComputedStyle(document.querySelector('.mobile-bottom-nav')).position}));
  assert.ok(result.overflow<=0,JSON.stringify(result));assert.deepEqual(result.fixed,[]);evidence.layouts.push({width,menuOpen:mobile,...result});
  if(mobile)assert.ok(await page.evaluate(()=>document.querySelector('.mobile-menu-nav').getBoundingClientRect().bottom<=document.querySelector('main').getBoundingClientRect().top),'Open menu must not cover simulator');
  if([1440,320].includes(width)){
   const a=await new AxeBuilder({page}).analyze();evidence.axe.push({width,violations:a.violations});assert.deepEqual(a.violations,[]);
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`/tmp/oxymitter-m7-shell/${width}.png`,fullPage:true});await page.screenshot({path:`/tmp/oxymitter-m7-shell/${width}-top.png`});
  }
  if(mobile)await page.locator('.mobile-menu>summary').press('Enter');
 }
 // Enlarged text with the real shared menu open.
 await page.evaluate(()=>{const ns=[...document.querySelectorAll('body *')],sizes=ns.map(e=>parseFloat(getComputedStyle(e).fontSize));ns.forEach((e,i)=>e.style.fontSize=sizes[i]*2+'px');});
 await page.locator('.mobile-menu>summary').press('Enter');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/oxymitter-m7-shell/320-text200.png',fullPage:true});
 evidence.storage=await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length,cookies:document.cookie}));assert.deepEqual(evidence.storage,{local:0,session:0,cookies:''});
 await page.locator('.mobile-menu>summary').press('Enter');await page.locator('.sim-crumb a').click();await page.waitForSelector('.sim-card');assert.equal(await page.locator('.sim-card').count(),3);
 await page.locator('.sim-card a[href="/simulations/oxymitter-4000/"]').click();await page.waitForSelector('#training-assessment');assert.equal(new URL(page.url()).pathname,'/simulations/oxymitter-4000/');
 assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.failed,[]);assert.deepEqual(evidence.warnings,[]);
 await writeFile('/tmp/m7-shell-evidence.json',JSON.stringify(evidence,null,2));console.log('M7 shared-chrome acceptance passed');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
