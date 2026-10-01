/** Static catalog registry. Taxonomy describes subject areas, not promised releases. */
export const CATEGORIES = Object.freeze([
 {id:'measurement', label:'Measurement', topicIds:['pressure','flow','level','temperature']},
 {id:'signals-control', label:'Signals & Control', topicIds:['current-loop','scaling','pid','control-valves']},
 {id:'analyzers', label:'Analyzers', topicIds:['oxygen','gas-analysis','gas-chromatography','moisture','sample-conditioning']},
 {id:'field-skills', label:'Field Skills', topicIds:['calibration','loop-checks','fault-finding','troubleshooting']}
]);
export const TOPICS = Object.freeze(Object.fromEntries([
 ['pressure','Pressure'],['flow','Flow'],['level','Level'],['temperature','Temperature'],
 ['current-loop','4–20 mA'],['scaling','Scaling'],['pid','PID'],['control-valves','Control valves'],
 ['oxygen','Oxygen'],['gas-analysis','Gas analysis'],['gas-chromatography','Gas chromatography'],
 ['moisture','Moisture'],['sample-conditioning','Sample conditioning'],['calibration','Calibration'],
 ['loop-checks','Loop checks'],['fault-finding','Fault finding'],['troubleshooting','Troubleshooting']
]));
export const SIMULATIONS = Object.freeze([
 {id:'4-20ma-loop', lab:'01', title:'4–20 mA Transmitter & Loop', status:'available', href:'/simulations/4-20ma-loop/',
 summary:'Trace current and scaling from transmitter to display; diagnose loop faults.',
 categoryIds:['signals-control','field-skills'], topicIds:['current-loop','scaling','fault-finding'],
 equipmentTypes:['transmitter','analog-input'], objectives:['Trace the current signal','Compare transmitter and receiver scaling','Diagnose loop faults']},
 {id:'pressure-transmitter-calibration', lab:'02', title:'Pressure Transmitter Calibration', status:'available', href:'/simulations/pressure-transmitter-calibration/',
 summary:'Record a calibration run, diagnose errors and compare as-found with as-left.',
 categoryIds:['measurement','field-skills'], topicIds:['pressure','calibration','troubleshooting'],
 equipmentTypes:['pressure-transmitter','reference-pressure-calibrator','hand-pump'], objectives:['Record nine calibration observations','Diagnose response errors','Compare as-found and as-left results']}
]);

/** Fail closed: unpublished entries cannot acquire launch actions. Route existence is checked at build/test time. */
export function validateCatalog(labs) {
 const ids=new Set(), numbers=new Set(), routes=new Set();
 for(const lab of labs) {
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lab.id) || ids.has(lab.id)) throw new Error('Invalid or duplicate lab ID');
  if(!/^\d{2,}$/.test(lab.lab) || numbers.has(Number(lab.lab))) throw new Error('Invalid or duplicate lab number');
  ids.add(lab.id); numbers.add(Number(lab.lab));
  if(!['available','coming-soon','planned'].includes(lab.status)) throw new Error('Invalid status');
  for(const key of ['title','summary']) if(typeof lab[key]!=='string' || !lab[key].trim()) throw new Error('Missing '+key);
  for(const key of ['categoryIds','topicIds','equipmentTypes','objectives']) if(!Array.isArray(lab[key]) || !lab[key].length || lab[key].some(v=>typeof v!=='string'||!v.trim())) throw new Error('Invalid '+key);
  if(lab.categoryIds.some(id=>!CATEGORIES.some(c=>c.id===id)) || lab.topicIds.some(id=>!Object.hasOwn(TOPICS,id))) throw new Error('Unknown taxonomy');
  if(lab.status==='available') {
   if(!/^\/simulations\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(lab.href) || routes.has(lab.href)) throw new Error('Invalid or duplicate available route');
   routes.add(lab.href);
  } else if(lab.href != null) throw new Error('Unpublished lab cannot have a launch route');
 }
 return labs;
}
export function availableLabs(labs=SIMULATIONS) {
 return validateCatalog(labs).filter(lab=>lab.status==='available').map(lab=>({...lab,categoryIds:[...new Set(lab.categoryIds)],topicIds:[...new Set(lab.topicIds)]}));
}
