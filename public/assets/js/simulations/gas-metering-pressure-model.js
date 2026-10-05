/** Educational pressure lesson only; no equipment specifications or flow calculations. */
export const INITIAL_PRESSURE_PA = 300000;
export const BIAS_PA = 20000;
const record = (valuePa, quality = 'GOOD') => ({valuePa, quality, unit: 'Pa', basis: 'absolute'});
export const initialState = () => ({processPa: INITIAL_PRESSURE_PA, biasEnabled: false});
export function parsePressure(text) {
  if (typeof text !== 'string' || !/^[0-9]+$/.test(text.trim())) {
    return {error: 'Enter a whole number from 200 through 400, without units or punctuation. Draft not applied.'};
  }
  const kPa = Number(text.trim());
  if (!Number.isSafeInteger(kPa) || kPa < 200 || kPa > 400) {
    return {error: 'Pressure must be from 200 through 400 kPa (absolute). Draft not applied.'};
  }
  return {valuePa: kPa * 1000};
}
export function transition(state, action) {
  if (action.type === 'reset') return {state: initialState(), error: null};
  if (action.type === 'apply') {
    const parsed = parsePressure(action.text);
    return parsed.error ? {state, error: parsed.error} : {state: {...state, processPa: parsed.valuePa}, error: null};
  }
  if (action.type === 'bias' && typeof action.enabled === 'boolean') {
    return {state: {...state, biasEnabled: action.enabled}, error: null};
  }
  throw new TypeError('Unsupported lesson action');
}
export function observePressure(processPa, biasEnabled) {
  if (!Number.isInteger(processPa) || processPa < 200000 || processPa > 400000 || processPa % 1000 !== 0 || typeof biasEnabled !== 'boolean') return record(null, 'INVALID');
  return record(processPa + (biasEnabled ? BIAS_PA : 0));
}
function acceptPressure(input) {
  if (input == null || input.quality === 'UNAVAILABLE') return record(null, 'UNAVAILABLE');
  if (input.quality !== 'GOOD' || input.unit !== 'Pa' || input.basis !== 'absolute' || !Number.isInteger(input.valuePa) || input.valuePa < 200000 || input.valuePa > 420000 || input.valuePa % 1000 !== 0) return record(null, 'INVALID');
  return record(input.valuePa);
}
export const transmitPressure = observation => acceptPressure(observation);
export const selectPressure = transmission => ({...acceptPressure(transmission), source: 'PT'});
export function measurementChain(state) {
  const observation = observePressure(state.processPa, state.biasEnabled);
  const transmitted = transmitPressure(observation);
  return {processPa: state.processPa, observation, transmitted, selected: selectPressure(transmitted)};
}
export function displayPressure(input) {
  const accepted = acceptPressure(input);
  return accepted.quality === 'GOOD' ? `${accepted.valuePa / 1000} kPa (absolute)` : '—';
}
