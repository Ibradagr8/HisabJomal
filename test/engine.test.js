import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, compareElements, compareProfiles, elementDisplayName, formatElementNames, profile } from '../src/engine.js';

test('حسابات الأبجد المرجعية ثابتة', () => {
  assert.equal(analyze('بسم الله الرحمن الرحيم').total, 786);
  assert.equal(analyze('محمد').total, 92);
  assert.equal(analyze('فاطمة').total, 530);
  assert.equal(analyze('داود').total, 15);
  assert.equal(analyze('جالوت').total, 440);
  assert.equal(analyze('أإآء').total, 4);
});

test('التاء المربوطة تُحسب كالتاء المفتوحة', () => {
  assert.equal(analyze('ة').letters[0].normalized, 'ت');
  assert.equal(analyze('ة').total, 400);
  assert.equal(analyze('ة').total, analyze('ت').total);
  assert.equal(analyze('ة').letters[0].normalized, analyze('ت').letters[0].normalized);
});

test('التطبيع يدعم النص القرآني وأشكال العرض ولا يكرر الشدة', () => {
  assert.equal(analyze('ٱ').total, 1);
  assert.equal(analyze('ﻻ').total, 31);
  assert.equal(analyze('﷽').total, 786);
  assert.equal(analyze('مّ').total, 40);
});

test('مقارنة الطبائع تستخدم نفس نموذج اقتراح المولود', () => {
  assert.equal(profile('تيم').leaders[0], 'هواء');
  assert.equal(profile('داود').leaders[0], 'تراب');
  assert.equal(compareElements(profile('تيم'), profile('داود')).kind, 'تضاد');
});

test('أسماء الطبائع المعروضة عربية وصفية ولا تغيّر مفاتيح الحساب', () => {
  assert.equal(elementDisplayName('نار'), 'ناري');
  assert.equal(elementDisplayName('هواء'), 'هوائي');
  assert.equal(elementDisplayName('ماء'), 'مائي');
  assert.equal(elementDisplayName('تراب'), 'ترابي');
  assert.equal(formatElementNames(['نار', 'هواء']), 'ناري / هوائي');
  assert.ok(profile('محمد').leaders.includes('نار'));
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
