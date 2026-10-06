import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as gc from '../public/assets/js/simulations/gas-metering-gc-model.js';
import * as p from '../public/assets/js/simulations/gas-metering-pressure-model.js';
import * as t from '../public/assets/js/simulations/gas-metering-temperature-model.js';
const act=(s,type,extra={})=>{const r=gc.transition(s,{type,...extra});assert.equal(r.error,null);return r.state;};
const start=s=>act(s,'start'), advance=s=>act(s,'advance');
const finish=s=>advance(advance(s));
const completed=()=>finish(start(gc.initialState()));
const copy=x=>JSON.parse(JSON.stringify(x));
test('GC: startup has no sample, result, delivery, selected value or age',()=>{
 const s=gc.initialState();assert.equal(s.process.profileId,'A');assert.equal(s.tick,0);assert.equal(s.analysisState,'IDLE');assert.equal(s.nextAnalysisId,1);
 for(const key of ['capturedSample','completed','delivered'])assert.equal(s[key],null);
 assert.deepEqual(s.selected,{quality:'UNAVAILABLE',composition:null,source:'GC'});assert.equal(gc.sampleAge(s.selected,0),null);
});
for(const [id,composition] of [['A',{methane:80,ethane:10,nitrogen:10}],['B',{methane:60,ethane:20,nitrogen:20}]]){
 test(`GC: educational profile ${id} exact structure and basis`,()=>{
  assert.deepEqual(gc.educationalProfile(id),{profileId:id,basis:'mole-percent',composition});assert.equal(gc.validComposition(composition,'mole-percent'),true);
 });
}
test('GC: structural validator rejects malformed composition without normalization',()=>{
 const a=gc.educationalProfile('A').composition;
 for(const c of [null,undefined,[],{}, {methane:80,ethane:20}, {...a,oxygen:0},{...a,methane:NaN},{...a,methane:Infinity},{...a,methane:'80'},{...a,methane:80.5},{...a,methane:-1},{...a,methane:101},{...a,methane:79}])assert.equal(gc.validComposition(c,gc.BASIS),false);
 assert.equal(gc.validComposition(a,'mass-percent'),false);assert.equal(gc.educationalProfile('C'),null);
});
test('GC: profile selection changes only modeled composition',()=>{
 const s=start(gc.initialState()),next=act(s,'profile',{profileId:'B'});
 for(const key of Object.keys(s).filter(k=>k!=='process'))assert.equal(next[key],s[key]);assert.equal(next.process.profileId,'B');
 const bad=gc.transition(s,{type:'profile',profileId:'C'});assert.equal(bad.state,s);assert.ok(bad.error);
});
test('GC: start captures deep immutable sample and sequential ID',()=>{
 const s=gc.initialState(),n=start(s);assert.equal(n.analysisState,'ANALYZING');assert.equal(n.nextAnalysisId,2);
 assert.deepEqual(n.capturedSample,{...gc.educationalProfile('A'),analysisId:1,sampleCapturedAt:0,analysisStartedAt:0});
 assert.notEqual(n.capturedSample.composition,s.process.composition);assert.ok(Object.isFrozen(n.capturedSample));assert.ok(Object.isFrozen(n.capturedSample.composition));
 assert.throws(()=>{n.capturedSample.composition.methane=60;},TypeError);assert.equal(s.capturedSample,null);
});
test('GC: overlapping Start rejected without mutation',()=>{
 const s=start(gc.initialState()),r=gc.transition(s,{type:'start'});assert.equal(r.state,s);assert.ok(r.error);
});
test('GC: invalid or absent process rejects sample capture',()=>{
 for(const process of [null,{}, {...gc.educationalProfile('A'),basis:'wrong'},{...gc.educationalProfile('A'),composition:{methane:100}}]){
  const s={...gc.initialState(),process};const r=gc.transition(s,{type:'start'});assert.equal(r.state,s);assert.ok(r.error);
 }
});
test('GC case A: first step analyzing; second completes and delivers with age two',()=>{
 let s=start(gc.initialState());s=advance(s);assert.equal(s.tick,1);assert.equal(s.analysisState,'ANALYZING');assert.equal(s.completed,null);assert.equal(s.selected.quality,'UNAVAILABLE');
 s=advance(s);assert.equal(s.tick,2);assert.equal(s.analysisState,'COMPLETE');assert.equal(s.completed.analysisId,1);
 assert.equal(s.completed.profileId,'A');assert.equal(s.completed.sampleCapturedAt,0);assert.equal(s.completed.analysisStartedAt,0);assert.equal(s.completed.analysisCompletedAt,2);
 assert.equal(s.delivered.deliveredAt,2);assert.equal(s.selected.source,'GC');assert.deepEqual(s.selected.composition,gc.educationalProfile('A').composition);assert.equal(gc.sampleAge(s.selected,s.tick),2);
});
test('GC case B: process B never changes captured A or completion A',()=>{
 let s=start(gc.initialState());const sample=s.capturedSample;s=act(s,'profile',{profileId:'B'});assert.equal(s.capturedSample,sample);
 s=finish(s);assert.equal(s.process.profileId,'B');for(const key of ['capturedSample','completed','delivered','selected'])assert.equal(s[key].profileId,'A');
});
test('GC case C: next B analysis retains previous A until B completes',()=>{
 let s=completed();s=act(s,'profile',{profileId:'B'});const previous=s.completed,selected=s.selected;
 s=start(s);assert.equal(s.capturedSample.profileId,'B');assert.equal(s.capturedSample.analysisId,2);assert.equal(s.completed,previous);assert.equal(s.selected,selected);
 s=advance(s);assert.equal(s.completed,previous);s=advance(s);assert.equal(s.completed.profileId,'B');assert.equal(s.selected.profileId,'B');assert.equal(s.selected.analysisId,2);assert.equal(s.selected.sampleCapturedAt,2);assert.equal(s.selected.analysisCompletedAt,4);
});
test('GC: post-completion advancement changes only tick and derived age',()=>{
 const s=completed(),n=advance(s);assert.equal(n.tick,3);assert.equal(gc.sampleAge(n.selected,3),3);
 for(const key of Object.keys(s).filter(k=>k!=='tick'))assert.equal(n[key],s[key]);assert.equal(n.selected.quality,'GOOD');
});
test('GC: reset from every lifecycle state restores fresh initial state',()=>{
 for(const s of [gc.initialState(),start(gc.initialState()),completed()])assert.deepEqual(act(s,'reset'),gc.initialState());
 assert.notEqual(gc.initialState(),gc.initialState());
});
test('GC: deterministic replay and advancing before capture',()=>{
 const replay=()=>{let s=advance(gc.initialState());s=start(s);s=act(s,'profile',{profileId:'B'});return finish(s);};
 assert.deepEqual(replay(),replay());assert.equal(replay().completed.sampleCapturedAt,1);assert.equal(replay().completed.analysisCompletedAt,3);
});
test('GC: captured, completed, delivered and selected compositions are separate frozen copies',()=>{
 const s=completed();const records=[s.process,s.capturedSample,s.completed,s.delivered,s.selected];
 assert.equal(new Set(records.map(x=>x.composition)).size,5);for(const r of records)assert.ok(Object.isFrozen(r.composition));
});
test('GC: completion derives from supplied snapshot only',()=>{
 const s=start(act(gc.initialState(),'profile',{profileId:'B'}));assert.equal(gc.completeSample(s.capturedSample,2).profileId,'B');assert.equal(gc.completeSample(null,2).quality,'UNAVAILABLE');
});
test('GC: delivery and FC selection use supplied records and preserve provenance',()=>{
 const r=completed().completed;const delivered=gc.deliverResult(r,2);assert.deepEqual(delivered,{...r,deliveredAt:2});
 const selected=gc.selectComposition(delivered,7);assert.deepEqual(selected,{...delivered,source:'GC'});assert.equal(gc.sampleAge(selected,7),7);
});
test('GC: malformed completed provenance cannot be delivered',()=>{
 const r=completed().completed;
 for(const change of [{analysisId:0},{analysisId:1.5},{profileId:'C'},{sampleCapturedAt:-1},{sampleCapturedAt:1},{analysisStartedAt:'0'},{analysisCompletedAt:1},{analysisCompletedAt:Infinity},{basis:'wrong'},{quality:'INVALID'},{composition:{methane:100}}]){
  const bad={...r,...change};assert.equal(gc.validCompleted(bad),false);assert.equal(gc.deliverResult(bad,2).quality,'INVALID');
 }
 assert.equal(gc.deliverResult(r,3).quality,'INVALID');
});
test('GC: malformed delivery or future record cannot be selected',()=>{
 const r=completed().delivered;
 for(const [record,now] of [[{...r,deliveredAt:3},3],[r,1],[{...r,analysisId:'1'},2],[r,NaN]])assert.equal(gc.selectComposition(record,now).quality,'INVALID');
 assert.equal(gc.sampleAge(r,1),null);
});
test('GC: invalid and unavailable new delivery never falls back',()=>{
 const valid=completed().delivered;assert.equal(gc.selectComposition(valid,2).quality,'GOOD');
 for(const bad of [null,undefined,{quality:'UNAVAILABLE'}, {...valid,quality:'INVALID'},{}]){
  const selected=gc.selectComposition(bad,2);assert.equal(selected.composition,null);assert.notEqual(selected.quality,'GOOD');
 }
 assert.equal(gc.deliverResult(null,2).quality,'UNAVAILABLE');
});
test('GC: malformed captured composition completes as invalid without older-result fallback',()=>{
 const old=completed(),s=start(old);const corrupt={...s,capturedSample:{...s.capturedSample,composition:{methane:99}}};
 const n=finish(corrupt);assert.equal(n.analysisState,'COMPLETE');assert.equal(n.completed.quality,'INVALID');assert.equal(n.selected.composition,null);assert.equal(n.selected.quality,'INVALID');
});
test('GC: timing and ID overflow rejected without mutation',()=>{
 for(const s of [{...gc.initialState(),tick:-1},{...gc.initialState(),tick:Number.MAX_SAFE_INTEGER}]){
  assert.equal(gc.transition(s,{type:'advance'}).state,s);assert.equal(gc.transition(s,{type:'start'}).state,s);
 }
 const s={...gc.initialState(),nextAnalysisId:Number.MAX_SAFE_INTEGER};assert.equal(gc.transition(s,{type:'start'}).state,s);
});

// Both actual controllers execute against one minimal event/DOM fixture. This checks
// orchestration and state isolation, not rendered layout or browser accessibility.
test('GC controllers: bidirectional isolation, distinct records and shared reset',()=>{
 const elements=new Map();
 const el=id=>{
  if(!elements.has(id))elements.set(id,{hidden:true,value:'',checked:false,textContent:'',disabled:false,dataset:{},attrs:{},events:{},
   setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
   addEventListener(k,fn){(this.events[k]??=[]).push(fn);},querySelectorAll(){return [];}});
  return elements.get(id);
 };
 const selectors=['pressure','temperature'].map(name=>{const e=el(`selector-${name}`);e.dataset.lesson=name;e.attrs['aria-controls']=`gm-${name}-lesson`;return e;});
 const document={getElementById:el,querySelector:()=>el('equipment'),querySelectorAll:s=>s==='[data-lesson]'?selectors:s==='[data-detail]'?[]:[el(s)]};
 const run=(file,bindings)=>runInNewContext(readFileSync(new URL(`../public/assets/js/simulations/${file}`,import.meta.url),'utf8').replace(/^import .*;$/gm,''),{document,...bindings});
 run('gas-metering-skid-page.js',{...p,initialTemperature:t.initialState,temperatureTransition:t.transition,temperatureChain:t.measurementChain,displayTemperature:t.displayTemperature});
 run('gas-metering-gc-page.js',gc);
 const fire=(id,event)=>{for(const fn of el(id).events[event]||[])fn({preventDefault(){}});};
 const setProfile=id=>{el('gm-gc-profile').value=id;fire('gm-gc-profile','change');};
 const ptSnapshot=()=>copy([...elements.entries()].filter(([id])=>!id.startsWith('gm-gc-')).map(([id,e])=>[id,e.textContent,e.value,e.checked,e.hidden,e.attrs]));
 const gcSnapshot=()=>copy([...elements.entries()].filter(([id])=>id.startsWith('gm-gc-')).map(([id,e])=>[id,e.textContent,e.value,e.disabled]));
 el('gm-pressure-entry').value='bad';fire('gm-pressure-form','submit');el('gm-temperature-bias').checked=true;fire('gm-temperature-bias','change');fire('selector-temperature','click');
 const beforePT=ptSnapshot();fire('gm-gc-start','click');setProfile('B');fire('gm-gc-advance','click');fire('gm-gc-advance','click');assert.deepEqual(ptSnapshot(),beforePT);
 assert.equal(el('gm-gc-result-identity').textContent,'Analysis #1 — Profile A');
 fire('gm-gc-start','click');assert.match(el('gm-gc-current').textContent,/ANALYZING.*Profile B/);assert.equal(el('gm-gc-input-identity').textContent,'Analysis #1 — Profile A');
 const beforeGC=gcSnapshot();el('gm-pressure-entry').value='250';fire('gm-pressure-form','submit');el('gm-pressure-bias').checked=true;fire('gm-pressure-bias','change');el('gm-temperature-entry').value='25';fire('gm-temperature-form','submit');el('gm-temperature-bias').checked=false;fire('gm-temperature-bias','change');fire('selector-pressure','click');assert.deepEqual(gcSnapshot(),beforeGC);
 assert.equal(el('gm-pressure-reset').events.click.length,2);fire('gm-pressure-reset','click');
 assert.equal(el('gm-gc-profile').value,'A');assert.equal(el('gm-gc-tick').textContent,'Simulation step: 0');assert.match(el('gm-gc-current').textContent,/IDLE/);assert.equal(el('gm-gc-result-identity').textContent,'No GC result yet');assert.equal(el('gm-gc-input-age').textContent,'Sample age: —');
 assert.equal(el('gm-pressure-entry').value,'300');assert.equal(el('gm-temperature-entry').value,'30');assert.equal(el('gm-pressure-bias').checked,false);assert.equal(el('gm-temperature-bias').checked,false);
});
