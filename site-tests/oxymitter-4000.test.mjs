import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as engineApi from '../public/assets/js/simulations/oxymitter-4000/startup-engine.mjs';
import * as fixtureApi from '../public/assets/js/simulations/oxymitter-4000/source-data.mjs';
import { validateDatum, validateFixtureTree, readSupported } from '../public/assets/js/simulations/oxymitter-4000/provenance.mjs';

const { SOURCE_DATA: data } = fixtureApi;
const { createStartupEngine } = engineApi;
const value = d => readSupported(d, data.evidence);
// Independently transcribed from PDF pp107-108, not generated from M0 or the
// implementation's values. These remain reference points, not measurement limits.
const manualPairs = [
  [100,-34],[20,1],[15,7.25],[10,16.1],[9,18.4],[8,21.1],[7,23.8],
  [6,27.2],[5,31.2],[4,36],[3,42.3],[2,51.1],[1,66.1],[.8,71],
  [.6,77.5],[.5,81.5],[.4,86.3],[.2,101.4],[.1,116.6],[.01,166.8],
];
test('oxy: all 20 exact source pairs and table provenance', () => {
  assert.deepEqual(data.referencePoints.map(p => [value(p.oxygenPercent), value(p.emfMv)]), manualPairs);
  for (const pair of data.referencePoints) for (const d of Object.values(pair)) {
    assert.equal(d.source.evidenceId, 'E65');
    assert.deepEqual(data.evidence[d.source.evidenceId].pages, [107,108]);
  }
});

test('oxy: measurement table endpoints do not redefine detection or range', () => {
  assert.equal(value(data.operating.lowestDetectable), .02);
  assert.deepEqual(value(data.operating.factoryRange), { lower:0, upper:10 });
  assert.deepEqual(value(data.operating.localRanges), [{lower:0,upper:10},{lower:0,upper:25}]);
  assert.equal(value(data.operating.cellSetpoint), 736);
  assert.equal(value(data.operating.referenceOxygen), 20.95);
  assert.equal(value(data.operating.warmupApproximate), 30);
});

test('oxy: every technical leaf has validated evidence and blocked values cannot execute', () => {
  const counts = validateFixtureTree(data, data.evidence);
  assert.ok(counts.SUPPORTED > 0);
  assert.equal(counts.DERIVED, 0);
  let blocked = 0;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.status) {
      assert.ok(data.evidence[node.source.evidenceId]);
      if (node.status !== 'SUPPORTED') {
        blocked++;
        assert.equal(Object.hasOwn(node,'value'),false);
        assert.throws(() => readSupported(node,data.evidence),RangeError);
      }
      return;
    }
    Object.values(node).forEach(visit);
  }
  visit(data);
  assert.equal(blocked,counts.UNSUPPORTED);
});

test('oxy: schema rejects absent source, invalid pages, bad status and executable unsupported data', () => {
  const valid = {status:'SUPPORTED',value:30,unit:'minute',source:{evidenceId:'E44'}};
  assert.equal(validateDatum(valid,data.evidence),valid);
  for (const patch of [{source:null},{source:{evidenceId:'unknown'}},{status:'GUESS'},{value:NaN},{value:Infinity},{unit:''},{value:null}]) {
    assert.throws(() => validateDatum({...valid,...patch},data.evidence),TypeError);
  }
  for (const pages of [[],[0],[187],[1.1]]) assert.throws(() => validateDatum(valid,{E44:{section:'5.1.1',pages}}),TypeError);
  assert.throws(() => validateDatum({...valid,status:'UNSUPPORTED'},data.evidence),TypeError);
  assert.throws(() => validateDatum({...valid,status:'DERIVED',approval:'owner'},data.evidence),TypeError);
  const derived = {status:'DERIVED',availability:'BLOCKED',gapId:'G01',reason:'Unapproved derivation',source:{evidenceId:'E02'}};
  validateDatum(derived,data.evidence);
  assert.throws(() => readSupported(derived,data.evidence),RangeError);
});

test('oxy: fixtures and nested arrays are immutable', () => {
  assert.throws(() => { data.referencePoints[0].emfMv.value = 0; },TypeError);
  assert.throws(() => data.startup.warmupLedSteps.value[0].push('HEATER'),TypeError);
  assert.throws(() => {data.evidence.E44.pages[0]=1;},TypeError);
});

test('oxy: fault numbers, messages, LEDs, blinks and self-clear match independent tables', () => {
  // Table2-8 p53 and Table8-2 p111 independently encoded, not source-data reads.
  const messages = ['O2 T/C Open','O2 T/C Shorted','O2 T/C Reversed','ADC Error','O2 Heater Open','Very Hi O2 Temp','Board Temp Hi','O2 Temp Low','O2 Temp Hi','O2 Cell Open','O2 Cell Bad','EEprom Corrupt','O2 Cell Bad','O2 Cell Bad','Calib Failed'];
  const groups = ['HEATER T/C','HEATER T/C','HEATER T/C','HEATER T/C','HEATER','HEATER','HEATER','HEATER','HEATER','O2 CELL','O2 CELL','O2 CELL','CALIBRATION','CALIBRATION','CALIBRATION'];
  const blinks = [1,2,3,4,1,2,3,4,5,1,3,4,1,2,3];
  for (let i=0;i<15;i++) {
    const f=data.faults[i];
    assert.equal(value(f.number),i+1);
    assert.equal(value(f.loiMessage),messages[i]);
    assert.equal(value(f.diagnosticLed),groups[i]);
    assert.equal(value(f.blinkCount),blinks[i]);
    assert.equal(value(f.selfClearing),[1,2,3,4,5,6,12].includes(i+1)?'NO':'YES');
    assert.equal(f.simulationImplemented,false);
  }
  assert.equal(value(data.faults[1].pause),2); // p114, not the general 3s.
});

test('oxy: conflicting fault9 and incomplete line-frequency details stay blocked', () => {
  assert.equal(data.faults[8].outputBehavior.gapId,'G06');
  const f=data.faults.find(f=>f.id==='line-frequency');
  assert.equal(value(f.loiMessage),'Line Freq Error');
  assert.equal(value(f.selfClearing),'NO');
  for (const key of ['number','diagnosticLed','blinkCount','outputBehavior']) assert.equal(f[key].availability,'BLOCKED');
  const old=data.faults.find(f=>f.historicalOnly);
  assert.equal(old.triggerDescription.gapId,'G05');
});

test('oxy: calibration constants are data only with exact limits and timings', () => {
  assert.deepEqual(value(data.calibration.lowGas),{min:.4,max:2,balance:'nitrogen'});
  assert.deepEqual(value(data.calibration.highGas),{min:8,max:21,balance:'nitrogen'});
  assert.deepEqual(value(data.calibration.slopeLimits),{min:35,max:52});
  assert.deepEqual(value(data.calibration.constantLimits),{min:-4,max:10});
  assert.equal(value(data.calibration.gasFlowTime),300);
  assert.equal(value(data.calibration.purgeTime),3);
  assert.equal(value(data.calibration.gasApplicationWait),30);
  assert.equal(data.blockedCapabilities.calibrationMath.availability,'BLOCKED');
});

test('oxy: exact test-point polarities and examples; no generalized voltage transfer', () => {
  assert.deepEqual(data.testPoints.map(t=>[value(t.positive),value(t.negative)]),[['TP1','TP2'],['TP3','TP4'],['TP5','TP6']]);
  assert.deepEqual(data.testPoints[2].examples.map(t=>[value(t.oxygenPercent),value(t.voltage)]),[[8,8],[.4,.4]]);
  assert.equal(data.testPoints[0].continuousConversion.gapId,'G01');
  assert.equal(data.testPoints[1].temperatureConversion.gapId,'G09');
  assert.equal(data.testPoints[2].generalConversion.gapId,'G11');
});

test('oxy: air, pressure and variant conflicts are reference-only blocked records', () => {
  for (const d of Object.values(data.conflictingContexts)) assert.throws(()=>readSupported(d,data.evidence),RangeError);
});

test('oxy: initial state is POWER OFF with no invented output or temperature', () => {
  const e=createStartupEngine(),s=e.snapshot();
  assert.equal(s.device.state,'POWER OFF');
  assert.equal(s.infrastructure.elapsedLogicalWarmupSeconds,0);
  assert.equal(s.device.analogOutput.availability,'BLOCKED');
  assert.equal(s.device.loi.oxygenPercent,null);
  assert.equal(Object.hasOwn(s.device,'temperature'),false);
  assert.throws(()=>e.advanceLogicalTime(30),RangeError);
  assert.throws(()=>e.advanceIndication(),RangeError);
});

test('oxy: apply power is an event leading directly to documented WARM UP', () => {
  const e=createStartupEngine(),s=e.applyPower();
  assert.equal(s.device.state,'WARM UP');
  assert.equal(s.device.heater.status,'ON');
  assert.equal(s.device.loi.mode,'WARM UP');
  assert.equal(s.device.loi.text,'Warm up');
  assert.equal(s.device.analogOutput.value,3.5);
  assert.deepEqual(s.device.membrane.litDiagnosticLeds,['CALIBRATION']);
  assert.throws(()=>e.applyPower(),RangeError);
});

test('oxy: selectable startup output is limited to documented SW2.3 settings', () => {
  assert.equal(createStartupEngine({startupOutputMa:21.6}).applyPower().device.analogOutput.value,21.6);
  for(const v of [0,4,20,NaN,Infinity,'3.5',null]) assert.throws(()=>createStartupEngine({startupOutputMa:v}),RangeError);
});

test('oxy: cumulative bottom-up warmup LEDs extinguish together and repeat', () => {
  const e=createStartupEngine();e.applyPower();
  const expected=[['CALIBRATION'],['CALIBRATION','O2 CELL'],['CALIBRATION','O2 CELL','HEATER'],['CALIBRATION','O2 CELL','HEATER','HEATER T/C'],[],['CALIBRATION']];
  const actual=[e.snapshot().device.membrane.litDiagnosticLeds];
  for(let i=1;i<expected.length;i++) actual.push(e.advanceIndication().device.membrane.litDiagnosticLeds);
  assert.deepEqual(actual,expected);
  assert.equal(e.snapshot().infrastructure.elapsedLogicalWarmupSeconds,0);
  assert.equal(e.snapshot().infrastructure.indicationCadence,'NOT SPECIFIED IN SOURCE MANUAL');
});

test('oxy: time cannot invent LED cadence or a thermal trajectory', () => {
  const e=createStartupEngine();e.applyPower();e.advanceIndication();
  const before=e.snapshot().device.membrane;
  const s=e.advanceLogicalTime(1000);
  assert.deepEqual(s.device.membrane,before);
  assert.equal(Object.hasOwn(s.device,'temperature'),false);
  assert.equal(s.infrastructure.approximateManualDuration,true);
});

test('oxy: educational time boundary transitions at approximately 30-minute milestone', () => {
  const e=createStartupEngine();e.applyPower();
  assert.equal(e.advanceLogicalTime(1799).device.state,'WARM UP');
  assert.equal(e.advanceLogicalTime(.5).device.state,'WARM UP');
  const s=e.advanceLogicalTime(.5);
  assert.equal(s.device.state,'NORMAL OPERATION');
  assert.equal(s.device.loi.mode,'O2 DISPLAY');
  assert.equal(s.device.loi.oxygenPercent,null);
  assert.equal(s.device.loi.readingAvailability,'MEASUREMENT NOT IMPLEMENTED');
  assert.equal(s.device.analogOutput.availability,'BLOCKED');
  assert.deepEqual(s.device.membrane.litDiagnosticLeds,['HEATER T/C']);
});

test('oxy: one-step acceleration and partitioned time have identical results', () => {
  const a=createStartupEngine(),b=createStartupEngine();a.applyPower();b.applyPower();
  a.advanceLogicalTime(1800);
  for(let i=0;i<18;i++)b.advanceLogicalTime(100);
  assert.deepEqual(a.snapshot(),b.snapshot());
  const c=createStartupEngine();c.applyPower();
  assert.equal(c.advanceLogicalTime(1e100).infrastructure.elapsedLogicalWarmupSeconds,1800);
});

test('oxy: invalid time is rejected without changing valid engine state', () => {
  const e=createStartupEngine();e.applyPower();const before=e.snapshot();
  for(const t of [-1,NaN,Infinity,-Infinity,'60',null,undefined]) {
    assert.throws(()=>e.advanceLogicalTime(t),RangeError);
    assert.deepEqual(e.snapshot(),before);
  }
  assert.deepEqual(e.advanceLogicalTime(0),before);
});

test('oxy: normal LEDs run one at a time, top to bottom, then repeat', () => {
  const e=createStartupEngine();e.applyPower();e.advanceLogicalTime(1800);
  const actual=[e.snapshot().device.membrane.litDiagnosticLeds];
  for(let i=0;i<4;i++)actual.push(e.advanceIndication().device.membrane.litDiagnosticLeds);
  assert.deepEqual(actual,[['HEATER T/C'],['HEATER'],['O2 CELL'],['CALIBRATION'],['HEATER T/C']]);
  assert.throws(()=>e.advanceLogicalTime(1),RangeError);
});

test('oxy: power removal resets infrastructure without creating a cooling model', () => {
  const e=createStartupEngine();e.applyPower();e.advanceLogicalTime(17);e.advanceIndication();
  assert.equal(e.removePower().device.state,'POWER OFF');
  assert.equal(e.applyPower().infrastructure.elapsedLogicalWarmupSeconds,0);
  assert.deepEqual(e.snapshot().device.membrane.litDiagnosticLeds,['CALIBRATION']);
});

test('oxy: externally reported startup fault is only an alarm boundary', () => {
  const e=createStartupEngine();e.applyPower();e.advanceLogicalTime(10);
  const s=e.reportStartupFault('fault-1');
  assert.equal(s.device.state,'FAULT INDICATION');
  assert.equal(s.device.loi.text,'O2 T/C Open');
  assert.equal(s.device.membrane.mode,'FAULT_BOUNDARY');
  assert.equal(s.device.membrane.litDiagnosticLeds,null);
  assert.equal(s.device.analogOutput.availability,'BLOCKED');
  assert.throws(()=>e.advanceLogicalTime(1800),RangeError);
  assert.throws(()=>e.advanceIndication(),RangeError);
  assert.throws(()=>e.reportStartupFault('fault-2'),RangeError);
});

test('oxy: startup fault boundary rejects unknown/historical and non-startup calls', () => {
  const e=createStartupEngine();
  assert.throws(()=>e.reportStartupFault('fault-1'),RangeError);
  e.applyPower();
  for(const id of ['unknown','calibration-recommended','fault-16',1]) assert.throws(()=>e.reportStartupFault(id),RangeError);
  assert.equal(e.reportStartupFault('line-frequency').device.loi.text,'Line Freq Error');
  e.removePower();e.applyPower();e.advanceLogicalTime(1800);
  assert.throws(()=>e.reportStartupFault('fault-1'),RangeError);
});

test('oxy: independent engines and immutable snapshots prevent externally forged state', () => {
  const a=createStartupEngine(),b=createStartupEngine();a.applyPower();
  const s=a.snapshot();
  assert.throws(()=>{s.device.state='NORMAL OPERATION';},TypeError);
  assert.throws(()=>s.device.membrane.litDiagnosticLeds.push('HEATER'),TypeError);
  assert.equal(b.snapshot().device.state,'POWER OFF');
  assert.equal(a.snapshot().device.state,'WARM UP');
});

test('oxy: executable API exposes no solver, analog mapping, calibration or game', () => {
  assert.deepEqual(Object.keys(engineApi),['createStartupEngine']);
  assert.deepEqual(Object.keys(fixtureApi),['SOURCE_DATA']);
  assert.deepEqual(Object.keys(createStartupEngine()).sort(),['advanceIndication','advanceLogicalTime','applyPower','removePower','reportStartupFault','snapshot']);
  for(const d of Object.values(data.blockedCapabilities)) assert.throws(()=>readSupported(d,data.evidence),RangeError);
  for(const file of ['startup-engine.mjs','source-data.mjs','provenance.mjs']) {
    const code=readFileSync(new URL(`../public/assets/js/simulations/oxymitter-4000/${file}`,import.meta.url),'utf8');
    assert.doesNotMatch(code,/from ['"].*linear\.js|Math\.log|setInterval\(|setTimeout\(/);
  }
});

test('oxy: M7 public route and catalog registration exist', () => {
  assert.equal(existsSync(new URL('../public/simulations/oxymitter-4000/',import.meta.url)),true);
  assert.match(readFileSync(new URL('../public/assets/js/simulations/catalog.js',import.meta.url),'utf8'),/oxymitter-4000/);
});
