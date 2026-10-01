// M6 UI boundaries only. No device values, timers or recovery rules live here.
import {trainingSnapshot} from './training-page.mjs';
import {calibrationSnapshot} from './calibration-page.mjs';
import {CALIBRATION_DATA as calibration} from '../calibration-data.mjs';
import {calRead} from '../calibration-data.mjs';
import {source} from './view-model.mjs';
const $=id=>document.getElementById(id);
const error=document.createElement('p');error.id='hardening-error';error.setAttribute('role','alert');document.querySelector('.workspace-switch').before(error);
const obligation=document.createElement('p');obligation.id='cleanup-obligation';obligation.className='boundary-note';obligation.setAttribute('role','status');$('cal-procedure').after(obligation);
const caution=document.createElement('aside');caution.id='cal-active-safety';caution.className='boundary-note';caution.setAttribute('aria-label','Active calibration safety context');
const cautionText=document.createElement('p');cautionText.textContent=calRead(calibration.facts.flowCaution);const cautionSource=document.createElement('p');cautionSource.className='source';cautionSource.textContent=`${calibration.facts.flowCaution.source.evidenceId} · ${source(calibration.facts.flowCaution.source.evidenceId)}`;caution.append(cautionText,cautionSource);$('cal-procedure').after(caution);
// A malformed reference selection must never fall through to Number('') or undefined.
for(const id of ['reference-point','fault-reference','configuration']){
 const node=$(id),allowed=new Set([...node.options].map(o=>o.value));let previous=node.value;
 node.addEventListener('change',event=>{if(!allowed.has(node.value)){event.stopImmediatePropagation();node.value=previous;error.textContent='TRAINING INPUT REJECTED: choose an existing documented reference. The previous selection is retained.';node.setAttribute('aria-invalid','true');}else{previous=node.value;node.removeAttribute('aria-invalid');error.textContent='';}},true);
}
// Rendering can hide the event control and make the browser return focus to body.
function focusVisible(previous){const active=document.activeElement===document.body?previous:document.activeElement;if(!active||active===document.body||active.getClientRects().length)return;
 let target;
 if(!$('diagnostic-workspace-panel').hidden){ // Resolved below using native DOM IDs.
  const ids={CHECK:'diag-check',TEST:'diag-meter-mode',OBSERVATION:'diag-observation',DIAGNOSIS:'diag-diagnosis',ACTION:'diag-action',COMPLETE:'diag-result'};
  target=$(ids[$('diag-stage').textContent]);
 }
 if(!target&&!$('calibration-workspace-panel').hidden)target=$('cal-state');
 if(target){if(!target.matches('button,select,input'))target.tabIndex=-1;target.focus({preventScroll:true});}
}
function sync(event){const c=calibrationSnapshot(),pending=c.active||c.needsAutomatic;
 obligation.hidden=!pending;obligation.textContent=pending?(c.needsAutomatic?calRead(calibration.facts.returnLoop):'Finish or abort this calibration and complete cleanup before leaving the workspace. This is a training navigation guard.')+' Home, diagnostics and power removal remain unavailable until cleanup finishes.':'';
 caution.hidden=!pending;
 if(pending){for(const id of ['startup-workspace','diagnostic-workspace','power-off','training-home','training-reset']){const n=$(id);if(n){n.disabled=true;n.setAttribute('aria-describedby','cleanup-obligation');}}}
 else{for(const id of ['startup-workspace','diagnostic-workspace'])$(id).disabled=false;for(const id of ['startup-workspace','diagnostic-workspace','power-off','training-home','training-reset']){const n=$(id);if(n?.getAttribute('aria-describedby')==='cleanup-obligation'){if(id.startsWith('training-'))n.setAttribute('aria-describedby','training-guard-note');else n.removeAttribute('aria-describedby');}}}
 // Errors must be announced even if the invalid action occurred before a scenario loaded.
 if($('diag-active').hidden&&$('diag-error').textContent)error.textContent=$('diag-error').textContent;
 focusVisible(event?.target);
}
for(const id of ['startup-workspace','calibration-workspace','diagnostic-workspace','power-on','power-off','complete','minute','five','next','report-fault'])$(id).addEventListener('click',event=>{if(trainingSnapshot().mode==='ACTIVE'){event.stopImmediatePropagation();error.textContent='TRAINING ACTION BLOCKED: the exploration workspace is paused during assessment.';}},true);
// Guard even stale, programmatically dispatched UI events; do not change engine semantics.
for(const id of ['startup-workspace','diagnostic-workspace','power-off'])$(id).addEventListener('click',event=>{const c=calibrationSnapshot();if(c.active||c.needsAutomatic){event.stopImmediatePropagation();error.textContent='TRAINING NAVIGATION BLOCKED: complete calibration cleanup and return the loop to AUTOMATIC.';sync();}},true);
document.addEventListener('click',()=>{error.textContent='';},true);
document.addEventListener('click',sync);document.addEventListener('change',sync);
const trainingObserver=new MutationObserver(sync);trainingObserver.observe($('training'),{childList:true});
// Local navigation semantics and source/device labels; exact LOI text is untouched.
$('startup-workspace').parentElement.setAttribute('role','navigation');
for(const id of ['loi-state','cal-display','diag-loi-message'])$(id).setAttribute('aria-label','Device indication or explicitly labeled training boundary');
$('cal-prepare-text').setAttribute('role','note');
sync();
// Match keyboard/reading order to the existing mobile visual order.
const mobile=matchMedia('(max-width:600px)'),workbench=document.querySelector('.workbench'),anatomy=document.querySelector('.anatomy');
function orderWorkbench(){if(mobile.matches)workbench.append(anatomy);else workbench.prepend(anatomy);}
mobile.addEventListener('change',orderWorkbench);orderWorkbench();
