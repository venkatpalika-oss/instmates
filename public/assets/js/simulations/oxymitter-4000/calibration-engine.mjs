import {SOURCE_DATA as base} from './source-data.mjs';
import {deepFreeze} from './provenance.mjs';
import {CALIBRATION_DATA as data,calRead as read} from './calibration-data.mjs';
const gasSeconds=()=>read(base.calibration.gasFlowTime);
const purgeSeconds=()=>read(base.calibration.purgeTime)*60;
const waitSeconds=()=>read(base.calibration.gasApplicationWait)*60;
export function exactTestPoint(oxygen){const p=base.testPoints.find(p=>p.id==='TP5/TP6').examples.find(p=>read(p.oxygenPercent)===oxygen);return p??null;}
export function createCalibrationEngine(){
 let state='NORMAL',loop='AUTOMATIC',verified=false,gas=null,capped=true,remaining=null,aborted=false,finished=false,procedure='NOT STARTED',errors=0,active=false,needsAutomatic=false;
 let configuration={interface:'loi',low:read(base.calibration.typicalGases)[0],high:read(base.calibration.typicalGases)[1],first:'low',output:read(base.operating.calibrationOutputDefault),scenario:'valid'};
 let current='Prior good calibration (numeric values unknown)',previous='Earlier calibration (numeric values unknown)',lastResult=null,completedGas=0,history=[];
 function reject(message){errors++;procedure='TRAINING PROCEDURE ERROR';throw new RangeError(`TRAINING ACTION NOT ALLOWED: ${message}`);}
 function requireThat(condition,message){if(!condition)reject(message);}
 function record(event){history.push({state,event,source:data.transitions[event].source});}
 function move(next,event){state=next;record(event);}
 function configure(next){requireThat(!active,'Finish or abort and clean up this session before changing setup.');verified=false;const c={...configuration,...next};
  for(const kind of ['low','high']){const bounds=read(base.calibration[kind+'Gas']);requireThat(typeof c[kind]==='number'&&Number.isFinite(c[kind])&&c[kind]>=bounds.min&&c[kind]<=bounds.max,`${kind} gas must stay within the documented range.`);}
  requireThat(['loi','keypad'].includes(c.interface)&&['low','high'].includes(c.first)&&read(base.operating.calibrationOutputChoices).includes(c.output)&&Object.hasOwn(data.scenarios,c.scenario),'Use a documented configuration.');configuration=c;verified=false;return snapshot();
 }
 function manual(){requireThat(!active,'The control loop is already held in MANUAL for this training session.');loop='MANUAL';record('loopManual');return snapshot();}
 function verify(){requireThat(!active,'Verify setup before starting.');verified=true;record('verify');return snapshot();}
 function start(startupState){requireThat(!needsAutomatic,'Return the simulated loop to AUTOMATIC after purge before another calibration.');requireThat(!active&&startupState==='NORMAL OPERATION','Complete M1 startup before calibration.');requireThat(loop==='MANUAL'&&verified,'Place the simulated loop in MANUAL and verify gas parameters first.');active=true;aborted=false;finished=false;completedGas=0;lastResult=null;gas=null;capped=true;procedure=errors?'TRAINING PROCEDURE ERROR':'IN PROGRESS';remaining=waitSeconds();move('APPLY_1',configuration.interface==='loi'?'startLoi':'keypadEntry');return snapshot();}
 function apply(which){requireThat((state==='APPLY_1'&&which===1)||(state==='APPLY_2'&&which===2),'Apply the gas requested by the current step.');requireThat(gas!==which,'This gas is already applied.');gas=which;capped=false;remaining=null;record('apply');return snapshot();}
 function acknowledge(){if(state==='APPLY_1'||state==='APPLY_2'){const which=state==='APPLY_1'?1:2;requireThat(gas===which,'Apply the requested gas before CAL / ENTER.');remaining=gasSeconds();move(which===1?'FLOW_1':'FLOW_2','acknowledge');}
  else if(state==='RESULT'){requireThat(gas===null&&capped,'Remove calibration gas and cap the port before purge.');remaining=purgeSeconds();move('PURGE','purge');}
  else reject('Use CAL / ENTER only after the requested gas application or stop-gas step.');return snapshot();}
 function removeAndCap(){requireThat(state==='RESULT'||state==='ABORT','Remove/cap at Stop Gas or after abort.');gas=null;capped=true;record('remove');if(state==='ABORT'){remaining=purgeSeconds();move('PURGE','abortCleanup');}return snapshot();}
 function abort(mechanism){requireThat(active&&state!=='ABORT'&&!aborted,'No active calibration is available to abort.');const expected=abortMechanism();requireThat(mechanism===expected,'Use the documented abort mechanism for the selected interface.');doAbort('abort');return snapshot();}
 function doAbort(event){aborted=true;lastResult=null;remaining=null;move('ABORT',event);procedure='ABORTED — NOT PROCEDURALLY COMPLETE';}
 function advance(seconds){requireThat(typeof seconds==='number'&&Number.isFinite(seconds)&&seconds>=0,'Logical time must be a nonnegative finite number.');requireThat(remaining!==null&&active,'No documented timer is running.');remaining=Math.max(0,remaining-seconds);if(remaining>0)return snapshot();
  if(state==='APPLY_1'||state==='APPLY_2')doAbort('timeout');
  else if(state==='FLOW_1'){completedGas=1;remaining=waitSeconds();move('APPLY_2','gas1Complete');}
  else if(state==='FLOW_2'){completedGas=2;remaining=null;lastResult=configuration.scenario;move('RESULT','gas2Complete');}
  else if(state==='PURGE'){remaining=null;finished=true;active=false;needsAutomatic=true;move('NORMAL','purgeComplete');if(!aborted&&read(data.scenarios[lastResult]).valid){previous=current;current='Accepted training-scenario calibration (numeric values not calculated)';}procedure=aborted?'ABORTED — CLEANUP COMPLETE':errors?'TRAINING PROCEDURE ERROR':'PURGE COMPLETE — RETURN LOOP TO AUTOMATIC';}
  return snapshot();
 }
 function automatic(){requireThat(state==='NORMAL'&&finished&&needsAutomatic&&gas===null&&capped,'Complete gas removal and purge before returning the loop to AUTOMATIC.');loop='AUTOMATIC';needsAutomatic=false;record('loopAutomatic');procedure=aborted?'ABORTED — CLEANUP COMPLETE':errors?'TRAINING PROCEDURE ERROR':'TRAINING PROCEDURE COMPLETE';return snapshot();}
 function abortMechanism(){const gesture=read(data.facts.keypadAbort);return configuration.interface==='loi'?'Abort Calib':`CAL x${gesture.presses} within ${gesture.withinSeconds}s`;}
 function snapshot(){const spec=read(data.states[state]);const scenario=lastResult?read(data.scenarios[lastResult]):null;const concentration=gas===null?null:configuration[gas===1?configuration.first:configuration.first==='low'?'high':'low'];
  const diagnostic=scenario?.faultId&&['RESULT','PURGE'].includes(state)?base.faults.find(f=>f.id===scenario.faultId):null;
  return deepFreeze({state,label:spec.label,source:data.states[state].source,prompt:spec.prompt,guide:needsAutomatic?read(data.facts.returnLoop):spec.guide,configuration:{...configuration},active,abortMechanism:abortMechanism(),needsAutomatic,loop,verified,gas,capped,concentration,gas1:configuration[configuration.first],gas2:configuration[configuration.first==='low'?'high':'low'],remaining,completedGas,calLed:aborted?'NOT SPECIFIED FOR ABORT':state==='RESULT'?scenario.calLed:spec.led,
   outputMode:active?(configuration.output==='HOLD'?'HOLDING PRE-CALIBRATION VALUE':'TRACKING'):'NORMAL OUTPUT — NUMERIC MAPPING BLOCKED',outputMa:null,oxygenPercent:null,slope:null,constant:null,
   scenario,diagnostic,previous,current,lastResult,aborted,finished,procedure,errors,history:history.map(h=>({...h})),tp:concentration===null?null:exactTestPoint(concentration),
   retention:aborted?read(data.facts.abortRetention):lastResult?(scenario.valid?read(data.facts.goodRetention):read(data.facts.failedRetention)):'Previous good calibration is retained until a valid result is accepted; numbers are unknown.',
  });
 }
 return Object.freeze({snapshot,configure,manual,verify,start,apply,acknowledge,removeAndCap,abort,advance,automatic});
}
