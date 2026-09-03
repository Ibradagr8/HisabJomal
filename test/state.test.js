import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, parseStoredState, sanitizeState } from '../src/state.js';

test('التخزين التالف لا يعطّل تشغيل التطبيق', () => {
  assert.deepEqual(parseStoredState('{not-json'), {});
  assert.deepEqual(parseStoredState('null'), {});
});

test('يتم تجاهل القيم غير المسموح بها', () => {
  const clean = sanitizeState({ role: 'مدير', section: 'unknown', zodiacMode: 'unknown', nameA: 12, history: [{ text: 'محمد', total: 92 }] });
  assert.equal(clean.role, undefined);
  assert.equal(clean.section, undefined);
  assert.equal(clean.nameA, undefined);
  assert.equal(clean.history, undefined);
  assert.equal(clean.zodiacMode, undefined);
});

test('وضع الأبراج محفوظ وآمن ومتوافق مع الحالات القديمة', () => {
  assert.equal(createState().zodiacMode, 'heritage');
  assert.equal(createState({ zodiacMode: 'natal' }).zodiacMode, 'natal');
  assert.equal(createState({ zodiacMode: 'broken' }).zodiacMode, 'heritage');
  assert.equal(parseStoredState('{"zodiacMode":"natal"}').zodiacMode, 'natal');
  assert.equal(parseStoredState('{"zodiacMode":"broken"}').zodiacMode, undefined);
});

test('يتم ترحيل التاريخ القديم ويبدأ التشغيل العادي من الأسماء', () => {
  const state = createState({ section: 'zodiac', birthDate: '1990-04-01' });
  assert.equal(state.section, 'names');
  assert.deepEqual([state.birthDay, state.birthMonth, state.birthYear], ['1', '4', '1990']);
});

test('رابط المشاركة يعيد فتح الشاشة المحفوظة فيه', () => {
  assert.equal(createState({}, { section: 'calculator', text: 'محمد' }).section, 'calculator');
  assert.equal(createState({}, { section: 'zodiac', zodiacName: 'محمد' }).section, 'zodiac');
});

test('مدينة الميلاد يجب أن تكون معرفًا حقيقيًا من قاعدة مصر', () => {
  assert.equal(createState({}, { birthCity: 'eg-fake' }).birthCity, '');
  assert.equal(createState({}, { birthCity: 'eg-360630' }).birthCity, 'eg-360630');
});
