import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {startServer} from '../scripts/serve-oxymitter-dev.mjs';
import {QUESTION_BANK as bank} from '../public/assets/js/simulations/oxymitter-4000/training-data.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const {server,url}=await startServer();let browser;
const shots='/tmp/oxymitter-m5-screenshots';
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.goto(url);await page.waitForSelector('#training-assessment');
 const click=id=>page.locator('#'+id).click(),select=(id,v)=>page.locator('#'+id).selectOption(v),text=id=>page.locator('#'+id).textContent();
 async function tabTo(id){for(let i=0;i<240;i++){if(await page.evaluate(()=>document.activeElement?.id)===id)return;await page.keyboard.press('Tab');}throw new Error('No keyboard path to '+id);}
 async function key(id){await tabTo(id);await page.keyboard.press('Enter');}
 async function keySelect(id,value){await tabTo(id);const idx=await page.locator('#'+id).evaluate((n,v)=>[...n.options].findIndex(o=>o.value===v),value);assert.ok(idx>=0);await page.keyboard.press('Home');for(let i=0;i<idx;i++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');}
 await click('lesson-fundamentals');await select('lesson-component','cell');await click('lesson-interact');assert.equal(await page.locator('[data-component=cell]').getAttribute('aria-pressed'),'true');await select('lesson-answer',bank[0].correctAnswer);await click('lesson-submit');assert.match(await text('training'),/Lesson complete/);await click('lesson-next');assert.match(await text('training'),/Measurement Reference/);await click('training-home');
 await mkdir(shots,{recursive:true});
 for(const width of [1440,430,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`home overflow ${width}`);await page.locator('#training').screenshot({path:`${shots}/home-${width}.png`});}
 // Entire assessment uses native keyboard navigation at the narrowest width.
 await key('training-assessment');assert.equal(await page.locator('.workbench').isVisible(),false);assert.equal(await page.locator('#training-home').isDisabled(),true);
 for(const [i,q]of bank.entries()){
  assert.equal(await page.locator('#training .source').count(),0,'no source/answer help before submission');assert.doesNotMatch(await text('training'),/Correct answer:/);
  await keySelect('assessment-answer',q.correctAnswer);await key('assessment-submit');assert.match(await text('training'),/Correct answer:/);assert.ok(await page.locator('#training .source').count()>0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`question overflow ${i}`);await key('assessment-next');
 }
 async function action(value){await keySelect('practical-action',value);await key('practical-perform');assert.equal(await text('training-error'),'');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'practical overflow');}
 await action('power');await action('warm');await key('assessment-next');
 await action('manual');assert.equal(await page.locator('#training-reset').isDisabled(),true);await action('verify');await action('start');
 await page.locator('#training').screenshot({path:`${shots}/calibration-320.png`});
 for(const a of ['apply1','enter','advance','apply2','enter','advance','remove','enter','advance'])await action(a);
 assert.equal(await page.locator('#training-reset').isDisabled(),true);await action('automatic');assert.equal(await page.locator('#training-reset').isDisabled(),false);await key('assessment-next');
 for(const a of ['blink','blink','fault-2'])await action(a);await key('assessment-next');
 for(const a of ['T19-trend','safe','Inspection / source review','next','T19','safe','T19-action'])await action(a);await key('assessment-next');
 assert.match(await text('training'),/19 \/ 19 educational points/);assert.match(await text('training'),/15 \/ 15 knowledge/);assert.match(await text('training'),/4 \/ 4 procedural/);
 for(const width of [1440,430,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`result overflow ${width}`);await page.locator('#training').screenshot({path:`${shots}/result-${width}.png`});}
 // Review via keyboard, then retry with an intentionally wrong answer.
 const summary=page.locator('#assessment-review summary');await summary.evaluate(n=>n.id='review-toggle');await key('review-toggle');assert.match(await text('assessment-review'),/Your answer:/);assert.match(await text('assessment-review'),/Correct answer:/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await key('assessment-retry');assert.match(await text('training'),/Question 1 \/ 15/);await keySelect('assessment-answer',bank[0].choices.find(c=>c.id!==bank[0].correctAnswer).id);await key('assessment-submit');assert.match(await text('training'),/Review recommended/);
 await key('training-reset');await page.waitForSelector('#training-assessment');assert.match(await text('training'),/0 \/ 6 lessons complete/);
 // Existing M3 cleanup protection remains active for every new home/reset route.
 await click('power-on');await click('complete');await click('calibration-workspace');await click('cal-manual');await click('cal-verify');await click('cal-start');assert.equal(await page.locator('#training-home').isDisabled(),true);assert.equal(await page.locator('#training-reset').isDisabled(),true);await click('training-assessment');assert.match(await text('training-error'),/cleanup/);assert.equal(await page.locator('#assessment-answer').count(),0);
 await click('cal-abort');await click('cal-remove');await click('cal-finish-timer');assert.equal(await page.locator('#training-reset').isDisabled(),true);await click('cal-auto');assert.equal(await page.locator('#training-reset').isDisabled(),false);
 assert.equal(await page.locator('#training').evaluate(n=>[n,...n.querySelectorAll('*')].some(x=>['fixed','sticky'].includes(getComputedStyle(x).position))),false);
 assert.equal(await page.locator('#training button,#training select').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().height===0||n.getBoundingClientRect().height>=44)),true);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
 assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith(new URL(url).origin)));assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 console.log('M5 browser acceptance passed: guided lesson, source-backed question, complete keyboard-only 15-question/four-practical assessment at 320px, score/review/retry/reset, inherited calibration guards, four viewports, no overflow/overlays/browser errors/storage/external requests.');console.log('Screenshots: '+shots);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
