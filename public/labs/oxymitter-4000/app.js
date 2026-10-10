import {MANUAL,FAULTS,initial,span,fault,act,readings,inCalibration,logicRole} from './model.js';
let state=initial(),z=0,locked=true,feedbackTimer;
const $=id=>document.getElementById(id),num=(v,dp=2)=>v===null?'—':Number(v).toFixed(dp);
const sources=[
 ['Measurement principle','Logarithmic zirconia-cell signal; 20.95% reference oxygen.','§1.3 · pp. 17–18',17],
 ['Configuration source & signal range','LOCAL hardware ranges: 0–10% / 0–25%; HART/AMS software range up to 0–40%. Hardware changes require power off.','§3.4.1–2 · pp. 67–68',68],
 ['Startup & operating indications','Approximately 30-minute warm up; bottom-up accumulating LEDs at startup, then top-down one at a time.','§5.1.1–2 · p. 79; §6.1.1–2 · p. 85',79],
 ['Test points','TP1/TP2: cell mV. TP3/TP4: heater thermocouple. TP5/TP6: process/calibration oxygen, 1 V per 1% O₂.','§5.2.3–4 · pp. 82–83',82],
 ['Cell mV lookup','Exact manufacturer tabulation at 736°C and 20.95% reference oxygen; no fitted response curve.','Figure 8-1 / Table 8-1 · pp. 107–108',108],
 ['Fault output and blink counts','Each modeled fault follows the documented LED group, count, current behavior and recoverability. Table 8-2 provides LOI labels.','Table 2-8 · p. 53; Table 8-2 · p. 111',53],
 ['Logic I/O assignment','Alarm modes 0–7; sequencer handshake modes 8–9. Handshake use removes the alarm-contact function.','Table 2-9 · p. 54; §8.4 · pp. 109–110',54],
 ['Track / hold during calibration','Output tracks O₂ by default; holding the last O₂ value is configurable.','§4.6 · p. 77; §8.4 · p. 110',110],
 ['Calibration phases & retention','Two gases; default 5-minute sampling and 3-minute purge. 30-minute gas wait abort. Previous values retained after invalid/aborted calibration.','§9.2.2 · pp. 143–147',146],
 ['LOI lockout','Z-pattern unlock; default inactivity timeout is 30 seconds. This is an isolated exercise.','§6.2.2 · p. 90',90],
 ['Disabled historical feature','Calibration Recommended disabled/discontinued in 2014, despite retained menu entries and older procedure references.','Table 2-8 footnote · p. 53; §5.2.2 · p. 82',82],
];
const logicOptions=['0 · No alarm','1 · Unit alarm','2 · Low O₂ (threshold not modeled)','3 · Unit alarm + low O₂','4 · Calibration Recommended (legacy/disabled)','5 · Unit + Calibration Recommended (legacy)','6 · Low O₂ + Calibration Recommended (legacy)','7 · Unit + low O₂ + Calibration Recommended','8 · Sequencer handshake (legacy trigger disabled)','9 · Sequencer handshake (no recommended trigger)'];
const calInfo={
 idle:['Ready to begin','Start from a simulated operating state with no fault. The first CAL action arms the sequence.','Off','CAL · arm calibration'],
 armed:['Calibration armed','The CAL LED is steady. A second CAL action starts the gas sequence and captures the output for Hold. Historical Calibration Recommended indication is omitted per the edition caveat.','Steady','CAL · begin gas sequence'],
 ready1:['Waiting for first gas','CAL flashes continuously. Apply the first gas scenario, then press CAL. A 30-minute wait abort can be explored below.','Continuous flash','CAL · sample first gas'],
 sample1:['Sampling first gas','CAL is steady while the first gas is sampled. Advance the documented default 5-minute interval explicitly. No measured response is calculated.','Steady',''],
 ready2:['Waiting for second gas','CAL flashes continuously. Replace the first gas with the second gas scenario, then press CAL.','Continuous flash','CAL · sample second gas'],
 sample2:['Sampling second gas','CAL is steady. Advance the gas timer to reveal the externally selected result. The same default gas-time interval is used.','Steady',''],
 result:['Calibration result','The result is selected by you, not calculated. Remove the second gas scenario, then press CAL to start purge.','Result','CAL · start purge'],
 purge:['Purging','CAL is steady for the default 3-minute purge. The return-to-process gas curve is not modeled. Held current releases when purge completes.','Steady','']
};
function href(page){return `${MANUAL}#page=${page}`;}
for(const a of document.querySelectorAll('[data-page]')){a.href=href(a.dataset.page);a.target='_blank';a.rel='noopener noreferrer';}
for(const id of ['top-manual','evidence-manual']){$(id).href=MANUAL;$(id).target='_blank';$(id).rel='noopener noreferrer';}
$('fault-select').innerHTML=FAULTS.map(f=>`<option value="${f.id}">${f.id} · ${f.name}</option>`).join('');
$('logic').innerHTML=logicOptions.map((t,i)=>`<option value="${i}">${t}</option>`).join('');
$('evidence-list').innerHTML=sources.map(([title,body,label,page])=>`<div class="evidence-item"><h4>${title}</h4><p>${body}</p><a class="source-link" href="${href(page)}" target="_blank" rel="noopener noreferrer">${label} ↗</a></div>`).join('');
function feedback(message){$('feedback').textContent=message;$('feedback').classList.add('visible');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('feedback').classList.remove('visible'),4500);}
function dispatch(action,value,message){state=act(state,action,value);render();if(message)feedback(message);}
function switchTab(name){for(const tab of document.querySelectorAll('.tab')){const on=tab.dataset.tab===name;tab.classList.toggle('active',on);if(on)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}for(const panel of document.querySelectorAll('.panel'))panel.hidden=panel.id!==`${name}-panel`;}
for(const tab of document.querySelectorAll('.tab'))tab.addEventListener('click',()=>switchTab(tab.dataset.tab));
function field(id,event,fn){$(id).addEventListener(event,fn);}
field('oxygen','input',()=>{const v=Number($('oxygen').value);const valid=$('oxygen').value.trim()!==''&&Number.isFinite(v)&&v>=0&&v<=40;$('oxygen').setAttribute('aria-invalid',String(!valid));if(valid){state=act(state,'o2',v);render(false);}else feedback('Enter a simulated oxygen value from 0 to 40%.');});
field('oxygen-slider','input',()=>dispatch('o2',Number($('oxygen-slider').value)));
for(const p of document.querySelectorAll('[data-o2]'))p.addEventListener('click',()=>dispatch('o2',Number(p.dataset.o2)));
field('power','click',()=>dispatch('power',null,state.power?'Power off. Hardware settings can now be changed.':'Startup entered. Advance explicitly when ready.'));
field('finish-warm','click',()=>dispatch('warm',null,'Operating-temperature snapshot entered. Actual startup is approximately 30 minutes.'));
for(const [id,key,convert] of [['config-mode','mode',String],['local-span','localSpan',Number],['failure','fail',Number],['loop','loop',String]])field(id,'change',()=>dispatch(key,convert($(id).value)));
field('hart-span','change',()=>{const v=Number($('hart-span').value);if(v<=0||v>40||!Number.isFinite(v)){feedback('HART upper range must be greater than 0 and no more than 40%.');render();return;}dispatch('hartSpan',v);});
for(const [id,key,convert] of [['cal-output','calOutput',String],['outcome','outcome',String],['logic','logic',Number]])field(id,'change',()=>dispatch(key,convert($(id).value)));
for(const id of ['gas1','gas2'])field(id,'change',()=>{const v=Number($(id).value);if(v<0.01||v>40||!Number.isFinite(v)){feedback('Use a scenario concentration between 0.01 and 40%.');render();return;}dispatch(id,v);});
field('cal-key','click',()=>dispatch('cal'));
field('apply-gas','click',()=>dispatch('applyGas',null,'Gas snapshot changed. No gas flow or transport response is modeled.'));
field('advance-cal','click',()=>dispatch('advance'));
field('abort-cal','click',()=>dispatch('abort',null,'Scenario aborted. Previous calibration record retained.'));
field('timeout-cal','click',()=>dispatch('timeout',null,'30-minute wait scenario: calibration aborted. Previous record retained.'));
field('inject-fault','click',()=>dispatch('fault',Number($('fault-select').value),'Documented fault scenario applied.'));
field('remove-cause','click',()=>dispatch('removeCause',null,'Simulated cause removed. Non-self-clearing alarms still require a reset.'));
field('cycle-power','click',()=>{if(state.power)state=act(state,'power');state=act(state,'power');render();feedback('Power cycled. Open Explore and advance startup. An unremoved cause remains active.');});
field('reset','click',()=>{state=initial();z=0;locked=true;render();renderLock();feedback('Lab reset to the initial 3% O₂ operating example.');});
field('range-experiment','click',()=>{state=initial();state=act(state,'power');render();feedback('3% example set, power off. Select 0–25%, power on, then advance startup.');});
for(const b of document.querySelectorAll('[data-z]'))b.addEventListener('click',()=>{if(!locked){feedback('LOI exercise is already unlocked. Simulate inactivity to lock again.');return;}const choice=Number(b.dataset.z);if(choice===z){z++;if(z===4){locked=false;z=0;feedback('Z pattern accepted. The LK indication clears.');}}else{z=choice===0?1:0;feedback('Pattern restarted. Begin at top left.');}renderLock();});
field('lock-loi','click',()=>{locked=true;z=0;renderLock();feedback('Default 30-second inactivity interval advanced. LOI exercise locked.');});
function renderLock(){$('lock-symbol').textContent=locked?'LK':'—';$('loi-message').textContent=locked?'Locked':'Unlocked';$('loi-message').parentElement.dataset.locked=String(locked);$('z-progress').textContent=locked?(z?`${z} of 4 touches accepted.`:'Top left → top right → bottom left → bottom right.'):'LK cleared. Pressing the top-left key again enters the real LOI menu (§6.2.2). Menu navigation is not emulated.';}
function render(updateInput=true){
 const r=readings(state),f=fault(state),range=span(state),busy=inCalibration(state);
 document.body.dataset.status=!state.power?'off':f?(f.critical?'critical':'warning'):state.warm||state.cal!=='idle'?'active':'normal';
 $('logic-role').parentElement.dataset.alarm=String(!!f&&[1,3,5,7].includes(state.logic));
 const label=!state.power?'Power off':state.warm?'Warming up':f?f.name:state.cal!=='idle'?'Calibration':'Measuring';
 $('state-name').textContent=label;$('state-dot').className=`dot ${!state.power?'gray':f?(f.critical?'red':'amber'):state.warm||state.cal!=='idle'?'amber':''}`;
 $('state-subtitle').textContent=state.warm?'Approx. 30 min in manual · advanced by you':'Simulated operating state';
 $('display-label').textContent=f?'DOCUMENTED ALARM':state.warm?'STARTUP STATE':'OXYGEN CONCENTRATION';
 $('display-o2').textContent=!state.power?'OFF':state.warm?'Warm up':f?'ALARM':num(r.seen);
 $('display-o2').style.fontSize=state.warm?'38px':f?'44px':'';
 $('display-unit').textContent=!state.power||state.warm||f?'':'% O₂';
 $('display-status').textContent=f?`${f.name.toUpperCase()} · FAULT ${f.id}`:state.cal!=='idle'?`SIMULATED · ${state.cal.toUpperCase()}`:state.power?'SIMULATED · NORMAL OPERATION':'SIMULATED · POWER OFF';
 const leds=['HEATER T/C','HEATER','O₂ CELL','CALIBRATION'];$('leds').innerHTML=leds.map((name,i)=>`<div class="led-item ${!state.power?'':f?(f.led===i?'fault':''):state.warm?'warm':'run'}" style="--i:${i};--r:${3-i}"><div class="led-bulb"></div>${name}</div>`).join('');
 $('led-note').textContent=!state.power?'Diagnostic LEDs off in this learning view.':f?`${leds[f.led]}: ${f.blinks} repeating ${f.blinks===1?'blink':'blinks'}. Symbolic indication; cadence not emulated.`:state.warm?'Bottom-up accumulating lights, then all off. Animation pace is illustrative.':'One diagnostic LED at a time, top to bottom. Animation pace is illustrative.';
 $('ma').textContent=num(r.ma);$('ma-note').textContent=r.reason;$('ma-meter').style.width=r.ma===null?'0%':`${Math.max(0,Math.min(100,(r.ma-4)/16*100))}%`;
 $('mv').textContent=num(r.mv,1);$('mv-note').textContent=r.mv!==null?'Exact manual table value at 736°C and 20.95% reference O₂.':(!state.power||state.warm||f?'Cell mV withheld in this state.':'No exact table entry for this concentration. No interpolation.');
 $('tp').textContent=r.tp===null?'Not modeled / unavailable':`${num(r.tp)} Vdc`;$('record').textContent=state.accepted?`${state.accepted} accepted scenario(s)`:'Initial example';
 $('power-label').textContent=state.power?'On':'Off';$('power').textContent=state.power?'Switch power off':'Switch power on';$('finish-warm').hidden=!state.power||!state.warm;
 for(const [id,key] of [['config-mode','mode'],['local-span','localSpan'],['failure','fail'],['loop','loop']]){$(id).value=state[key];$(id).disabled=state.power;}
 $('hart-span').value=state.hartSpan;$('hart-span').disabled=state.mode!=='HART'||busy;
 $('config-note').textContent=state.power?'Hardware settings locked while powered. Power off to change SW1/SW2.':state.mode==='HART'?'HART controls the range. Local range switch has no effect in HART mode.':'LOCAL controls the range: 0–10% or 0–25%. §3.4.2.';
 if(updateInput){$('oxygen').value=state.o2;$('oxygen').setAttribute('aria-invalid','false');}$('oxygen-slider').max=range;$('oxygen-slider').value=Math.min(state.o2,range);$('slider-max').textContent=`${range}%`;
 for(const p of document.querySelectorAll('[data-o2]'))p.classList.toggle('selected',Number(p.dataset.o2)===state.o2);
 $('formula').textContent=`I = 4 + 16 × (O₂ / ${range})`;$('active-span').textContent=`0–${range}% O₂`;
 const x=52+(Math.min(state.o2,range)/range)*476;const y=117-(Math.min(state.o2,range)/range)*88;
 $('signal-graph').innerHTML=`<line x1="52" y1="117" x2="528" y2="117" stroke="#dce4df"/><line x1="52" y1="73" x2="528" y2="73" stroke="#edf1ec"/><line x1="52" y1="29" x2="528" y2="29" stroke="#edf1ec"/><text x="18" y="121" font-size="10" fill="#6a7d7c">4</text><text x="12" y="77" font-size="10" fill="#6a7d7c">12</text><text x="12" y="33" font-size="10" fill="#6a7d7c">20</text><text x="9" y="13" font-size="8" fill="#6a7d7c">mA</text><path d="M52 117L528 29" stroke="#008eae" stroke-width="2" fill="none"/>${state.o2<=range?`<line x1="${x}" y1="${y}" x2="${x}" y2="117" stroke="#008eae" stroke-dasharray="3 4"/><circle cx="${x}" cy="${y}" r="5" fill="#006a91" stroke="#fff" stroke-width="2"/>`:''}<text x="52" y="141" font-size="10" fill="#6a7d7c">0%</text><text x="510" y="141" font-size="10" fill="#6a7d7c">${range}%</text>`;
 $('signal-graph').setAttribute('aria-label',`Steady mapping: zero oxygen equals 4 mA, ${range}% equals 20 mA. Marker shows the hypothetical process input, not the current output during alarms or calibration.`);
 if(f){$('insight-title').textContent=f.critical?'Alarm current ≠ oxygen.':'A fault can still track O₂.';$('insight-body').textContent=f.critical?'This fault renders oxygen unusable. The loop goes to the selected SW2 level, not the signal-scaling value.':'Table 2-8 specifies Track O₂ for this fault. A continuing current does not prove measurement health.';}
 else if(state.warm){$('insight-title').textContent='Warm up before measurement.';$('insight-body').textContent='The LOI indicates Warm up. Startup uses the selected output level. Advancing here jumps to the operating-temperature state; it does not calculate heating.';}
 else {$('insight-title').textContent='Two signals. One measurement.';$('insight-body').textContent='The oxygen-cell voltage is logarithmic. The transmitter’s analog output represents oxygen on a linear 4–20 mA scale.';}
 $('insight-source').href=href(f?53:state.warm?79:17);$('insight-source').textContent=f?'Table 2-8 · p. 53 ↗':state.warm?'§5.1.1–2 · p. 79 ↗':'§1.3 · p. 17 ↗';
 for(const id of ['cal-ma','fault-ma'])$(id).textContent=`${num(r.ma)} mA`;for(const id of ['cal-reason','fault-reason'])$(id).textContent=r.reason;
 for(const [id,key] of [['cal-output','calOutput'],['gas1','gas1'],['gas2','gas2'],['outcome','outcome'],['logic','logic']]){$(id).value=state[key];$(id).disabled=busy;}
 const info=calInfo[state.cal];$('phase-title').textContent=state.cal==='result'?(state.outcome==='valid'?'Valid result scenario':'Invalid result scenario'):info[0];$('phase-description').textContent=info[1];$('cal-led').textContent=`CAL LED · ${state.cal==='result'?(state.outcome==='valid'?'2-pattern flash':'3-pattern flash'):info[2]}`;
 $('cal-key').textContent=info[3]||'CAL';$('cal-key').hidden=!info[3];$('cal-key').disabled=!state.power||state.warm||!!state.fault||(state.cal==='ready1'&&state.gas!=='gas1')||(state.cal==='ready2'&&state.gas!=='gas2')||(state.cal==='result'&&state.gas!=='removed');
 $('apply-gas').hidden=!['ready1','ready2','result'].includes(state.cal);$('apply-gas').textContent=state.cal==='ready1'?'Apply first gas (simulated)':state.cal==='ready2'?'Replace with second gas (simulated)':'Remove second gas (simulated)';$('apply-gas').disabled=(state.cal==='ready1'&&state.gas==='gas1')||(state.cal==='ready2'&&state.gas==='gas2')||(state.cal==='result'&&state.gas==='removed');
 $('advance-cal').hidden=!['sample1','sample2','purge'].includes(state.cal);$('advance-cal').textContent=state.cal==='purge'?'Advance 3-minute purge':'Advance 5-minute gas timer';
 $('abort-cal').disabled=state.cal==='idle';$('timeout-cal').hidden=!['ready1','ready2'].includes(state.cal);
 const stage=['idle','armed'].includes(state.cal)?0:['ready1','sample1'].includes(state.cal)?1:['ready2','sample2'].includes(state.cal)?2:state.cal==='result'?3:4;
 $('cal-steps').innerHTML=['Arm & initiate','First gas','Second gas','Selected result','Purge & return'].map((name,i)=>`<li class="${i===stage?'active':i<stage?'done':''}"><span class="step-number">${i<stage?'✓':i+1}</span>${name}</li>`).join('');
 $('retention').textContent=`${state.accepted} accepted scenario(s). Invalid and aborted calibrations retain the previous record. Scenario count represents retention behavior, not real calibration parameters.`;
 $('inject-fault').disabled=!state.power||state.warm||state.cal!=='idle';$('remove-cause').disabled=!state.fault||!state.cause;
 $('fault-details').innerHTML=f?`<h3>${f.name}</h3><p>${f.meaning}${!state.cause&&!f.self?' · cause removed; alarm awaits reset':''}</p><div class="fault-facts"><span class="tag">${f.critical?'SW2 failure current':'Track O₂'}</span><span class="tag">${f.self?'Self-clearing':'Reset required'}</span><span class="tag">${leds[f.led]} · ${f.blinks} blinks</span></div>`:'<h3>No injected fault</h3><p>Choose an alarm to see its documented output and LED code.</p>';
 $('logic-role').textContent=logicRole(state);$('logic-description').textContent=state.logic>=8?'Sequencer communication replaces the alarm function. No sequencer or pulse timing is simulated.':state.logic===0?'No alarm is assigned to the contact.':`Mode ${state.logic}: ${logicOptions[state.logic].split(' · ')[1]}. Low-O₂ conditions are not calculated. Calibration Recommended is disabled for this edition.`;
}
render();renderLock();
