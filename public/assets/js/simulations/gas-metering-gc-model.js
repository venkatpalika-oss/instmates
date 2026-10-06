/** Educational sample lifecycle only. Steps are not physical GC cycle time. */
export const BASIS = 'mole-percent';
export const ANALYSIS_STEPS = 2;
const components = ['methane', 'ethane', 'nitrogen'];
const profiles = Object.freeze({
  A: Object.freeze({methane: 80, ethane: 10, nitrogen: 10}),
  B: Object.freeze({methane: 60, ethane: 20, nitrogen: 20})
});
const tickValid = value => Number.isSafeInteger(value) && value >= 0;
const profileValid = id => id === 'A' || id === 'B';
export function validComposition(composition, basis) {
  return basis === BASIS && composition !== null && typeof composition === 'object' && !Array.isArray(composition)
    && Object.keys(composition).length === components.length
    && components.every(key => Object.hasOwn(composition, key) && Number.isInteger(composition[key]) && composition[key] >= 0 && composition[key] <= 100)
    && components.reduce((sum, key) => sum + composition[key], 0) === 100;
}
const copyRecord = record => Object.freeze({...record, composition: Object.freeze({...record.composition})});
export function educationalProfile(profileId) {
  return profileValid(profileId) ? copyRecord({profileId, basis: BASIS, composition: profiles[profileId]}) : null;
}
const absent = quality => Object.freeze({quality, composition: null});
export function validCompleted(record) {
  return !!record && record.quality === 'GOOD' && profileValid(record.profileId)
    && validComposition(record.composition, record.basis)
    && Number.isSafeInteger(record.analysisId) && record.analysisId > 0
    && tickValid(record.sampleCapturedAt) && tickValid(record.analysisStartedAt) && tickValid(record.analysisCompletedAt)
    && record.sampleCapturedAt === record.analysisStartedAt
    && record.analysisCompletedAt - record.analysisStartedAt === ANALYSIS_STEPS;
}
export function completeSample(sample, completionTick) {
  if (!sample) return absent('UNAVAILABLE');
  const result = {...sample, analysisCompletedAt: completionTick, quality: 'GOOD'};
  return validCompleted(result) ? copyRecord(result) : absent('INVALID');
}
export function deliverResult(completed, now) {
  if (!completed || completed.quality === 'UNAVAILABLE') return absent('UNAVAILABLE');
  if (!validCompleted(completed) || !tickValid(now) || now !== completed.analysisCompletedAt) return absent('INVALID');
  return copyRecord({...completed, deliveredAt: now});
}
export function selectComposition(delivered, now) {
  if (!delivered || delivered.quality === 'UNAVAILABLE') return Object.freeze({...absent('UNAVAILABLE'), source: 'GC'});
  if (!validCompleted(delivered) || !tickValid(now) || delivered.deliveredAt !== delivered.analysisCompletedAt || delivered.deliveredAt > now) {
    return Object.freeze({...absent('INVALID'), source: 'GC'});
  }
  return copyRecord({...delivered, source: 'GC'});
}
export function sampleAge(record, now) {
  return validCompleted(record) && tickValid(now) && now >= record.analysisCompletedAt ? now - record.sampleCapturedAt : null;
}
export function initialState() {
  return Object.freeze({process: educationalProfile('A'), tick: 0, analysisState: 'IDLE', nextAnalysisId: 1,
    capturedSample: null, completed: null, delivered: null, selected: selectComposition(null, 0)});
}
export function transition(state, action) {
  const reject = error => ({state, error});
  if (action.type === 'reset') return {state: initialState(), error: null};
  if (action.type === 'profile') {
    const process = educationalProfile(action.profileId);
    return process ? {state: Object.freeze({...state, process}), error: null} : reject('Select educational Profile A or B.');
  }
  if (action.type === 'start') {
    if (!['IDLE', 'COMPLETE'].includes(state.analysisState)) return reject('An analysis is already in progress. Advance simulation to complete it.');
    if (!state.process || !profileValid(state.process.profileId) || !validComposition(state.process.composition, state.process.basis)
      || !tickValid(state.tick) || state.tick > Number.MAX_SAFE_INTEGER - ANALYSIS_STEPS
      || !Number.isSafeInteger(state.nextAnalysisId) || state.nextAnalysisId < 1 || state.nextAnalysisId >= Number.MAX_SAFE_INTEGER) {
      return reject('Sample capture unavailable: invalid educational composition or timing.');
    }
    const capturedSample = copyRecord({...state.process, analysisId: state.nextAnalysisId, sampleCapturedAt: state.tick, analysisStartedAt: state.tick});
    return {state: Object.freeze({...state, capturedSample, analysisState: 'ANALYZING', nextAnalysisId: state.nextAnalysisId + 1}), error: null};
  }
  if (action.type === 'advance') {
    if (!tickValid(state.tick) || state.tick === Number.MAX_SAFE_INTEGER) return reject('Simulation step limit reached. Reset lesson.');
    const tick = state.tick + 1;
    if (state.analysisState === 'ANALYZING') {
      const sample = state.capturedSample;
      if (!sample || !tickValid(sample.analysisStartedAt) || sample.analysisStartedAt > state.tick) return reject('Invalid analysis timing. Reset lesson.');
      if (tick - sample.analysisStartedAt >= ANALYSIS_STEPS) {
        const completed = completeSample(sample, tick);
        const delivered = deliverResult(completed, tick);
        const selected = selectComposition(delivered, tick);
        return {state: Object.freeze({...state, tick, analysisState: 'COMPLETE', completed, delivered, selected}), error: null};
      }
    }
    return {state: Object.freeze({...state, tick}), error: null};
  }
  return reject('Unsupported GC lesson action.');
}
