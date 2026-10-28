'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const { phaseAt, skyAtMinute, mixColor, cssHex } = loadTs('src/shared/shift.ts');

const at = (h, m = 0) => h * 60 + m;

test('each shift covers its hours and the wheel wraps at midnight', () => {
  assert.equal(phaseAt(at(2)), 'night');
  assert.equal(phaseAt(at(5)), 'dawn');
  assert.equal(phaseAt(at(12)), 'day');
  assert.equal(phaseAt(at(18)), 'dusk');
  assert.equal(phaseAt(at(23, 59)), 'night');
  assert.equal(phaseAt(at(24) + at(12)), 'day', 'minutes past 24h wrap');
  assert.equal(phaseAt(-60), 'night', 'negative minutes wrap');
});

test('desk lamps are on at night and off at midday; the floor is untinted by day', () => {
  assert.equal(skyAtMinute(at(2)).lamps, 1);
  assert.equal(skyAtMinute(at(12)).lamps, 0);
  assert.equal(skyAtMinute(at(12)).tintAlpha, 0);
  assert.ok(skyAtMinute(at(2)).tintAlpha > 0.3, 'night carries a strong blue wash');
});

test('the light drifts smoothly — no jump across a keyframe or midnight', () => {
  for (let m = 0; m < 1440; m++) {
    const a = skyAtMinute(m);
    const b = skyAtMinute(m + 1);
    assert.ok(Math.abs(a.lamps - b.lamps) < 0.05, `lamps jump at minute ${m}`);
    assert.ok(Math.abs(a.tintAlpha - b.tintAlpha) < 0.05, `tint jumps at minute ${m}`);
  }
});

test('colour helpers blend channels and format CSS hex', () => {
  assert.equal(mixColor(0x000000, 0xffffff, 0.5), 0x808080);
  assert.equal(mixColor(0xff0000, 0x0000ff, 0), 0xff0000);
  assert.equal(cssHex(0x0a0b0c), '#0a0b0c');
});
