/** Shared presentation primitives for client-only simulations. */
export function number(id) {
  const input = document.getElementById(id);
  if (input.value.trim() === '') throw new RangeError(`${input.labels[0].textContent.trim()} is required.`);
  return input.valueAsNumber;
}
export function text(id, value) { document.getElementById(id).textContent = value; }
export const format = value => Number.isFinite(value) ? value.toFixed(2) : '—';
export function setMeter(id, value) {
  document.getElementById(id).style.setProperty('--fill', `${Math.max(0, Math.min(100, value))}%`);
}
