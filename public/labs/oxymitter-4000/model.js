// Manufacturer evidence: 00809-0100-4340 Rev AE (November 2024).
// Pure educational state model; does not model thermal, gas transport or cell aging dynamics.
export const MANUAL='https://www.emerson.com/is/content/emerson/en/measurement-instrumentation/technical/products/gas-analysis-combustion/documents/doc-rosemount-00809-0100-4340.pdf';
export const CELL_TABLE=[[0.01,166.8],[0.1,116.6],[0.2,101.4],[0.4,86.3],[0.5,81.5],[0.6,77.5],[0.8,71],[1,66.1],[2,51.1],[3,42.3],[4,36],[5,31.2],[6,27.2],[7,23.8],[8,21.1],[9,18.4],[10,16.1],[15,7.25],[20,1],[100,-34]];
export const FAULTS=[
 {id:1,name:'O2 T/C Open',meaning:'Heater thermocouple open',led:0,blinks:1,critical:true,self:false},
 {id:2,name:'O2 T/C Shorted',meaning:'Heater thermocouple shorted',led:0,blinks:2,critical:true,self:false},
 {id:3,name:'O2 T/C Reversed',meaning:'Heater thermocouple polarity reversed',led:0,blinks:3,critical:true,self:false},
 {id:4,name:'ADC Error',meaning:'A/D communication error',led:0,blinks:4,critical:true,self:false},
 {id:5,name:'O2 Heater Open',meaning:'Oxygen heater open',led:1,blinks:1,critical:true,self:false},
 {id:6,name:'Very Hi O2 Temp',meaning:'Very high process temperature',led:1,blinks:2,critical:true,self:false},
 {id:7,name:'Board Temp Hi',meaning:'Electronics overheated',led:1,blinks:3,critical:true,self:true},
 {id:8,name:'O2 Temp Low',meaning:'Low process temperature',led:1,blinks:4,critical:true,self:true},
 {id:9,name:'O2 Temp Hi',meaning:'High process temperature',led:1,blinks:5,critical:true,self:true},
 {id:10,name:'O2 Cell Open',meaning:'Cell open / high mV',led:2,blinks:1,critical:true,self:true},
 {id:11,name:'O2 Cell Bad',meaning:'Failed cell',led:2,blinks:3,critical:false,self:true},
 {id:12,name:'EEprom Corrupt',meaning:'EEPROM failed',led:2,blinks:4,critical:true,self:false},
 {id:13,name:'O2 Cell Bad — slope',meaning:'Invalid calibration slope',led:3,blinks:1,critical:false,self:true},
 {id:14,name:'O2 Cell Bad — constant',meaning:'Invalid calibration constant',led:3,blinks:2,critical:false,self:true},
 {id:15,name:'Calib Failed',meaning:'Last calibration failed',led:3,blinks:3,critical:false,self:true}
];
export const PHASES=['idle','armed','ready1','sample1','ready2','sample2','result','purge'];
export function initial(){return {power:true,warm:false,o2:3,mode:'LOCAL',localSpan:10,hartSpan:10,fail:3.5,loop:'internal',calOutput:'track',logic:5,fault:0,cause:false,cal:'idle',gas:'process',gas1:8,gas2:0.4,outcome:'valid',held:null,accepted:0};}
export function span(s){return s.mode==='LOCAL'?s.localSpan:s.hartSpan;}
export function fault(s){return FAULTS.find(f=>f.id===s.fault);}
export function inCalibration(s){return !['idle','armed'].includes(s.cal);}
export function observed(s){if(s.cal==='purge'||s.gas==='removed')return null;if(s.gas==='gas1')return s.gas1;if(s.gas==='gas2')return s.gas2;return s.o2;}
export function linear(o2,range){return o2>=0&&o2<=range?4+16*o2/range:null;}
export function readings(s){
 const f=fault(s); const seen=observed(s); let ma=null,reason='';
 if(!s.power){reason='Power off: electrical output not modeled.';}
 else if(s.warm){ma=s.fail;reason='Startup: selected SW2 failure level.';}
 else if(f?.critical){ma=s.fail;reason='Critical alarm: O₂ measurement unusable.';}
 else if(inCalibration(s)&&s.calOutput==='hold'){ma=s.held;reason='Calibration hold: output captured at initiation.';}
 else if(seen===null){reason='Purge: no gas-response curve is assumed.';}
 else {ma=linear(seen,span(s));reason=ma===null?'Outside configured span: saturation is not modeled.':f?'Alarm table specifies Track O₂; example reading only.':'Linear scaling of the documented 4–20 mA O₂ output.';}
 const usable=s.power&&!s.warm&&!f;
 return {ma,reason,seen:s.power&&!s.warm&&!f?.critical?seen:null,mv:usable&&seen!==null?(CELL_TABLE.find(row=>row[0]===seen)?.[1]??null):null,tp:usable&&seen!==null?seen:null};
}
export function logicRole(s){if(!s.power)return 'Not modeled while off';if(s.logic>=8)return 'Calibration handshake • alarm contact unavailable';if(s.logic===0)return 'No alarm configured';const unit=[1,3,5,7].includes(s.logic);return s.fault&&unit?'Unit alarm assigned • alarm condition present':unit?'Unit alarm assigned • no unit alarm':'No modeled unit alarm assignment';}
export function act(s,a,value){
 const n={...s};
 if(a==='reset')return initial();
 if(a==='power'){n.power=!s.power;n.cal='idle';n.gas='process';n.held=null;if(n.power){n.warm=true;if(!n.cause)n.fault=0;}return n;}
 if(a==='warm'){if(s.power&&s.warm)n.warm=false;return n;}
 if(a==='o2'){if(Number.isFinite(value)&&value>=0&&value<=40)n.o2=value;return n;}
 if(['mode','localSpan','fail','loop'].includes(a)){if(!s.power)n[a]=value;return n;}
 if(a==='hartSpan'){if(s.mode==='HART'&&Number.isFinite(value)&&value>0&&value<=40&&!inCalibration(s))n.hartSpan=value;return n;}
 if(['calOutput','logic','gas1','gas2','outcome'].includes(a)){if(!inCalibration(s))n[a]=value;return n;}
 if(a==='fault'){if(s.power&&!s.warm&&s.cal==='idle'&&FAULTS.some(f=>f.id===value)){n.fault=value;n.cause=true;}return n;}
 if(a==='removeCause'){n.cause=false;if(fault(s)?.self)n.fault=0;return n;}
 if(a==='applyGas'){if(s.cal==='ready1')n.gas='gas1';else if(s.cal==='ready2')n.gas='gas2';else if(s.cal==='result')n.gas='removed';return n;}
 if(a==='cal'){if(!s.power||s.warm||s.fault)return n;
   if(s.cal==='idle')n.cal='armed';
   else if(s.cal==='armed'){n.cal='ready1';n.held=linear(s.o2,span(s));}
   else if(s.cal==='ready1'&&s.gas==='gas1')n.cal='sample1';
   else if(s.cal==='ready2'&&s.gas==='gas2')n.cal='sample2';
   else if(s.cal==='result'&&s.gas==='removed')n.cal='purge';
   return n;
 }
 if(a==='advance'){
   if(s.cal==='sample1')n.cal='ready2';
   else if(s.cal==='sample2')n.cal='result';
   else if(s.cal==='purge'){n.cal='idle';n.gas='process';n.held=null;if(s.outcome==='valid')n.accepted++;}
   return n;
 }
 if(a==='abort'||a==='timeout'){if(a==='abort'||['ready1','ready2'].includes(s.cal)){n.cal='idle';n.gas='process';n.held=null;}return n;}
 return n;
}
