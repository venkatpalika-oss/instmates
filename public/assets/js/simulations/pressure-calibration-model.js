import {validateRange, toCurrent} from './linear.js';
export const DEFAULTS=Object.freeze({lrv:0,urv:10,configuredLrv:0,configuredUrv:10,requested:0,tolerance:.5,zeroAdjustment:0,spanAdjustment:0,scenario:'normal'});
export const SCENARIOS=Object.freeze({normal:{label:'Normal',z:0,g:0,n:0,source:0},zero:{label:'Zero shift',z:.16,g:0,n:0,source:0},span:{label:'Span error',z:0,g:.01,n:0,source:0},combined:{label:'Zero + span error',z:.16,g:.01,n:0,source:0},nonlinear:{label:'Nonlinear response',z:0,g:0,n:.16,source:0},range:{label:'Wrong configured range',z:0,g:0,n:0,source:0},application:{label:'Pressure application error',z:0,g:0,n:0,source:-.2}});
export const POINTS=Object.freeze([0,25,50,75,100,75,50,25,0].map((percent,i)=>Object.freeze({percent,direction:i<5?'Upscale':'Downscale'})));
export const CHALLENGES=Object.freeze([
 {scenario:'zero',title:'A constant difference',explanation:'A constant +0.160 mA difference is consistent with zero offset. Verify all points before and after educational adjustment.'},
 {scenario:'span',title:'An error that grows',explanation:'Error grows from the configured lower endpoint: investigate span/gain, after checking configuration.'},
 {scenario:'combined',title:'Both endpoints need attention',explanation:'An offset plus increasing error requires both educational corrections and a complete recheck.'},
 {scenario:'nonlinear',title:'Endpoints are not the whole story',explanation:'Correct endpoints do not prove linearity. Endpoint adjustments cannot remove this curved response.'},
 {scenario:'range',title:'Check the specification',explanation:'Required and configured ranges differ. Correct configuration, not the adjustment controls.'},
 {scenario:'application',title:'The pump missed its target',explanation:'Use measured reference pressure for expected current. A missed pressure target is not a transmitter calibration error.'}
]);
export function within(error,limit){return Math.abs(error)<=limit+1e-12;}
export function simulate(s){
 for(const k of Object.keys(DEFAULTS).filter(k=>k!=='scenario'))if(!Number.isFinite(s[k])||Math.abs(s[k])>1e4)throw new RangeError('Enter finite values within the supported limits.');
 validateRange(s.lrv,s.urv);validateRange(s.configuredLrv,s.configuredUrv);
 if(s.lrv<0||s.urv>100||s.configuredLrv<0||s.configuredUrv>100||s.requested<0||s.requested>100)throw new RangeError('This positive gauge-pressure bench supports 0–100 bar only.');
 if(s.tolerance<=0||s.tolerance>5||Math.abs(s.zeroAdjustment)>1||Math.abs(s.spanAdjustment)>5)throw new RangeError('Tolerance: >0 to 5%; zero adjustment: ±1 mA; span adjustment: ±5%.');
 const f=SCENARIOS[s.scenario];if(!f)throw new RangeError('Unknown scenario.');
 const mismatch=s.lrv!==s.configuredLrv||s.urv!==s.configuredUrv;
 if(mismatch&&(s.zeroAdjustment!==0||s.spanAdjustment!==0))throw new RangeError('Match configured and required ranges before applying educational adjustments.');
 const reference=Math.max(0,s.requested+f.source),x=(reference-s.configuredLrv)/(s.configuredUrv-s.configuredLrv);
 const expected=toCurrent(reference,s.lrv,s.urv);
 const raw=4+f.z+s.zeroAdjustment+16*(1+f.g+s.spanAdjustment/100)*x+f.n*4*x*(1-x);
 if(!Number.isFinite(raw)||!Number.isFinite(expected))throw new RangeError('Range is too small for a finite response.');
 const measured=Math.min(20.5,Math.max(3.8,raw)),error=measured-expected;
 return {requested:s.requested,applied:reference,reference,expected,measured,raw,error,errorPercent:error/16*100,percent:(reference-s.lrv)/(s.urv-s.lrv)*100,pass:within(error,s.tolerance*.16),saturated:raw!==measured,mismatch};
}
export function scenarioState(name,previous=DEFAULTS){if(!SCENARIOS[name])throw new RangeError('Unknown scenario.');return {...previous,scenario:name,zeroAdjustment:0,spanAdjustment:0,configuredLrv:previous.lrv,configuredUrv:name==='range'?Math.min(100,previous.lrv+2*(previous.urv-previous.lrv)):previous.urv,requested:previous.lrv};}
export function target(s,index){const p=POINTS[index];return p?{...p,pressure:s.lrv+(s.urv-s.lrv)*p.percent/100,window:(s.urv-s.lrv)*.001}:null;}
export function newRun(kind='as-found'){return Object.freeze({kind,records:Object.freeze([]),invalid:false});}
export function invalidate(run){return Object.freeze({...run,invalid:true});}
export function canRecord(s,run){const r=simulate(s),t=target(s,run.records.length);return !!t&&!run.invalid&&within(r.reference-t.pressure,t.window);}
export function record(s,run,revision){if(!canRecord(s,run))throw new RangeError('Reach the reference target window before recording; restart an invalidated run.');const r=simulate(s),t=target(s,run.records.length);const row=Object.freeze({direction:t.direction,percent:t.percent,target:t.pressure,reference:r.reference,expected:r.expected,measured:r.measured,error:r.error,errorPercent:r.errorPercent,tolerance:s.tolerance,pass:r.pass,revision,saturated:r.saturated});return Object.freeze({...run,records:Object.freeze([...run.records,row])});}
export const complete=run=>!run.invalid&&run.records.length===9;
export const runPass=run=>complete(run)&&run.records.every(r=>r.pass);
