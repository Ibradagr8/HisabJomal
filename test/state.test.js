import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, parseStoredState, sanitizeState } from '../src/state.js';

test('التخزين التالف لا يعطّل تشغيل التطبيق', () => {
  assert.deepEqual(parseStoredState('{not-json'), {});
  assert.deepEqual(parseStoredState('null'), {});
});

test('يتم تجاهل القيم غير المسموح بها وتقييد السجل', () => {
  const clean = sanitizeState({ role: 'مدير', section: 'unknown', nameA: 12, history: Array(8).fill({ text: 'محمد', total: 92 }) });
  assert.equal(clean.role, undefined);
  assert.equal(clean.section, undefined);
  assert.equal(clean.nameA, undefined);
  assert.equal(clean.history.length, 5);
});

test('يتم ترحيل التاريخ القديم ويبدأ التطبيق من الأسماء', () => {
  const state = createState({ section: 'zodiac', birthDate: '1990-04-01' });
  assert.equal(state.section, 'names');
  assert.deepEqual([state.birthDay, state.birthMonth, state.birthYear], ['1', '4', '1990']);
});
