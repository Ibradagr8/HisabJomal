import test from 'node:test';
import assert from 'node:assert/strict';
import { ZODIAC_SOURCES, daysInMonth, isAllowedSourceUrl, isLeapYear, parseBirthDate, visibleDayCount, zodiacFromDate, zodiacFromNumber } from '../src/zodiac.js';

test('تاريخ الميلاد يقبل الأرقام العربية والغربية', () => {
  assert.equal(parseBirthDate('١', '٤', '١٩٩٠').sign.name, 'الحمل');
  assert.equal(parseBirthDate('1', '4', '1990').iso, '1990-04-01');
  assert.equal(zodiacFromDate('1990-04-01').name, 'الحمل');
});

test('الباقي صفر يُعامل بوصفه الباقي الثاني عشر', () => {
  assert.equal(zodiacFromNumber(0).name, 'الحوت');
  assert.equal(zodiacFromNumber(12).name, 'الحوت');
});

test('عدد أيام الشهر يتغير حسب الشهر والسنة الكبيسة', () => {
  assert.equal(daysInMonth('2', '2000'), 29);
  assert.equal(daysInMonth('2', '2024'), 29);
  assert.equal(daysInMonth('2', '1900'), 28);
  assert.equal(daysInMonth('2', '2025'), 28);
  assert.equal(daysInMonth('2', ''), 29);
  assert.equal(daysInMonth('2', '199'), 29);
  assert.equal(daysInMonth('4', '1990'), 30);
  assert.equal(daysInMonth('', ''), 31);
  assert.equal(isLeapYear('2000'), true);
  assert.equal(isLeapYear('1900'), false);
});

test('اختيار 29 فبراير لا يُحذف عند إدخال سنة غير كبيسة', () => {
  const today = new Date(2026, 8, 2);
  const result = parseBirthDate('29', '2', '2025', today);
  assert.equal(result.status, 'non-leap');
  assert.equal(result.day, '29');
  assert.equal(result.month, '2');
  assert.equal(result.year, '2025');
  assert.deepEqual(result.errorFields, ['birthDay', 'birthYear']);
  assert.equal(result.focusField, 'birthDay');
  assert.equal(visibleDayCount('2', '2025', '29'), 29);
  assert.equal(parseBirthDate('29', '2', '2024', today).status, 'valid');
});

test('يميّز التاريخ المستقبلي عن التاريخ غير الصحيح', () => {
  const today = new Date(2026, 8, 2);
  const futureYear = parseBirthDate('1', '1', '2027', today);
  const futureDay = parseBirthDate('3', '9', '2026', today);
  const impossible = parseBirthDate('31', '2', '1990', today);
  assert.equal(futureYear.status, 'future');
  assert.deepEqual(futureYear.errorFields, ['birthYear']);
  assert.equal(futureYear.focusField, 'birthYear');
  assert.equal(futureDay.status, 'future');
  assert.deepEqual(futureDay.errorFields, ['birthDay', 'birthMonth', 'birthYear']);
  assert.equal(impossible.status, 'invalid');
  assert.deepEqual(impossible.errorFields, ['birthDay', 'birthMonth']);
  assert.equal(impossible.focusField, 'birthDay');
  assert.equal(parseBirthDate('1', '12', '2026', today).status, 'future');
  assert.equal(parseBirthDate('1', '4', '1990', today).status, 'valid');
  assert.equal(parseBirthDate('', '2', '1990', today).status, 'incomplete');
});

test('الأيام المستحيلة تبقى ظاهرة لتصحيحها بدل حذفها بصمت', () => {
  const today = new Date(2026, 8, 2);
  assert.equal(visibleDayCount('4', '2025', '31'), 31);
  assert.equal(visibleDayCount('2', '2025', '30'), 30);
  assert.equal(parseBirthDate('31', '4', '2025', today).status, 'invalid');
  assert.equal(parseBirthDate('30', '2', '2025', today).status, 'invalid');
});

test('جميع روابط المصادر HTTPS وموجودة في قائمة السماح', () => {
  assert.ok(ZODIAC_SOURCES.length >= 14);
  for (const [, , url] of ZODIAC_SOURCES) {
    assert.equal(new URL(url).protocol, 'https:');
    assert.equal(isAllowedSourceUrl(url), true);
  }
  assert.equal(isAllowedSourceUrl('https://example.com'), false);
});
