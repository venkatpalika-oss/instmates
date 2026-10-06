/** Explicit assembly only; measurement controllers remain the sole owners of live state. */
import {assembleInputSet} from './gas-metering-input-set-model.js';
const inputSetById = id => document.getElementById(id);
let nextSetId = 1;
function requestSnapshot(id, type) {
  let snapshot;
  inputSetById(id)?.dispatchEvent(new CustomEvent(type, {detail: {receive(value) { snapshot = value; }}}));
  return snapshot;
}
const text = (id, value) => { inputSetById(`gm-input-set-${id}`).textContent = value; };
const biasText = value => value === null ? 'Unavailable' : value ? 'ON' : 'OFF';
inputSetById('gm-input-set-assemble').addEventListener('click', () => {
  if (!Number.isSafeInteger(nextSetId)) { text('status', 'Set ID limit reached. Reset lesson.'); return; }
  const measurements = requestSnapshot('gm-pressure-form', 'gm-measurement-snapshot');
  const gas = requestSnapshot('gm-gc-controls', 'gm-gc-snapshot');
  const set = assembleInputSet(nextSetId, {...measurements, ...gas});
  nextSetId += 1;
  const {pressure, temperature, gc} = set.records;
  text('status', `Set #${set.setId} — ${set.completeness}`);
  text('pressure', pressure.quality === 'GOOD' ? `${pressure.valuePa} Pa (absolute) · Source: PT · Educational record quality: GOOD` : `PT: ${pressure.quality} — no pressure value`);
  text('temperature', temperature.quality === 'GOOD' ? `${temperature.valueC} °C · Source: TT · Educational record quality: GOOD` : `TT: ${temperature.quality} — no temperature value`);
  text('gc', gc.quality === 'GOOD' ? `Analysis #${gc.analysisId} — Profile ${gc.profileId} · Source: GC · Methane ${gc.composition.methane} mole % · Ethane ${gc.composition.ethane} mole % · Nitrogen ${gc.composition.nitrogen} mole %` : `GC: ${gc.quality} — no composition`);
  text('gc-provenance', gc.quality === 'GOOD' ? `GC-local steps: captured ${gc.sampleCapturedAt}; started ${gc.analysisStartedAt}; completed ${gc.analysisCompletedAt}; delivered ${gc.deliveredAt}. Age evaluated at GC tick ${gc.ageEvaluatedAtGcTick}.` : 'GC sample provenance unavailable.');
  text('age', gc.quality === 'GOOD' ? `Sample age at assembly: ${gc.ageAtAssemblySteps} GC simulation steps` : 'Sample age at assembly: —');
  text('completeness', set.completeness);
  text('integrity', set.recordIntegrity);
  text('issues', `Missing: ${set.missingRecords.join(', ') || 'None'}. Invalid: ${set.invalidRecords.join(', ') || 'None'}.`);
  text('bias', `PT teaching bias: ${biasText(set.teachingContext.ptBiasEnabled)} · TT teaching bias: ${biasText(set.teachingContext.ttBiasEnabled)}`);
  inputSetById('gm-input-set-records').hidden = false;
});
inputSetById('gm-pressure-reset').addEventListener('click', () => {
  nextSetId = 1;
  inputSetById('gm-input-set-records').hidden = true;
  for (const id of ['pressure', 'temperature', 'gc', 'gc-provenance', 'age', 'completeness', 'integrity', 'issues', 'bias']) text(id, '—');
  text('status', 'No input set assembled');
});
inputSetById('gm-input-set-assemble').hidden = false;
