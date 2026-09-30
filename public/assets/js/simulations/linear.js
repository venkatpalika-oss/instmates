/** Pure linear scaling; extrapolates. Instrument limits belong to the model. */
export function validateRange(low, high) {
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low || !Number.isFinite(high - low))
    throw new RangeError('URV must be greater than LRV, with finite values.');
}
export function percentOfRange(value, low, high) {
  validateRange(low, high);
  if (!Number.isFinite(value)) throw new RangeError('Value must be finite.');
  const percent = (value - low) / (high - low) * 100;
  if (!Number.isFinite(percent)) throw new RangeError('Result exceeds the supported numeric range.');
  return percent;
}
export function toCurrent(value, low, high) { return 4 + percentOfRange(value, low, high) * 0.16; }
export function fromCurrent(current, low, high) {
  validateRange(low, high);
  if (!Number.isFinite(current)) throw new RangeError('Current must be finite.');
  const value = low + (current - 4) / 16 * (high - low);
  if (!Number.isFinite(value)) throw new RangeError('Result exceeds the supported numeric range.');
  return value;
}
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
