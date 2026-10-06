import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {calculateCapturedMolarMass as calculate, formatDecimalHalfUp} from '../public/assets/js/simulations/gas-metering-molar-mass-model.js';
import * as gc from '../public/assets/js/simulations/gas-metering-gc-model.js';
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const clone=x=>JSON.parse(JSON.stringify(x));
const identity={lessonRunOrdinal:1,calculationOrdinal:1};
const record=(patch={})=>freeze({measurementType:'GAS_COMPOSITION',source:'GC',quality:'GOOD',basis:'mole-percent',
 analysisId:1,profileId:'A',composition:{methane:80,ethane:10,nitrogen:10},
 sampleCapturedAt:0,analysisStartedAt:0,analysisCompletedAt:2,deliveredAt:2,
 provenance:{type:'SAMPLED_DELAYED_EDUCATIONAL_OBSERVATION'},timeDomain:'GC_LOCAL_SIMULATION_STEPS',...patch});
const good=(r=record(),id=identity)=>calculate(r,id);
const deepFrozen=x=>{if(x&&typeof x==='object'){assert.ok(Object.isFrozen(x));Object.values(x).forEach(deepFrozen);}};
// Independent literal oracles approved by the Product Owner; never computed from production exports.
for(const fixture of [
 {name:'A',composition:{methane:80,ethane:10,nitrogen:10},expected:18.642240,display:'18.642',contributions:[12.834000,3.006900,2.801340]},
 {name:'B',composition:{methane:60,ethane:20,nitrogen:20},expected:21.241980,display:'21.242',contributions:[9.625500,6.013800,5.602680]}
])test(`molar mass: literal independent Profile ${fixture.name} fixture and contributions`,()=>{
 const out=good(record({profileId:fixture.name,composition:fixture.composition}));assert.equal(out.status,'CALCULATED');
 assert.ok(Math.abs(out.value-fixture.expected)<=1e-9);assert.equal(out.displayValue,fixture.display);assert.equal(out.unit,'kg/kmol');
 Object.values(out.contributions).forEach((v,i)=>assert.ok(Math.abs(v-fixture.contributions[i])<=1e-9));
});
test('molar mass: explicit decimal halfway up, below/above ties and carry',()=>{
 for(const [input,expected] of [['16.0425','16.043'],['30.0685','30.069'],['1.2345','1.235'],['1.234499999','1.234'],['1.234500001','1.235'],['9.9995','10.000'],['0.0005','0.001'],['0','0.000'],['5e-4','0.001']])assert.equal(formatDecimalHalfUp(input),expected);
 for(const input of ['-1','NaN','Infinity','text'])assert.throws(()=>formatDecimalHalfUp(input),TypeError);
 // Pure methane yields an exact halfway result through the actual calculation path.
 const pure=good(record({composition:{methane:100,ethane:0,nitrogen:0}}));assert.equal(pure.value,16.0425);assert.equal(pure.displayValue,'16.043');
});
test('molar mass: finite fractional mole percentages accepted without changing GC producer',()=>{
 const out=good(record({composition:{methane:79.5,ethane:10.25,nitrogen:10.25}}));assert.equal(out.status,'CALCULATED');assert.ok(Math.abs(out.value-18.7072335)<=1e-9);
});
const badPatches=[
 ['type',{measurementType:'PRESSURE'}],['source',{source:'PT'}],['basis',{basis:'mass-percent'}],['quality',{quality:'INVALID'}],
 ['missing provenance',{provenance:{}}],['domain',{timeDomain:'seconds'}],['analysis ID',{analysisId:0}],['profile',{profileId:'C'}],
 ['capture/start',{sampleCapturedAt:1}],['duration',{analysisCompletedAt:3}],['delivery',{deliveredAt:3}],['negative time',{sampleCapturedAt:-1}],
 ['fractional time',{analysisStartedAt:0.5}],['missing component',{composition:{methane:90,ethane:10}}],
 ['extra component',{composition:{methane:80,ethane:10,nitrogen:10,oxygen:0}}],['array',{composition:[80,10,10]}],
 ['null',{composition:null}],['wrong total',{composition:{methane:80,ethane:10,nitrogen:9}}],
 ...['80',NaN,Infinity,-1,101,undefined,null].map(value=>[`bad value ${String(value)}`,{composition:{methane:value,ethane:10,nitrogen:10}}])
];
for(const [name,patch] of badPatches)test(`molar mass: rejects ${name} without value or substitution`,()=>{
 const out=good(record(patch));assert.equal(out.status,'REJECTED');assert.ok(out.reason);assert.ok(!Object.hasOwn(out,'value'));assert.ok(!Object.hasOwn(out,'displayValue'));deepFrozen(out);
});
test('molar mass: unavailable, mutable and malformed records fail closed',()=>{
 for(const input of [undefined,null,record({quality:'UNAVAILABLE'}),{},[],42,'GOOD',clone(record()),Object.freeze({...record(),composition:{methane:80,ethane:10,nitrogen:10}})])assert.equal(calculate(input,identity).status,'REJECTED');
 for(const id of [{}, {lessonRunOrdinal:0,calculationOrdinal:1},{lessonRunOrdinal:1,calculationOrdinal:Infinity}])assert.equal(good(record(),id).reason,'INVALID_CALCULATION_IDENTITY');
});
test('molar mass: deterministic, detached, deeply immutable and complete provenance',()=>{
 const input=record(),out=good(input);assert.deepEqual(out,good(input));deepFrozen(out);assert.notEqual(out.source.composition,input.composition);
 assert.equal(out.property,'MOLAR_MASS');assert.equal(out.identityScope,'PAGE_SESSION');assert.equal(out.calculationId,'run-1:calculation-1');
 assert.deepEqual(out.method,{id:'INSTMATES_EDUCATIONAL_MOLAR_MASS',version:1});
 assert.deepEqual(out.constants.values,{methane:16.0425,ethane:30.0690,nitrogen:28.0134});
 assert.equal(out.constants.id,'INSTMATES-MOLAR-MASS-CONSTANTS');assert.equal(out.constants.version,1);
 assert.equal(out.constants.sourceIdentity,'NIST Chemistry WebBook / SRD 69');
 assert.equal(out.applicability,'CAPTURED_EDUCATIONAL_COMPOSITION_ONLY');
 assert.deepEqual(JSON.parse(out.calculationInputIdentity.canonicalCapturedRecord),out.source);
 assert.throws(()=>{out.source.composition.methane=0;},TypeError);
 const saved=clone(out);good(record({analysisId:2,profileId:'B',composition:{methane:60,ethane:20,nitrogen:20}}));assert.deepEqual(out,saved);
 const nextRun=good(input,{lessonRunOrdinal:2,calculationOrdinal:1});assert.notEqual(nextRun.calculationId,out.calculationId);assert.notDeepEqual(nextRun.calculationInputIdentity,out.calculationInputIdentity);
});
test('molar mass: consumes real frozen GC lifecycle record and has no measurement-set dependency',()=>{
 let state=gc.initialState();for(const type of ['start','advance','advance'])state=gc.transition(state,{type}).state;
 const out=good(record({...state.selected}));assert.equal(out.displayValue,'18.642');
 const before=clone(out);state=gc.transition(state,{type:'profile',profileId:'B'}).state;
 for(const type of ['start','advance','advance'])state=gc.transition(state,{type}).state;
 assert.equal(good(record({...state.selected})).displayValue,'21.242');assert.deepEqual(out,before);
 const source=readFileSync(new URL('../public/assets/js/simulations/gas-metering-molar-mass-model.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\b(?:document|window|fetch|Date|localStorage|sessionStorage)\b|^import /m);
});
function controller(){
 const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'—',hidden:true,events:{},addEventListener(type,fn){(this.events[type]??=[]).push(fn);},dispatchEvent(event){for(const fn of this.events[event.type]||[])fn(event);}});return elements.get(id);};
 let snapshot={gc:record()},requests=0;
 el('gm-gc-controls').addEventListener('gm-gc-snapshot',e=>{requests++;e.detail.receive(snapshot);});
 const source=readFileSync(new URL('../public/assets/js/simulations/gas-metering-molar-mass-page.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
 runInNewContext(source,{document:{getElementById:el},calculateCapturedMolarMass:calculate,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
 return {el,click:id=>el(id).dispatchEvent({type:'click'}),set:s=>{snapshot=s;},requests:()=>requests,read:()=>Object.fromEntries([...elements].filter(([id])=>id.startsWith('gm-molar-mass-')).map(([id,e])=>[id,e.textContent]))};
}
test('molar mass controller: explicit only, rejection clears stale success and reset distinguishes runs',()=>{
 const h=controller();assert.equal(h.requests(),0);h.click('gm-molar-mass-calculate');assert.equal(h.el('gm-molar-mass-value').textContent,'18.642 kg/kmol');
 const saved=h.read();h.set({gc:record({analysisId:2,profileId:'B',composition:{methane:60,ethane:20,nitrogen:20}})});
 for(const id of ['gm-gc-advance','gm-gc-start','gm-gc-profile','gm-pressure-form','gm-temperature-form','gm-input-set-assemble'])h.click(id);
 assert.deepEqual(h.read(),saved);assert.equal(h.requests(),1);
 h.click('gm-molar-mass-calculate');assert.equal(h.el('gm-molar-mass-value').textContent,'21.242 kg/kmol');
 h.set({gc:record({source:'PT'})});h.click('gm-molar-mass-calculate');assert.match(h.el('gm-molar-mass-status').textContent,/INVALID_GC_METADATA/);
 for(const id of ['value','source','identity','provenance'])assert.equal(h.el(`gm-molar-mass-${id}`).textContent,'—');
 h.click('gm-pressure-reset');assert.equal(h.el('gm-molar-mass-status').textContent,'No calculation yet');
 h.set({gc:record()});h.click('gm-molar-mass-calculate');assert.match(h.el('gm-molar-mass-identity').textContent,/run-2:calculation-1/);
 h.set(undefined);h.click('gm-molar-mass-calculate');assert.match(h.el('gm-molar-mass-status').textContent,/GC_UNAVAILABLE/);
});

test('molar mass: real four-controller integration preserves PT/TT/GC/M5 and frozen results',async()=>{
 const p=await import('../public/assets/js/simulations/gas-metering-pressure-model.js');
 const t=await import('../public/assets/js/simulations/gas-metering-temperature-model.js');
 const {assembleInputSet}=await import('../public/assets/js/simulations/gas-metering-input-set-model.js');
 const elements=new Map();const el=id=>{
  if(!elements.has(id))elements.set(id,{id,hidden:true,value:'',checked:false,textContent:'',dataset:{},attrs:{},events:{},
   setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},querySelectorAll(){return [];},
   addEventListener(k,fn){(this.events[k]??=[]).push(fn);},dispatchEvent(e){for(const fn of this.events[e.type]||[])fn(e);}});
  return elements.get(id);
 };
 const selectors=['pressure','temperature'].map(name=>{const e=el(`selector-${name}`);e.dataset.lesson=name;e.attrs['aria-controls']=`gm-${name}-lesson`;return e;});
 const document={getElementById:el,querySelector:()=>el('equipment'),querySelectorAll:s=>s==='[data-lesson]'?selectors:s==='[data-detail]'?[]:[el(s)]};
 const CustomEvent=class{constructor(type,options){this.type=type;this.detail=options.detail;}};
 const run=(name,imports)=>runInNewContext(readFileSync(new URL(`../public/assets/js/simulations/${name}.js`,import.meta.url),'utf8').replace(/^import .*;$/gm,''),{document,CustomEvent,...imports});
 run('gas-metering-skid-page',{...p,initialTemperature:t.initialState,temperatureTransition:t.transition,temperatureChain:t.measurementChain,displayTemperature:t.displayTemperature});
 run('gas-metering-gc-page',gc);run('gas-metering-input-set-page',{assembleInputSet});run('gas-metering-molar-mass-page',{calculateCapturedMolarMass:calculate});
 const fire=(id,type='click')=>el(id).dispatchEvent({type,preventDefault(){}});
 const snapshot=(id,type)=>{let value;el(id).dispatchEvent({type,detail:{receive:x=>{value=x;}}});return value;};
 const gas=()=>snapshot('gm-gc-controls','gm-gc-snapshot');
 const measurements=()=>snapshot('gm-pressure-form','gm-measurement-snapshot');
 const textWith=prefix=>JSON.stringify([...elements].filter(([id])=>id.startsWith(prefix)).map(([id,e])=>[id,e.textContent,e.hidden]));
 fire('gm-molar-mass-calculate');assert.match(el('gm-molar-mass-status').textContent,/GC_UNAVAILABLE/);
 for(const id of ['gm-gc-start','gm-gc-advance','gm-gc-advance'])fire(id);
 fire('gm-input-set-assemble');const m5=textWith('gm-input-set-'),g1=clone(gas()),m1=clone(measurements());
 fire('gm-molar-mass-calculate');assert.equal(el('gm-molar-mass-value').textContent,'18.642 kg/kmol');
 assert.deepEqual(clone(gas()),g1);assert.deepEqual(clone(measurements()),m1);assert.equal(textWith('gm-input-set-'),m5);
 const massA=textWith('gm-molar-mass-');
 el('gm-pressure-entry').value='250';fire('gm-pressure-form','submit');el('gm-temperature-entry').value='25';fire('gm-temperature-form','submit');
 el('gm-gc-profile').value='B';fire('gm-gc-profile','change');fire('gm-gc-start');fire('gm-gc-advance');
 assert.equal(textWith('gm-molar-mass-'),massA);
 fire('gm-molar-mass-calculate');assert.equal(el('gm-molar-mass-value').textContent,'18.642 kg/kmol');
 const pending=textWith('gm-molar-mass-');fire('gm-gc-advance');assert.equal(textWith('gm-molar-mass-'),pending);
 fire('gm-molar-mass-calculate');assert.equal(el('gm-molar-mass-value').textContent,'21.242 kg/kmol');assert.equal(textWith('gm-input-set-'),m5);
 const set=assembleInputSet(2,{...measurements(),...gas()});assert.equal(set.temporalAlignment,'NOT_ESTABLISHED');assert.equal(set.calculationEligibility,'NOT_EVALUATED');
 fire('gm-pressure-reset');assert.equal(el('gm-molar-mass-status').textContent,'No calculation yet');assert.equal(el('gm-molar-mass-source').textContent,'—');assert.equal(gas().gcTick,0);
});
