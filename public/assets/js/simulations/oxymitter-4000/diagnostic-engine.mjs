import {SOURCE_DATA as base} from './source-data.mjs';
import {deepFreeze} from './provenance.mjs';
import {DIAGNOSTIC_SCENARIOS as scenarios,DIAGNOSTIC_SAFETY as safety,diagRead as read} from './diagnostic-data.mjs';
export function chooseChallenge(random=Math.random){const n=random();if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Random selection must be in [0,1).');return scenarios[Math.floor(n*scenarios.length)].id;}
export function createDiagnosticEngine(){
 let scenario=null,stage='SELECT',index=0,selectedCheck=null,safe=false,observation=null,errors=0,blink=0,history=[],output=read(base.operating.startupOutputDefault);
 function reject(){errors++;throw new RangeError('TRAINING ACTION NOT APPROPRIATE FOR THIS DOCUMENTED SCENARIO');}
 function requireThat(condition){if(!condition)reject();}
 function record(action,source){history.push({action,source});}
 function load(id){const candidate=scenarios.find(s=>s.id===id);requireThat(Boolean(candidate));scenario=candidate;stage='CHECK';index=0;selectedCheck=null;safe=false;observation=null;errors=0;blink=0;history=[];record('Training fixture selected',candidate.symptom.source);return snapshot();}
 function configureOutput(value){requireThat(read(base.operating.startupOutputChoices).includes(value));output=value;return snapshot();}
 function selectCheck(id){requireThat(stage==='CHECK'&&scenario.checks[index].id===id);selectedCheck=scenario.checks[index];safe=false;stage='TEST';record('Documented check selected',selectedCheck.instruction.source);return snapshot();}
 function acknowledgeSafety(){requireThat(stage==='TEST'||stage==='ACTION');safe=true;record('Training prerequisites acknowledged',stage==='TEST'?safety[selectedCheck.safety].source:safety.service.source);return snapshot();}
 function perform(mode){requireThat(stage==='TEST'&&safe);const isMeter=selectedCheck.meter.status==='SUPPORTED';requireThat(mode===(isMeter?read(selectedCheck.meter).mode:'Inspection / source review'));observation={text:read(selectedCheck.observation),source:selectedCheck.observation.source,measurement:isMeter?selectedCheck.meter:null};stage='OBSERVATION';record('Source fixture observed',selectedCheck.observation.source);return snapshot();}
 function next(){requireThat(stage==='OBSERVATION');index++;selectedCheck=null;safe=false;stage=index<scenario.checks.length?'CHECK':'DIAGNOSIS';return snapshot();}
 function diagnose(id){requireThat(stage==='DIAGNOSIS'&&id===scenario.id);stage='ACTION';safe=false;record('Diagnosis identified',scenario.diagnosis.source);return snapshot();}
 function corrective(id){requireThat(stage==='ACTION'&&safe&&id===scenario.action.id);stage='COMPLETE';record('Documented corrective action identified',scenario.action.text.source);return snapshot();}
 function stepBlink(){const f=fault();requireThat(Boolean(f));const count=read(f.blinkCount);blink=(blink+1)%(count+1);return snapshot();}
 function fault(){return scenario?.faultId?base.faults.find(f=>f.id===scenario.faultId):null;}
 function snapshot(){const f=fault();let outputState='Normal analog mapping BLOCKED; no numeric current.';
  if(f){if(f.outputBehavior.status!=='SUPPORTED')outputState=`BLOCKED · ${f.outputBehavior.reason}`;else if(read(f.outputBehavior).startsWith('SW2.3:'))outputState=`FAULT OUTPUT SELECTED: ${output} mA · training configuration, not a measured current`;else outputState=`${read(f.outputBehavior)} · no numeric analog mapping`;}
  const count=f?read(f.blinkCount):null;const blinkText=f?(blink<count?`Flash ${blink+1} of ${count}`:`Pause ${read(f.pause)} seconds (documented duration; manually stepped)`):'No diagnostic blink pattern assigned';
  return deepFreeze({scenario,stage,index,selectedCheck,safe,observation,errors,history:[...history],fault:f,blinkText,outputState,outputSelection:output,
   oxygenPercent:null,normalMa:null,generatedMeasurement:null,physicalRecovery:'NOT SIMULATED',
   currentSource:stage==='ACTION'||stage==='COMPLETE'?scenario?.action.text.source:selectedCheck?.instruction.source??scenario?.symptom.source??null,
   warning:selectedCheck&&['TEST','OBSERVATION'].includes(stage)?safety[selectedCheck.safety]:safety.service,
   guidance:!scenario?'Select a READY scenario.':stage==='CHECK'?`Next documented check: ${read(scenario.checks[index].instruction)} Source interpretation to examine: ${read(scenario.checks[index].observation)}`:stage==='TEST'?'Acknowledge the source prerequisites, select the specified meter mode or source-review mode, then perform the check.':stage==='OBSERVATION'?'Read the source observation and continue to the next documented check.':stage==='DIAGNOSIS'?'Identify the diagnosis supported by the observations.':stage==='ACTION'?`Documented corrective direction: ${read(scenario.action.text)}`:'DOCUMENTED CORRECTIVE ACTION IDENTIFIED · EXERCISE COMPLETE. The fault fixture remains active; recovery is not simulated.',
  });
 }
 return Object.freeze({snapshot,load,configureOutput,selectCheck,acknowledgeSafety,perform,next,diagnose,corrective,stepBlink});
}
