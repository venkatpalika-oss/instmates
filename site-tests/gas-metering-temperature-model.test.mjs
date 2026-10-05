import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as t from '../public/assets/js/simulations/gas-metering-temperature-model.js';
import * as p from '../public/assets/js/simulations/gas-metering-pressure-model.js';
const tuple=s=>{const c=t.measurementChain(s);return [c.processC,c.observation.valueC,c.transmitted.valueC,c.selected.valueC];};
const apply=(s,text)=>t.transition(s,{type:'apply',text}).state;
const bias=(s,enabled=true)=>t.transition(s,{type:'bias',enabled}).state;
const good=valueC=>({valueC,quality:'GOOD',unit:'°C'});
test('temperature: initial and biased chains preserve modeled reference',()=>{
 const s=Object.freeze(t.initialState());assert.deepEqual(tuple(s),[30,30,30,30]);
 assert.deepEqual(tuple(bias(s)),[30,32,32,32]);assert.deepEqual(s,t.initialState());
});
test('temperature: changed process with bias and bias OFF',()=>{
 const s=apply(bias(t.initialState()),'25');assert.deepEqual(tuple(s),[25,27,27,27]);assert.deepEqual(tuple(bias(s,false)),[25,25,25,25]);
});
test('temperature: domain boundaries do not clamp derived observations',()=>{
 for(const n of [20,40]){const s=apply(t.initialState(),String(n));assert.deepEqual(tuple(s),[n,n,n,n]);assert.deepEqual(tuple(bias(s)),[n,n+2,n+2,n+2]);}
});
test('temperature: explicit ASCII parsing and trimmed input',()=>{
 assert.deepEqual(t.parseTemperature(' 25 '),{valueC:25});assert.deepEqual(t.parseTemperature('025'),{valueC:25});
});
test('temperature: invalid drafts preserve exact accepted state',()=>{
 const s=bias(t.initialState());
 for(const text of ['', ' ', '+25','-25','25.0','2e1','0x20','2,5','25 °C','NaN','Infinity','19','41','２５','٢٥',null,undefined,25,NaN,Infinity]){
 const result=t.transition(s,{type:'apply',text});assert.equal(result.state,s);assert.match(result.error,/Draft not applied/);assert.deepEqual(tuple(s),[30,32,32,32]);}
});
test('temperature: transmission derives from supplied observation',()=>{
 const input=Object.freeze(good(29));assert.deepEqual(t.transmitTemperature(input),input);assert.notEqual(t.transmitTemperature(input),input);
});
test('temperature: selection derives from supplied transmission with TT metadata',()=>assert.deepEqual(t.selectTemperature(good(37)),{...good(37),source:'TT'}));
test('temperature: unavailable inputs never retain last good data',()=>{
 t.selectTemperature(good(30));for(const value of [null,undefined,{quality:'UNAVAILABLE',valueC:30}])for(const fn of [t.transmitTemperature,t.selectTemperature]){assert.equal(fn(value).quality,'UNAVAILABLE');assert.equal(fn(value).valueC,null);}
});
test('temperature: malformed records fail closed',()=>{
 for(const value of [{},good(NaN),good(Infinity),good('30'),good(19),good(43),good(30.5),{...good(30),unit:'K'},{...good(30),quality:'INVALID'}]){
 for(const fn of [t.transmitTemperature,t.selectTemperature]){assert.equal(fn(value).quality,'INVALID');assert.equal(fn(value).valueC,null);}assert.equal(t.displayTemperature(value),'—');}
});
test('temperature: malformed modeled inputs and bias are invalid',()=>{
 for(const value of [null,undefined,'30',19,41,30.5,NaN,Infinity])assert.equal(t.observeTemperature(value,false).quality,'INVALID');assert.equal(t.observeTemperature(30,1).quality,'INVALID');
});
test('temperature: biased valid records remain internally GOOD with explicit units',()=>{
 const c=t.measurementChain(bias(t.initialState()));for(const r of [c.observation,c.transmitted,c.selected]){assert.equal(r.quality,'GOOD');assert.equal(r.unit,'°C');}assert.equal(t.displayTemperature(good(42)),'42 °C');assert.equal(t.displayTemperature(undefined),'—');
});
test('temperature: deterministic reset and fresh states',()=>{
 assert.deepEqual(t.transition(apply(bias(t.initialState()),'40'),{type:'reset'}),{state:t.initialState(),error:null});assert.notEqual(t.initialState(),t.initialState());
});
test('temperature and pressure: actions never mutate the other chain',()=>{
 let ts=t.initialState(),ps=p.initialState();
 for(const action of [{type:'apply',text:'25'},{type:'bias',enabled:true}]){const before=p.measurementChain(ps);ts=t.transition(ts,action).state;assert.deepEqual(p.measurementChain(ps),before);}
 for(const action of [{type:'apply',text:'250'},{type:'bias',enabled:true}]){const before=t.measurementChain(ts);ps=p.transition(ps,action).state;assert.deepEqual(t.measurementChain(ts),before);}
 assert.deepEqual(tuple(ts),[25,27,27,27]);assert.equal(p.measurementChain(ps).selected.valuePa,270000);
});

test('page controller: independent actions, preserved drafts/views and shared reset',async()=>{
 const {readFileSync}=await import('node:fs');
 const {runInNewContext}=await import('node:vm');
 const elements=new Map();
 const element=id=>{
  if(!elements.has(id)) elements.set(id,{hidden:true,value:'',checked:false,textContent:'',dataset:{},attrs:{},events:{},
   setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
   addEventListener(k,fn){this.events[k]=fn;},querySelectorAll(){return [];}});
  return elements.get(id);
 };
 const selectors=['pressure','temperature'].map(name=>{const e=element(`selector-${name}`);e.dataset.lesson=name;e.attrs['aria-controls']=`gm-${name}-lesson`;return e;});
 const document={getElementById:element,querySelector:()=>element('equipment'),querySelectorAll:selector=>{
  if(selector==='[data-lesson]')return selectors;
  if(selector==='[data-detail]')return [];
  return [element(selector)];
 }};
 let source=readFileSync(new URL('../public/assets/js/simulations/gas-metering-skid-page.js',import.meta.url),'utf8');
 source=source.replace(/^import .*;$/gm,'');
 runInNewContext(source,{document,...p,initialTemperature:t.initialState,temperatureTransition:t.transition,temperatureChain:t.measurementChain,displayTemperature:t.displayTemperature});
 const values=name=>['process','observation','transmitted','selected'].map(stage=>element(`[data-${name}="${stage}"]`).textContent);
 const submit=(name,value)=>{element(`gm-${name}-entry`).value=value;element(`gm-${name}-form`).events.submit({preventDefault(){}});};
 const toggle=(name,on)=>{element(`gm-${name}-bias`).checked=on;element(`gm-${name}-bias`).events.change();};
 const initialP=values('pressure'),initialT=values('temperature');
 submit('temperature','25');assert.deepEqual(values('pressure'),initialP);
 toggle('temperature',true);assert.deepEqual(values('pressure'),initialP);
 assert.deepEqual(values('temperature'),['25 °C','27 °C','27 °C','27 °C']);
 const changedT=values('temperature');submit('pressure','250');assert.deepEqual(values('temperature'),changedT);
 toggle('pressure',true);assert.deepEqual(values('temperature'),changedT);
 const changedP=values('pressure');assert.deepEqual(changedP,['250 kPa (absolute)','270 kPa (absolute)','270 kPa (absolute)','270 kPa (absolute)']);
 submit('pressure','bad');submit('temperature','41');
 for(const selector of selectors){selector.events.click();assert.equal(selector.attrs['aria-pressed'],'true');assert.deepEqual(values('pressure'),changedP);assert.deepEqual(values('temperature'),changedT);}
 assert.equal(element('gm-pressure-entry').value,'bad');assert.equal(element('gm-temperature-entry').value,'41');
 assert.equal(element('gm-temperature-entry').attrs['aria-invalid'],'true');
 toggle('temperature',false);assert.deepEqual(values('temperature'),['25 °C','25 °C','25 °C','25 °C']);assert.equal(element('gm-temperature-entry').value,'41');assert.equal(element('gm-temperature-entry').attrs['aria-invalid'],'true');
 element('gm-pressure-reset').events.click();assert.deepEqual(values('pressure'),initialP);assert.deepEqual(values('temperature'),initialT);
 for(const [name,value] of [['pressure','300'],['temperature','30']]){assert.equal(element(`gm-${name}-entry`).value,value);assert.equal(element(`gm-${name}-entry`).attrs['aria-invalid'],'false');assert.equal(element(`gm-${name}-error`).textContent,'');assert.equal(element(`gm-${name}-bias`).checked,false);}
 assert.equal(selectors[0].attrs['aria-pressed'],'true');assert.equal(element('gm-temperature-lesson').hidden,true);
});
