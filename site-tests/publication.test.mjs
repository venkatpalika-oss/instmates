import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,symlink,access} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {buildPublication,sha256,canonical,approvalPayload,verifyApproval,parseStrict} from '../scripts/build-publication.mjs';
const key=()=>{const k=generateKeyPairSync('ed25519');return {...k,pem:k.publicKey.export({type:'spki',format:'pem'})};};
const keys=key(); // Ephemeral TEST keys only; never persisted.
const approve=(m,k=keys)=>({payload:approvalPayload(m),signature:sign(null,Buffer.from(canonical(approvalPayload(m))),k.privateKey).toString('base64')});
async function fixture(t){
 const root=await mkdtemp(path.join(os.tmpdir(),'publication-test-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(path.join(root,'public'));
 const content=Buffer.from('<!doctype html><title>TEST fixture</title>');await writeFile(path.join(root,'public/index.html'),content);
 const m={schemaVersion:1,reviewedSourceCommit:'a'.repeat(40),sourceRoot:'public',artifactRoot:'dist/hosting',files:[{path:'index.html',sha256:sha256(content),bytes:content.length,dependencies:[],dynamicDependencies:[]}],excludedFiles:[],routes:[{url:'/',file:'index.html'}]};
 const manifestPath=path.join(root,'manifest.json');
 const save=()=>writeFile(manifestPath,JSON.stringify(m));
 const build=async(options={})=>{await save();return buildPublication({root,manifestPath,approval:approve(m),publicKey:keys.pem,...options});};
 const add=async(p,data='fixture')=>{await mkdir(path.dirname(path.join(root,'public',p)),{recursive:true});await writeFile(path.join(root,'public',p),data);return {path:p,sha256:sha256(data),bytes:Buffer.byteLength(data),dependencies:[],dynamicDependencies:[]};};
 return {root,m,save,build,add,manifestPath};
}
const absent=async p=>assert.rejects(access(p),{code:'ENOENT'});
test('publication: exact inventory, signed deterministic rebuild and source unchanged',async t=>{const f=await fixture(t);const before=await readFile(path.join(f.root,'public/index.html'));const a=await f.build();await writeFile(path.join(f.root,'dist/hosting/stale.js'),'bad');const b=await f.build();assert.deepEqual(a,b);assert.deepEqual(await readdir(path.join(f.root,'dist/hosting')),['index.html']);assert.deepEqual(await readFile(path.join(f.root,'public/index.html')),before);assert.deepEqual(await readFile(path.join(f.root,'dist/hosting/index.html')),before);assert.equal(a.publicationAuthorized,true);assert.ok(await readFile(path.join(f.root,'dist/publication-audit.json')));});
for(const [label,mutate,pattern] of [
 ['unknown source',async f=>{await f.add('unknown.html');},/Unknown/],
 ['unapproved asset',async f=>{await f.add('assets/new.js');},/unapproved/],
 ['hash mismatch',async f=>{f.m.files[0].sha256='0'.repeat(64);},/Hash/],
 ['byte size',async f=>{f.m.files[0].bytes++;},/Byte/],
 ['missing file',async f=>{await rm(path.join(f.root,'public/index.html'));},/Missing/],
 ['missing dependency',async f=>{f.m.files[0].dependencies=['missing.js'];},/dependency/],
 ['excluded dependency',async f=>{await f.add('excluded.js');f.m.excludedFiles.push({path:'excluded.js',reason:'development'});f.m.files[0].dependencies=['excluded.js'];},/dependency/],
 ['missing dynamic dependency',async f=>{f.m.files[0].dynamicDependencies=['missing.js'];},/dependency/],
 ['unknown property',async f=>{f.m.approved=true;},/unknown property/],
 ['nested unknown property',async f=>{f.m.files[0].allow=true;},/unknown property/],
 ['case collision',async f=>{await f.add('INDEX.html');},/Case collision/],
 ['symlink',async f=>{await symlink('index.html',path.join(f.root,'public/link.html'));},/Symlink/],
 ['denied route',async f=>{f.m.routes=[{url:'/ai/',file:'index.html'}];},/Denied route/],
 ['wrong route mapping',async f=>{f.m.routes=[{url:'/other/',file:'index.html'}];},/Route\/file/],
 ['duplicate classification',async f=>{f.m.excludedFiles.push({path:'index.html',reason:'dev'});},/classification/],
 ['invalid commit',async f=>{f.m.reviewedSourceCommit='main';},/invalid string/]
])test('publication rejection: '+label,async t=>{const f=await fixture(t);await f.build();await mutate(f);await assert.rejects(f.build(),pattern);await absent(path.join(f.root,'dist/hosting'));await absent(path.join(f.root,'dist/hosting.stage'));});
for(const p of ['../escape','/absolute','C:/windows','a\\b','assets/*','a/?.js','a/../b','a//b','a/%2e%2e/b','a/CON','a/trailing.'])test('publication unsafe path: '+p,async t=>{const f=await fixture(t);f.m.files[0].path=p;await assert.rejects(f.build(),/Unsafe/);});
for(const p of ['simulations/gas-metering-skid/index.html','assets/js/simulations/gas-metering-molar-mass-model.js','assets/css/gas-metering-skid.css','assets/images/simulations/gas-metering-skid/skid.svg','_template.html','ai/index.html'])test('publication mandatory exclusion: '+p,async t=>{const f=await fixture(t);const entry=await f.add(p);f.m.files.push(entry);await assert.rejects(f.build(),/Denied content/);f.m.files.pop();f.m.excludedFiles.push({path:p,reason:'NOT PUBLIC'});await f.build();await absent(path.join(f.root,'dist/hosting',p));});
test('publication dependencies: static and explicit dynamic declarations',async t=>{const f=await fixture(t);const a=await f.add('assets/a.js');const b=await f.add('assets/b.js');f.m.files.push(a,b);f.m.files[0].dependencies=[a.path];a.dynamicDependencies=[b.path];assert.equal((await f.build()).files.length,3);});
test('publication: unsigned required mode rejected, fixture mode explicitly unauthorised',async t=>{const f=await fixture(t);await assert.rejects(f.build({approval:undefined}),/approval/);const a=await f.build({approval:undefined,approvalRequired:false});assert.equal(a.publicationAuthorized,false);});
test('publication signature: changed manifest rejected',async t=>{const f=await fixture(t);const a=approve(f.m);f.m.reviewedSourceCommit='b'.repeat(40);await assert.rejects(f.build({approval:a}),/approval/);});
test('publication signature: wrong key rejected',async t=>{const f=await fixture(t);await assert.rejects(f.build({publicKey:key().pem}),/Signature/);});
for(const signature of ['garbage','',Buffer.alloc(64).toString('base64')])test('publication signature: malformed or invalid '+signature.slice(0,7),async t=>{const f=await fixture(t);await assert.rejects(f.build({approval:{payload:approvalPayload(f.m),signature}}),/signature|Signature/);});
test('publication canonical payload has stable key order',()=>{assert.equal(canonical({b:2,a:{d:4,c:3}}),canonical({a:{c:3,d:4},b:2}));});
test('publication strict JSON duplicate and trailing data rejection',()=>{assert.throws(()=>parseStrict('{"a":1,"a":2}'),/Duplicate/);assert.throws(()=>parseStrict('{"a":{"b":1,"b":2}}'),/Duplicate/);assert.throws(()=>parseStrict('{}junk'));});
test('publication failed copy leaves no output or report',async t=>{const f=await fixture(t);const e=await f.add('a');f.m.files.push(e);f.m.files.push({...e,path:'a/b'});await assert.rejects(f.build(),/Missing/);await absent(path.join(f.root,'dist/hosting'));await absent(path.join(f.root,'dist/publication-audit.json'));});
test('publication abandoned staging never carried forward',async t=>{const f=await fixture(t);await mkdir(path.join(f.root,'dist/hosting.stage'),{recursive:true});await writeFile(path.join(f.root,'dist/hosting.stage/leak.html'),'unfinished');await f.build();await absent(path.join(f.root,'dist/hosting/leak.html'));await absent(path.join(f.root,'dist/hosting.stage'));});
test('publication interruption after staging begins clears previous release and partial stage',async t=>{
 const f=await fixture(t);await f.build();let observations=0;
 const signal={get aborted(){return ++observations===3;}};
 await assert.rejects(f.build({signal}),/interrupted/);
 assert.equal(observations,3);await absent(path.join(f.root,'dist/hosting'));await absent(path.join(f.root,'dist/hosting.stage'));await absent(path.join(f.root,'dist/publication-audit.json'));
});
test('publication missing approval file cannot retain stale release',async t=>{const f=await fixture(t);await f.build();await assert.rejects(f.build({approvalPath:path.join(f.root,'missing-approval.json')}),/ENOENT/);await absent(path.join(f.root,'dist/hosting'));});
test('publication malformed manifest cannot retain stale release',async t=>{const f=await fixture(t);await f.build();await writeFile(f.manifestPath,'{"schemaVersion":1,"schemaVersion":1}');await assert.rejects(buildPublication({root:f.root,manifestPath:f.manifestPath,approvalRequired:false}),/Duplicate/);await absent(path.join(f.root,'dist/hosting'));});
test('publication special file rejected',async t=>{
 if(process.platform==='win32'){t.skip('FIFO fixture is POSIX-only');return;}
 const {execFileSync}=await import('node:child_process');const f=await fixture(t);execFileSync('mkfifo',[path.join(f.root,'public/pipe')]);await assert.rejects(f.build(),/Special file/);
});
test('publication output symlink cannot cause writes outside root',async t=>{const f=await fixture(t);await mkdir(path.join(f.root,'dist'));const target=path.join(f.root,'untouched');await mkdir(target);await writeFile(path.join(target,'sentinel'),'safe');await symlink(target,path.join(f.root,'dist/hosting'));await assert.rejects(f.build(),/Symlink/);assert.equal(await readFile(path.join(target,'sentinel'),'utf8'),'safe');});

test('publication strict JSON rejects non-JSON whitespace',()=>{assert.throws(()=>parseStrict('\v{}'));});
for(const entry of ['hosting.stage','hosting','publication-audit.json'])test('R1: reject '+entry+' symlink and invalidate old release without following target',async t=>{
 const f=await fixture(t);await f.build();const target=path.join(f.root,'sentinel-target');await mkdir(target);await writeFile(path.join(target,'sentinel'),'DO NOT DELETE');
 const link=path.join(f.root,'dist',entry);await rm(link,{recursive:true,force:true});await symlink(target,link);
 await assert.rejects(f.build(),/Symlink/);
 for(const p of ['hosting','hosting.stage','publication-audit.json'])await absent(path.join(f.root,'dist',p));
 assert.equal(await readFile(path.join(target,'sentinel'),'utf8'),'DO NOT DELETE');
 assert.equal((await f.build()).publicationAuthorized,true);
});
test('R1: nested output symlink cleanup preserves source',async t=>{const f=await fixture(t);await f.build();await symlink(path.join(f.root,'public'),path.join(f.root,'dist/hosting/nested'));f.m.files[0].sha256='0'.repeat(64);await assert.rejects(f.build(),/Hash/);assert.ok(await readFile(path.join(f.root,'public/index.html')));await absent(path.join(f.root,'dist/hosting'));await absent(path.join(f.root,'dist/publication-audit.json'));});
test('R1: preflight source symlink after success invalidates previous artifact and audit',async t=>{const f=await fixture(t);await f.build();const {rename}=await import('node:fs/promises');await rename(path.join(f.root,'public'),path.join(f.root,'source-target'));await symlink(path.join(f.root,'source-target'),path.join(f.root,'public'));await assert.rejects(f.build(),/Symlink/);await absent(path.join(f.root,'dist/hosting'));await absent(path.join(f.root,'dist/publication-audit.json'));assert.ok(await readFile(path.join(f.root,'source-target/index.html')));});
for(const phase of ['copy','validation','promotion'])test('R1: '+phase+' fault after prior success invalidates all output',async t=>{
 const f=await fixture(t);await f.build();const {mkdirSync,writeFileSync}=await import('node:fs');let calls=0;
 const signal={get aborted(){calls++;
  if(phase==='copy'&&calls===2)writeFileSync(path.join(f.root,'dist/hosting.stage/index.html'),'collision');
  if(phase==='validation'&&calls===2)writeFileSync(path.join(f.root,'dist/hosting.stage/unapproved.txt'),'extra');
  if(phase==='promotion'&&calls===3){mkdirSync(path.join(f.root,'dist/hosting'));writeFileSync(path.join(f.root,'dist/hosting/blocker'),'collision');}
  return false;
 }};
 await assert.rejects(f.build({signal}),phase==='copy'?/EEXIST/:phase==='validation'?/inventory mismatch/:/ENOTEMPTY|EEXIST/);
 for(const p of ['hosting','hosting.stage','publication-audit.json'])await absent(path.join(f.root,'dist',p));
 assert.equal((await f.build()).publicationAuthorized,true);
});
