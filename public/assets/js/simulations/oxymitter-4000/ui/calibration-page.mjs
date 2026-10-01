import {engine as startup} from './page.mjs';
import {SOURCE_DATA as base} from '../source-data.mjs';
import {CALIBRATION_DATA as data,calRead as read} from '../calibration-data.mjs';
import {createCalibrationEngine} from '../calibration-engine.mjs';
import {source,formatDatum} from './view-model.mjs';
const $=id=>document.getElementById(id);
let trainer=createCalibrationEngine();
let workspace=false;
const panel=$('calibration-workspace-panel');
panel.innerHTML=`<p class="eyebrow">02 / CALIBRATION TRAINING</p><h2>Two gases. One documented procedure.</h2>
<p class="hint">Procedural training only. The gas values do not calculate a device result. No live DCS connection.</p>
<div class="state-strip"><strong id="cal-state" role="status"></strong><span id="cal-loop"></span></div>
<p id="cal-procedure" aria-live="polite"></p><p id="cal-startup" class="hint"></p>
<p id="cal-mode-summary" class="hint" hidden></p><div id="cal-mode-settings" class="cal-settings"><label for="cal-interface">Training interface</label><select id="cal-interface"><option value="loi">LOI · Chapter 9 procedure</option><option value="keypad">Keypad · start at Gas 1 readiness fixture</option></select>
<label for="cal-guidance">Learning mode</label><select id="cal-guidance"><option value="guided">Guided</option><option value="practice">Practice · fewer hints</option></select></div>
<details id="cal-setup" open><summary>Preparation & gas configuration</summary>
<p id="cal-prepare-text" class="hint"></p><div class="cal-settings"><div><label for="cal-low">Low gas · % O₂, balance nitrogen</label><input id="cal-low" type="text" inputmode="decimal" aria-describedby="cal-gas-limits"></div><div><label for="cal-high">High gas · % O₂, balance nitrogen</label><input id="cal-high" type="text" inputmode="decimal" aria-describedby="cal-gas-limits"></div></div>
<p id="cal-gas-limits" class="hint"></p><label for="cal-first">Gas order</label><select id="cal-first"><option value="low">Low gas first</option><option value="high">High gas first</option></select>
<label for="cal-output">Educational output configuration</label><select id="cal-output"></select>
<label for="cal-scenario">Pre-authored device outcome · not calculated</label><select id="cal-scenario"></select>
<p id="cal-flow-caution" class="hint"></p><p class="hint">Gas handling is OFF / APPLIED at the documented training condition. No flow or pressure adjustment is simulated.</p>
<div class="button-row"><button id="cal-manual">Place simulated loop in MANUAL</button><button id="cal-verify">Verify parameters & flow caution</button></div><p id="cal-verified" class="hint"></p></details>
<p id="cal-keypad-boundary" class="boundary-note" hidden></p>
<button id="cal-start" class="primary wide">Start Calibration</button>
<div class="instrument"><p id="cal-instrument-label" class="instrument-label"></p><div id="cal-display-panel" class="loi-screen"><strong id="cal-display"></strong><span id="cal-measurement">O₂: --.-- %</span></div><p id="cal-led" class="cal-indicator"></p><p class="hint">LED patterns are described in text; no flash cadence is invented.</p>
<div id="cal-keypad" class="gas-keys" hidden><button disabled>INC HIGH GAS</button><button disabled>INC LOW GAS</button><button id="cal-cal" class="cal-key">CAL</button><button disabled>DEC HIGH GAS</button><button disabled>DEC LOW GAS</button></div>
<button id="cal-enter" class="wide">ENTER</button><p id="cal-key-note" class="hint" hidden>Gas-key increments are not specified. Use the educational gas setup above; INC/DEC remain read-only.</p></div>
<div class="cal-gases"><div><span>GAS 1</span><strong id="cal-gas1"></strong></div><div><span>GAS 2</span><strong id="cal-gas2"></strong></div></div>
<p id="cal-gas-state"></p><div class="button-row"><button id="cal-apply1">Apply Gas 1</button><button id="cal-apply2">Remove Gas 1 / apply Gas 2</button><button id="cal-remove">Remove gas / cap port</button></div>
<div class="time-controls"><p class="eyebrow">SIMULATION TIME CONTROL</p><p id="cal-timer" role="status"></p><div class="button-row"><button id="cal-30">+30 sec</button><button id="cal-60">+1 min</button><button id="cal-finish-timer">Complete current timer</button></div><p class="hint">Logical time only. Flow/Read share the documented gas period; separate Read timing and sensing dynamics are not modeled. Gas-application timeout uses the documented wait.</p></div>
<p id="cal-guided" class="guidance" aria-live="polite"></p>
<div class="button-row"><button id="cal-abort"></button><button id="cal-auto">Return simulated loop to AUTOMATIC</button><button id="cal-new">New training exercise</button></div>
<p id="cal-error" role="alert"></p>
<dl class="readouts"><div><dt>Output state</dt><dd id="cal-output-state"></dd></div><div><dt>TP5 / TP6 exact example</dt><dd id="cal-tp"></dd></div></dl>
<p id="cal-device-outcome" class="boundary-note"></p><p id="cal-diagnostic" class="hint"></p><p id="cal-retention" class="hint"></p>
<details><summary>Source / current procedure</summary><p id="cal-step-source" class="source"></p><p id="cal-fact-source" class="source"></p><ol id="cal-history" class="cal-history"></ol></details>
<details><summary>Slope, constant & calibration records</summary><p id="cal-math"></p><p id="cal-bounds"></p><p>Calculation is blocked. A procedure can be complete even when the selected device scenario reports an invalid result.</p><p id="cal-records"></p><p id="cal-math-source" class="source"></p></details>
<details><summary>Semi-automatic / automatic overview</summary><h3>Semi-automatic</h3><p id="cal-semiauto"></p><h3>Automatic</h3><p id="cal-automatic"></p><p class="boundary-note">Sequencer internal behavior is outside the supplied Oxymitter 4000 manual and is not simulated. The discontinued calibration-recommended automatic trigger remains blocked.</p><p id="cal-sequencer-source" class="source"></p></details>
<details><summary>Source conflicts & blocked behavior</summary><div id="cal-gaps"></div></details>`;
const settings=['cal-interface','cal-low','cal-high','cal-first','cal-output','cal-scenario'];
function fillSetup(){const s=trainer.snapshot();$('cal-interface').value=s.configuration.interface;$('cal-low').value=s.configuration.low;$('cal-high').value=s.configuration.high;$('cal-first').value=s.configuration.first;$('cal-output').value=s.configuration.output;$('cal-scenario').value=s.configuration.scenario;}
for(const kind of ['low','high']){const b=read(base.calibration[kind+'Gas']);$('cal-'+kind).min=b.min;$('cal-'+kind).max=b.max;}
for(const v of read(base.operating.calibrationOutputChoices))$('cal-output').add(new Option(v==='HOLD'?'HOLD LAST VALUE':v,v));
for(const [id,d] of Object.entries(data.scenarios))$('cal-scenario').add(new Option(read(d).title,id));
$('cal-prepare-text').textContent=read(data.facts.preparation);
$('cal-flow-caution').textContent=read(base.calibration.flowSettingRule)+'. '+read(data.facts.flowCaution);
$('cal-gas-limits').textContent=`Low ${formatDatum(base.calibration.lowGas)}; high ${formatDatum(base.calibration.highGas)}. Typical pair: ${formatDatum(base.calibration.typicalGases)}. ${read(base.calibration.gasOrder)}.`;
$('cal-math').textContent=[data.facts.mathematics,data.facts.slopeConcept,data.facts.constantConcept].map(read).join(' ');
$('cal-bounds').textContent=`Slope bounds: ${formatDatum(base.calibration.slopeLimits)}. Constant bounds: ${formatDatum(base.calibration.constantLimits)}.`;
$('cal-math-source').textContent=['E01','E67','E70','E71'].map(source).join('\n');
$('cal-semiauto').textContent=read(data.facts.semiauto);$('cal-automatic').textContent=read(data.facts.automatic);$('cal-sequencer-source').textContent=source('E72');
$('cal-fact-source').textContent=['E17','E18','E31','E56','E67','E68','E69','E71'].map(source).join('\n');
for(const [key,d] of Object.entries(data.blocked)){const p=document.createElement('p');p.textContent=`${d.gapId} · ${d.reason}`;const ref=document.createElement('p');ref.className='source';ref.textContent=source(d.source.evidenceId);$('cal-gaps').append(p,ref);}
function render(){const s=trainer.snapshot();const keypad=s.configuration.interface==='keypad';
 $('cal-state').textContent=s.label;$('cal-loop').textContent=`Loop: ${s.loop}`;$('cal-procedure').textContent=s.procedure;
 $('cal-startup').textContent=`Startup engine: ${startup.snapshot().device.state}. ${startup.snapshot().device.state==='NORMAL OPERATION'?'Startup prerequisite satisfied.':'Complete startup before calibration.'}`;
 $('cal-display').textContent=keypad?`Training step: ${s.label}`:s.state==='NORMAL'?'NORMAL':s.prompt;$('cal-display-panel').className=keypad?'cal-step-readout':'loi-screen';$('cal-instrument-label').textContent=keypad?'MEMBRANE KEYPAD · TRAINING':'LOI · CALIBRATION ONLY';
 $('cal-measurement').hidden=keypad||s.state!=='NORMAL';$('cal-keypad').hidden=!keypad;$('cal-enter').hidden=keypad;$('cal-key-note').hidden=!keypad;
 $('cal-led').textContent=`CAL activity LED: ${s.calLed}`;$('cal-keypad-boundary').hidden=!keypad;$('cal-keypad-boundary').textContent=data.blocked.arming.reason;
 $('cal-gas1').textContent=`${s.gas1}% O₂`;$('cal-gas2').textContent=`${s.gas2}% O₂`;
 $('cal-gas-state').textContent=s.gas===null?`GAS OFF · Port ${s.capped?'capped':'not capped'}`:`GAS ${s.gas} APPLIED · ${s.concentration}% O₂ · documented training condition`;
 $('cal-timer').textContent=s.remaining===null?'No documented timer running':`${s.remaining} s remaining · ${s.state.startsWith('APPLY')?'gas application wait':s.state==='PURGE'?'purge':'grouped gas period'}`;
 $('cal-guided').hidden=$('cal-guidance').value!=='guided';$('cal-guided').textContent=s.finished&&!s.needsAutomatic?'Session finished. Review the source and records, or start a new training exercise.':s.guide;
 $('cal-verified').textContent=`Parameters: ${s.verified?'verified':'verification required'}. Loop: ${s.loop}.`;
 $('cal-start').textContent=keypad?'Load Gas 1 readiness training fixture':'CALIBRATION → Start Calibration';
 const gesture=read(data.facts.keypadAbort);$('cal-abort').textContent=keypad?`Simulate CAL ×${gesture.presses} within ${gesture.withinSeconds}s`:'Abort Calib';
 $('cal-abort').disabled=!s.active||s.aborted;$('cal-new').disabled=s.active||s.loop!=='AUTOMATIC';$('cal-start').disabled=s.active;$('cal-start').hidden=s.active;$('cal-mode-settings').hidden=s.active;$('cal-mode-summary').hidden=!s.active;$('cal-mode-summary').textContent=`${keypad?'Keypad readiness fixture':'LOI'} · ${$('cal-guidance').value==='guided'?'Guided':'Practice'} · ${s.configuration.output}`;$('cal-startup').hidden=s.active;
 for(const id of settings)$(id).disabled=s.active;for(const id of ['cal-manual','cal-verify'])$(id).disabled=s.active;
 // Other training actions remain selectable so practice errors are educational validation, not fabricated alarms.
 for(const id of ['cal-30','cal-60','cal-finish-timer'])$(id).disabled=s.remaining===null;
 $('cal-output-state').textContent=s.outputMode+' · numeric mA not simulated';
 $('cal-tp').textContent=s.gas===null?'No calibration gas selected':s.tp?`${formatDatum(s.tp.oxygenPercent)} → ${formatDatum(s.tp.voltage)} (documented example; not live measurement)`:'No exact TP5/TP6 numerical value documented for this selected gas in the current source model.';
 $('cal-device-outcome').textContent=s.scenario?`TRAINING SCENARIO: ${s.scenario.title}. Pre-authored; not calculated from gases or readings.`:'Device result: not calculated. The selected scenario will be revealed after Gas 2.';
 $('cal-diagnostic').textContent=s.diagnostic?`Fixture diagnostic: ${read(s.diagnostic.alarm)} · ${read(s.diagnostic.diagnosticLed)} LED: ${read(s.diagnostic.blinkCount)} flash, ${read(s.diagnostic.pause)} s pause (text only), until purge ends. LOI alarm reference: ${read(s.diagnostic.loiMessage)}. ${source(s.diagnostic.alarm.source.evidenceId)}`:s.scenario?.diagnostic??'No device alarm inferred from training actions.';
 $('cal-retention').textContent=s.retention;$('cal-records').textContent=`Current: ${s.current}. Previous: ${s.previous}. Failed values are not loaded.`;
 $('cal-step-source').textContent=source(s.source.evidenceId);
 $('cal-history').replaceChildren();for(const h of s.history){const li=document.createElement('li');li.textContent=`${h.event} → ${h.state}. ${source(h.source.evidenceId)}`;$('cal-history').append(li);}
 $('startup-workspace').disabled=s.active;$('diagnostic-workspace').disabled=s.active;
 if(workspace)$('power-off').disabled=s.active||startup.snapshot().device.state==='POWER OFF';
}
function run(fn){try{fn();$('cal-error').textContent='';}catch(e){$('cal-error').textContent=e.message+' Expected next step: '+trainer.snapshot().guide;}render();}
function configure(){const low=$('cal-low').value.trim(),high=$('cal-high').value.trim();trainer.configure({interface:$('cal-interface').value,low:low===''?NaN:Number(low),high:high===''?NaN:Number(high),first:$('cal-first').value,output:$('cal-output').value,scenario:$('cal-scenario').value});}
for(const id of settings)$(id).addEventListener('change',()=>run(configure));
$('cal-guidance').onchange=render;
$('cal-manual').onclick=()=>run(()=>trainer.manual());$('cal-verify').onclick=()=>run(()=>{configure();trainer.verify();});
$('cal-start').onclick=()=>run(()=>{trainer.start(startup.snapshot().device.state);$('cal-setup').open=false;});
$('cal-apply1').onclick=()=>run(()=>trainer.apply(1));$('cal-apply2').onclick=()=>run(()=>trainer.apply(2));$('cal-remove').onclick=()=>run(()=>trainer.removeAndCap());
for(const id of ['cal-enter','cal-cal'])$(id).onclick=()=>run(()=>trainer.acknowledge());
$('cal-30').onclick=()=>run(()=>trainer.advance(30));$('cal-60').onclick=()=>run(()=>trainer.advance(60));$('cal-finish-timer').onclick=()=>run(()=>trainer.advance(trainer.snapshot().remaining));
$('cal-abort').onclick=()=>run(()=>trainer.abort(trainer.snapshot().abortMechanism));
$('cal-auto').onclick=()=>run(()=>trainer.automatic());$('cal-new').onclick=()=>{trainer=createCalibrationEngine();fillSetup();$('cal-setup').open=true;$('cal-error').textContent='';render();};
function show(calibration){workspace=calibration;document.querySelector('.workbench').classList.toggle('calibration-active',calibration);$('controls').hidden=calibration;panel.hidden=!calibration;$('startup-workspace').setAttribute('aria-pressed',String(!calibration));$('calibration-workspace').setAttribute('aria-pressed',String(calibration));render();}
$('startup-workspace').onclick=()=>show(false);$('calibration-workspace').onclick=()=>show(true);
for(const id of ['power-on','power-off','complete','minute','five'])$(id).addEventListener('click',render);
fillSetup();render();
// Read-only training orchestration boundary; device semantics remain in M3.
export const calibrationSnapshot=()=>trainer.snapshot();
