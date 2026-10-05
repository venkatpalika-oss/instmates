/** Equipment descriptions and independent educational measurement lessons. */
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

// Quantity-specific states remain separate; equipment selection stays descriptive.
import {initialState, transition, measurementChain, displayPressure} from './gas-metering-pressure-model.js';
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
import {initialState as initialTemperature, transition as temperatureTransition, measurementChain as temperatureChain, displayTemperature} from './gas-metering-temperature-model.js';
const temperatureEntry = document.getElementById('gm-temperature-entry');
const temperatureBias = document.getElementById('gm-temperature-bias');
const temperatureFeedback = document.getElementById('gm-temperature-error');
let temperatureState = initialTemperature();
function renderTemperature() {
  const chain = temperatureChain(temperatureState);
  const values = {process: {valueC: chain.processC, quality: 'GOOD', unit: '°C'}, observation: chain.observation, transmitted: chain.transmitted, selected: chain.selected};
  for (const [stage, value] of Object.entries(values)) {
    document.querySelectorAll(`[data-temperature="${stage}"]`).forEach(el => { el.textContent = displayTemperature(value); });
  }
  document.getElementById('gm-temperature-bias-context').textContent = temperatureState.biasEnabled ? 'Educational TT bias ON: +2 °C offset.' : 'Educational TT bias OFF: no injected offset.';
  document.getElementById('gm-temperature-explanation').textContent = temperatureState.biasEnabled
    ? 'The TT observation increased by the injected offset. Transmission and the selected temperature followed it. Modeled process temperature did not change.'
    : 'With no injected offset, the educational TT observation equals modeled temperature.';
}
document.getElementById('gm-temperature-form').addEventListener('submit', event => {
  event.preventDefault();
  const result = temperatureTransition(temperatureState, {type: 'apply', text: temperatureEntry.value});
  temperatureFeedback.textContent = result.error || '';
  temperatureEntry.setAttribute('aria-invalid', String(Boolean(result.error)));
  if (result.error) return;
  temperatureState = result.state;
  renderTemperature();
});
temperatureBias.addEventListener('change', () => {
  temperatureState = temperatureTransition(temperatureState, {type: 'bias', enabled: temperatureBias.checked}).state;
  renderTemperature();
});
const lessonButtons = [...document.querySelectorAll('[data-lesson]')];
function selectLesson(name) {
  lessonButtons.forEach(button => {
    const selected = button.dataset.lesson === name;
    button.setAttribute('aria-pressed', String(selected));
    document.getElementById(button.getAttribute('aria-controls')).hidden = !selected;
  });
}
lessonButtons.forEach(button => button.addEventListener('click', () => selectLesson(button.dataset.lesson)));
document.getElementById('gm-pressure-reset').addEventListener('click', () => {
  pressureState = transition(pressureState, {type: 'reset'}).state;
  temperatureState = temperatureTransition(temperatureState, {type: 'reset'}).state;
  entry.value = '300'; bias.checked = false;
  temperatureEntry.value = '30'; temperatureBias.checked = false;
  entry.setAttribute('aria-invalid', 'false'); feedback.textContent = '';
  temperatureEntry.setAttribute('aria-invalid', 'false'); temperatureFeedback.textContent = '';
  renderPressure(); renderTemperature(); selectLesson('pressure');
});
renderPressure(); renderTemperature(); selectLesson('pressure');
document.getElementById('gm-lessons').hidden = false;
