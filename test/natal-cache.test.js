import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateNatalChart, cityById } from '../src/natal-chart.js';
import { createNatalChartCache, natalChartInputKey, resolveNatalChartFacts } from '../src/natal-cache.js';

const baseInput = {
  year: '1990', month: '4', day: '1',
  hour: '12', minute: '0', cityId: 'eg-360630', timeKnown: true,
};
const cairo = cityById('eg-360630');
const helwan = cityById('eg-355795');

test('مفتاح خريطة الميلاد يتجاهل الاسم الحرفي ويعتمد على القيم الفلكية المحسوبة', () => {
  const facts = resolveNatalChartFacts(baseInput);
  const key = natalChartInputKey(baseInput);
  assert.equal(key, natalChartInputKey({ ...baseInput, name: 'محمد', heritageName: 'فاطمة' }));
  assert.equal(facts.latitude, String(cairo.lat));
  assert.equal(facts.longitude, String(cairo.lon));
  assert.match(facts.utcOffset, /^[+-]\d{2}:\d{2}$/);
  assert.equal('cityId' in facts, false);
  assert.equal('name' in facts, false);
  assert.equal(key, natalChartInputKey({
    year: baseInput.year, month: baseInput.month, day: baseInput.day,
    hour: baseInput.hour, minute: baseInput.minute, timeKnown: true,
    latitude: cairo.lat, longitude: cairo.lon, timeZone: cairo.zone,
  }));
});

test('حساب خريطة الميلاد لا يُعاد عند تغيير الاسم وحده ويعيد النتيجة من الكاش لنفس المدخلات الفلكية', () => {
  let calls = 0;
  const cache = createNatalChartCache(input => {
    calls += 1;
    return calculateNatalChart(input);
  });
  const first = cache.get(baseInput);
  assert.equal(first.cacheHit, false);
  assert.equal(calls, 1);
  const named = cache.get({ ...baseInput, heritageName: 'فاطمة' });
  assert.equal(named.cacheHit, true);
  assert.equal(calls, 1);
  assert.equal(named.chart, first.chart);
  const sameSky = cache.get({
    year: baseInput.year, month: baseInput.month, day: baseInput.day,
    hour: baseInput.hour, minute: baseInput.minute, timeKnown: true,
    latitude: cairo.lat, longitude: cairo.lon, utcOffset: resolveNatalChartFacts(baseInput).utcOffset,
  });
  assert.equal(sameSky.cacheHit, true);
  assert.equal(calls, 1);
  assert.equal(first.chart.placements.find(item => item.key === 'sun').sign.name, 'الحمل');
});

test('تغيير اليوم يبطل كاش خريطة الميلاد', () => {
  let calls = 0;
  const cache = createNatalChartCache(input => {
    calls += 1;
    return calculateNatalChart(input);
  });
  cache.get(baseInput);
  assert.equal(cache.get({ ...baseInput, day: '2' }).cacheHit, false);
  assert.equal(calls, 2);
});

test('تغيير الوقت يبطل كاش خريطة الميلاد', () => {
  let calls = 0;
  const cache = createNatalChartCache(input => {
    calls += 1;
    return calculateNatalChart(input);
  });
  cache.get(baseInput);
  assert.equal(cache.get({ ...baseInput, hour: '13' }).cacheHit, false);
  assert.equal(calls, 2);
  assert.equal(cache.get({ ...baseInput, hour: '13', minute: '15' }).cacheHit, false);
  assert.equal(calls, 3);
});

test('تغيير latitude أو longitude يبطل كاش خريطة الميلاد', () => {
  let calls = 0;
  const cache = createNatalChartCache(input => {
    calls += 1;
    return { ok: true };
  });
  cache.get(baseInput);
  assert.notEqual(natalChartInputKey(baseInput), natalChartInputKey({ ...baseInput, cityId: helwan.id }));
  assert.equal(cache.get({ ...baseInput, cityId: helwan.id }).cacheHit, false);
  assert.equal(calls, 2);
  assert.equal(cache.get({ ...baseInput, latitude: cairo.lat + 1 }).cacheHit, false);
  assert.equal(calls, 3);
  assert.equal(cache.get({ ...baseInput, latitude: cairo.lat + 1, longitude: cairo.lon + 1 }).cacheHit, false);
  assert.equal(calls, 4);
});

test('مدينتان حقيقيتان تنتجان مفتاحين وطالعين مختلفين', () => {
  const cairoInput = { ...baseInput, cityId: cairo.id };
  const helwanInput = { ...baseInput, cityId: helwan.id };
  assert.notEqual(natalChartInputKey(cairoInput), natalChartInputKey(helwanInput));
  const cairoChart = calculateNatalChart(cairoInput);
  const helwanChart = calculateNatalChart(helwanInput);
  assert.notEqual(cairoChart.angles.ascendant.longitude, helwanChart.angles.ascendant.longitude);
});

test('تغيير timezone أو UTC offset المحسوب يبطل كاش خريطة الميلاد', () => {
  let calls = 0;
  const cache = createNatalChartCache(() => {
    calls += 1;
    return { ok: true };
  });
  const winter = { ...baseInput, year: '2010', month: '1', day: '15' };
  const summer = { ...baseInput, year: '2010', month: '7', day: '15' };
  const winterFacts = resolveNatalChartFacts(winter);
  const summerFacts = resolveNatalChartFacts(summer);
  assert.notEqual(winterFacts.utcOffset, summerFacts.utcOffset);
  cache.get(baseInput);
  assert.equal(cache.get({ ...baseInput, utcOffset: '+03:00' }).cacheHit, false);
  assert.equal(calls, 2);
  assert.equal(cache.get({ ...baseInput, timeZone: 'UTC' }).cacheHit, false);
  assert.equal(calls, 3);
});

test('نظام البيوت غير قابل للتغيير من المدخلات فلا يدخل في مفتاح الكاش', () => {
  assert.equal(
    natalChartInputKey(baseInput),
    natalChartInputKey({ ...baseInput, houseSystem: 'placidus' }),
  );
});

test('حساب الخريطة وutcOffset يعتمدان على polyfill لا على globalThis.Temporal', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const natalCacheSrc = await readFile(new URL('../src/natal-cache.js', import.meta.url), 'utf8');
  const natalChartSrc = await readFile(new URL('../src/natal-chart.js', import.meta.url), 'utf8');
  assert.ok(pkg.dependencies['@js-temporal/polyfill']);
  assert.match(natalCacheSrc, /import \{ Temporal \} from '@js-temporal\/polyfill'/);
  assert.match(natalChartSrc, /import \{ Temporal \} from '@js-temporal\/polyfill'/);
  assert.doesNotMatch(natalCacheSrc, /globalThis\.Temporal/);
  assert.doesNotMatch(natalChartSrc, /globalThis\.Temporal/);

  const hadNative = Object.prototype.hasOwnProperty.call(globalThis, 'Temporal');
  const original = globalThis.Temporal;
  try {
    delete globalThis.Temporal;
    assert.equal(globalThis.Temporal, undefined);
    let facts = resolveNatalChartFacts(baseInput);
    assert.equal(facts.utcOffset, '+02:00');
    let chart = calculateNatalChart(baseInput);
    assert.equal(chart.date.toISOString(), '1990-04-01T10:00:00.000Z');
    assert.equal(chart.placements.find(item => item.key === 'sun').sign.name, 'الحمل');

    globalThis.Temporal = {
      ZonedDateTime: { from() { throw new Error('used globalThis.Temporal'); } },
    };
    facts = resolveNatalChartFacts(baseInput);
    assert.equal(facts.utcOffset, '+02:00');
    chart = calculateNatalChart(baseInput);
    assert.equal(chart.date.toISOString(), '1990-04-01T10:00:00.000Z');
  } finally {
    if (hadNative) globalThis.Temporal = original;
    else delete globalThis.Temporal;
  }
});
