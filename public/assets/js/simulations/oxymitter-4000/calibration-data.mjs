// M3 adds procedural facts; M1 values and provenance remain unchanged.
import {SOURCE_DATA as base} from './source-data.mjs';
import {deepFreeze,readSupported,validateFixtureTree} from './provenance.mjs';
const fact=(value,evidenceId,unit='procedure')=>({value,unit,status:'SUPPORTED',source:{evidenceId}});
const blocked=(gapId,reason,evidenceId)=>({status:'UNSUPPORTED',availability:'BLOCKED',gapId,reason,source:{evidenceId}});
export const CALIBRATION_DATA=deepFreeze({
 evidence:base.evidence,
 facts:{
  preparation:fact('Place the control loop in manual and verify calibration gas parameters before calibration.','E69'),
  flowCaution:fact('Reset calibration flow only after installing a new diffuser. Increasing flow to compensate for plugging can pressurize the cell and bias calibration.','E67'),
  removeCap:fact('Remove the second calibration gas and cap the calibration gas port before acknowledging purge.','E69'),
  returnLoop:fact('After purge and return to normal operation, place the control loop in automatic.','E69'),
  keypadAbort:fact({presses:3,withinSeconds:3},'E68','gesture'),
  abortRetention:fact('An aborted calibration retains the previous good calibration. LOI abort returns to normal after gas removal and purge.','E68'),
  goodRetention:fact('A valid calibration updates current calibration; the prior good calibration becomes previous calibration.','E71'),
  failedRetention:fact('Bad calibration values are not loaded. Previous good values remain in use.','E71'),
  mathematics:fact('The transmitter calculates slope and cell constant from the two known calibration gases; this trainer does not calculate either.','E67'),
  slopeConcept:fact('Slope describes the millivolt change per decade in the logarithmic oxygen response. The manual checks the calibrated slope against its stated bounds.','E70'),
  constantConcept:fact('C is the cell constant added in the manual’s cell EMF expression. No numeric constant or calibration correction is generated here.','E01'),
  output:fact('Output tracks by default; HOLD retains the last value during calibration and releases after purge.','E69'),
  semiauto:fact('Permanent gas piping and SPS 4001B or IMPS 4000 are required. Logic I/O mode 8 or 9 supports communication. Initiation may use CAL, LOI, HART/AMS, IMPS or a remote contact. The sequencer signals in-cal to the control room and sequences gases.','E72'),
  automatic:fact('Permanent gas piping and SPS 4001B or IMPS 4000 are required with logic I/O mode 8. Scheduled calibration intervals are configured in hours. The sequencer signals in-cal to the control room and sequences gases.','E72'),
 },
 states:{
  NORMAL:fact({label:'NORMAL / READY',led:'OFF',prompt:'O₂: --.-- %',guide:'Place the simulated control loop in manual and verify the gas parameters.'},'E69'),
  APPLY_1:fact({label:'APPLY GAS 1',led:'FLASHING',prompt:'Apply Gas 1 · Hit E when ready',guide:'Apply the selected Gas 1, then acknowledge with ENTER or CAL.'},'E69'),
  FLOW_1:fact({label:'FLOW / READ GAS 1',led:'SOLID',prompt:'Flow Gas 1 → Read Gas 1',guide:'Complete the documented gas period. Flow and Read remain grouped; no separate Read timer is specified.'},'E71'),
  APPLY_2:fact({label:'APPLY GAS 2',led:'FLASHING',prompt:'Done Gas 1 · Apply Gas 2 · Hit E when ready',guide:'Remove Gas 1 and apply the selected Gas 2, then acknowledge.'},'E69'),
  FLOW_2:fact({label:'FLOW / READ GAS 2',led:'SOLID',prompt:'Flow Gas 2 → Read Gas 2',guide:'Complete the second documented gas period. No sensing response is calculated.'},'E71'),
  RESULT:fact({label:'RESULT / STOP GAS',led:'SCENARIO PATTERN',prompt:'Done Gas 2 · Stop Gas · Hit E when ready',guide:'Inspect the pre-authored device outcome. Remove Gas 2 and cap the port, then acknowledge purge.'},'E69'),
  PURGE:fact({label:'PURGE',led:'SOLID',prompt:'Purge',guide:'Complete the documented purge before returning the control loop to automatic.'},'E69'),
  ABORT:fact({label:'ABORT / REMOVE GAS',led:'NOT SPECIFIED',prompt:'Abort Calib',guide:'Remove calibration gas; the LOI procedure returns to normal after purge. No abort CAL LED pattern is specified.'},'E68'),
 },
 transitions:{
  loopManual:fact('NORMAL → control loop MANUAL','E69'),
  verify:fact('NORMAL → gas parameters verified','E67'),
  startLoi:fact('NORMAL → APPLY GAS 1 via CALIBRATION / Start Calibration','E71'),
  keypadEntry:fact('Ready for first calibration gas after the documented CAL initiation steps; initial arming is excluded because of G05.','E69'),
  apply:fact('Apply Gas 1, or remove Gas 1 and apply Gas 2, before acknowledgment.','E69'),
  acknowledge:fact('CAL or ENTER starts the selected gas period after gas application.','E69'),
  gas1Complete:fact('First gas period complete → ready for Gas 2','E69'),
  gas2Complete:fact('Second gas period complete → result / stop gas','E69'),
  remove:fact('Remove gas and cap port','E69'),
  purge:fact('CAL or ENTER acknowledges removal and starts purge','E69'),
  purgeComplete:fact('Purge complete → normal; hold released','E69'),
  abort:fact('CAL three times within three seconds or LOI Abort Calib → aborted calibration','E68'),
  timeout:fact('Gas application not completed within the documented wait → electronics abort','E69'),
  abortCleanup:fact('Following LOI abort, remove gases and wait for purge before normal operation','E71'),
  loopAutomatic:fact('Normal after purge → return control loop to AUTOMATIC','E69'),
 },
 scenarios:{
  valid:fact({title:'Device reports valid calibration',valid:true,calLed:'TWO-PATTERN FLASH',diagnostic:'No calibration diagnostic in this scenario'},'E69'),
  invalidSlope:fact({title:'Device reports invalid slope',valid:false,calLed:'THREE-PATTERN FLASH',faultId:'fault-13'},'E70'),
  invalidNoAlarm:fact({title:'Device reports invalid calibration without diagnostic alarm',valid:false,calLed:'THREE-PATTERN FLASH',diagnostic:'No diagnostic alarm; the manual lists same gases or gas not turned on as possible causes. This fixture does not infer either cause from your selections.'},'E69'),
 },
 blocked:{
  arming:blocked('G05','Keypad initial arming and CALIBRATION RECOMMENDED behavior conflict with the 2014 discontinuation (pp53/82/101 versus p146). Keypad training starts at an explicitly selected Gas 1 readiness fixture.','E69'),
  keyIncrements:blocked('G10','INC/DEC increments, repeat and rounding are not specified. Gas setup uses training inputs, not emulated hardware editing.','E51'),
  readTiming:blocked('G14','Flow / Read / Done order is documented; separate Read duration is not. The training clock groups Flow/Read without inventing subphase timing.','E71'),
  predicate:blocked('G08','p136 uses slope AND constant; p146 uses either. Device outcomes are pre-authored fixtures, not a calculated acceptance predicate.','E70'),
  sequencer:blocked('G14','Sequencer internal behavior is outside the supplied Oxymitter 4000 manual and is not simulated.','E72'),
  earlyAuto:blocked('G15','HART p105 wording returns automatic before purge; keypad pp146–147 returns afterward. This Chapter 9 trainer requires completed purge; the HART path remains blocked.','E62'),
  gasConflict:blocked('G16','Supply pressure versus hazardous calibration-line pressure remains unresolved. No pressure setting or pneumatic model.','E19'),
  calculation:base.blockedCapabilities.calibrationMath,
  emfExamples:blocked('M3-G01','Troubleshooting p132 gives different example cell mV values from Table 8-1 (pp107–108). No common calibration transfer function is selected; the existing exact Table 8-1 lookup remains unchanged.','E70'),
 },
});
export const calRead=d=>readSupported(d,CALIBRATION_DATA.evidence);
export const CALIBRATION_COUNTS=validateFixtureTree({facts:CALIBRATION_DATA.facts,states:CALIBRATION_DATA.states,transitions:CALIBRATION_DATA.transitions,scenarios:CALIBRATION_DATA.scenarios,blocked:CALIBRATION_DATA.blocked},CALIBRATION_DATA.evidence);
