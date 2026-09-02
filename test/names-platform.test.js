import test from 'node:test';
import assert from 'node:assert/strict';
import { femaleNames, maleNames } from '../src/data.js';
import { profile } from '../src/engine.js';
import { assessBabyName, babyVerdict, suggestionEmptyMessage } from '../src/names-engine.js';
import { copyText, escapeHtml } from '../src/platform.js';

test('محرك اقتراح الاسم منفصل وقابل للاختبار', () => {
  const parents = [{ label: 'الأب', profile: profile('محمد') }, { label: 'الأم', profile: profile('فاطمة') }];
  const result = assessBabyName('آدم', parents);
  assert.equal(typeof result.compatible, 'boolean');
  assert.ok(result.p.total > 0);
  assert.equal(typeof babyVerdict(result, parents.length), 'string');
});

test('قاعدة الأسماء الموسعة كبيرة ونظيفة وتشمل أسماء حديثة', () => {
  assert.ok(maleNames.length >= 290);
  assert.ok(femaleNames.length >= 300);
  assert.equal(new Set(maleNames).size, maleNames.length);
  assert.equal(new Set(femaleNames).size, femaleNames.length);
  assert.ok(['أمير', 'تميم', 'غيث', 'ليث', 'يامن', 'مينا'].every(name => maleNames.includes(name)));
  assert.ok(['أسيل', 'إيلاف', 'تالين', 'ريناد', 'سلمى', 'لجين', 'ملك', 'وتين'].every(name => femaleNames.includes(name)));
  assert.ok([...maleNames, ...femaleNames].every(name => /^[ء-ي\s]+$/u.test(name) && profile(name).total > 0));
});

test('اقتراح المولود ومقارنة الأسماء لا يتناقضان في تضاد الهواء والتراب', () => {
  const result = assessBabyName('تيم', [{ label: 'الأب', profile: profile('داود') }]);
  assert.equal(result.compatible, false);
  assert.match(result.reason, /تضاد/);
});

test('البحث يشرح أن الاسم موجود لكنه غير متوافق', () => {
  assert.match(suggestionEmptyMessage('نور', ['نور', 'نورا'], 'إناث'), /موجود|توجد/);
  assert.match(suggestionEmptyMessage('سارة', ['نور'], 'إناث'), /لا توجد/);
});

test('النصوص الديناميكية تُهرب قبل إدخالها في الواجهة', () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('x')">`), '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;');
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
