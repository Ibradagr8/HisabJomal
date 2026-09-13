import { Temporal } from '@js-temporal/polyfill';
import { cityById } from './natal-chart.js';

function computeUtcOffset({ timeZone, year, month, day, hour, minute }) {
  try {
    const zoned = Temporal.ZonedDateTime.from({
      timeZone,
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: 0,
    }, { disambiguation: 'reject' });
    return zoned.offset;
  } catch {
    return 'invalid-local-time';
  }
}

export function resolveNatalChartFacts(input = {}) {
  const city = cityById(input.cityId);
  const timeKnown = Boolean(input.timeKnown);
  const year = String(input.year ?? '');
  const month = String(input.month ?? '');
  const day = String(input.day ?? '');
  const hour = timeKnown ? String(input.hour ?? '12') : '';
  const minute = timeKnown ? String(input.minute ?? '0') : '';
  const latitude = input.latitude ?? city?.lat ?? '';
  const longitude = input.longitude ?? city?.lon ?? '';
  const timeZone = input.timeZone ?? city?.zone ?? '';
  const offsetHour = timeKnown ? (input.hour ?? 12) : 12;
  const offsetMinute = timeKnown ? (input.minute ?? 0) : 0;
  let utcOffset = input.utcOffset;
  if (utcOffset == null || utcOffset === '') {
    utcOffset = timeZone
      ? computeUtcOffset({ timeZone, year, month, day, hour: offsetHour, minute: offsetMinute })
      : '';
  }
  return {
    year,
    month,
    day,
    timeKnown,
    hour,
    minute,
    latitude: latitude === '' ? '' : String(latitude),
    longitude: longitude === '' ? '' : String(longitude),
    utcOffset: String(utcOffset),
  };
}

export function natalChartInputKey(input = {}) {
  return JSON.stringify(resolveNatalChartFacts(input));
}

export function createNatalChartCache(calculate, { maxSize = 20 } = {}) {
  const entries = new Map();
  let calls = 0;
  return {
    get(input) {
      const nextKey = natalChartInputKey(input);
      if (entries.has(nextKey)) {
        const hit = entries.get(nextKey);
        // LRU: نعيد إدخال المفتاح ليبقى الأحدث في النهاية
        entries.delete(nextKey);
        entries.set(nextKey, hit);
        return { chart: hit.chart, error: hit.error, cacheHit: true, calls };
      }
      calls += 1;
      let chart = null;
      let error = null;
      try {
        chart = calculate(input);
      } catch (err) {
        chart = null;
        error = err;
      }
      entries.set(nextKey, { chart, error });
      if (entries.size > maxSize) {
        // إسقاط أقدم مفتاح للحفاظ على حد الذاكرة
        const oldest = entries.keys().next().value;
        entries.delete(oldest);
      }
      return { chart, error, cacheHit: false, calls };
    },
    getCalls() { return calls; },
    size() { return entries.size; },
    reset() { entries.clear(); calls = 0; },
  };
}
