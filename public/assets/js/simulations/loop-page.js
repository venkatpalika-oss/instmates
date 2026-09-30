import { DEFAULTS, simulate, DIAGNOSTICS, CHALLENGES } from './loop-model.js';
import { number, text, format, setMeter } from './ui.js';
const $ = id => document.getElementById(id);
const numeric = ['lrv','urv','pv','dcsLrv','dcsUrv','manual','stuck','zero','span'];
let challenge = -1;
let savedSandbox = null;
let announcement;
function read() {
  return { ...Object.fromEntries(numeric.map(id => [id, number(id)])),
    fault:$('fault').value, mode:$('mode').value, unit:$('unit').value };
}
function apply(s) { for (const [id,value] of Object.entries(s)) $(id).value = value; }
function update() {
  try {
    const s = read(), r = simulate(s), unit = s.unit;
    $('input-error').hidden=true;
    $('signal-path').classList.remove('invalid');
    for (const id of numeric) $(id).removeAttribute('aria-invalid');
    $('manual-control').hidden=s.mode !== 'manual';
    for (const f of ['stuck','zero','span']) $(`${f}-control`).hidden=s.fault !== f;
    $('pv-slider').value=Math.max(0, Math.min(100,r.percent));
    $('pv-slider').setAttribute('aria-valuetext', `${format(r.percent)} percent of transmitter range; process ${format(s.pv)} ${unit}`);
    text('process-reading',`${format(s.pv)} ${unit}`);
    text('percent-reading',`${format(r.percent)}% of span`);
    text('tx-reading',`${format(r.tx)} mA`);
    text('expected-reading',`Ideal: ${format(r.expected)} mA`);
    text('loop-reading',`${format(r.loop)} mA`);
    text('input-reading',`${format(r.input)} mA`);
    text('mobile-process',`${format(s.pv)} ${unit}`);
    text('mobile-ideal',`${format(r.expected)} mA`);
    text('mobile-loop',`${format(r.loop)} mA`);
    text('mobile-dcs',r.displayed === null ? 'BAD SIGNAL' : `${format(r.displayed)} ${unit}`);
    text('scale-reading',`${format(s.dcsLrv)} → ${format(s.dcsUrv)} ${unit}`);
    text('display-reading',r.displayed === null ? 'BAD SIGNAL' : `${format(r.displayed)} ${unit}`);
    text('display-note',r.quality === 'BAD' ? 'Engineering indication suppressed' : 'Engineering indication');
    text('quality',`${r.quality} signal`);
    $('quality').dataset.warning=String(r.quality !== 'GOOD');
    text('raw-reading',`${format(r.rawDcs)} ${unit}${r.quality === 'BAD' ? ' (invalid signal)' : ''}`);
    text('error-reading',r.displayed === null ? 'Unavailable' : `${format(r.displayed-s.pv)} ${unit}`);
    setMeter('process-meter',r.percent);
    $('signal-path').classList.toggle('flowing',r.loop > 0);
    $('wire-node').classList.toggle('node-warning',r.loop !== r.tx);
    $('input-node').classList.toggle('node-warning',r.input !== r.loop || r.scalingMismatch);
    // Presentation only: the numerical model remains the single source of truth.
    const reveal = challenge < 0;
    $('signal-path').dataset.fault = reveal ? s.fault : 'challenge';
    $('pressure-needle').style.transform = `rotate(${Math.max(0,Math.min(100,r.percent))*2.4-120}deg)`;
    $('transmitter-node').classList.toggle('node-warning',reveal && Math.abs(r.tx-r.expected) > .001);
    $('display-node').classList.toggle('node-warning',reveal && r.scalingMismatch);
    // In challenges expose measurements, not a visual diagnosis.
    if (!reveal) for (const id of ['wire-node','input-node']) $(id).classList.remove('node-warning');
    text('tx-delta',`Command − ideal: ${format(r.tx-r.expected)} mA`);
    text('wire-condition',reveal && s.fault === 'open' ? 'OPEN PATH' : r.loop > 0 ? 'CURRENT PRESENT' : 'NO CURRENT');
    text('receiver-condition',!reveal ? 'Compare measurement points' : s.fault === 'short' ? 'Sensing input bypassed' : r.scalingMismatch ? 'Range differs from transmitter' : 'Range matches transmitter');
    const visualNotes = {
      normal:'Trace the current into the receiver, then compare its engineering indication with the process reference.',
      open:'Series path disconnected: no current flows anywhere in the loop. The transmitter command is not a measured output.',
      short:'Receiver sensing input bypassed: series current continues, but current through the sensing input is zero.',
      stuck:'Output is held at the selected current. Change the process value and compare the ideal output with the fixed current.',
      zero:'Compare ideal and commanded output: the selected zero offset is applied before saturation in process mode.',
      span:'Compare ideal and commanded output: the span error grows with process position in process mode.',
      scaling:'The current path remains healthy. Compare the transmitter range with the receiver endpoints.'
    };
    text('visual-state-note',reveal ? visualNotes[s.fault] : 'Inspect the live measurements. Choose your first investigation below before revealing an explanation.');
    for (const [target,source] of [['card-process','process-reading'],['card-ideal','expected-reading'],['card-loop','loop-reading'],['card-dcs','display-reading']]) text(target,$(source).textContent.replace('Ideal: ',''));
    $('card-loop').parentElement.classList.toggle('measurement-warning',Math.abs(r.loop-r.expected) > .001);
    $('card-dcs').parentElement.classList.toggle('measurement-warning',r.displayed === null || Math.abs(r.displayed-s.pv) > .001);
    let observation = `Ideal ${format(r.expected)} mA · measured loop ${format(r.loop)} mA · receiver input ${format(r.input)} mA.`;
    if (r.saturated) observation += ' Process output is at the model saturation limit.';
    text('observation',observation);
    text('what',r.quality === 'BAD'
      ? 'The receiver input is outside this model’s valid signal limits. The raw conversion is arithmetic only; it is not a valid process indication.'
      : `The receiver converts ${format(r.input)} mA using its own engineering endpoints. Compare its ${format(r.rawDcs)} ${unit} indication with the process reference, then trace the signal upstream.`);
    text('worked',`Ideal output: 4 + ((${format(s.pv)} − ${format(s.lrv)}) / (${format(s.urv)} − ${format(s.lrv)})) × 16 = ${format(r.expected)} mA. Reverse conversion uses the receiver’s endpoints.`);
    text('diagnosis',DIAGNOSTICS[s.fault] + (r.scalingMismatch && s.fault !== 'scaling' ? ' The transmitter and receiver endpoints also differ.' : ''));
    text('fault-hint',s.mode === 'manual' && ['zero','span'].includes(s.fault)
      ? 'Forced-current mode bypasses process zero/span errors. Select Follow process value to observe this fault.'
      : s.fault === 'short' ? 'Topology: short across the receiver sensing resistor. Other shorts behave differently.'
      : s.fault === 'scaling' ? 'Receiver span preset to half transmitter span when selected. Adjust endpoints to explore or correct it.'
      : 'Observe readings before revealing diagnostic checks.');
    clearTimeout(announcement);
    announcement=setTimeout(()=>text('live-summary',`${observation} DCS ${r.displayed === null ? 'bad signal' : format(r.displayed)+' '+unit}.`),300);
  } catch (e) {
    clearTimeout(announcement);
    text('input-error',`${e.message} Correct the inputs to resume live readings.`); $('input-error').hidden=false;
    $('signal-path').classList.add('invalid'); $('signal-path').classList.remove('flowing');
    for (const id of ['process-reading','percent-reading','tx-reading','expected-reading','loop-reading','input-reading','scale-reading','display-reading','raw-reading','error-reading','worked','mobile-process','mobile-ideal','mobile-loop','mobile-dcs','card-process','card-ideal','card-loop','card-dcs','tx-delta','wire-condition','receiver-condition']) text(id,'—');
    $('signal-path').dataset.fault='invalid';
    $('pressure-needle').style.transform='rotate(-120deg)';
    for (const el of document.querySelectorAll('.node-warning,.measurement-warning')) el.classList.remove('node-warning','measurement-warning');
    text('visual-state-note','Correct the inputs to resume the equipment visualization.');
    text('quality','INVALID INPUT'); $('quality').dataset.warning='true';
    text('what','Live calculations are paused until all inputs are valid.');
    text('observation','No valid simulation result. Previous readings have been cleared.');
    text('display-note','Calculation paused'); setMeter('process-meter',0);
    text('diagnosis','Correct the inputs before diagnosing a signal.');
    for (const id of numeric) if (!$(id).validity.valid) $(id).setAttribute('aria-invalid','true');
    if (Number.isFinite($('lrv').valueAsNumber) && $('urv').valueAsNumber <= $('lrv').valueAsNumber) $('urv').setAttribute('aria-invalid','true');
    if (Number.isFinite($('dcsLrv').valueAsNumber) && $('dcsUrv').valueAsNumber <= $('dcsLrv').valueAsNumber) $('dcsUrv').setAttribute('aria-invalid','true');
  }
}
$('controls').addEventListener('submit',e=>e.preventDefault());
$('controls').addEventListener('input', e=>{
  if (e.target.id === 'pv-slider') {
    const low=$('lrv').valueAsNumber, high=$('urv').valueAsNumber;
    if (Number.isFinite(low) && Number.isFinite(high) && high>low) $('pv').value=low+(high-low)*Number(e.target.value)/100;
  }
  if (e.target.id === 'fault') {
    $('diagnostics').open=false;
    if (e.target.value === 'scaling') {
      const low=$('lrv').valueAsNumber, high=$('urv').valueAsNumber;
      if (Number.isFinite(low) && high>low) { $('dcsLrv').value=low; $('dcsUrv').value=low+(high-low)/2; }
    }
  }
  update();
});
$('match-range').addEventListener('click',()=>{ $('dcsLrv').value=$('lrv').value; $('dcsUrv').value=$('urv').value; update(); });
function exitChallenge(restore=true) {
  challenge=-1;
  $('controls').hidden=false; $('diagnostics').hidden=false; $('diagnostics').open=false;
  $('challenge-form').hidden=true; $('start-challenge').hidden=false;
  text('challenge-count','3 scenarios'); text('challenge-feedback','');
  text('challenge-prompt','Load a scenario, inspect the readings, then choose where to investigate first. Fault controls are hidden during a challenge.');
  if (restore && savedSandbox) apply(savedSandbox);
  savedSandbox=null; update();
}
$('reset').addEventListener('click',()=>{exitChallenge(false); apply(DEFAULTS); update();});
function loadChallenge(index) {
  challenge=index;
  apply({...DEFAULTS,...CHALLENGES[index].state}); update();
  $('controls').hidden=true; $('diagnostics').hidden=true; $('diagnostics').open=false;
  $('challenge-form').hidden=false; $('start-challenge').hidden=true;
  $('challenge-form').reset(); $('next-challenge').hidden=true;
  $('challenge-form').querySelector('button[type="submit"]').disabled=false;
  for (const radio of document.querySelectorAll('[name="diagnosis"]')) radio.disabled=false;
  text('challenge-count',`${index+1} / ${CHALLENGES.length}`);
  text('challenge-prompt',`${CHALLENGES[index].title}. Transmitter range 0–10 bar. Inspect the live path above. Where would you investigate first?`);
  text('challenge-feedback','');
  document.querySelector('[name="diagnosis"]').focus();
}
$('start-challenge').addEventListener('click',()=>{
  try {savedSandbox=read(); simulate(savedSandbox);} catch {savedSandbox={...DEFAULTS};}
  loadChallenge(0);
});
$('exit-challenge').addEventListener('click',()=>{exitChallenge(); $('start-challenge').focus();});
$('next-challenge').addEventListener('click',()=>loadChallenge((challenge+1)%CHALLENGES.length));
$('challenge-form').addEventListener('submit',e=>{
  e.preventDefault();
  const selected=new FormData(e.currentTarget).get('diagnosis');
  if (!selected) {text('challenge-feedback','Choose an investigation before checking your diagnosis.'); return;}
  const scenario=CHALLENGES[challenge];
  text('challenge-feedback',`${selected === scenario.answer ? 'Correct first check.' : 'Reconsider the measurement points.'} ${scenario.explanation}`);
  $('next-challenge').hidden=false;
  e.currentTarget.querySelector('button[type="submit"]').disabled=true;
  for (const radio of document.querySelectorAll('[name="diagnosis"]')) radio.disabled=true;
});
apply(DEFAULTS); update();
