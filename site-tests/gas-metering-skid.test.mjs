import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {SIMULATIONS} from '../public/assets/js/simulations/catalog.js';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url),'utf8');
const html = read('public/simulations/gas-metering-skid/index.html');
const js = read('public/assets/js/simulations/gas-metering-skid-page.js');
const svg = read('public/assets/images/simulations/gas-metering-skid/skid.svg');
const body = html.split('<body')[1];
const visible = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ').replace(/M1/g,'');
test('gas skid: semantic unreleased learning page and shared shell',()=>{
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 for(const id of ['main','siteHeader','siteFooter','overview','process','instruments','gas-quality','flow-computer']) assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/data-public-learning="true"/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(html,/<meta name="description" content="[^\"]+">/);
 assert.match(html,/Pressure, temperature and GC lifecycle lessons active — calculations not enabled/);
 assert.match(html,/<a class="gm-skip" href="#main">/);
});
test('gas skid: every enabled local anchor resolves; deferred navigation is not interactive',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'unique ids');
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),id);
 const nav=html.match(/<nav class="gm-nav"[\s\S]*?<\/nav>/)[0];
 assert.equal((nav.match(/<a /g)||[]).length,5);
 for(const label of ['Fault Scenarios','Trends','Assessment']) assert.ok(nav.includes(`<span>${label}<small>Not active in M1</small></span>`));
});
test('gas skid: only measurement lessons permit numeric controls; other results stay absent',()=>{
 const results=[...html.matchAll(/data-result>([^<]*)</g)].map(m=>m[1]);
 assert.ok(results.length>=10);assert.ok(results.every(x=>x==='—'));
 assert.doesNotMatch(visible,/\b(?:NORMAL|HEALTHY|OK|GOOD)\b|\bmA\b|\bbar\b|\bMW\b|\bMJ\b|°K/);
 const lesson=html.match(/<div id="gm-pressure-lesson"[\s\S]*?<\/div>/)[0];
 assert.equal((lesson.match(/<input /g)||[]).length,2);
 assert.equal((html.match(/<input /g)||[]).length,4);
 assert.doesNotMatch(html,/<canvas\b/);
 assert.equal((html.match(/<select /g)||[]).length,1);
 assert.match(html,/<select id="gm-gc-profile">/);
 assert.match(lesson,/type="text" inputmode="numeric"/);
 assert.match(lesson,/type="checkbox"/);
 assert.equal((html.match(/data-pressure="selected"/g)||[]).length,2);
 for(const id of ['gas-properties']) {
  const section=html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?<\\/section>`))[0];
  assert.doesNotMatch(section,/<input|data-pressure|data-temperature/);
  assert.doesNotMatch(section.replace(/<[^>]*>/g,' '),/\d/);
 }
 assert.match(html,/No flow calculation enabled/);
 assert.match(html,/A dash means no value, not zero/);
 assert.match(html,/Model pending validation/);
});
test('gas skid: equipment buttons have unique static destinations and initial selection',()=>{
 const buttons=[...html.matchAll(/<button type="button" data-equipment="([^"]+)" aria-pressed="([^"]+)" aria-controls="gm-detail">/g)];
 assert.equal(buttons.length,9);assert.equal(buttons.filter(m=>m[2]==='true').length,1);
 assert.equal(new Set(buttons.map(m=>m[1])).size,9);
 const details=[...html.matchAll(/<article data-detail="([^"]+)"([^>]*)>/g)];
 assert.equal(details.length,9);
 for(const [,id] of buttons) assert.ok(details.some(m=>m[1]===id));
 assert.equal(details.filter(m=>!m[2].includes('hidden')).length,1);
 assert.match(html,/role="status" aria-live="polite" aria-atomic="true"/);
 assert.match(html,/<noscript>/);
});
test('gas skid: controller imports only quantity-specific models; no timing or persistence',()=>{
 assert.doesNotMatch(js,/\b(?:fetch|setTimeout|setInterval|requestAnimationFrame|Date|localStorage|sessionStorage|eval)\b|Math\.|innerHTML/);
 assert.deepEqual([...js.matchAll(/from '([^']+)'/g)].map(m=>m[1]),['./gas-metering-pressure-model.js','./gas-metering-temperature-model.js']);
 assert.match(js,/textContent/);assert.match(js,/aria-pressed/);
});
test('gas skid: runtime assets are local and exist; SVG contains no simulated readings',()=>{
 for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) assert.ok(existsSync(new URL(`../public${url}`,import.meta.url)),url);
 assert.match(svg,/<title id="title">/);assert.match(svg,/<desc id="desc">/);
 assert.doesNotMatch(svg,/<(?:script|foreignObject|animate|image)\b|onload=/);
 const labels=[...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(m=>m[1]).join(' ');
 assert.doesNotMatch(labels,/\d|\b(?:NORMAL|HEALTHY|OK)\b/);
 assert.match(svg,/SAMPLE BRANCH/);assert.match(svg,/INFORMATION/);
});
test('gas skid: catalog and sitemap exclude the prototype; published labs remain two',()=>{
 assert.deepEqual(SIMULATIONS.map(x=>x.id),['4-20ma-loop','pressure-transmitter-calibration']);
 assert.doesNotMatch(read('public/sitemap.xml'),/gas-metering-skid/);
 assert.doesNotMatch(read('public/index.html'),/gas-metering-skid/);
 assert.doesNotMatch(read('public/includes/header.html'),/gas-metering-skid/);
});

test('gas skid: independent temperature lesson, accessible selectors and shared reset',()=>{
 assert.equal((html.match(/data-temperature="selected"/g)||[]).length,2);
 assert.equal((html.match(/>Reset lesson</g)||[]).length,1);
 for(const name of ['pressure','temperature']) assert.match(html,new RegExp(`data-lesson="${name}" aria-pressed="(?:true|false)" aria-controls="gm-${name}-lesson"`));
 assert.match(html,/Inject educational TT bias: \+2 °C/);
 assert.match(html,/20–40 °C/);
 assert.doesNotMatch(js,/\.focus\(|scrollIntoView|scrollTo/);
});

test('gas skid: GC lifecycle controls, distinct records and absent startup result',()=>{
 const gc=html.match(/<section[^>]*id="gas-quality"[\s\S]*?<\/section>/)[0];
 assert.match(gc,/Modeled process composition/);assert.match(gc,/Select educational profile/);
 assert.match(gc,/<option value="A" selected>Profile A<\/option><option value="B">Profile B<\/option>/);
 assert.equal((gc.match(/<button /g)||[]).length,2);assert.doesNotMatch(gc,/<input|<canvas|<svg/);
 for(const heading of ['Captured sample','Current analysis','Latest completed result'])assert.ok(gc.includes(heading));
 assert.match(gc,/id="gm-gc-current"[^>]*>IDLE — no analysis started/);
 assert.match(gc,/id="gm-gc-result-identity">No GC result yet/);
 assert.match(html,/id="gm-gc-input-identity">No GC result yet/);
 for(const prefix of ['result','input']){
  assert.match(html,new RegExp(`id="gm-gc-${prefix}-composition">—`));
  assert.match(html,new RegExp(`id="gm-gc-${prefix}-age">Sample age: —`));
 }
 assert.match(html,/No gas-property or flow calculation enabled/);
 assert.match(gc,/not representative pipeline gas/);assert.match(gc,/not manufacturer cycle time/);
 assert.doesNotMatch(gc,/process control|feed control|gas blending control|valve control|FRESH|STALE/);
 assert.match(html,/<script type="module" src="\/assets\/js\/simulations\/gas-metering-gc-page.js"><\/script>/);
 const controller=read('public/assets/js/simulations/gas-metering-gc-page.js');
 const model=read('public/assets/js/simulations/gas-metering-gc-model.js');
 assert.match(controller,/from '.\/gas-metering-gc-model.js'/);
 assert.doesNotMatch(controller+model,/\b(?:fetch|setTimeout|setInterval|requestAnimationFrame|Date|localStorage|sessionStorage|eval)\b|innerHTML|scrollTo|scrollIntoView|\.focus\(/);
 assert.doesNotMatch(controller,/data-pressure|data-temperature|pressureState|temperatureState/);
 assert.match(controller,/gm-pressure-reset/);
});

test('gas skid: explicit educational input-set boundary and isolated controller',()=>{
 const page=read('public/assets/js/simulations/gas-metering-input-set-page.js');
 assert.match(html,/<script type="module" src="\/assets\/js\/simulations\/gas-metering-input-set-page.js"><\/script>/);
 assert.match(page,/from '.\/gas-metering-input-set-model.js'/);
 assert.match(html,/<button type="button" id="gm-input-set-assemble" hidden>Assemble input set<\/button>/);
 for(const copy of ['No input set assembled','Snapshot — not automatically updated','Temporal alignment: Not established','Calculation eligibility: Not evaluated','No engineering eligibility policy or calculation method is implemented.'])assert.ok(html.includes(copy));
 assert.match(page,/addEventListener\('click'/);assert.equal((page.match(/assembleInputSet\(nextSetId/g)||[]).length,1);
 assert.doesNotMatch(page,/setInterval|setTimeout|requestAnimationFrame|MutationObserver|innerHTML|\.focus\(|scrollTo|scrollIntoView/);
 const section=html.split('id="gm-input-set"')[1].split('</section>')[0];
 assert.equal((section.match(/<button /g)||[]).length,1);
 assert.doesNotMatch(section,/<input|<select|data-result|\b(?:AGA|ISO|GPA|GERG)\b|1\.01325|60 °F|15 °C/);
 assert.match(section,/SOURCE REQUIRED \+ POLICY REQUIRED/);
});
