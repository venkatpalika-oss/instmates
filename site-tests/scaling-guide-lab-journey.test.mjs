import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULTS, simulate } from '../public/assets/js/simulations/loop-model.js';

const guide = readFileSync(new URL('../public/knowledge/field/signals/4-20ma/scaling-calculation.html', import.meta.url), 'utf8');
const text = guide.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');

test('pressure exercise: only receiver scaling changes the indication', () => {
  const state = { ...DEFAULTS, pv: 7.5 };
  for (const [upper, indication] of [[10, 7.5], [5, 3.75], [10, 7.5]]) {
    const r = simulate({ ...state, dcsUrv: upper });
    assert.deepEqual([r.expected, r.loop, r.input, r.displayed, r.quality],
      [16, 16, 16, indication, 'GOOD']);
  }
  assert.ok(text.includes('7.5 bar to 3.75 bar and back to 7.5 bar'));
  assert.ok(text.includes('DCS input stay at 16 mA'));
});

test('negative temperature is one quarter of span, with normal current', () => {
  const r = simulate({ ...DEFAULTS, unit: '°C', lrv: -20, urv: 20, pv: -10, dcsLrv: -20, dcsUrv: 20 });
  assert.deepEqual([r.percent, r.input, r.displayed, r.quality], [25, 8, -10, 'GOOD']);
  assert.ok(text.includes('−10 °C on a −20 to +20 °C transmitter'));
  assert.ok(text.includes('Expect 8 mA and −10 °C'));
});

test('guide keeps original examples and offers a same-tab lab link before the diagnosis', () => {
  for (const original of ['0–100 bar', '-50 to +50 mbar', '0–200 m³/h']) assert.ok(text.includes(original));
  assert.match(guide, /<a href="\/simulations\/4-20ma-loop\/">Test your prediction in LAB 01<\/a>[\s\S]+?<details>\s*<summary>Check the three readings/);
  assert.match(guide, /<details>\s*<summary>Show worked answers/);
  assert.ok(text.includes('does not verify a real instrument’s calibration'));
  assert.ok(text.includes('linear, direct-acting, steady-state'));
});
