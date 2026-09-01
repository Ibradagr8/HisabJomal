import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, compareProfiles, profile } from '../src/engine.js';

test('حسابات الأبجد المرجعية ثابتة', () => {
  assert.equal(analyze('بسم الله الرحمن الرحيم').total, 786);
  assert.equal(analyze('محمد').total, 92);
  assert.equal(analyze('فاطمة').total, 135);
  assert.equal(analyze('أإآء').total, 4);
});

test('التساوي الفردي يمنح الغلبة للشخص صاحب دور الطالب', () => {
  const first = profile('ا');
  const second = profile('ي');
  assert.equal(compareProfiles(first, second, 'طالب').winnerIndex, 0);
  assert.equal(compareProfiles(first, second, 'مطلوب').winnerIndex, 1);
});

test('التساوي الزوجي يمنح الغلبة للشخص صاحب دور المطلوب', () => {
  const first = profile('ب');
  const second = profile('ك');
  assert.equal(compareProfiles(first, second, 'طالب').winnerIndex, 1);
  assert.equal(compareProfiles(first, second, 'مطلوب').winnerIndex, 0);
});

test('القواعد المختلفة تعيد هوية الشخص الفائز لا مجرد مسمى الدور', () => {
  assert.equal(compareProfiles(profile('ا'), profile('ب'), 'مطلوب').winnerIndex, 1);
  assert.equal(compareProfiles(profile('ب'), profile('د'), 'مطلوب').winnerIndex, 0);
});
