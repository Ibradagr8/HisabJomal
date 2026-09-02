import { LOCAL_BIRTH_CITIES } from './cities-data.js';

export const APP_SECTIONS = Object.freeze(['names', 'calculator', 'zodiac', 'reference']);
const BIRTH_CITY_IDS = new Set(LOCAL_BIRTH_CITIES.map(city => city.id));

export const STATE_KEYS = Object.freeze([
  'section', 'text', 'target', 'nameA', 'motherA', 'nameB', 'motherB', 'role',
  'father', 'mother', 'desiredBabyName', 'maleSearch', 'femaleSearch',
  'zodiacName', 'zodiacMother', 'birthDay', 'birthMonth', 'birthYear',
  'birthHour', 'birthMinute', 'birthCity', 'birthTimeKnown', 'namesMode', 'detailMode',
]);

export const DEFAULT_STATE = Object.freeze({
  section: 'names', text: '', target: '', nameA: '', motherA: '', nameB: '', motherB: '',
  role: 'طالب', father: '', mother: '', desiredBabyName: '', maleSearch: '', femaleSearch: '',
  zodiacName: '', zodiacMother: '', birthDay: '', birthMonth: '', birthYear: '',
  birthHour: '12', birthMinute: '0', birthCity: '', birthTimeKnown: false,
  namesMode: 'baby', detailMode: 'simple', suggestionLimit: 6,
});

const textKeys = STATE_KEYS.filter(key => !['section', 'role', 'birthTimeKnown', 'namesMode', 'detailMode'].includes(key));

export function parseStoredState(raw = '') {
  try {
    return sanitizeState(JSON.parse(raw || '{}'));
  } catch {
    return {};
  }
}

export function sanitizeState(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const clean = {};
  for (const key of textKeys) {
    if (typeof input[key] === 'string') clean[key] = input[key].slice(0, 5000);
  }
  if (APP_SECTIONS.includes(input.section)) clean.section = input.section;
  if (['طالب', 'مطلوب'].includes(input.role)) clean.role = input.role;
  if (['baby', 'comparison'].includes(input.namesMode)) clean.namesMode = input.namesMode;
  if (['simple', 'full'].includes(input.detailMode)) clean.detailMode = input.detailMode;
  if (typeof input.birthTimeKnown === 'boolean') clean.birthTimeKnown = input.birthTimeKnown;
  if (Number.isFinite(input.suggestionLimit)) clean.suggestionLimit = Math.min(500, Math.max(6, Math.trunc(input.suggestionLimit)));
  // ترحيل تاريخ النسخ السابقة من YYYY-MM-DD إلى الحقول الجديدة.
  if (typeof input.birthDate === 'string') {
    const match = input.birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      clean.birthYear ||= match[1];
      clean.birthMonth ||= String(Number(match[2]));
      clean.birthDay ||= String(Number(match[3]));
    }
  }
  return clean;
}

export function createState(stored = {}, shared = {}) {
  const cleanStored = sanitizeState(stored);
  const cleanShared = sanitizeState(shared);
  const merged = { ...DEFAULT_STATE, ...cleanStored, ...cleanShared };
  // النسخ السابقة كانت تعرض 12 اقتراحًا دفعة واحدة؛ نبدأ الآن بستة لتبقى الواجهة هادئة.
  if (merged.suggestionLimit === 12) merged.suggestionLimit = 6;
  // ترحيل اختيار القاهرة من النسخة السابقة، وإسقاط أي مدينة لم تعد ضمن قاعدة مصر.
  if (merged.birthCity === 'cairo') merged.birthCity = 'eg-360630';
  if (merged.birthCity && !BIRTH_CITY_IDS.has(merged.birthCity)) merged.birthCity = '';
  // التشغيل العادي يبدأ من الأسماء، بينما رابط المشاركة يعيد الشاشة التي نُسخ منها.
  merged.section = cleanShared.section || 'names';
  return merged;
}
