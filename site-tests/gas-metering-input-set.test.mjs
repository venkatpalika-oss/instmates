import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as p from '../public/assets/js/simulations/gas-metering-pressure-model.js';
import * as t from '../public/assets/js/simulations/gas-metering-temperature-model.js';
import * as g from '../public/assets/js/simulations/gas-metering-gc-model.js';
import {assembleInputSet} from '../public/assets/js/simulations/gas-metering-input-set-model.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const provenance=source=>({type:'CURRENT_EDUCATIONAL_OBSERVATION',path:`${source} observation → transmission → FC selection`});
const gcRecord=s=>({...s.selected,measurementType:'GAS_COMPOSITION',basis:'mole-percent',provenance:{type:'SAMPLED_DELAYED_EDUCATIONAL_OBSERVATION'},timeDomain:'GC_LOCAL_SIMULATION_STEPS'});
const step=(s,type)=>g.transition(s,{type}).state;
const completed=()=>step(step(step(g.initialState(),'start'),'advance'),'advance');
const inputs=(state=g.initialState(),bias=false)=>({
 pressure:{...p.measurementChain({...p.initialState(),biasEnabled:bias}).selected,measurementType:'PRESSURE',provenance:provenance('PT')},
 temperature:{...t.measurementChain({...t.initialState(),biasEnabled:bias}).selected,measurementType:'TEMPERATURE',provenance:provenance('TT')},
 gc:gcRecord(state),gcTick:state.tick,teachingContext:{ptBiasEnabled:bias,ttBiasEnabled:bias}
});
const assemble=(i=inputs(),id=1)=>assembleInputSet(id,i);
test('input set: startup is structurally valid but incomplete, without invented GC',()=>{
 const s=assemble();assert.equal(s.setId,1);assert.equal(s.completeness,'INCOMPLETE');assert.equal(s.recordIntegrity,'STRUCTURALLY_VALID');
 assert.deepEqual(s.missingRecords,['GC']);assert.deepEqual(s.invalidRecords,[]);assert.equal(s.records.gc.composition,null);
 for(const key of ['analysisId','profileId','sampleCapturedAt','ageAtAssemblySteps','ageEvaluatedAtGcTick'])assert.ok(!Object.hasOwn(s.records.gc,key));
});
test('input set: complete first analysis retains exact independent provenance and age',()=>{
 const i=inputs(completed()),s=assemble(i);assert.equal(s.completeness,'COMPLETE');assert.equal(s.recordIntegrity,'STRUCTURALLY_VALID');
 assert.deepEqual(s.records.pressure,i.pressure);assert.deepEqual(s.records.temperature,i.temperature);
 assert.deepEqual(s.records.gc,{...i.gc,ageAtAssemblySteps:2,ageEvaluatedAtGcTick:2});
 assert.ok(!Object.hasOwn(s.records.temperature,'basis'));assert.ok(!Object.hasOwn(s.records.pressure,'timestamp'));
});
test('input set: eligibility and alignment never follow completeness, quality, age or bias',()=>{
 let old=completed();for(let n=0;n<20;n++)old=step(old,'advance');
 for(const i of [inputs(),inputs(completed()),inputs(completed(),true),inputs(old),{}]){
  const s=assemble(i);assert.equal(s.temporalAlignment,'NOT_ESTABLISHED');assert.equal(s.calculationEligibility,'NOT_EVALUATED');assert.ok(!Object.hasOwn(s,'eligible'));
 }
});
test('input set: biased records preserve GOOD and captured bias flags including upper derived values',()=>{
 const i=inputs(completed(),true);i.pressure.valuePa=420000;i.temperature.valueC=42;
 const s=assemble(i);assert.equal(s.completeness,'COMPLETE');assert.equal(s.recordIntegrity,'STRUCTURALLY_VALID');
 assert.equal(s.records.pressure.quality,'GOOD');assert.equal(s.records.temperature.quality,'GOOD');
 assert.deepEqual(s.teachingContext,{ptBiasEnabled:true,ttBiasEnabled:true});assert.deepEqual(assemble().teachingContext,{ptBiasEnabled:false,ttBiasEnabled:false});
});
for(const [key,source] of [['pressure','PT'],['temperature','TT'],['gc','GC']]){
 test(`input set: ${source} unavailable is distinct from invalid and never zero-substituted`,()=>{
  for(const absent of [undefined,null,{...inputs(completed())[key],quality:'UNAVAILABLE'}]){
   const i=inputs(completed());i[key]=absent;const s=assemble(i);assert.equal(s.completeness,'INCOMPLETE');assert.equal(s.recordIntegrity,'STRUCTURALLY_VALID');assert.deepEqual(s.missingRecords,[source]);
   assert.equal(s.records[key][key==='pressure'?'valuePa':key==='temperature'?'valueC':'composition'],null);
  }
  const i=inputs(completed());i[key].quality='INVALID';const s=assemble(i);assert.equal(s.recordIntegrity,'INVALID_RECORD_PRESENT');assert.deepEqual(s.invalidRecords,[source]);assert.deepEqual(s.missingRecords,[]);
 });
}
const mutations=[
 ['pressure','unit','kPa'],['pressure','basis','gauge'],['pressure','source','TT'],['pressure','valuePa',NaN],['pressure','valuePa',0],['pressure','valuePa','300000'],['pressure','measurementType','TEMPERATURE'],['pressure','provenance',{}],
 ['temperature','unit','K'],['temperature','source','PT'],['temperature','valueC',Infinity],['temperature','valueC',0],['temperature','basis','absolute'],['temperature','provenance',{}],
 ['gc','source','PT'],['gc','basis','mass-percent'],['gc','sampleCapturedAt',1],['gc','analysisCompletedAt',3],['gc','deliveredAt',3],['gc','analysisId',0],['gc','timeDomain','seconds'],['gc','provenance',{}],['gc','composition',{methane:100}],['gc','profileId','C']
];
for(const [key,field,value] of mutations)test(`input set: malformed GOOD ${key}.${field} fails closed (${String(value)})`,()=>{
 const i=inputs(completed());i[key]={...i[key],[field]:value};const s=assemble(i);
 assert.equal(s.completeness,'INCOMPLETE');assert.equal(s.recordIntegrity,'INVALID_RECORD_PRESENT');assert.equal(s.records[key].quality,'INVALID');
 assert.equal(s.calculationEligibility,'NOT_EVALUATED');
});
test('input set: malformed objects and impossible age fail closed',()=>{
 for(const bad of [{},[],42,'GOOD'])for(const key of ['pressure','temperature','gc']){const i=inputs(completed());i[key]=bad;assert.equal(assemble(i).records[key].quality,'INVALID');}
 for(const gcTick of [-1,1,NaN,2.5,undefined])assert.equal(assemble({...inputs(completed()),gcTick}).records.gc.quality,'INVALID');
});
test('input set: absence cannot substitute process composition or old result',()=>{
 const i=inputs();i.process=g.educationalProfile('A');i.previous=completed().selected;const s=assemble(i);assert.equal(s.records.gc.composition,null);
 assert.deepEqual(assemble({}).missingRecords,['PT','TT','GC']);assert.equal(assemble({}).teachingContext.ptBiasEnabled,null);
});
test('input set: every nested snapshot detached/frozen; live updates cannot rewrite it',()=>{
 const i=clone(inputs(completed())),s=assemble(i),before=clone(s);
 i.pressure.valuePa=250000;i.pressure.provenance.path='changed';i.temperature.valueC=25;i.gc.composition.methane=0;i.gcTick=10;i.teachingContext.ptBiasEnabled=true;
 assert.deepEqual(s,before);
 const check=x=>{if(x&&typeof x==='object'){assert.ok(Object.isFrozen(x));Object.values(x).forEach(check);}};check(s);
 assert.throws(()=>{s.records.gc.composition.methane=0;},TypeError);assert.throws(()=>s.missingRecords.push('PT'),TypeError);
});
test('input set: second GC analysis and age do not rewrite earlier captured provenance',()=>{
 let state=completed();const s1=assemble(inputs(state));state=step(state,'advance');assert.equal(s1.records.gc.ageAtAssemblySteps,2);
 state=g.transition(state,{type:'profile',profileId:'B'}).state;state=step(step(step(state,'start'),'advance'),'advance');
 const s2=assemble(inputs(state),2);assert.equal(s1.records.gc.analysisId,1);assert.equal(s1.records.gc.profileId,'A');assert.equal(s2.records.gc.analysisId,2);assert.equal(s2.records.gc.profileId,'B');
});
test('input set: deterministic explicit IDs; no engineering output or reference context',()=>{
 const i=inputs(completed());assert.deepEqual(assemble(i),assemble(i));const s2=assemble(i,2);assert.deepEqual({...s2,setId:1},assemble(i));
 for(const id of [0,-1,1.5,NaN,Infinity,'1'])assert.throws(()=>assemble(i,id),TypeError);
 assert.deepEqual(Object.keys(assemble(i)),['schemaVersion','setId','records','teachingContext','completeness','recordIntegrity','missingRecords','invalidRecords','temporalAlignment','calculationEligibility']);
});
// Execute the real controllers with a minimal event-capable DOM; no copied state machine.
function controllers(providers=true){
 const elements=new Map();
 const element=id=>{
  if(!elements.has(id))elements.set(id,{id,hidden:true,value:'',checked:false,textContent:'',dataset:{},attrs:{},events:{},
   setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},querySelectorAll(){return [];},
   addEventListener(k,fn){(this.events[k]??=[]).push(fn);},dispatchEvent(event){for(const fn of this.events[event.type]||[])fn(event);}});
  return elements.get(id);
 };
 const selectors=['pressure','temperature'].map(name=>{const e=element(`selector-${name}`);e.dataset.lesson=name;e.attrs['aria-controls']=`gm-${name}-lesson`;return e;});
 const document={getElementById:element,querySelector:()=>element('equipment'),querySelectorAll:s=>s==='[data-lesson]'?selectors:s==='[data-detail]'?[]:[element(s)]};
 const run=(file,imports)=>runInNewContext(readFileSync(new URL(`../public/assets/js/simulations/${file}.js`,import.meta.url),'utf8').replace(/^import .*;$/gm,''),{document,...imports});
 if(providers){
  run('gas-metering-skid-page',{...p,initialTemperature:t.initialState,temperatureTransition:t.transition,temperatureChain:t.measurementChain,displayTemperature:t.displayTemperature});
  run('gas-metering-gc-page',g);
 }
 run('gas-metering-input-set-page',{assembleInputSet,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
 const fire=(id,type='click',detail)=>element(id).dispatchEvent({type,detail,preventDefault(){}});
 const provider=(id,type)=>{let result;fire(id,type,{receive:v=>{result=v;}});return result;};
 const read=()=>({m:provider('gm-pressure-form','gm-measurement-snapshot'),g:provider('gm-gc-controls','gm-gc-snapshot')});
 const live=()=>JSON.stringify([...elements].filter(([id])=>!id.startsWith('gm-input-set-')).map(([id,e])=>({id,value:e.value,checked:e.checked,text:e.textContent,attrs:e.attrs,hidden:e.hidden})));
 return {element,fire,read,live};
}
test('snapshot providers: detached, read-only and preserve drafts/errors/lessons/lifecycle/tick',()=>{
 const h=controllers();
 for(const name of ['pressure','temperature']){h.element(`gm-${name}-bias`).checked=true;h.fire(`gm-${name}-bias`,'change');h.element(`gm-${name}-entry`).value='bad';h.fire(`gm-${name}-form`,'submit');}
 h.fire('selector-temperature');h.fire('gm-gc-start');h.fire('gm-gc-advance');h.fire('gm-gc-advance');h.fire('gm-gc-start');
 const before=h.live(),a=h.read(),b=h.read();assert.equal(h.live(),before);assert.deepEqual(clone(a),clone(b));
 assert.notEqual(a.m,b.m);assert.notEqual(a.m.pressure,b.m.pressure);assert.notEqual(a.g.gc.composition,b.g.gc.composition);
 assert.equal(a.g.gcTick,2);assert.equal(a.g.gc.analysisId,1);assert.equal(a.m.pressure.valuePa,320000);assert.equal(a.m.temperature.valueC,32);
 assert.ok(Object.isFrozen(a.g.gc.composition));assert.ok(Object.isFrozen(a.m.teachingContext));
 h.fire('gm-input-set-assemble');assert.equal(h.live(),before);
 assert.match(h.element('gm-input-set-bias').textContent,/PT teaching bias: ON.*TT teaching bias: ON/);
});
test('input-set controller: explicit assembly, unchanged snapshots, reset-local IDs and absent providers',()=>{
 const h=controllers();assert.equal(h.element('gm-input-set-records').hidden,true);
 h.fire('gm-input-set-assemble');assert.match(h.element('gm-input-set-status').textContent,/Set #1 — INCOMPLETE/);assert.equal(h.element('gm-input-set-integrity').textContent,'STRUCTURALLY_VALID');
 const before=h.element('gm-input-set-gc').textContent;h.fire('gm-gc-start');h.fire('gm-gc-advance');h.fire('gm-gc-advance');assert.equal(h.element('gm-input-set-gc').textContent,before);
 h.fire('gm-input-set-assemble');assert.match(h.element('gm-input-set-status').textContent,/Set #2 — COMPLETE/);
 const age=h.element('gm-input-set-age').textContent;h.fire('gm-gc-advance');assert.equal(h.element('gm-input-set-age').textContent,age);
 h.fire('gm-pressure-reset');assert.equal(h.element('gm-input-set-status').textContent,'No input set assembled');assert.equal(h.element('gm-input-set-records').hidden,true);
 h.fire('gm-input-set-assemble');assert.match(h.element('gm-input-set-status').textContent,/Set #1 — INCOMPLETE/);
 const absent=controllers(false);absent.fire('gm-input-set-assemble');assert.match(absent.element('gm-input-set-issues').textContent,/Missing: PT, TT, GC/);assert.doesNotMatch(absent.element('gm-input-set-pressure').textContent,/\b0\b/);
});
