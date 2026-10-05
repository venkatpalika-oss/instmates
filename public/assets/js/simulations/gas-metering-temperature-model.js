/** Educational temperature lesson only; no equipment specifications or flow calculations. */
export const INITIAL_TEMPERATURE_C = 30;
export const BIAS_C = 2;
const record = (valueC, quality = 'GOOD') => ({valueC, quality, unit: '°C'});
export const initialState = () => ({processC: INITIAL_TEMPERATURE_C, biasEnabled: false});
export function parseTemperature(text) {
  if (typeof text !== 'string' || !/^[0-9]+$/.test(text.trim())) {
    return {error: 'Enter a whole number from 20 through 40, without units or punctuation. Draft not applied.'};
  }
  const celsius = Number(text.trim());
  if (!Number.isSafeInteger(celsius) || celsius < 20 || celsius > 40) {
    return {error: 'Temperature must be from 20 through 40 °C. Draft not applied.'};
  }
  return {valueC: celsius};
}
export function transition(state, action) {
  if (action.type === 'reset') return {state: initialState(), error: null};
  if (action.type === 'apply') {
    const parsed = parseTemperature(action.text);
    return parsed.error ? {state, error: parsed.error} : {state: {...state, processC: parsed.valueC}, error: null};
  }
  if (action.type === 'bias' && typeof action.enabled === 'boolean') {
    return {state: {...state, biasEnabled: action.enabled}, error: null};
  }
  throw new TypeError('Unsupported lesson action');
}
export function observeTemperature(processC, biasEnabled) {
  if (!Number.isInteger(processC) || processC < 20 || processC > 40 || typeof biasEnabled !== 'boolean') return record(null, 'INVALID');
  return record(processC + (biasEnabled ? BIAS_C : 0));
}
function acceptTemperature(input) {
  if (input == null || input.quality === 'UNAVAILABLE') return record(null, 'UNAVAILABLE');
  if (input.quality !== 'GOOD' || input.unit !== '°C' || !Number.isInteger(input.valueC) || input.valueC < 20 || input.valueC > 42) return record(null, 'INVALID');
  return record(input.valueC);
}
export const transmitTemperature = observation => acceptTemperature(observation);
export const selectTemperature = transmission => ({...acceptTemperature(transmission), source: 'TT'});
export function measurementChain(state) {
  const observation = observeTemperature(state.processC, state.biasEnabled);
  const transmitted = transmitTemperature(observation);
  return {processC: state.processC, observation, transmitted, selected: selectTemperature(transmitted)};
}
export function displayTemperature(input) {
  const accepted = acceptTemperature(input);
  return accepted.quality === 'GOOD' ? `${accepted.valueC} °C` : '—';
}
