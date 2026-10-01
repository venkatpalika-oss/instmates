import {SOURCE_DATA as data} from '../source-data.mjs';
import {createStartupEngine} from '../startup-engine.mjs';
import {read,source,lookup,components,formatDatum} from './view-model.mjs';
const $=id=>document.getElementById(id);
export const engine=createStartupEngine();
const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const label=key=>key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
function datum(parent,name,d){const box=el('div',undefined,'datum');box.append(el('strong',name),el('p',formatDatum(d)),el('p',source(d.source.evidenceId),'source'));parent.append(box);}
function fields(parent,object){for(const [key,d] of Object.entries(object))if(d?.status)datum(parent,label(key),d);}
let selected='cell';
function component(){const c=components.find(c=>c[0]===selected);const panel=$('component-detail');panel.replaceChildren(el('h3',c[1]),el('p',c[2]),el('p',source(c[3]),'source'));const s=engine.snapshot().device;
 if(selected==='cell')datum(panel,'Documented operating setpoint (not live temperature)',data.operating.cellSetpoint);
 if(selected==='reference')datum(panel,'Documented reference oxygen',data.operating.referenceOxygen);
 if(selected==='heater')panel.append(el('p',`Simulated heater state: ${s.heater.status}`));
 if(selected==='electronics')panel.append(el('p',`Startup state: ${s.state}`));
 if(selected==='loop')datum(panel,'Documented startup output selections',data.operating.startupOutputChoices);
 for(const b of $('component-buttons').children)b.setAttribute('aria-pressed',String(b.dataset.component===selected));
}
components.forEach((c,i)=>{const b=el('button',`${i+1} · ${c[1]}`);b.dataset.component=c[0];b.onclick=()=>{selected=c[0];component();};$('component-buttons').append(b);});
// Equivalent native buttons remain available below the drawing on small screens.
const bounds=[[15,28,105,280],[128,156,42,80],[174,156,27,80],[197,56,145,35],[207,157,98,30],[305,185,145,24],[235,209,200,33],[465,125,111,119],[595,54,117,45],[597,146,119,43],[599,202,114,39]];
components.forEach((c,i)=>{const target=document.createElementNS('http://www.w3.org/2000/svg','rect');const [x,y,w,h]=bounds[i];for(const [k,v] of Object.entries({x,y,width:w,height:h,fill:'transparent',tabindex:'0',role:'button','aria-label':`Select ${c[1]}`,class:'diagram-target'}))target.setAttribute(k,v);const choose=()=>{selected=c[0];component();};target.addEventListener('click',choose);target.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});document.querySelector('svg').append(target);});
function render(){const {device:d,infrastructure:i}=engine.snapshot();const warm=d.state==='WARM UP';$('state').textContent=d.state;$('elapsed').textContent=`${i.elapsedLogicalWarmupSeconds/60} min logical elapsed`;
 $('power-on').disabled=d.state!=='POWER OFF';$('power-off').disabled=d.state==='POWER OFF';for(const id of ['minute','five','complete','report-fault','startup-fault'])$(id).disabled=!warm;
 $('next').disabled=!(warm||d.state==='NORMAL OPERATION');
 $('leds').replaceChildren();for(const name of ['HEATER T/C','HEATER','O2 CELL','CALIBRATION']){const active=d.membrane.litDiagnosticLeds?.includes(name);const row=el('div',undefined,active?'led-row on':'led-row');row.append(el('span','','led-dot'),el('span',name),el('strong',d.membrane.litDiagnosticLeds?(active?'ON':'OFF'):'Not modeled'));$('leds').append(row);}
 $('sequence-text').textContent=d.membrane.litDiagnosticLeds?`Indication ${i.indicationStep+1}: ${d.membrane.litDiagnosticLeds.join(', ')||'all diagnostic LEDs off'}`:'Diagnostic indication is not modeled at this boundary.';
 $('heater').textContent=d.heater.status;$('current').textContent=d.analogOutput.status==='SUPPORTED'?`${d.analogOutput.value} ${d.analogOutput.unit}`:`Not simulated · ${d.analogOutput.reason}`;
 $('loi-state').textContent=d.loi.text??d.state;$('loi-reading').textContent=d.state==='NORMAL OPERATION'?'O₂: --.-- %':'—';
 $('startup-source').textContent=[d.stateSource,d.membrane.source,d.loi.source,d.analogOutput.source].filter(Boolean).map(s=>source(s.evidenceId)).filter((s,i,a)=>a.indexOf(s)===i).join('\n');component();}
function act(fn){return()=>{try{fn();$('error').textContent='';render();}catch(e){$('error').textContent=e.message;}};}
$('power-on').onclick=act(()=>engine.applyPower());$('power-off').onclick=act(()=>engine.removePower());$('minute').onclick=act(()=>engine.advanceLogicalTime(60));$('five').onclick=act(()=>engine.advanceLogicalTime(300));$('complete').onclick=act(()=>engine.advanceLogicalTime(engine.snapshot().infrastructure.educationalWarmupMilestoneSeconds));$('next').onclick=act(()=>engine.advanceIndication());$('report-fault').onclick=act(()=>engine.reportStartupFault($('startup-fault').value));
$('configuration').onchange=()=>{$('keypad').hidden=$('configuration').value!=='keypad';$('loi').hidden=$('configuration').value!=='loi';};
$('milestone').textContent=`Approximate documented warm-up milestone: ${formatDatum(data.operating.warmupApproximate)}. ${source(data.operating.warmupApproximate.source.evidenceId)}`;
for(const p of data.referencePoints){const o=read(p.oxygenPercent);$('reference-point').add(new Option(`${o}% O₂`,String(o)));const row=el('tr');row.append(el('td',o),el('td',read(p.emfMv)));$('reference-table').append(row);}
function showLookup(){const p=lookup(Number($('reference-point').value));$('lookup-o2').textContent=formatDatum(p.oxygenPercent);$('lookup-emf').textContent=formatDatum(p.emfMv);$('lookup-source').textContent=source(p.emfMv.source.evidenceId);}
$('reference-point').onchange=showLookup;showLookup();
for(const key of ['cellSetpoint','referenceOxygen'])datum($('operating-reference'),label(key),data.operating[key]);
const operatingDetails=el('details');operatingDetails.append(el('summary','Ranges, outputs & temperature limits'));
fields(operatingDetails,Object.fromEntries(Object.entries(data.operating).filter(([k])=>!['cellSetpoint','referenceOxygen'].includes(k))));$('operating-reference').append(operatingDetails);
fields($('calibration-reference'),data.calibration);
for(const p of data.testPoints){const box=el('div');box.append(el('h3',p.id));fields(box,p);for(const example of p.examples??[]){box.append(el('p',`${formatDatum(example.oxygenPercent)} → ${formatDatum(example.voltage)}`),el('p',source(example.voltage.source.evidenceId),'source'));}$('test-points').append(box);}
for(const f of data.faults){$('fault-reference').add(new Option(`${f.id}: ${read(f.alarm)}${f.historicalOnly?' (historical only)':''}`,f.id));if(!f.historicalOnly&&f.loiMessage.status==='SUPPORTED')$('startup-fault').add(new Option(read(f.loiMessage),f.id));}
function fault(){const f=data.faults.find(f=>f.id===$('fault-reference').value);$('fault-detail').replaceChildren(el('p',f.historicalOnly?'Historical reference only; not an active fault.':'Read-only source reference; no fault behavior is executed.'));fields($('fault-detail'),f);}
$('fault-reference').onchange=fault;fault();
$('interface-source').textContent=['E45','E51','E52','E53','E54'].map(source).join('\n');fields($('blocked-behaviors'),data.blockedCapabilities);fields($('blocked-behaviors'),data.conflictingContexts);render();
