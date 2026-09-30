import { validateRange, percentOfRange, toCurrent, fromCurrent, clamp } from './linear.js';

export const DEFAULTS = Object.freeze({ lrv: 0, urv: 10, pv: 5, dcsLrv: 0, dcsUrv: 10,
  mode: 'process', manual: 12, fault: 'normal', stuck: 4, zero: 1, span: 10, unit: 'bar' });
export const FAULTS = Object.freeze({
  normal: 'Normal', open: 'Open loop', short: 'Short / low current', stuck: 'Current stuck',
  zero: 'Zero shift', span: 'Span error', scaling: 'Wrong DCS scaling'
});
/** Steady-state educational model. No dynamic, compliance or universal NE43 claim. */
export function simulate(s) {
  for (const key of ['lrv','urv','pv','dcsLrv','dcsUrv','manual','stuck','zero','span']) {
    if (!Number.isFinite(s[key]) || Math.abs(s[key]) > 1e6) throw new RangeError('Use finite values between −1,000,000 and 1,000,000.');
  }
  validateRange(s.lrv, s.urv); validateRange(s.dcsLrv, s.dcsUrv);
  if (!(s.fault in FAULTS) || !['process','manual'].includes(s.mode)) throw new RangeError('Unknown mode.');
  if (s.manual < 0 || s.manual > 24 || s.stuck < 0 || s.stuck > 24) throw new RangeError('Test and stuck current must be 0–24 mA.');
  if (s.zero < -4 || s.zero > 4 || s.span < -50 || s.span > 50) throw new RangeError('Fault magnitude is outside its allowed range.');
  const percent = percentOfRange(s.pv, s.lrv, s.urv);
  const expected = toCurrent(s.pv, s.lrv, s.urv);
  let command = s.mode === 'manual' ? s.manual : expected;
  if (s.mode === 'process') {
    if (s.fault === 'zero') command += s.zero;
    if (s.fault === 'span') command = 4 + (expected - 4) * (1 + s.span / 100);
  }
  if (s.fault === 'stuck') command = s.stuck;
  // Process output uses this simulator's explicit 3.8–20.5 mA saturation convention.
  const tx = s.mode === 'process' && s.fault !== 'stuck' ? clamp(command, 3.8, 20.5) : command;
  const loop = s.fault === 'open' ? 0 : tx;
  // Short is specifically a bypass across the receiver's sensing resistor.
  const input = s.fault === 'short' ? 0 : loop;
  const rawDcs = fromCurrent(input, s.dcsLrv, s.dcsUrv);
  const quality = input < 3.8 || input > 20.5 ? 'BAD' : input < 4 || input > 20 ? 'OUT OF RANGE' : 'GOOD';
  return { percent, expected, command, tx, loop, input, rawDcs, quality,
    displayed: quality === 'BAD' ? null : rawDcs,
    saturated: tx !== command,
    scalingMismatch: s.lrv !== s.dcsLrv || s.urv !== s.dcsUrv };
}
export const DIAGNOSTICS = Object.freeze({
  normal: 'Compare the applied process value, transmitter range and receiver range at several points. Matching one point alone does not prove calibration.',
  open: 'The series path is broken, so actual current is zero. The calculated command is not a measured output. Under site isolation procedures, check loop supply, terminals and continuity; never measure resistance on an energized loop.',
  short: 'This case bypasses the PLC/DCS sensing resistor: transmitter loop current continues, but current through the input is zero. Check wiring and input burden using the approved isolation procedure. Other short locations can behave differently.',
  stuck: 'Change PV and compare expected versus measured current. If measured current stays fixed, investigate loop-test mode, frozen output and transmitter status before changing the receiver scaling.',
  zero: 'A constant output offset points toward zero error. Compare several applied reference points before trim. In this model the offset is in mA, and clipping can conceal it near the endpoints.',
  span: 'The error grows with distance from LRV. Check at LRV, midpoint and URV against a trusted reference. The gain error is applied to the 16 mA span, not to the 4 mA live zero.',
  scaling: 'If current agrees with the transmitter but engineering indication does not, compare the PLC/DCS 4 mA and 20 mA endpoints with the transmitter range. Correct channel and units must also match.'
});
export const CHALLENGES = Object.freeze([
  { title: 'A believable but wrong indication', state: { fault:'scaling', dcsUrv:5 }, answer:'scaling',
    explanation:'12 mA is 50% of span. A receiver scaled 0–5 bar displays 2.5 bar. Investigate DCS range/channel configuration first.' },
  { title: 'The process moved. The current did not.', state:{ fault:'stuck', stuck:4, pv:7.5 }, answer:'stuck',
    explanation:'The expected output is 16 mA, but actual loop current stays at 4 mA. Inspect forced/frozen transmitter output first; 4 mA is a valid signal and does not itself trigger bad quality.' },
  { title: 'No signal at either measurement point', state:{ fault:'open', pv:5 }, answer:'open',
    explanation:'Zero measured loop current is consistent with an open circuit or lost loop supply. Check the supply and series path first. These symptoms alone do not identify a unique failed component.' }
]);
