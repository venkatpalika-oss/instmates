/** Explicit GC snapshot consumption only; no subscription to measurement or GC changes. */
import {calculateCapturedMolarMass} from './gas-metering-molar-mass-model.js';
const massElement = id => document.getElementById(`gm-molar-mass-${id}`);
let lessonRunOrdinal = 1;
let calculationOrdinal = 0;
const clearMass = () => {
  for (const id of ['value', 'source', 'identity', 'provenance']) massElement(id).textContent = '—';
};
massElement('calculate').addEventListener('click', () => {
  clearMass();
  let gc;
  document.getElementById('gm-gc-controls')?.dispatchEvent(new CustomEvent('gm-gc-snapshot', {
    detail: {receive(snapshot) { gc = snapshot?.gc; }}
  }));
  calculationOrdinal += 1;
  const result = calculateCapturedMolarMass(gc, {lessonRunOrdinal, calculationOrdinal});
  if (result.status !== 'CALCULATED') {
    massElement('status').textContent = `No calculation — ${result.reason}`;
    return;
  }
  massElement('value').textContent = `${result.displayValue} kg/kmol`;
  const source = result.source;
  massElement('source').textContent = `Analysis #${source.analysisId} · Profile ${source.profileId} · Methane ${source.composition.methane} mole % · Ethane ${source.composition.ethane} mole % · Nitrogen ${source.composition.nitrogen} mole %`;
  massElement('identity').textContent = `${result.calculationId} · Page-session identity only`;
  massElement('provenance').textContent = `${result.method.id}-v${result.method.version} · ${result.constants.id}-v${result.constants.version} · ${result.constants.sourceIdentity}. GC steps: captured ${source.sampleCapturedAt}; started ${source.analysisStartedAt}; completed ${source.analysisCompletedAt}; delivered ${source.deliveredAt}.`;
  massElement('status').textContent = `Calculated from Analysis #${source.analysisId} — ${result.displayValue} kg/kmol. Snapshot — not automatically updated.`;
});
document.getElementById('gm-pressure-reset').addEventListener('click', () => {
  lessonRunOrdinal += 1;
  calculationOrdinal = 0;
  clearMass();
  massElement('status').textContent = 'No calculation yet';
});
massElement('calculate').hidden = false;
