import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/engine.js';
import { parseBirthDate, zodiacFromDate, zodiacFromNumber } from '../src/zodiac.js';
import { runReferenceChecks } from '../src/self-tests.js';

test('الاختبار الذاتي يشمل الباقي صفر وعلامة البسملة مع ملخص واحد', () => {
  const result = runReferenceChecks({ analyze, zodiacFromNumber, zodiacFromDate, parseBirthDate });
  assert.equal(analyze('﷽').total, 786);
  assert.equal(analyze('يب').total, 12);
  assert.equal(zodiacFromNumber(0).name, 'الحوت');
  assert.equal(result.ok, true);
  assert.ok(result.checks >= 10);
});
