import {SOURCE_DATA as base} from './source-data.mjs';
import {deepFreeze,readSupported,validateFixtureTree} from './provenance.mjs';
const fact=(value,evidenceId,unit='training reference')=>({value,unit,status:'SUPPORTED',source:{evidenceId}});
const blocked=(gapId,reason,evidenceId)=>({status:'UNSUPPORTED',availability:'BLOCKED',gapId,reason,source:{evidenceId}});
// Additional evidence narrows the page references; it does not change M1.
export const DIAGNOSTIC_EVIDENCE=deepFreeze({...base.evidence,
 DSAFE:{section:'Essential instructions; Safety instructions; 9.1; 9.3; 9.3.3',pages:[2,3,141,148,150],figureTable:'',description:'Hot equipment, covers/grounds and hazardous housing warnings'},
 D16:{section:'8.6',pages:[137],figureTable:'',description:'Auto Tune case'},
 D17:{section:'8.7.1',pages:[138,139],figureTable:'Fig 8-29',description:'Leak checks'},
 D19:{section:'8.7.2; 9.2.2',pages:[139,140,143],figureTable:'',description:'Diffuser restriction'},
 D21:{section:'9.3.10',pages:[161,162],figureTable:'Fig 9-8',description:'Damaged ceramic diffusion element'},
 DTC:{section:'9.3.11',pages:[162,163],figureTable:'Fig 9-9',description:'Contact and thermocouple assembly replacement'},
});
export const diagRead=d=>readSupported(d,DIAGNOSTIC_EVIDENCE);
export const DIAGNOSTIC_SAFETY=deepFreeze({
 general:fact('Educational training only; not authorization to service live equipment. The manual warns that opening the electronics housing in a hazardous area can cause an explosion and loss of hazardous permits; a company hot-work permit may be needed. Hazardous-voltage covers require power removal and trained service personnel; observe any specified waiting time before opening. Surfaces can remain hot after power removal. Replace protective covers and safety grounds after troubleshooting. Remove the transmitter from the stack for service and allow it to cool before servicing.','DSAFE'),
 live:fact('This is a virtual voltage/inspection check, not a live-work instruction. Follow the fault-specific access sequence. For Faults 1–3 LOI access, remove power before removing the LOI module, then reconnect power for the specified checks. Resistance checks require power removal and the specified disconnection.','F01'),
 j1:fact('Virtual prerequisite: remove power and disconnect J1 before resistance measurement. Do not measure resistance on an energized circuit in this exercise.','F02'),
 leads:fact('Virtual prerequisite: remove power and disconnect J1; resistance is across the red and yellow thermocouple leads.','F01'),
 heater:fact('Virtual prerequisite: remove power and remove the electronic assembly before measuring heater connector J8.','F05'),
 service:fact('Before service: remove the transmitter from the stack and allow it to cool. Preserve covers/ground leads and hazardous-area housing precautions. This exercise identifies the documented action; it does not perform the repair.','DSAFE'),
 cool:fact('Virtual source sequence: remove power, allow five minutes to cool, then restore power and check for recurrence. This does not model cooling or declare equipment safe to touch.','F06'),
 reference:fact('Source review only: no equipment state is changed. Read the documented condition and applicable warnings before choosing an action.','DSAFE'),
});
const check=(id,title,observation,ev,{meter=null,safety='reference'}={})=>({id,instruction:fact(title,ev),observation:fact(observation,ev),safety,meter:meter?fact(meter,ev,'scenario measurement'):blocked('M4-NUM','No numeric meter result is specified for this check.',ev)});
const meter=(location,mode,result,reference='')=>({location,mode,result,reference});
const action=(id,text,ev)=>({id,text:fact(text,ev)});
const scenarios=[];
function add(id,component,symptom,checks,diagnosis,corrective,ev,notes=''){
 scenarios.push({id,classification:'READY FOR M4',component,faultId:id.startsWith('F')?'fault-'+id.slice(1):null,symptom:fact(symptom,ev),checks,diagnosis:fact(diagnosis,ev),action:corrective,notes:fact(notes||'Deterministic source scenario; no physical trigger or repair recovery is calculated.',ev),numericExtension:blocked('M4-NUM','No measurements beyond the explicit checks in this scenario.',ev)});
}
add('F1','thermocouple','Open thermocouple indication.',[
 check('F1-j1','Check that connector J1 is properly seated.','J1 seating is checked; the open-thermocouple indication remains the selected training fixture.','F01',{safety:'live'}),
 check('F1-voltage','Measure voltage from TP3+ to TP4−.','The documented voltage condition identifies an open thermocouple.','F01',{safety:'live',meter:meter('TP3+ / TP4−','DC voltage','1.2 Vdc ±0.1 Vdc')}),
 check('F1-leads','Remove power, disconnect J1 and measure red/yellow lead resistance.','Open thermocouple is the scenario condition. The approximately 1 ohm intact-lead value is a comparison reference, not a contradictory measured value.','F01',{safety:'leads',meter:meter('Red / yellow thermocouple leads, J1 disconnected','Resistance','OPEN — qualitative scenario condition','Intact leads: approximately 1 ohm')}),
],'Open thermocouple; do not infer a numeric open-circuit resistance.',action('F1-action','Use the contact/thermocouple service reference (§9.3.11); the Fault 1 “see” cross-reference is blank in the supplied PDF. Stop at identifying this service direction.','DTC'),'F01','Fault 1 has a broken repair cross-reference. M0 links the separate §9.3.11 reference; no missing repair steps are reconstructed.');
add('F2','thermocouple','Shorted thermocouple indication.',[
 check('F2-voltage','Measure voltage from TP3+ to TP4−.','This voltage suggests a shorted thermocouple.','F02',{safety:'live',meter:meter('TP3+ / TP4−','DC voltage','0 ±0.5 mV')}),
 check('F2-board','Remove power, disconnect J1 and measure board-side TP3+/TP4− resistance.','At the documented board-side resistance, the short is in thermocouple wiring or the thermocouple, not the PC board.','F02',{safety:'j1',meter:meter('TP3+ / TP4−, J1 disconnected','Resistance','Approximately 20 kΩ')}),
],'Thermocouple wiring or thermocouple short; board-side result is in the stated context.',action('F2-action','Refer to Replace heater strut after the documented checks.','F02'),'F02','Fault 2 specifies a TWO-second pause (p114); it is not normalized to the other faults.');
add('F3','thermocouple','Reversed thermocouple wiring / faulty PC board context.',[
 check('F3-voltage','Measure TP3+/TP4− voltage and interpret its sign.','A negative reading means reversed thermocouple wiring; no magnitude is specified.','F03',{safety:'live',meter:meter('TP3+ / TP4−','DC voltage','NEGATIVE — no magnitude specified')}),
 check('F3-wires','Check red/yellow wire placement in J1.','The selected negative-voltage branch directs a red/yellow wire-placement check. The separate correctly-wired PC-board alternative is reference-only in this exercise.','F03'),
],'Negative TP3/TP4 voltage indicates reversed thermocouple wiring.',action('F3-action','Check/correct red and yellow wire placement in J1. The separate correctly-wired branch refers to Replace electronic assembly.','F03'),'F03','M1/Table 8-2 says “O2 T/C Reversed”; §8.5.3 p115 prints “O2 T/C REVERSED”. Both wordings are preserved.');
add('F4','electronics','A/D communications error.',[
 check('F4-review','Review the A/D Comm Error recommended action.','No numerical field test is supplied; the manual directs factory assistance.','F04'),
],'A/D Comm Error: use the documented escalation.',action('F4-action','Call the factory for assistance.','F04'),'F04');
add('F5','heater','Open heater indication.',[
 check('F5-j8','Remove power/assembly and check heater connector J8 resistance.','The open-heater branch calls for heater-strut replacement. The normal comparison is approximately 72 ohms.','F05',{safety:'heater',meter:meter('Heater connector J8','Resistance','OPEN — qualitative scenario condition','Good-heater comparison: approximately 72 ohms')}),
],'Open heater in the documented J8 check.',action('F5-action','Refer to Replace heater strut if the heater is open.','F05'),'F05');
add('F6','heater','High high heater temperature indication.',[
 check('F6-restart','Review/remove power, allow the documented cool interval, restore power and check recurrence.','Pre-authored recurrence branch: the condition repeats after the documented restart sequence. The triac and temperature control may be at fault. No cooling trajectory or live voltage is computed.','F06',{safety:'cool'}),
],'Repeated high-high condition: triac / temperature-control fault is a potential cause.',action('F6-action','If the condition repeats, replace the electronic assembly.','F06'),'F06');
add('F7','electronics','High case temperature indication.',[
 check('F7-context','Review installation ambient/convection context.','The manual identifies excessive installation ambient temperature or convection heat as potential causes. No actual case temperature is generated.','F07'),
],'Installation ambient or convection heat can raise case temperature beyond its limit.',action('F7-action','Place a spool piece between stack and transmitter flanges or relocate the transmitter to a cooler area.','F07'),'F07');
add('F8','heater','Low heater temperature indication.',[
 check('F8-j8','Remove power/assembly and measure heater connector J8 resistance.','Selected open-heater check branch; the Fault 8 good-heater comparison is approximately 70 ohms, not Fault 5’s 72 ohms.','F08',{safety:'heater',meter:meter('Heater connector J8','Resistance','OPEN — qualitative scenario condition','Fault 8 good-heater comparison: approximately 70 ohms')}),
],'Open heater found by the documented Fault 8 check; no automatic transition to Fault 5 is simulated.',action('F8-action','Replace the heater strut if the heater is open.','F08'),'F08');
add('F9','heater','High heater temperature indication.',[
 check('F9-recovery','Review the documented self-clearing condition.','The alarm clears when temperature control is restored and thermocouple voltage returns to normal range. This is a source condition, not a simulated recovery.','F09'),
],'High heater temperature; documented self-clearing depends on restored temperature control.',action('F9-action','Identify the documented recovery condition; do not invent a repair or a cooling curve.','F09'),'F09','Fault output remains BLOCKED: p126 says 4/20 mA while Table 2-8 specifies the SW2 selection. No precedence is chosen.');
add('F10','cell','High Cell mV / O2 Cell Open context.',[
 check('F10-cell','Measure cell voltage at TP1+ / TP2−.','At 1.2 Vdc the manual identifies an orange or green wire detached from the input. The alternative 104 mV to 1 Vdc range concerns high combustibles and is not converted to O₂.','F10',{safety:'live',meter:meter('TP1+ / TP2−','DC voltage','1.2 Vdc','Alternative context only: 104 mV to 1 Vdc — high combustibles')}),
],'Detached orange/green input-wire context, not a generalized O₂ conversion.',action('F10-action','For the wire issue, refer to Replace heater strut. A broken platinum-pad alternative instead directs cell/flange replacement.','F10'),'F10');
add('F11','cell','Bad Cell / O2 Cell Bad indication.',[
 check('F11-condition','Review the cell-resistance condition in Fault 11.','The manual says the cell exceeds its maximum resistance; the numeric maximum and a meter reading are not specified.','F11'),
],'Bad cell in the documented maximum-resistance context; numeric threshold unavailable.',action('F11-action','Replace the cell; refer to Replace cell.','F11'),'F11');
add('F12','electronics','EEprom Corrupt indication after an EEprom change at power-up.',[
 check('F12-context','Distinguish power-up after EEprom replacement from a running fault.','Selected source branch: EEprom changed to a later version and not updated at power-up. A running fault is a separate microprocessor-board hardware context.','F12'),
],'Power-up after EEprom replacement branch.',action('F12-action','Power down and restore power for this power-up branch. A running hardware fault instead directs electronic-assembly replacement.','F12'),'F12');
add('F13','cell','Invalid Slope / O2 Cell Bad indication.',[
 check('F13-gas','Verify that calibration gases match their configured parameters.','The manual directs gas/parameter matching before further checks. No slope is calculated.','F13'),
 check('F13-high','Review the Fault 13 TP1+/TP2− example with 8% O₂.','Fault 13 page-132 example only. It is not Table 8-1 and does not authorize a transfer function.','F13',{safety:'live',meter:meter('TP1+ / TP2− · Fault 13, 8% O₂ example','DC voltage','23 mV','M3-G01: Table 8-1 is a different, unresolved source context')}),
 check('F13-low','Review the Fault 13 TP1+/TP2− example with 0.4% O₂.','Fault 13 page-132 example only; do not fit or reconcile these values with Table 8-1.','F13',{safety:'live',meter:meter('TP1+ / TP2− · Fault 13, 0.4% O₂ example','DC voltage','85 mV','M3-G01 remains unresolved')}),
],'Invalid slope fixture; no slope computation or acceptance predicate.',action('F13-action','After the prescribed checks, power down, remove the transmitter from the stack and refer to Replace cell.','F13'),'F13','M3-G01 remains visible: page-132 examples stay exclusively inside this fault context.');
add('F14','cell','Invalid Constant / O2 Cell Bad indication.',[
 check('F14-cal','Verify that the last calibration was performed correctly.','The manual identifies a constant outside its documented bounds. No constant is calculated or numeric result generated.','F14'),
],'Invalid constant fixture; calibration procedure review is required.',action('F14-action','Power down, remove the transmitter from the stack and replace the cell per the manual.','F14'),'F14');
add('F15','cell','Last Calibration Failed / Calib Failed indication.',[
 check('F15-retention','Review calibration failure and previous-calibration retention.','The unit reverts to previous calibration values. The combined slope/constant predicate conflict is not executed.','F15'),
],'Last calibration failed; previous values retained without invented coefficients.',action('F15-action','Refer to Replace cell; failed values are not loaded.','F15'),'F15','G08: p136 AND versus p146 either remains unresolved.');
add('T16','heater','Heater not open, but unable to reach the documented setpoint.',[
 check('T16-autotune','Review System → Parameters → Auto Tune? and the documented application context.','Chapter 8.6 describes possible Auto Tune difficulty in hot processes. The selected case is given, not calculated from process temperature.','D16'),
],'Documented Auto Tune difficulty with heater not open.',action('T16-action','Go to System → Parameters → Auto Tune? and select No.','D16'),'D16');
add('T17','tube','Calibration passes, no alarm, but O₂ appears too high.',[
 check('T17-cap','Inspect calibration line cap and, if fitted, autocal valve seating.','The manual requires a tightly capped calibration line and properly seating autocal valve; passing calibration does not rule out air ingress.','D17'),
 check('T17-gasket','Review abrasive-shield/probe-flange gasket leakage path.','With an abrasive shield, ambient air can migrate through a probe-flange gasket leak toward the cell.','D17'),
 check('T17-tubing','Inspect calibration gas hoses/tubing and cell-flange corrugated seal.','These are documented leak-check locations. No leak rate or O₂ bias is assigned.','D17'),
],'Possible ambient-air ingress in the documented process-side paths; high reading alone is not proof.',action('T17-action','Tighten the cap/check valve seating, repair leaking tubing, use a new probe-flange gasket on reinstall and replace a leaking cell-flange seal as applicable.','D17'),'D17');
add('T18','reference','Calibration passes, no alarm, high reading: investigate internal reference-side leakage.',[
 check('T18-reference','Review the instrument-air reference / one-minute reference-exhaust blocking check.','Pre-authored documented result: INCREASES. The manual says an intact reference-side check should DECREASE SLIGHTLY; an increase indicates an internal probe leak. No magnitude is assigned.','D17'),
 check('T18-tube','Inspect the red silicone calibration tube and the corrugated cell seal.','Acid condensation can degrade the red silicone calibration tube. The corrugated seal is single-use.','D17',{safety:'service'}),
],'Internal probe leakage indicated by the documented direction of change, not by a calculated leak rate.',action('T18-action','Follow the housing/tube inspection reference; replace the single-use corrugated seal when replacing the cell and apply anti-seize to both sides as documented.','D17'),'D17');
add('T19','diffuser','Calibration passes, no alarm; low reading with progressively slower response.',[
 check('T19-trend','Compare control-room trend, calibration flow and recovery against prior calibration records.','Documented indicators: smoother trend, slower response, lower calibration gas flow and longer recovery to process reading. There is no fixed slowdown factor.','D19'),
],'Possible passive diffuser restriction in the documented particulate-loading context; low O₂ alone does not establish plugging.',action('T19-action','Do not turn calibration flow upward to compensate. Replace the diffuser at the appropriate opportunity; reset flow only with a new diffuser.','D19'),'D19');
add('T21','diffuser','Damaged ceramic diffusion element: calibration response slower than prior record.',[
 check('T21-inspect','Compare previous response and inspect the removed probe’s ceramic diffusion element.','A broken ceramic diffusion element can also cause slower calibration response. Damage is the selected inspection finding; no response curve is generated.','D21',{safety:'service'}),
],'Damaged ceramic diffusion element, not automatically a plugged diffuser.',action('T21-action','Replace the damaged ceramic element per §9.3.10 after probe removal and safety prerequisites; this exercise does not execute service steps.','D21'),'D21');
export const DIAGNOSTIC_SCENARIOS=deepFreeze(scenarios);
export const SCENARIO_CLASSIFICATION=deepFreeze([...scenarios.map(s=>({id:s.id,classification:s.classification,scope:'Documented check/observation/action identification only; missing numeric or recovery behavior excluded.',source:s.symptom.source})),{id:'T20',classification:'PARTIALLY SUPPORTED',scope:'Badly plugged diffuser temporary calibration, p140: directional flow/mixing procedure is reference-only. No adjustable gas-flow/mixing model is authorized (G19/G14).',source:{evidenceId:'D19'}}].sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1))));
export const DIAGNOSTIC_FAULTS=deepFreeze(base.faults.slice(0,15).map(identity=>({identity,scenarioId:'F'+diagRead(identity.number),checks:scenarios.find(s=>s.faultId===identity.id).checks,action:scenarios.find(s=>s.faultId===identity.id).action})));
export const DIAGNOSTIC_COUNTS=validateFixtureTree({safety:DIAGNOSTIC_SAFETY,scenarios:DIAGNOSTIC_SCENARIOS},DIAGNOSTIC_EVIDENCE);
