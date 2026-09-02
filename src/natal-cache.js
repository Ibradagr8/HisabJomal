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

export function createNatalChartCache(calculate) {
  let key = null;
  let chart = null;
  let error = null;
  let calls = 0;
  return {
    get(input) {
      const nextKey = natalChartInputKey(input);
      if (key === nextKey) return { chart, error, cacheHit: true, calls };
      calls += 1;
      key = nextKey;
      try {
        chart = calculate(input);
        error = null;
      } catch (err) {
        chart = null;
        error = err;
      }
      return { chart, error, cacheHit: false, calls };
    },
    getCalls() { return calls; },
    reset() { key = null; chart = null; error = null; calls = 0; },
  };
}
