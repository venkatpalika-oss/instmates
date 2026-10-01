// PR #54 regression: hidden diagnostic controls must hand keyboard focus forward.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startServer} from '../scripts/serve-oxymitter-dev.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const {server,url}=await startServer();let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const bodyFallback of [false,true]){
  await page.goto(url);await page.waitForSelector('#cal-active-safety',{state:'attached'});
  await page.locator('#diagnostic-workspace').click();await page.locator('#diag-scenario').selectOption('T19');await page.locator('#diag-load').click();
  await page.locator('#diag-check').selectOption('T19-trend');
  if(bodyFallback)await page.locator('#diag-select-check').evaluate(n=>n.addEventListener('click',()=>n.blur(),{once:true}));
  async function activate(id,next){await page.locator('#'+id).focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),next);}
  await activate('diag-select-check','diag-meter-mode');
  await page.locator('#diag-meter-mode').selectOption('Inspection / source review');
  await activate('diag-safe','diag-safe'); // Do not steal focus from a still-visible control.
  await activate('diag-perform','diag-observation');
  await activate('diag-next','diag-diagnosis');
  await page.locator('#diag-diagnosis').selectOption('T19');await activate('diag-identify','diag-action');
  await page.locator('#diag-action').selectOption('T19-action');await activate('diag-action-safe','diag-action-safe');
  await activate('diag-corrective','diag-result');
 }
 assert.deepEqual(errors,[]);console.log('PR54 keyboard focus regression passed: native and body-fallback transitions, visible focus retained.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
