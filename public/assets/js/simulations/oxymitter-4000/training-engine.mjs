import {QUESTION_BANK as bank,TRAINING_MODULES as modules,PRACTICALS,trainingRead as read,trainingText} from './training-data.mjs';
import {createStartupEngine} from './startup-engine.mjs';
import {createCalibrationEngine} from './calibration-engine.mjs';
import {createDiagnosticEngine} from './diagnostic-engine.mjs';
import {DIAGNOSTIC_SCENARIOS as scenarios,DIAGNOSTIC_SAFETY as safety} from './diagnostic-data.mjs';
import {CALIBRATION_DATA as calData} from './calibration-data.mjs';
import {SOURCE_DATA as base} from './source-data.mjs';
import {deepFreeze} from './provenance.mjs';
const get=id=>scenarios.find(s=>s.id===id);
export const SCORING=deepFreeze({classification:'educational infrastructure',knowledge:'One point per correct first submitted answer.',practical:'One point per completed practical with zero inappropriate choices. Completion is recorded separately.',threshold:null,total:bank.length+PRACTICALS.length,disclaimer:'This result reflects performance in this educational simulator only.'});
const calSequence=['manual','verify','start','apply1','enter','advance','apply2','enter','advance','remove','enter','advance','automatic'];
const calActions=[['manual','Place simulated loop in MANUAL'],['verify','Verify gas parameters and flow caution'],['start','Start LOI calibration'],['apply1','Apply Gas 1'],['apply2','Remove Gas 1 / apply Gas 2'],['enter','ENTER'],['advance','Complete current logical timer'],['remove','Remove gas / cap port'],['automatic','Return loop to AUTOMATIC'],['abort','Abort Calib']];
export function createTrainingEngine(){
 let lessons={},mode='IDLE',index=0,answers=[],practicalResults=[],practicalIndex=0,practical=null,errors=0,steps=0,practicalDone=false,blinkSteps=0,attempt=0,attempts=[];
 const reject=message=>{throw new RangeError(message);};
 function lessonInteract(id){if(mode==='ACTIVE')reject('Finish the assessment before lessons.');if(!modules.some(m=>m.id===id))reject('Unknown lesson');lessons[id]={...lessons[id],interacted:true};return snapshot();}
 function lessonAnswer(id,choice){const m=modules.find(m=>m.id===id),q=bank.find(q=>q.id===m?.question);if(!q||!lessons[id]?.interacted||mode==='ACTIVE')reject('Complete the lesson interaction first.');if(!q.choices.some(c=>c.id===choice))reject('Choose an answer');lessons[id]={...lessons[id],answer:choice,complete:choice===q.correctAnswer};return snapshot();}
 function start(){if(mode==='ACTIVE')reject('An assessment is already active.');mode='ACTIVE';index=0;answers=[];practicalResults=[];practicalIndex=0;practical=null;attempt++;return snapshot();}
 function submit(choice){if(mode!=='ACTIVE'||index>=bank.length||answers[index])reject('No unanswered question.');const q=bank[index];if(!q.choices.some(c=>c.id===choice))reject('Choose an answer');answers.push({id:q.id,module:q.module,choice,correct:choice===q.correctAnswer});return snapshot();}
 function next(){if(mode!=='ACTIVE')reject('No active assessment');if(index<bank.length){if(!answers[index])reject('Submit this question first.');index++;if(index===bank.length)beginPractical();}
  else{if(!practicalDone)reject('Complete this practical first.');practicalIndex++;if(practicalIndex===PRACTICALS.length){mode='RESULT';practical=null;}else beginPractical();}return snapshot();}
 function beginPractical(){attempts=[];errors=0;steps=0;practicalDone=false;blinkSteps=0;const id=PRACTICALS[practicalIndex].id;
  if(id==='startup')practical={startup:createStartupEngine()};
  if(id==='calibration'){const startup=createStartupEngine();startup.applyPower();startup.advanceLogicalTime(startup.snapshot().infrastructure.educationalWarmupMilestoneSeconds);practical={startup,cal:createCalibrationEngine(),sequence:[...calSequence]};}
  if(id==='diagnostics'||id==='troubleshooting'){const diag=createDiagnosticEngine();diag.load(id==='diagnostics'?'F2':'T19');practical={diag};}
 }
 function finish(){practicalDone=true;practicalResults.push({id:PRACTICALS[practicalIndex].id,module:PRACTICALS[practicalIndex].module,completed:!practical.cal?.snapshot().aborted,errors,correct:errors===0&&!practical.cal?.snapshot().aborted});}
 function act(action){if(mode!=='ACTIVE'||!practical||practicalDone)reject('No active practical');const id=PRACTICALS[practicalIndex].id;const entry={action,label:practicalView().actions.find(a=>a[0]===action)?.[1]??action,accepted:false};attempts.push(entry);
  try{
   if(id==='startup'){if(steps===0&&action==='power'){practical.startup.applyPower();steps++;}else if(steps===1&&action==='warm'){practical.startup.advanceLogicalTime(practical.startup.snapshot().infrastructure.educationalWarmupMilestoneSeconds);steps++;finish();}else reject('Select the documented startup action.');}
   if(id==='calibration'){
    const c=practical.cal,s=c.snapshot();
    if(action==='abort'&&s.active&&!s.aborted){c.abort(s.abortMechanism);practical.sequence=['remove','advance','automatic'];steps=0;}
    else{if(action!==practical.sequence[steps])reject('TRAINING ACTION NOT ALLOWED: choose the documented next calibration step.');
     const actions={manual:()=>c.manual(),verify:()=>c.verify(),start:()=>c.start(practical.startup.snapshot().device.state),apply1:()=>c.apply(1),apply2:()=>c.apply(2),enter:()=>c.acknowledge(),advance:()=>c.advance(s.remaining),remove:()=>c.removeAndCap(),automatic:()=>c.automatic()};actions[action]();steps++;if(steps===practical.sequence.length)finish();}
   }
   if(id==='diagnostics'){if(action==='blink'){practical.diag.stepBlink();blinkSteps++;}else{if(blinkSteps<2)reject('Step through both flashes and the documented pause before identifying.');if(action!=='fault-2')reject('TRAINING ACTION NOT APPROPRIATE FOR THIS DOCUMENTED SCENARIO');finish();}}
   if(id==='troubleshooting'){const d=practical.diag,s=d.snapshot();if(s.stage==='CHECK')d.selectCheck(action);else if(s.stage==='TEST'){if(action==='safe')d.acknowledgeSafety();else d.perform(action);}else if(s.stage==='OBSERVATION'){if(action!=='next')reject('Read the observation, then continue.');d.next();}else if(s.stage==='DIAGNOSIS')d.diagnose(action);else if(s.stage==='ACTION'){if(action==='safe')d.acknowledgeSafety();else d.corrective(action);}if(d.snapshot().stage==='COMPLETE')finish();}
  entry.accepted=true;
  }catch(e){errors++;entry.message=e.message;throw e;}if(practicalDone)practicalResults.at(-1).transcript=attempts.map(a=>({...a}));return snapshot();
 }
 function cleanupRequired(){const s=practical?.cal?.snapshot();return Boolean(s&&(s.active||s.needsAutomatic||s.loop!=='AUTOMATIC'));}
 function reset(){if(cleanupRequired())reject('Finish or abort calibration, remove/cap gas, complete purge and return the loop to AUTOMATIC first.');lessons={};mode='IDLE';index=0;answers=[];practicalResults=[];practical=null;attempt=0;return snapshot();}
 function practicalView(){if(!practical)return null;const spec=PRACTICALS[practicalIndex];let status,actions=[],warning=safety.general,source=spec.sources[0],observation='';
  if(spec.id==='startup'){const s=practical.startup.snapshot();status=s.device.state;actions=[['power','Apply power'],['warm','Complete logical warm-up']];source=base.operating.warmupApproximate;}
  if(spec.id==='calibration'){const s=practical.cal.snapshot();status=`${s.label} · Loop ${s.loop} · ${s.gas===null?'GAS OFF':`Gas ${s.gas} APPLIED`} · ${s.capped?'Port capped':'Port not capped'}${s.remaining===null?'':` · ${s.remaining} s remaining`}`;actions=calActions;warning=calData.facts.preparation;source={source:s.source};observation=`LOI: ${s.prompt} · CAL LED ${s.calLed}. Gas 1 ${s.gas1}% O₂; Gas 2 ${s.gas2}% O₂. ${s.retention}`;}
  if(spec.id==='diagnostics'){const s=practical.diag.snapshot();status=`${read(s.fault.diagnosticLed)} · ${s.blinkText}`;observation=`LOI: ${read(s.fault.loiMessage)}`;warning=safety.reference;actions=[['blink','Step blink pattern'],...base.faults.slice(0,3).map(f=>[f.id,read(f.alarm)])];source=s.fault.alarm;}
  if(spec.id==='troubleshooting'){const s=practical.diag.snapshot();status=`${s.stage} · ${read(s.scenario.symptom)}`;warning=s.warning;source=s.scenario.symptom;
   if(s.stage==='CHECK')actions=['T19','F1','T16'].map(id=>[get(id).checks[0].id,read(get(id).checks[0].instruction)]);
   if(s.stage==='TEST')actions=[['safe','Acknowledge the displayed safety prerequisites'],['Inspection / source review','Perform inspection / source review'],['DC voltage','Measure DC voltage']];
   if(s.stage==='OBSERVATION'){observation=s.observation.text;actions=[['next','Continue after reviewing observation']];source=s.scenario.checks[0].observation;}
   if(s.stage==='DIAGNOSIS')actions=['T19','F1','T16'].map(id=>[id,read(get(id).diagnosis)]);
   if(s.stage==='ACTION')actions=[['safe','Acknowledge service safety prerequisites'],...['T19','F1','T16'].map(id=>[get(id).action.id,read(get(id).action.text)])];
   if(s.stage==='COMPLETE')observation='DOCUMENTED CORRECTIVE ACTION IDENTIFIED. No physical recovery simulated.';
  }
  return {spec,status,actions:practicalDone?[]:actions,warning,source,observation,errors,done:practicalDone,aborted:Boolean(practical.cal?.snapshot().aborted),cleanupRequired:cleanupRequired()};
 }
 function review(){if(mode!=='RESULT')return null;const breakdown=modules.map(m=>{const a=answers.filter(a=>a.module===m.id),p=practicalResults.filter(p=>p.module===m.id);return {id:m.id,title:m.title,correct:a.filter(x=>x.correct).length,total:a.length,practicalCompleted:p.filter(x=>x.completed).length,practicalTotal:p.length,practicalCorrect:p.filter(x=>x.correct).length};});return {correct:answers.filter(a=>a.correct).length,total:bank.length,practicalCompleted:practicalResults.filter(p=>p.completed).length,practicalTotal:PRACTICALS.length,points:answers.filter(a=>a.correct).length+practicalResults.filter(p=>p.correct).length,maxPoints:SCORING.total,breakdown,weak:breakdown.filter(m=>m.correct<m.total||m.practicalCorrect<m.practicalTotal).map(m=>m.id),answers:answers.map(a=>({...a,question:bank.find(q=>q.id===a.id)})),practicals:practicalResults.map(p=>({...p,transcript:p.transcript.map(a=>({...a})),sources:PRACTICALS.find(s=>s.id===p.id).sources,documentedPath:p.id==='calibration'?calSequence.map(a=>calActions.find(x=>x[0]===a)[1]):p.id==='startup'?['Apply power','Complete logical warm-up']:p.id==='diagnostics'?['Step blink pattern through the documented pause',read(base.faults.find(f=>f.id==='fault-2').alarm)]:[read(get('T19').checks[0].instruction),'Acknowledge safety prerequisites','Inspection / source review',read(get('T19').diagnosis),'Acknowledge service safety prerequisites',read(get('T19').action.text)]}))};}
 function snapshot(){const q=mode==='ACTIVE'&&index<bank.length?bank[index]:null;return deepFreeze({mode,index,attempt,lessons:{...lessons},question:q?{id:q.id,module:q.module,prompt:q.prompt,choices:q.choices.map(c=>({id:c.id,text:trainingText(c.datum)})),difficulty:q.difficulty,classification:q.classification}:null,feedback:q&&answers[index]?{...answers[index],correctAnswer:q.correctAnswer,explanation:q.explanation,explanationLead:q.explanationLead,source:q.source}:null,practical:practicalView(),result:review(),cleanupRequired:cleanupRequired()});}
 return Object.freeze({snapshot,lessonInteract,lessonAnswer,start,submit,next,act,reset});
}
