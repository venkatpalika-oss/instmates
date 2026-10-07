/** P1A only: no Firebase invocation. Static declarations are authoritative; JS discovery is not complete. */
import {readFile,writeFile,mkdir,rm,rename,readdir,lstat,unlink,rmdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash,verify,createPublicKey} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const schemaPath=new URL('../publication/manifest.schema.json',import.meta.url);
const fail=message=>{throw new Error(message);};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function canonical(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
// Recursive JSON parser rejects duplicate keys before JSON.parse can discard them.
export function parseStrict(text){
 JSON.parse(text); // Enforce JSON grammar, including its restricted whitespace.
 let i=0;const ws=()=>{while(/\s/.test(text[i]||'')&&i<text.length)i++;};
 function string(){const start=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"')return JSON.parse(text.slice(start,i));}fail('Invalid JSON string');}
 function value(){ws();if(text[i]==='"')return string();if(text[i]==='{'){i++;const o=Object.create(null);ws();if(text[i]==='}'){i++;return o;}while(true){ws();if(text[i]!=='"')fail('Invalid JSON key');const k=string();if(Object.hasOwn(o,k))fail('Duplicate JSON key');ws();if(text[i++]!==':')fail('Invalid JSON colon');o[k]=value();ws();const c=text[i++];if(c==='}')return o;if(c!==',')fail('Invalid JSON object');}}
 if(text[i]==='['){i++;const a=[];ws();if(text[i]===']'){i++;return a;}while(true){a.push(value());ws();const c=text[i++];if(c===']')return a;if(c!==',')fail('Invalid JSON array');}}
 const m=text.slice(i).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);if(!m)fail('Invalid JSON value');i+=m[0].length;return JSON.parse(m[0]);}
 const result=value();ws();if(i!==text.length)fail('Invalid JSON trailing data');return result;
}
function validate(v,s,label='$'){
 if(s.const!==undefined&&v!==s.const)fail(label+' constant mismatch');
 if(s.enum&&!s.enum.includes(v))fail(label+' enum mismatch');
 if(s.type==='object'){
  if(!v||typeof v!=='object'||Array.isArray(v))fail(label+' must be object');
  for(const k of s.required||[])if(!Object.hasOwn(v,k))fail(label+' missing '+k);
  for(const k of Object.keys(v)){if(!Object.hasOwn(s.properties,k))fail(label+' unknown property '+k);validate(v[k],s.properties[k],label+'.'+k);}
 }else if(s.type==='array'){
  if(!Array.isArray(v))fail(label+' must be array');
  if(s.uniqueItems&&new Set(v.map(canonical)).size!==v.length)fail(label+' duplicate item');
  v.forEach((x,i)=>validate(x,s.items,label+'['+i+']'));
 }else if(s.type==='string'){
  if(typeof v!=='string'||(s.minLength&&v.length<s.minLength)||(s.pattern&&!new RegExp(s.pattern).test(v)))fail(label+' invalid string');
 }else if(s.type==='integer'&&(!Number.isSafeInteger(v)||v<s.minimum))fail(label+' invalid integer');
}
function safe(p){
 if(typeof p!=='string'||!p||p!==p.normalize('NFC')||/[\\:*?\[\]{}\x00-\x1f%#]/.test(p)||path.posix.isAbsolute(p)||p.split('/').some(x=>!x||x==='.'||x==='..'||/[. ]$/.test(x)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(x)))fail('Unsafe path: '+p);
 return p;
}
async function secure(p){
 const absolute=path.resolve(p);let current=path.parse(absolute).root;
 for(const part of absolute.slice(current.length).split(path.sep).filter(Boolean)){
  current=path.join(current,part);try{const st=await lstat(current);if(st.isSymbolicLink())fail('Symlink: '+current);if(!st.isDirectory()&&!st.isFile())fail('Special file: '+current);}catch(e){if(e.code==='ENOENT')continue;throw e;}
 }
}
async function inventory(root){
 const result=[];const cases=new Set();
 async function walk(dir,prefix=''){for(const entry of (await readdir(dir)).sort()){
  const rel=safe(prefix+entry);const key=rel.toLowerCase();if(cases.has(key))fail('Case collision: '+rel);cases.add(key);
  const full=path.join(dir,entry),st=await lstat(full);if(st.isSymbolicLink())fail('Symlink: '+rel);
  if(st.isDirectory())await walk(full,rel+'/');else if(st.isFile())result.push(rel);else fail('Special file: '+rel);
 }}await walk(root);return result.sort();
}
function denied(p){return /(^|\/)gas-metering[^/]*(\/|$)/i.test(p)||/^ai(?:\/|\.html$|$)/i.test(p)||/^_template(?:\/|\.html$|$)/i.test(p);}
export function approvalPayload(manifest){return {schemaVersion:1,policy:'INSTMATES-PUBLICATION-v1',manifestSha256:sha256(canonical(manifest)),audience:'PUBLIC'};}
export function verifyApproval(manifest,approval,publicKey){
 if(!approval||Object.keys(approval).sort().join(',')!=='payload,signature'||canonical(approval.payload)!==canonical(approvalPayload(manifest)))fail('Invalid approval payload');
 if(typeof approval.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(approval.signature))fail('Malformed signature');
 const signature=Buffer.from(approval.signature,'base64');if(signature.toString('base64')!==approval.signature)fail('Malformed signature');
 const key=createPublicKey(publicKey);if(key.asymmetricKeyType!=='ed25519')fail('Ed25519 required');
 if(!verify(null,Buffer.from(canonical(approval.payload)),key,signature))fail('Signature verification failed');
}
// Cleanup only fixed output entries beneath a validated root. Never traverse links.
async function removeEntry(p){
 let st;try{st=await lstat(p);}catch(e){if(e.code==='ENOENT')return;throw e;}
 if(st.isSymbolicLink()||!st.isDirectory()){await unlink(p);return;}
 for(const name of await readdir(p))await removeEntry(path.join(p,name));
 await rmdir(p);
}
async function invalidate(root,output,stage,report){
 await secure(root);
 const dist=path.join(root,'dist');let st;
 try{st=await lstat(dist);}catch(e){if(e.code==='ENOENT')return;throw e;}
 if(st.isSymbolicLink()){await unlink(dist);return;}
 if(!st.isDirectory())return; // No deployable child exists; preparation will reject it.
 const errors=[];
 for(const target of [report,output,stage]){
  try{await removeEntry(target);}catch(e){errors.push(e);}
 }
 if(errors.length)throw new AggregateError(errors,'Publication invalidation failed');
}
export async function buildPublication({root,manifestPath,approval,publicKey,approvalRequired=true,approvalPath,publicKeyPath,signal}){
 root=path.resolve(root);const source=path.join(root,'public'),output=path.join(root,'dist/hosting'),stage=path.join(root,'dist/hosting.stage'),report=path.join(root,'dist/publication-audit.json');
 try{
  // Preserve rejection of unsafe destinations, but all failures now invalidate outputs.
  await secure(root);await secure(path.join(root,'dist'));await secure(output);await secure(stage);await secure(report);
  await invalidate(root,output,stage,report);
  await secure(source);await secure(manifestPath);
  if(signal?.aborted)fail('Build interrupted');
  if(approvalPath){await secure(approvalPath);approval=parseStrict(await readFile(approvalPath,'utf8'));}
  if(publicKeyPath){await secure(publicKeyPath);publicKey=await readFile(publicKeyPath);}
  const manifest=parseStrict(await readFile(manifestPath,'utf8'));const schema=JSON.parse(await readFile(schemaPath,'utf8'));validate(manifest,schema);
  if(approvalRequired)verifyApproval(manifest,approval,publicKey);else if(approval)verifyApproval(manifest,approval,publicKey);
  const all=await inventory(source),approved=new Map(),excluded=new Set(),seen=new Set();
  function register(p){safe(p);const key=p.toLowerCase();if(seen.has(key))fail('Duplicate/case-colliding classification: '+p);seen.add(key);}
  for(const f of manifest.files){register(f.path);if(denied(f.path))fail('Denied content: '+f.path);approved.set(f.path,f);}
  for(const f of manifest.excludedFiles){register(f.path);excluded.add(f.path);}
  for(const p of all)if(!approved.has(p)&&!excluded.has(p))fail('Unknown/unapproved source file: '+p);
  for(const p of [...approved.keys(),...excluded])if(!all.includes(p))fail('Missing classified file: '+p);
  const routes=new Set();for(const r of manifest.routes){if(!r.url.startsWith('/')||r.url.includes('?')||r.url.includes('#'))fail('Invalid route');const u=r.url.slice(1).replace(/\/$/,'');if(u)safe(u);if(denied(u)||denied(r.file))fail('Denied route');if(routes.has(r.url.toLowerCase()))fail('Duplicate route');routes.add(r.url.toLowerCase());if(!approved.has(r.file))fail('Missing route file');const expected=r.file==='index.html'?'/':r.file.endsWith('/index.html')?'/'+r.file.slice(0,-10):r.file.endsWith('.html')?'/'+r.file.slice(0,-5)+'/':'/'+r.file;if(r.url!==expected)fail('Route/file mismatch');}
  const bytes=new Map();for(const f of manifest.files){
   for(const dep of [...f.dependencies,...f.dynamicDependencies]){safe(dep);if(!approved.has(dep))fail('Missing/excluded dependency: '+dep);}
   const b=await readFile(path.join(source,f.path));if(b.length!==f.bytes)fail('Byte size mismatch: '+f.path);if(sha256(b)!==f.sha256)fail('Hash mismatch: '+f.path);bytes.set(f.path,b);
  }
  await mkdir(stage,{recursive:true});for(const p of [...approved.keys()].sort()){if(signal?.aborted)fail('Build interrupted');await mkdir(path.dirname(path.join(stage,p)),{recursive:true});await writeFile(path.join(stage,p),bytes.get(p),{flag:'wx'});}
  const actual=await inventory(stage),expected=[...approved.keys()].sort();if(canonical(actual)!==canonical(expected))fail('Artifact inventory mismatch');
  for(const p of actual){const b=await readFile(path.join(stage,p));if(b.length!==approved.get(p).bytes||sha256(b)!==approved.get(p).sha256)fail('Artifact hash mismatch');}
  const audit={schemaVersion:1,reviewedSourceCommit:manifest.reviewedSourceCommit,manifestSha256:sha256(canonical(manifest)),approvalVerified:!!approval,publicationAuthorized:approvalRequired&&!!approval,files:expected.map(p=>({path:p,sha256:approved.get(p).sha256,bytes:approved.get(p).bytes}))};
  if(signal?.aborted)fail('Build interrupted');
  await writeFile(report,JSON.stringify(audit,null,2)+'\n');await rename(stage,output);return audit;
 }catch(e){
  try{await invalidate(root,output,stage,report);}catch(cleanup){throw new AggregateError([e,cleanup],'Build failed; output invalidation incomplete — do not deploy');}
  throw e;
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);if(args.length!==4)fail('Usage: node scripts/build-publication.mjs ROOT MANIFEST APPROVAL_JSON PUBLIC_KEY_PEM');
  const [root,manifestPath,approvalFile,keyFile]=args;
  const result=await buildPublication({root,manifestPath,approvalPath:approvalFile,publicKeyPath:keyFile});console.log(JSON.stringify(result));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
