import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {SIMULATIONS, availableLabs, validateCatalog} from '../public/assets/js/simulations/catalog.js';
const fixture=n=>Array.from({length:n},(_,i)=>({...SIMULATIONS[i%2],id:`fixture-${i}`,lab:String(i+1).padStart(2,'0'),href:`/simulations/fixture-${i}/`,categoryIds:['measurement','field-skills','measurement']}));
for(const n of [2,5,10,25]) test(`catalog ${n} unique labs and deduplicated memberships`,()=>{
 const result=availableLabs(fixture(n));assert.equal(result.length,n);assert.ok(result.every(l=>l.categoryIds.length===2));
});
test('real available routes exist and retain permanent IDs',()=>{
 assert.deepEqual(SIMULATIONS.map(l=>l.lab),['01','02','03']);
 for(const l of availableLabs()) assert.ok(existsSync(new URL(`../public${l.href}index.html`,import.meta.url)));
});
test('unpublished entries excluded and cannot have launch routes',()=>{
 const labs=fixture(3);labs[1].status='coming-soon';delete labs[1].href;labs[2].status='planned';delete labs[2].href;
 assert.equal(availableLabs(labs).length,1);labs[1].href='/simulations/future/';assert.throws(()=>validateCatalog(labs));
});
test('reject duplicate identity, number, route, invalid status and taxonomy',()=>{
 for(const patch of [{id:'fixture-0'},{lab:'01'},{href:'/simulations/fixture-0/'},{status:'fake'},{categoryIds:['fake']},{topicIds:['fake']},{href:'https://example.com/'},{href:'/simulations/../fake/'}]) {
  const labs=fixture(2);Object.assign(labs[1],patch);assert.throws(()=>validateCatalog(labs),JSON.stringify(patch));
 }
});
test('empty catalog is supported',()=>assert.deepEqual(availableLabs([]),[]));
