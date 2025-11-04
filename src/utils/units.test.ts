import { expect, test } from 'vitest';
import { kgToLb, lbToKg } from './units';

test('kg<->lb conversions', () => {
  expect(kgToLb(100)).toBeCloseTo(220.5, 1);
  expect(lbToKg(220.5)).toBeCloseTo(100, 1);
});


