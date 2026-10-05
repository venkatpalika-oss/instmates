/** Equipment descriptions and the isolated educational pressure lesson. */
const controls = document.querySelector('.gm-equipment');
const buttons = [...controls.querySelectorAll('button[data-equipment]')];
const details = [...document.querySelectorAll('[data-detail]')];
const announcement = document.getElementById('gm-selected');
controls.hidden = false;
controls.addEventListener('click', event => {
  const button = event.target.closest('button[data-equipment]');
  if (!button || !controls.contains(button)) return;
  const detail = details.find(item => item.dataset.detail === button.dataset.equipment);
  if (!detail) return;
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  details.forEach(item => { item.hidden = item !== detail; });
  announcement.textContent = `Selected equipment: ${detail.querySelector('h3').textContent}`;
});

// Only the educational pressure slice is active; equipment selection stays descriptive.
import {initialState, transition, measurementChain, displayPressure} from './gas-metering-pressure-model.js';
const lesson = document.getElementById('gm-pressure-lesson');
const form = document.getElementById('gm-pressure-form');
const entry = document.getElementById('gm-pressure-entry');
const bias = document.getElementById('gm-pressure-bias');
const feedback = document.getElementById('gm-pressure-error');
let pressureState = initialState();
function renderPressure() {
  const chain = measurementChain(pressureState);
  const values = {process: {valuePa: chain.processPa, quality: 'GOOD', unit: 'Pa', basis: 'absolute'}, observation: chain.observation, transmitted: chain.transmitted, selected: chain.selected};
  for (const [stage, value] of Object.entries(values)) {
    document.querySelectorAll(`[data-pressure="${stage}"]`).forEach(el => { el.textContent = displayPressure(value); });
  }
  document.getElementById('gm-bias-context').textContent = pressureState.biasEnabled ? 'Educational PT bias ON: +20 kPa offset.' : 'Educational PT bias OFF: no injected offset.';
  document.getElementById('gm-pressure-explanation').textContent = pressureState.biasEnabled
    ? 'The PT observation increased by the injected offset. The transmitted and selected pressures followed it. Modeled process pressure did not change.'
    : 'With no injected offset, the educational PT observation equals the modeled pressure.';
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const result = transition(pressureState, {type: 'apply', text: entry.value});
  feedback.textContent = result.error || '';
  entry.setAttribute('aria-invalid', String(Boolean(result.error)));
  if (result.error) return;
  pressureState = result.state;
  renderPressure();
});
bias.addEventListener('change', () => {
  pressureState = transition(pressureState, {type: 'bias', enabled: bias.checked}).state;
  renderPressure();
});
document.getElementById('gm-pressure-reset').addEventListener('click', () => {
  pressureState = transition(pressureState, {type: 'reset'}).state;
  entry.value = '300'; bias.checked = false;
  entry.setAttribute('aria-invalid', 'false'); feedback.textContent = '';
  renderPressure();
});
renderPressure();
lesson.hidden = false;
