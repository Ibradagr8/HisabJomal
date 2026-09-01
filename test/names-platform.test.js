import test from 'node:test';
import assert from 'node:assert/strict';
import { profile } from '../src/engine.js';
import { assessBabyName, babyVerdict } from '../src/names-engine.js';
import { copyText } from '../src/platform.js';

test('محرك اقتراح الاسم منفصل وقابل للاختبار', () => {
  const parents = [{ label: 'الأب', profile: profile('محمد') }, { label: 'الأم', profile: profile('فاطمة') }];
  const result = assessBabyName('آدم', parents);
  assert.equal(typeof result.compatible, 'boolean');
  assert.ok(result.p.total > 0);
  assert.equal(typeof babyVerdict(result, parents.length), 'string');
});

test('النسخ يستخدم Clipboard API عند توفرها', async () => {
  let value = '';
  assert.equal(await copyText('أطلس', { writeText: async text => { value = text; } }), true);
  assert.equal(value, 'أطلس');
});

test('النسخ يعود إلى الطريقة البديلة عند رفض WebView2', async () => {
  const area = { style: {}, setAttribute() {}, select() {}, remove() {} };
  const doc = { body: { append() {} }, createElement: () => area, execCommand: command => command === 'copy' };
  assert.equal(await copyText('أطلس', { writeText: async () => { throw new Error('blocked'); } }, doc), true);
  assert.equal(area.value, 'أطلس');
});
