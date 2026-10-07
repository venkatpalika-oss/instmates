import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
const html=readFileSync(new URL('../public/labs/desalter/index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const core=scripts.find(s=>s.includes('const ENG='));
const section=(start,end)=>core.slice(core.indexOf(start),core.indexOf(end));
const model=runInNewContext(section('const ENG=','const S=')+section('function voteTrip','function instrumentFaultOffset')+section('function applyEffects','function initiate')+'\n;({ENG,SIM,CE,voteTrip})');

test('Desalter: every inline script and event handler parses',()=>{
 assert.equal(scripts.length,11);
 scripts.forEach((s,i)=>assert.doesNotThrow(()=>new Script(s,{filename:`desalter-script-${i}`})));
 for(const m of html.matchAll(/\bon\w+="([^"]*)"/g))assert.doesNotThrow(()=>new Script(`(function(event){${m[1]}})`));
});
test('Desalter: public identity and boundary are static markup',()=>{
 const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 assert.match(markup,/<title>InstMates — Desalter Training Simulator<\/title>/);
 assert.match(markup,/<div class="brand">InstMates — Desalter Training Simulator<small>/);
 assert.match(markup,/<div class="publicBoundary">Public Training Demo — Educational simulation only • Not for plant operation<\/div>/);
});
test('Desalter: only six learner views and two modes/tabs exist',()=>{
 const views=['processView','dcsView','esdView','trendsView','alarmsView','trainingView'];
 assert.deepEqual([...html.matchAll(/<button[^>]+data-view="([^"]+)"/g)].map(m=>m[1]),views);
 assert.deepEqual([...html.matchAll(/<section class="view(?: active)?" id="([^"]+)"/g)].map(m=>m[1]),views);
 assert.deepEqual([...html.matchAll(/<button[^>]+data-mode="([^"]+)"/g)].map(m=>m[1]),['normal','training']);
 assert.deepEqual([...html.matchAll(/<button[^>]+data-tab="([^"]+)"/g)].map(m=>m[1]),['overview','logic']);
});
test('Desalter: development payload is absent from source, including generated HTML',()=>{
 assert.doesNotMatch(html,/developer|devOnly|devCeBtn|devFaultState|engineeringView|settingsView|data-tab="engineering"|runTests|testResult|testBtn|regression|ceTestHarness|v17Run|v17Ce|M1_CE_VERIFICATION|m1CeRegistry|installM1CeRegistry|coreLevelBtn|coreSequence|setCoreLevel|modeAllowsFaultInjection|function inject\(|faultBtn|publicLock|instmates-public-demo-js|soeAudit|CORE_DIAG_CONTRACT/i);
 assert.match(core,/if\(mode!=='normal'&&mode!=='training'\)return/);
});
test('Desalter: approved thresholds and all eight voting combinations preserved',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(model.ENG)),{sp:650,lah:1500,lahh:1700,lal:450,lall:300,top:3800,voting:{required:2,total:3}});
 for(let n=0;n<8;n++){
  const bits=[!!(n&1),!!(n&2),!!(n&4)];
  assert.equal(model.voteTrip(bits),bits.filter(Boolean).length>=2);
 }
});
test('Desalter: eight C&E relationships retain exact approved effects',()=>{
 const all=['POWER_TRIP','INLET_SDV_CLOSE','OUTLET_SDV_CLOSE'];
 const expected={IFACE_HH_2OO3:['2oo3',all],TOTAL_LEVEL_LL_1OO1:['1oo1',['POWER_TRIP']],PU_CURRENT_HH_1OO1:['1oo1',['POWER_TRIP']],PU_OIL_LEVEL_LL_1OO1:['1oo1',['POWER_TRIP']],MANUAL_ESD_CR:['1oo1',all],MANUAL_ESD_LCS:['1oo1',all],MANUAL_ESD_LOCAL:['1oo1',all],UNIT_SHUTDOWN:['Interlock',['INLET_SDV_CLOSE','OUTLET_SDV_CLOSE']]};
 assert.deepEqual(Object.keys(model.CE),Object.keys(expected));
 for(const [key,[voting,effects]] of Object.entries(expected)){
  assert.equal(model.CE[key].voting,voting);assert.deepEqual(Array.from(model.CE[key].effects),effects);
 }
});
test('Desalter: supplied engineering and Training code fingerprints remain unchanged',()=>{
 // SHA-256 of exact sections in the owner-supplied public demo (not a master copy).
 // Locks shared simulation and scenario semantics while allowing public DOM cleanup.
 const fingerprints=[
  [
    "const ENG=",
    "const S=",
    "3da525a618816b8a2d8272b09bfa5335c28af676d0ed004f44db6e1e2a654864"
  ],
  [
    "function voteTrip",
    "function startHiddenTrainingScenario",
    "74dc83297df9d6fd3476a3493946f27c84c019a7efac5b562faf85136cd7a430"
  ],
  [
    "function startHiddenTrainingScenario",
    "function tick(){",
    "4e1aeefff3fc676a47f68aa9e0a65fed1fb115040c5ef7519be2c736adee582d"
  ],
  [
    "function tick(){",
    "function render(){",
    "ce9868ff4477094ff610e459d86031a9c72a99e003fc2595d540062c65c4857f"
  ]
];
 for(const [start,end,expected] of fingerprints){
  assert.ok(core.includes(start)&&core.includes(end),start);
  assert.equal(createHash('sha256').update(section(start,end)).digest('hex'),expected,start);
 }
});
test('Desalter: reset no longer depends on deleted controls; training hooks remain',()=>{
 for(const id of ['startBtn','normalBtn','resetBtn','ackBtn','hiddenScenarioStart','scenarioStabilizeBtn','scenarioDebriefBtn','scenarioReplayBtn','modalClose'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(core,/\$\('resetBtn'\)\.onclick=\(\)=>\{reset\(\);setMode\('normal'\);\}/);
 assert.doesNotMatch(core,/modeNote|cancelCoreSequence/);
});
test('Desalter: standalone payload contains no external dependencies or downloads',()=>{
 assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=|\bdownload\s*[=>]|sourceMappingURL|\.map["']|V26_Fixed\.html|https?:\/\/[^"' ]+\.html/);
 assert.deepEqual(readdirSync(new URL('../public/labs/desalter/',import.meta.url)),['index.html']);
});
test('Desalter: local route fits existing Firebase directory convention',()=>{
 const config=JSON.parse(readFileSync(new URL('../firebase.json',import.meta.url),'utf8'));
 assert.equal(config.hosting.public,'public');assert.equal(config.hosting.trailingSlash,true);assert.equal(config.hosting.cleanUrls,true);
 assert.ok(config.hosting.rewrites.every(r=>!r.source.startsWith('/labs')));
 assert.match(html,/class="processScroll"[^>]+tabindex="0"/);
});

test('Desalter: visualization reads lexical state without exporting or copying it',()=>{
 assert.doesNotMatch(html,/window\.(?:S|CE)\b/);
 assert.match(html,/const S=\{/);assert.match(html,/const CE=/);
 assert.match(html,/function activeKey\(\)\{\s*if\(!S\.tripped\) return '';/);
 assert.match(html,/function tripKey\(\)\{\s*if\(!S\.tripped\) return '';/);
});


test('Desalter M1: learner adapter only changes allowed inputs',()=>{
 const adapter=section('function exploreAction','function switchLearningMode');
 assert.doesNotMatch(adapter,/S\.(?:level|lv|tripped|powerTrip|uvClosed|tripCause|lah|alarmAck)\s*=(?!=)|\b(?:initiate|interfaceTrip|applyEffects)\s*\(/);
 assert.match(adapter,/S.mode!=='normal'\|\|S.tripped/);
 assert.match(adapter,/if\(!S.running\)return/);
 assert.match(adapter,/setInstrumentFault\(tag,'BIAS_HIGH',SIM.trainingChannelBias\)/);
 assert.match(adapter,/clearInstrumentFault/);
 assert.match(core,/reset\(\);setMode\(mode\)/);
 for(const id of ['pauseBtn','raiseBtn','removeDisturbanceBtn','clearBiasBtn','labSummary'])assert.ok(html.includes(`id="${id}"`));
 assert.equal((html.match(/class="labBias"/g)||[]).length,3);
 assert.doesNotMatch(html,/<input[^>]+(?:number|range)/);
});


test('Desalter P2: SVG timelines follow execution and announcements are transition gated',()=>{
 assert.match(html,/new MutationObserver\(syncSignalMotion\)/);
 assert.match(html,/svg\.pauseAnimations\(\)/);assert.match(html,/svg\.unpauseAnimations\(\)/);
 assert.doesNotMatch(html,/<div id="labSummary"[^>]*aria-live/);
 assert.match(html,/if\(\$\('labFeedback'\)\.textContent!==announcement\)/);
});
