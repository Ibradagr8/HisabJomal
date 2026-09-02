import test from 'node:test';
import assert from 'node:assert/strict';
import { ZODIAC_SOURCES, daysInMonth, isAllowedSourceUrl, parseBirthDate, zodiacFromDate, zodiacFromNumber } from '../src/zodiac.js';

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
  assert.equal(daysInMonth('2', '1990'), 28);
  assert.equal(daysInMonth('2', '1992'), 29);
  assert.equal(daysInMonth('4', '1990'), 30);
  assert.equal(daysInMonth('', ''), 31);
});

test('يرفض التواريخ المستحيلة والناقصة والمستقبلية', () => {
  const today = new Date(2026, 8, 1);
  assert.equal(parseBirthDate('31', '2', '1990', today).status, 'invalid');
  assert.equal(parseBirthDate('', '2', '1990', today).status, 'incomplete');
  assert.equal(parseBirthDate('1', '1', '2027', today).status, 'invalid');
});

test('جميع روابط المصادر HTTPS وموجودة في قائمة السماح', () => {
  assert.ok(ZODIAC_SOURCES.length >= 14);
  for (const [, , url] of ZODIAC_SOURCES) {
    assert.equal(new URL(url).protocol, 'https:');
    assert.equal(isAllowedSourceUrl(url), true);
  }
  assert.equal(isAllowedSourceUrl('https://example.com'), false);
});
