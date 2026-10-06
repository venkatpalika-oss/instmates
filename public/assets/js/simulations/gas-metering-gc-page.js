/** GC-only controller. The accepted PT/TT controller owns its own state and reset. */
import {initialState, transition, sampleAge, validComposition} from './gas-metering-gc-model.js';
const byId = id => document.getElementById(id);
const profile = byId('gm-gc-profile');
const start = byId('gm-gc-start');
const advance = byId('gm-gc-advance');
let state = initialState();
function compositionText(record) {
  if (!record || !validComposition(record.composition, record.basis)) return '—';
  return `Methane ${record.composition.methane} mole % · Ethane ${record.composition.ethane} mole % · Nitrogen ${record.composition.nitrogen} mole %`;
}
function renderRecord(prefix, record) {
  const usable = record?.quality === 'GOOD';
  byId(`${prefix}-identity`).textContent = usable ? `Analysis #${record.analysisId} — Profile ${record.profileId}`
    : record?.quality === 'INVALID' ? 'Invalid educational record — no usable composition' : 'No GC result yet';
  byId(`${prefix}-composition`).textContent = usable ? compositionText(record) : '—';
  byId(`${prefix}-provenance`).textContent = usable
    ? `Captured step ${record.sampleCapturedAt}; started step ${record.analysisStartedAt}; completed step ${record.analysisCompletedAt}${record.deliveredAt === undefined ? '' : `; delivered step ${record.deliveredAt}`}.`
    : '—';
  const age = sampleAge(record, state.tick);
  byId(`${prefix}-age`).textContent = age === null ? 'Sample age: —' : `Sample age: ${age} simulation steps`;
}
function render() {
  profile.value = state.process.profileId;
  byId('gm-gc-process-composition').textContent = compositionText(state.process);
  byId('gm-gc-tick').textContent = `Simulation step: ${state.tick}`;
  const sample = state.capturedSample;
  byId('gm-gc-sample-identity').textContent = sample ? `Profile ${sample.profileId} — captured step ${sample.sampleCapturedAt}` : 'No captured sample';
  byId('gm-gc-sample-composition').textContent = compositionText(sample);
  byId('gm-gc-current').textContent = state.analysisState === 'IDLE' ? 'IDLE — no analysis started'
    : state.analysisState === 'ANALYZING' ? `ANALYZING — Analysis #${sample.analysisId}, Profile ${sample.profileId} sample; ${state.tick - sample.analysisStartedAt} of 2 steps elapsed`
    : `COMPLETE — Analysis #${sample.analysisId}, Profile ${sample.profileId} sample`;
  start.disabled = state.analysisState === 'ANALYZING';
  byId('gm-gc-start-help').textContent = start.disabled ? 'Analysis in progress. Start is unavailable until two simulation steps have elapsed. Use Advance simulation.' : 'Start captures the currently selected educational profile. Analysis requires two simulation steps.';
  renderRecord('gm-gc-result', state.completed);
  renderRecord('gm-gc-input', state.selected);
}
function dispatch(action) {
  const result = transition(state, action);
  byId('gm-gc-error').textContent = result.error || '';
  if (result.error) return;
  state = result.state;
  render();
}
profile.addEventListener('change', () => dispatch({type: 'profile', profileId: profile.value}));
start.addEventListener('click', () => dispatch({type: 'start'}));
advance.addEventListener('click', () => dispatch({type: 'advance'}));
byId('gm-pressure-reset').addEventListener('click', () => dispatch({type: 'reset'}));
render();
byId('gm-gc-controls').hidden = false;
