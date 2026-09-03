import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedZodiacMode, applyZodiacToolClear, selectZodiacMode, selectedZodiacPanel, shouldComputeHeritageZodiac, shouldComputeNatalChart, zodiacModeSwitcherMarkup, ZODIAC_MODES } from '../src/zodiac-mode.js';

test('وضع الأبراج يقبل الأداتين فقط ويعود للحرفي عند التلف', () => {
  assert.deepEqual(ZODIAC_MODES, ['heritage', 'natal']);
  assert.equal(allowedZodiacMode('heritage'), 'heritage');
  assert.equal(allowedZodiacMode('natal'), 'natal');
  assert.equal(allowedZodiacMode('unknown'), 'heritage');
  assert.equal(allowedZodiacMode(null), 'heritage');
});

test('كل وضع يشغّل حساب أداته فقط', () => {
  assert.equal(shouldComputeHeritageZodiac('heritage'), true);
  assert.equal(shouldComputeNatalChart('heritage'), false);
  assert.equal(shouldComputeHeritageZodiac('natal'), false);
  assert.equal(shouldComputeNatalChart('natal'), true);
});

test('اختيار وضع جديد يحفظ بقية بيانات الأداتين', () => {
  const source = { zodiacMode: 'heritage', zodiacName: 'محمد', birthYear: '1990' };
  const selected = selectZodiacMode(source, 'natal');
  assert.deepEqual(selected, { zodiacMode: 'natal', zodiacName: 'محمد', birthYear: '1990' });
  assert.equal(selectZodiacMode(source, 'bad').zodiacMode, 'heritage');
});

test('اختيار لوحة الأبراج حصري ولا يشغّل اللوحة الأخرى', () => {
  let heritageCalls = 0;
  let natalCalls = 0;
  const panels = {
    heritage: () => { heritageCalls += 1; return 'heritage'; },
    natal: () => { natalCalls += 1; return 'natal'; },
  };
  assert.equal(selectedZodiacPanel('heritage', panels)(), 'heritage');
  assert.deepEqual([heritageCalls, natalCalls], [1, 0]);
  assert.equal(selectedZodiacPanel('natal', panels)(), 'natal');
  assert.deepEqual([heritageCalls, natalCalls], [1, 1]);
});

test('مسح الحساب الحرفي لا يمس بيانات الميلاد', () => {
  const source = { zodiacName: 'محمد', zodiacMother: 'فاطمة', birthDay: '1', birthMonth: '4', birthYear: '1990', birthCity: 'eg-360630', birthTimeKnown: true, birthHour: '12', birthMinute: '5' };
  const cleared = applyZodiacToolClear(source, 'heritage');
  assert.equal(cleared.zodiacName, '');
  assert.equal(cleared.zodiacMother, '');
  assert.deepEqual([cleared.birthDay, cleared.birthMonth, cleared.birthYear, cleared.birthCity], ['1', '4', '1990', 'eg-360630']);
  assert.equal(cleared.birthTimeKnown, true);
});

test('مسح خريطة الميلاد لا يمس الحساب الحرفي', () => {
  const source = { zodiacName: 'محمد', zodiacMother: 'فاطمة', birthDay: '1', birthMonth: '4', birthYear: '1990', birthCity: 'eg-360630', birthTimeKnown: true, birthHour: '12', birthMinute: '5' };
  const cleared = applyZodiacToolClear(source, 'natal');
  assert.equal(cleared.zodiacName, 'محمد');
  assert.equal(cleared.zodiacMother, 'فاطمة');
  assert.deepEqual([cleared.birthDay, cleared.birthMonth, cleared.birthYear, cleared.birthCity], ['', '', '', '']);
  assert.equal(cleared.birthTimeKnown, false);
  assert.deepEqual([cleared.birthHour, cleared.birthMinute], ['12', '0']);
});

test('بطاقتا الأبراج تستخدمان محددات مستقلة عن بطاقات الأسماء', () => {
  const html = zodiacModeSwitcherMarkup('heritage');
  assert.match(html, /class="mode-switch zodiac-mode-switch"/);
  assert.match(html, /data-zodiac-mode="heritage"/);
  assert.match(html, /data-zodiac-mode="natal"/);
  assert.doesNotMatch(html, /data-names-mode/);
});

test('البطاقة الحرفية هي النشطة افتراضيًا', () => {
  const html = zodiacModeSwitcherMarkup();
  assert.match(html, /class="active" data-zodiac-mode="heritage" aria-pressed="true"/);
  assert.match(html, /class="" data-zodiac-mode="natal" aria-pressed="false"/);
});

test('بطاقة الميلاد تحصل على active وaria-pressed عند اختيارها', () => {
  const html = zodiacModeSwitcherMarkup('natal');
  assert.match(html, /class="" data-zodiac-mode="heritage" aria-pressed="false"/);
  assert.match(html, /class="active" data-zodiac-mode="natal" aria-pressed="true"/);
});

test('نصوص بطاقتي الأبراج عربية ومختصرة', () => {
  const html = zodiacModeSwitcherMarkup('heritage');
  assert.match(html, /البرج الحرفي/);
  assert.match(html, /الاسم واسم الأم · الباقي من ١٢/);
  assert.match(html, /خريطة الميلاد/);
  assert.match(html, /الشمس والقمر والطالع · التاريخ والوقت والمدينة/);
});

test('مبدل الأبراج يملك اسم وصول واضحًا وأزرارًا صريحة النوع', () => {
  const html = zodiacModeSwitcherMarkup('heritage');
  assert.match(html, /aria-label="اختيار أداة الأبراج"/);
  assert.equal((html.match(/type="button"/g) || []).length, 2);
});

test('اللوحة المحددة يمكن أن تكون قيمة دون تشغيل الأخرى', () => {
  const panels = { heritage: '<section>حرفي</section>', natal: '<section>ميلاد</section>' };
  assert.equal(selectedZodiacPanel('heritage', panels), panels.heritage);
  assert.equal(selectedZodiacPanel('natal', panels), panels.natal);
});

test('الوضع التالف يختار اللوحة الحرفية الآمنة', () => {
  const panels = { heritage: 'safe', natal: 'chart' };
  assert.equal(selectedZodiacPanel('broken', panels), 'safe');
});

test('المسح يعيد كائنًا جديدًا ولا يغيّر الحالة الأصلية', () => {
  const source = { zodiacName: 'محمد', zodiacMother: 'فاطمة', birthYear: '1990' };
  const cleared = applyZodiacToolClear(source, 'heritage');
  assert.notEqual(cleared, source);
  assert.equal(source.zodiacName, 'محمد');
  assert.equal(source.birthYear, '1990');
});
