import test from 'node:test';
import assert from 'node:assert/strict';
import { femaleNames, maleNames } from '../src/data.js';
import { profile } from '../src/engine.js';
import { readFile } from 'node:fs/promises';
import { assessBabyName, assessBabyProfile, babyVerdict, buildIndexedNames, suggestionEmptyMessage } from '../src/names-engine.js';
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

test('فهرسة الأسماء تتم مرة واحدة ولا تتكرر مع البحث', async (t) => {
  let profileCalls = 0;
  const countingProfile = name => {
    profileCalls += 1;
    return profile(name);
  };
  const started = performance.now();
  const indexed = buildIndexedNames(maleNames, femaleNames, countingProfile);
  t.diagnostic(`indexedNames build: ${(performance.now() - started).toFixed(2)}ms`);
  const built = profileCalls;
  assert.equal(indexed.male.length, maleNames.length);
  assert.equal(indexed.female.length, femaleNames.length);
  assert.equal(built, maleNames.length + femaleNames.length);

  const parentEntries = [{ label: 'الأب', profile: profile('محمد') }];
  indexed.male.filter(item => item.name.includes('م')).forEach(item => assessBabyProfile(item.p, parentEntries));
  indexed.female.filter(item => item.name.includes('ن')).forEach(item => assessBabyProfile(item.p, parentEntries));
  assert.equal(profileCalls, built, 'البحث والترتيب يعيدان استخدام الفهرس ولا يعيدان حساب الأسماء');

  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.equal([...main.matchAll(/buildIndexedNames\(/g)].length, 1);
  assert.match(main, /const indexedNames = Object\.freeze\(buildIndexedNames/);
  assert.match(main, /indexedNames\[kind\]/);
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
