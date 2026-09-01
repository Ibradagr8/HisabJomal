import test from 'node:test';
import assert from 'node:assert/strict';
import { BIRTH_CITIES, calculateAngles, calculateNatalChart, cityById, localBirthToDate, zodiacPosition } from '../src/natal-chart.js';

test('قائمة المدن تحتوي إحداثيات ومنطقة زمنية صالحة', () => {
  assert.ok(BIRTH_CITIES.length >= 250);
  assert.deepEqual([...new Set(BIRTH_CITIES.map(city => city.country))], ['مصر']);
  for (const city of BIRTH_CITIES) {
    assert.doesNotMatch(city.label, /[A-Za-z]/);
    assert.ok(city.lat >= -90 && city.lat <= 90);
    assert.ok(city.lon >= -180 && city.lon <= 180);
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en', { timeZone:city.zone }));
  }
});

test('تحويل وقت القاهرة المحلي يحترم المنطقة الزمنية التاريخية', () => {
  const date = localBirthToDate({ year:1990, month:4, day:1, hour:12, minute:0, city:cityById('eg-360630') });
  assert.equal(date.toISOString(), '1990-04-01T10:00:00.000Z');
});

test('خريطة مرجعية تعيد الشمس والقمر والطالع والبيوت الاثني عشر', () => {
  const chart = calculateNatalChart({ year:1990, month:4, day:1, hour:12, minute:0, cityId:'eg-360630', timeKnown:true });
  assert.equal(chart.placements.find(item => item.key === 'sun').sign.name, 'الحمل');
  assert.equal(chart.placements.find(item => item.key === 'moon').sign.name, 'الجوزاء');
  assert.equal(chart.angles.ascendant.sign.name, 'السرطان');
  assert.ok(Math.abs(chart.angles.ascendant.degree - 22.2) < 0.2);
  assert.equal(chart.houses.length, 12);
  assert.deepEqual(chart.houses.map(item => item.house), [1,2,3,4,5,6,7,8,9,10,11,12]);
});

test('غياب الوقت يمنع تخمين الطالع والبيوت', () => {
  const chart = calculateNatalChart({ year:1990, month:4, day:1, cityId:'eg-360630', timeKnown:false });
  assert.equal(chart.angles, null);
  assert.deepEqual(chart.houses, []);
  assert.match(chart.accuracy, /الوقت غير معروف/);
});

test('كل خط طول سماوي يتحول إلى برج ودرجة داخل البرج', () => {
  assert.equal(zodiacPosition(0).sign.name, 'الحمل');
  assert.equal(zodiacPosition(359.5).sign.name, 'الحوت');
  assert.equal(zodiacPosition(-1).degree, 29);
});

test('المحاور المتقابلة تفصل بينها 180 درجة', () => {
  const angles = calculateAngles(new Date('1990-04-01T10:00:00Z'), cityById('eg-360630'));
  const separation = (angles.descendant - angles.ascendant + 360) % 360;
  const vertical = (angles.imumCoeli - angles.midheaven + 360) % 360;
  assert.ok(Math.abs(separation - 180) < 1e-9);
  assert.ok(Math.abs(vertical - 180) < 1e-9);
});
