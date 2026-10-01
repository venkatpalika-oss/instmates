// Educational orchestration only. Technical answers are audited source datums.
import {SOURCE_DATA as base} from './source-data.mjs';
import {CALIBRATION_DATA as cal} from './calibration-data.mjs';
import {DIAGNOSTIC_SCENARIOS as scenarios,DIAGNOSTIC_SAFETY as safety,DIAGNOSTIC_EVIDENCE as evidence} from './diagnostic-data.mjs';
import {components} from './ui/view-model.mjs';
import {deepFreeze,readSupported} from './provenance.mjs';
export const trainingRead=d=>readSupported(d,evidence);
const fact=(value,id)=>({value,unit:'training reference',status:'SUPPORTED',source:{evidenceId:id}});
const componentFacts=components.map(c=>fact(c[2],c[3]));
const f=n=>base.faults.find(f=>f.id===`fault-${n}`);
const scenario=id=>scenarios.find(s=>s.id===id);
export const TRAINING_MODULES=deepFreeze([
 {id:'fundamentals',title:'Analyzer Fundamentals',path:'Learn the analyzer',objective:'Trace the process, cell, reference and signal connections.',facts:componentFacts,interaction:'component',question:'OX-Q01'},
 {id:'reference',title:'Measurement Reference',path:'Learn the analyzer',objective:'Read exact documented reference points without predicting between them.',facts:[fact('The manual states EMF = KT log10(P1/P2) + C. P1 is reference-air oxygen partial pressure; P2 is measured-gas oxygen partial pressure. T is absolute temperature, K an arithmetic constant and C the cell constant. This is a reference explanation; no continuous solver runs here.','E01'),base.operating.referenceOxygen,base.operating.cellSetpoint,base.referencePoints.find(p=>p.oxygenPercent.value===8).emfMv],interaction:'reference',question:'OX-Q04'},
 {id:'startup',title:'Startup',path:'Startup & operation',objective:'Recognize warm-up and advance the logical startup exercise.',facts:[base.startup.powerApplied,base.operating.warmupApproximate,base.startup.loiWarmup,base.startup.operatingReached],interaction:'startup',question:'OX-Q06'},
 {id:'calibration',title:'Calibration',path:'Calibration',objective:'Prepare the loop, apply two gases and complete purge cleanup.',facts:[cal.facts.preparation,cal.facts.removeCap,cal.facts.returnLoop,cal.facts.failedRetention],interaction:'calibration',question:'OX-Q08'},
 {id:'diagnostics',title:'Diagnostics',path:'Diagnostics',objective:'Interpret documented LED and LOI indications as source fixtures.',facts:[f(2).alarm,f(2).diagnosticLed,f(2).blinkCount,f(2).loiMessage],interaction:'diagnostics',question:'OX-Q11'},
 {id:'troubleshooting',title:'Troubleshooting',path:'Troubleshooting',objective:'Use observations and documented checks before selecting a corrective direction.',facts:[scenario('T19').symptom,scenario('T19').checks[0].observation,scenario('T19').action.text,safety.general,safety.service],interaction:'troubleshooting',question:'OX-Q14'},
]);
// Answers are literal supported datums; options carry their own source provenance.
function question(id,module,prompt,answer,others,explanation,{difficulty='Foundation',classification='technical'}={}){
 const options=[answer,...others].map((datum,i)=>({id:`${id}-C${i+1}`,datum}));
 // Stable rotation avoids making every correct answer the first choice.
 const offset=Number(id.slice(-2))%options.length;
 return {id,module,prompt,choices:[...options.slice(offset),...options.slice(0,offset)],correctAnswer:options[0].id,answer,explanation:answer,explanationLead:explanation,source:answer.source,difficulty,classification};
}
export const QUESTION_BANK=deepFreeze([
 question('OX-Q01','fundamentals','Which statement describes in-situ measurement?',componentFacts[0],[componentFacts[8],componentFacts[10]],'The process relationship is:'),
 question('OX-Q02','fundamentals','Which statement describes HART and the analog loop?',componentFacts[9],[componentFacts[10],componentFacts[8]],'The signal relationship is:'),
 question('OX-Q03','fundamentals','Which statement describes the reference side of the cell?',componentFacts[3],[componentFacts[1],componentFacts[5]],'The reference arrangement is:'),
 question('OX-Q04','reference','At the exact Table 8-1 point of 8% O₂, which EMF is listed (mV)?',base.referencePoints.find(p=>p.oxygenPercent.value===8).emfMv,[base.referencePoints.find(p=>p.oxygenPercent.value===10).emfMv,base.referencePoints.find(p=>p.oxygenPercent.value===4).emfMv],'Table 8-1 gives this exact point; no interpolation is used:'),
 question('OX-Q05','reference','What reference oxygen concentration is documented (% O₂)?',base.operating.referenceOxygen,[base.operating.lowestDetectable,base.referencePoints.find(p=>p.oxygenPercent.value===8).oxygenPercent],'Documented reference oxygen:'),
 question('OX-Q06','startup','Which exact LOI text indicates warm-up?',base.startup.loiWarmup,[f(1).loiMessage,f(2).loiMessage],'The LOI startup message is:'),
 question('OX-Q07','startup','Which documented startup output is the default (mA)?',base.operating.startupOutputDefault,[fact(base.operating.startupOutputChoices.value[1],'E40')],'The source default is:'),
 question('OX-Q08','calibration','Which preparation belongs before starting calibration?',cal.facts.preparation,[cal.facts.removeCap,cal.facts.returnLoop],'Before calibration:',{classification:'procedural'}),
 question('OX-Q09','calibration','What comes before acknowledging purge after Gas 2?',cal.facts.removeCap,[cal.facts.preparation,cal.facts.returnLoop],'After Gas 2:',{classification:'procedural'}),
 question('OX-Q10','calibration','What does the manual say about an invalid calibration result?',cal.facts.failedRetention,[cal.facts.goodRetention,cal.facts.abortRetention],'For bad calibration values:'),
 question('OX-Q11','diagnostics','Which LOI message corresponds to Fault 2?',f(2).loiMessage,[f(1).loiMessage,f(3).loiMessage],'Fault 2 message:'),
 question('OX-Q12','diagnostics','Which diagnostic LED group indicates Fault 5?',f(5).diagnosticLed,[f(1).diagnosticLed,f(10).diagnosticLed],'Fault 5 group:'),
 question('OX-Q13','troubleshooting','For the Fault 1 open-thermocouple voltage check, which documented meter fixture applies?',scenario('F1').checks.find(c=>c.meter.status==='SUPPORTED').meter,[scenario('F5').checks.find(c=>c.meter.status==='SUPPORTED').meter,scenario('F10').checks.find(c=>c.meter.status==='SUPPORTED').meter],'The location, mode and result belong together:',{difficulty:'Applied',classification:'procedural'}),
 question('OX-Q14','troubleshooting','Which corrective direction belongs to the documented plugged-diffuser case?',scenario('T19').action.text,[scenario('T16').action.text,scenario('F4').action.text],'Use the documented diffuser direction:',{difficulty:'Applied',classification:'procedural'}),
 question('OX-Q15','troubleshooting','Before a service action, which safety context must remain attached to that action?',safety.service,[cal.facts.returnLoop,cal.facts.preparation],'The service safety context is:',{classification:'procedural'}),
]);
export const PRACTICALS=deepFreeze([
 {id:'startup',module:'startup',title:'Complete startup',objective:'Apply power and reach the documented logical warm-up milestone.',sources:[base.startup.powerApplied,base.operating.warmupApproximate]},
 {id:'calibration',module:'calibration',title:'Complete LOI calibration',objective:'Use the inherited LOI procedure, including preparation and cleanup. Gas 1 is 0.4%, Gas 2 is 8%; the valid outcome is a pre-authored fixture.',sources:[cal.facts.preparation,base.calibration.typicalGases,cal.facts.removeCap,cal.facts.returnLoop]},
 {id:'diagnostics',module:'diagnostics',title:'Interpret a diagnostic indication',objective:'Step the documented blink sequence, then identify the fault using the LED and LOI.',sources:[f(2).alarm,f(2).diagnosticLed,f(2).blinkCount,f(2).loiMessage]},
 {id:'troubleshooting',module:'troubleshooting',title:'Diagnose a no-alarm case',objective:'Choose and perform the documented check, then identify diagnosis and corrective direction.',sources:[scenario('T19').symptom,scenario('T19').checks[0].instruction,scenario('T19').action.text,safety.service]},
]);
export function trainingSource(d){const id=d.source.evidenceId,e=evidence[id];if(!e)throw new Error('Unknown source');return `${id} · Manual ${base.manual.id} Rev ${base.manual.revision} · §${e.section} · PDF p${e.pages.join(', ')}${e.figureTable?' · '+e.figureTable:''}`;}
export function trainingText(d){const v=trainingRead(d);return typeof v==='object'?Object.entries(v).map(([k,x])=>`${k}: ${x}`).join(' · '):`${v}${['deg C','minute','% O2','mA','mV','count'].includes(d.unit)?' '+d.unit:''}`;}
export function auditQuestionBank(bank=QUESTION_BANK){
 const ids=new Set();let supported=0;
 for(const q of bank){if(ids.has(q.id)||!q.id||!TRAINING_MODULES.some(m=>m.id===q.module))throw new Error('Invalid question identity');ids.add(q.id);
  if(!q.prompt||!['Foundation','Applied'].includes(q.difficulty)||!['technical','procedural'].includes(q.classification))throw new Error('Missing question metadata');
  trainingRead(q.answer);trainingRead(q.explanation);supported+=2;
  const correct=q.choices.filter(c=>c.id===q.correctAnswer);if(correct.length!==1||new Set(q.choices.map(c=>c.id)).size!==q.choices.length)throw new Error('Invalid answer mapping');
  if(JSON.stringify(correct[0].datum)!==JSON.stringify(q.answer)||q.source.evidenceId!==q.answer.source.evidenceId)throw new Error('Answer/source mismatch');
  for(const c of q.choices){trainingRead(c.datum);supported++;}
 }
 for(const m of TRAINING_MODULES)for(const d of m.facts)trainingRead(d);
 for(const p of PRACTICALS)for(const d of p.sources)trainingRead(d);
 return {questions:bank.length,SUPPORTED:supported,DERIVED:0,UNSUPPORTED:0};
}
export const QUESTION_AUDIT=deepFreeze(auditQuestionBank());
