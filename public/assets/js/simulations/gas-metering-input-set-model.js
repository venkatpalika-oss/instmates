/** Educational provenance snapshots only. No engineering eligibility or calculation model. */
import {selectPressure} from './gas-metering-pressure-model.js';
import {selectTemperature} from './gas-metering-temperature-model.js';
import {selectComposition, sampleAge} from './gas-metering-gc-model.js';
const current = 'CURRENT_EDUCATIONAL_OBSERVATION';
const sampled = 'SAMPLED_DELAYED_EDUCATIONAL_OBSERVATION';
const domain = 'GC_LOCAL_SIMULATION_STEPS';
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function scalar(input, pressure) {
  const source = pressure ? 'PT' : 'TT';
  const measurementType = pressure ? 'PRESSURE' : 'TEMPERATURE';
  const key = pressure ? 'valuePa' : 'valueC';
  const unit = pressure ? 'Pa' : '°C';
  const path = `${source} observation → transmission → FC selection`;
  const absent = quality => ({measurementType, [key]: null, unit, ...(pressure ? {basis: 'absolute'} : {}), source, quality,
    provenance: {type: current, path}});
  if (input == null) return absent('UNAVAILABLE');
  const metadata = input.measurementType === measurementType && input.source === source && input.unit === unit
    && (pressure ? input.basis === 'absolute' : !Object.hasOwn(input, 'basis'))
    && input.provenance?.type === current && input.provenance?.path === path;
  if (!metadata) return absent('INVALID');
  if (input.quality === 'UNAVAILABLE') return absent('UNAVAILABLE');
  const accepted = pressure ? selectPressure(input) : selectTemperature(input);
  return accepted.quality === 'GOOD' ? {...absent('GOOD'), [key]: accepted[key]} : absent('INVALID');
}
function composition(input, tick) {
  const absent = quality => ({measurementType: 'GAS_COMPOSITION', composition: null, basis: 'mole-percent', source: 'GC', quality,
    provenance: {type: sampled}, timeDomain: domain});
  if (input == null) return absent('UNAVAILABLE');
  if (input.measurementType !== 'GAS_COMPOSITION' || input.source !== 'GC' || input.basis !== 'mole-percent'
    || input.provenance?.type !== sampled || input.timeDomain !== domain) return absent('INVALID');
  if (input.quality === 'UNAVAILABLE') return absent('UNAVAILABLE');
  const selected = selectComposition(input, tick);
  if (selected.quality !== 'GOOD') return absent('INVALID');
  const {analysisId, profileId, sampleCapturedAt, analysisStartedAt, analysisCompletedAt, deliveredAt} = selected;
  return {...absent('GOOD'), analysisId, profileId, composition: {...selected.composition},
    sampleCapturedAt, analysisStartedAt, analysisCompletedAt, deliveredAt,
    ageAtAssemblySteps: sampleAge(selected, tick), ageEvaluatedAtGcTick: tick};
}
export function assembleInputSet(setId, inputs = {}) {
  if (!Number.isSafeInteger(setId) || setId < 1) throw new TypeError('A positive reset-local set ID is required');
  const records = {pressure: scalar(inputs.pressure, true), temperature: scalar(inputs.temperature, false), gc: composition(inputs.gc, inputs.gcTick)};
  const missingRecords = [], invalidRecords = [];
  for (const record of Object.values(records)) {
    if (record.quality === 'UNAVAILABLE') missingRecords.push(record.source);
    else if (record.quality !== 'GOOD') invalidRecords.push(record.source);
  }
  const context = inputs.teachingContext;
  return freeze({schemaVersion: 1, setId, records,
    teachingContext: {ptBiasEnabled: typeof context?.ptBiasEnabled === 'boolean' ? context.ptBiasEnabled : null,
      ttBiasEnabled: typeof context?.ttBiasEnabled === 'boolean' ? context.ttBiasEnabled : null},
    completeness: missingRecords.length || invalidRecords.length ? 'INCOMPLETE' : 'COMPLETE',
    recordIntegrity: invalidRecords.length ? 'INVALID_RECORD_PRESENT' : 'STRUCTURALLY_VALID',
    missingRecords, invalidRecords, temporalAlignment: 'NOT_ESTABLISHED', calculationEligibility: 'NOT_EVALUATED'});
}
