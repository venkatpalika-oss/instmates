import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,act,readings,FAULTS,CELL_TABLE,span,logicRole} from '../public/labs/oxymitter-4000/model.js';
test('linear endpoints and range change at constant oxygen',()=>{
 let s=initial();assert.equal(readings(s).ma,8.8);assert.equal(readings(s).mv,42.3);
 s=act(s,'o2',0);assert.equal(readings(s).ma,4);assert.equal(readings(s).mv,null);
 s=act(s,'o2',10);assert.equal(readings(s).ma,20);
 s=act(s,'power');s=act(s,'localSpan',25);s=act(s,'power');s=act(s,'warm');s=act(s,'o2',3);
 assert.equal(readings(s).ma,5.92);assert.equal(readings(s).mv,42.3);
 s=act(s,'o2',25);assert.equal(readings(s).ma,20);s=act(s,'o2',26);assert.equal(readings(s).ma,null);
});
test('hardware settings interlock; HART source overrides local switch',()=>{
 let s=initial();for(const [key,value] of [['localSpan',25],['mode','HART'],['fail',21.6],['loop','external']])assert.deepEqual(act(s,key,value),s);
 s=act(s,'power');s=act(s,'mode','HART');s=act(s,'localSpan',25);s=act(s,'hartSpan',40);
 assert.equal(span(s),40);assert.deepEqual(act(s,'hartSpan',41),s);assert.deepEqual(act(s,'hartSpan',0),s);
 s=act(s,'mode','LOCAL');assert.equal(span(s),25);assert.deepEqual(act(s,'hartSpan',20),s);
});
test('startup uses selected current and withholds measurement',()=>{
 for(const current of [3.5,21.6]){let s=act(initial(),'power');s=act(s,'fail',current);s=act(s,'power');assert.equal(readings(s).ma,current);assert.equal(readings(s).seen,null);assert.equal(readings(s).mv,null);s=act(s,'warm');assert.equal(readings(s).ma,8.8);}
});
test('every diagnostic preserves the fault table output and reset contract',()=>{
 for(const f of FAULTS){let s=act(initial(),'fault',f.id);assert.equal(readings(s).ma,f.critical?3.5:8.8);assert.equal(readings(s).mv,null);s=act(s,'removeCause');assert.equal(s.fault,f.self?0:f.id);s=act(s,'power');s=act(s,'power');s=act(s,'warm');assert.equal(s.fault,0);}
 let s=act(initial(),'fault',1);s=act(s,'power');s=act(s,'power');s=act(s,'warm');assert.equal(s.fault,1,'unremoved fault survives power cycle');
});
function start(output='track',outcome='valid'){let s=act(initial(),'calOutput',output);s=act(s,'outcome',outcome);s=act(s,'cal');assert.equal(s.cal,'armed');s=act(s,'cal');assert.equal(s.cal,'ready1');return s;}
function finish(s){s=act(s,'applyGas');s=act(s,'cal');assert.equal(s.cal,'sample1');s=act(s,'advance');s=act(s,'applyGas');s=act(s,'cal');assert.equal(s.cal,'sample2');s=act(s,'advance');assert.equal(s.cal,'result');s=act(s,'applyGas');s=act(s,'cal');assert.equal(s.cal,'purge');return act(s,'advance');}
test('calibration track and hold, gas gates, purge, and retained records',()=>{
 for(const output of ['track','hold']){let s=start(output);assert.equal(act(s,'cal').cal,'ready1');s=act(s,'applyGas');assert.equal(readings(s).ma,output==='hold'?8.8:16.8);s=act(s,'cal');s=act(s,'advance');assert.equal(act(s,'cal').cal,'ready2');s=act(s,'applyGas');assert.equal(readings(s).ma,output==='hold'?8.8:4.64);s=act(s,'cal');s=act(s,'advance');assert.equal(act(s,'cal').cal,'result');s=act(s,'applyGas');s=act(s,'cal');assert.equal(readings(s).ma,output==='hold'?8.8:null);assert.equal(readings(s).seen,null);s=act(s,'advance');assert.equal(s.cal,'idle');assert.equal(s.accepted,1);assert.equal(readings(s).ma,8.8);}
 let s=finish(start());s=act(s,'outcome','invalid');s=act(s,'cal');s=act(s,'cal');s=finish(s);assert.equal(s.accepted,1);s=act(s,'cal');s=act(s,'cal');s=act(s,'abort');assert.equal(s.accepted,1);assert.equal(s.cal,'idle');
});
test('waiting timeout and busy configuration interlocks',()=>{
 let s=start('hold');for(const [key,value] of [['gas1',4],['outcome','invalid'],['logic',0],['calOutput','track']])assert.deepEqual(act(s,key,value),s);
 s=act(s,'timeout');assert.equal(s.cal,'idle');assert.equal(s.accepted,0);assert.equal(readings(s).ma,8.8);
 let warm=act(act(initial(),'power'),'power');assert.equal(act(warm,'cal').cal,'idle');assert.equal(act(act(initial(),'fault',1),'cal').cal,'idle');
});
test('exact cell lookup; arbitrary values withheld; all normal table points',()=>{
 for(const [o2,mv] of CELL_TABLE.filter(([o2])=>o2<=40)){assert.equal(readings(act(initial(),'o2',o2)).mv,mv);}
 assert.equal(readings(act(initial(),'o2',3.33)).mv,null);assert.deepEqual(act(initial(),'o2',NaN),initial());
});
test('logic role does not equate handshake to an alarm output',()=>{
 for(let mode=0;mode<=9;mode++){const s=act(act(initial(),'logic',mode),'fault',5);if(mode>=8)assert.match(logicRole(s),/handshake.*unavailable/);else if([1,3,5,7].includes(mode))assert.match(logicRole(s),/condition present/);else assert.doesNotMatch(logicRole(s),/condition present/);}
});
