export const ABJAD = Object.freeze({
  ا: 1, ب: 2, ج: 3, د: 4, ه: 5, و: 6, ز: 7, ح: 8, ط: 9,
  ي: 10, ك: 20, ل: 30, م: 40, ن: 50, س: 60, ع: 70, ف: 80, ص: 90,
  ق: 100, ر: 200, ش: 300, ت: 400, ث: 500, خ: 600, ذ: 700, ض: 800, ظ: 900, غ: 1000,
});

const normalizations = Object.freeze({ أ: 'ا', إ: 'ا', آ: 'ا', ء: 'ا', ٱ: 'ا', ة: 'ت', ئ: 'ي', ى: 'ي', ؤ: 'و' });
export const OPPOSING_ELEMENTS = Object.freeze(new Set(['نار/ماء', 'ماء/نار', 'هواء/تراب', 'تراب/هواء']));
export const FRIENDLY_ELEMENTS = Object.freeze(new Set(['نار/هواء', 'هواء/نار', 'ماء/تراب', 'تراب/ماء']));
export const ELEMENTS = Object.freeze({
  نار: ['ا', 'ه', 'ط', 'م', 'ف', 'ش', 'ذ'],
  هواء: ['ب', 'و', 'ي', 'ن', 'ص', 'ت', 'ض'],
  ماء: ['ج', 'ز', 'ك', 'س', 'ق', 'ث', 'ظ'],
  تراب: ['د', 'ح', 'ل', 'ع', 'ر', 'خ', 'غ'],
});
export const ELEMENT_DISPLAY_NAMES = Object.freeze({ نار: 'ناري', هواء: 'هوائي', ماء: 'مائي', تراب: 'ترابي' });
export const PLANETS = ['شمس', 'قمر', 'مريخ', 'عطارد', 'مشتري', 'زهرة', 'زحل'];
export const ZODIAC = [
  ['الحمل', 'نار'], ['الثور', 'تراب'], ['الجوزاء', 'هواء'], ['السرطان', 'ماء'],
  ['الأسد', 'نار'], ['العذراء', 'تراب'], ['الميزان', 'هواء'], ['العقرب', 'ماء'],
  ['القوس', 'نار'], ['الجدي', 'تراب'], ['الدلو', 'هواء'], ['الحوت', 'ماء'],
];
const abjadOrder = Object.keys(ABJAD);
const elementByLetter = Object.fromEntries(Object.entries(ELEMENTS).flatMap(([element, letters]) => letters.map(letter => [letter, element])));

export function normalizeLetter(char) { return normalizations[char] || char; }
export function normalizeText(text = '') {
  return String(text).normalize('NFKC').replaceAll('﷽', 'بسم الله الرحمن الرحيم');
}
export function analyze(text = '') {
  const prepared = normalizeText(text);
  const letters = [...prepared].map((raw, index) => {
    const normalized = normalizeLetter(raw);
    const value = ABJAD[normalized] || 0;
    return value ? { raw, normalized, value, index } : null;
  }).filter(Boolean);
  const words = prepared.trim().split(/\s+/).filter(Boolean).map(word => ({ word, ...analyzeWord(word) }));
  const total = letters.reduce((sum, letter) => sum + letter.value, 0);
  return { text, total, count: letters.length, letters, words };
}
function analyzeWord(word) {
  const letters = [...word].map(raw => {
    const normalized = normalizeLetter(raw); const value = ABJAD[normalized] || 0;
    return value ? { raw, normalized, value } : null;
  }).filter(Boolean);
  return { total: letters.reduce((s, x) => s + x.value, 0), count: letters.length, letters };
}
export function profile(text) {
  const result = analyze(text);
  const counts = Object.fromEntries(Object.keys(ELEMENTS).map(key => [key, 0]));
  const planets = Object.fromEntries(PLANETS.map(key => [key, 0]));
  result.letters.forEach(({ normalized }) => {
    counts[elementByLetter[normalized]]++;
    planets[PLANETS[abjadOrder.indexOf(normalized) % 7]]++;
  });
  const leaders = objectLeaders(counts);
  const planetLeaders = objectLeaders(planets);
  const mod9 = result.total ? (result.total % 9 || 9) : null;
  const mod12 = result.total ? (result.total % 12 || 12) : null;
  return { ...result, elements: counts, leaders, planets, planetLeaders, mod9, zodiac: mod12 ? ZODIAC[mod12 - 1] : null };
}
function objectLeaders(obj) { const max = Math.max(...Object.values(obj)); return max ? Object.keys(obj).filter(k => obj[k] === max) : []; }
export function compareProfiles(first, second, firstRole = 'طالب') {
  if (!first.mod9 || !second.mod9) return null;
  const same = first.mod9 === second.mod9;
  const bothOdd = first.mod9 % 2 && second.mod9 % 2;
  const secondRole = firstRole === 'طالب' ? 'مطلوب' : 'طالب';
  let winnerRole;
  let winnerIndex;
  let reason;
  if (same) {
    winnerRole = bothOdd ? 'طالب' : 'مطلوب';
    winnerIndex = firstRole === winnerRole ? 0 : 1;
    reason = bothOdd ? 'باقيان متساويان فرديان: الطالب يغلب' : 'باقيان متساويان زوجيان: المطلوب يغلب';
  } else if ((first.mod9 % 2) === (second.mod9 % 2)) {
    winnerIndex = first.mod9 < second.mod9 ? 0 : 1;
    winnerRole = winnerIndex === 0 ? firstRole : secondRole;
    reason = 'باقيان مختلفان من نفس الزوجية: الأصغر يغلب';
  } else {
    winnerIndex = first.mod9 > second.mod9 ? 0 : 1;
    winnerRole = winnerIndex === 0 ? firstRole : secondRole;
    reason = 'باقيان مختلفا الزوجية: الأكبر يغلب';
  }
  return { winner: winnerRole, winnerRole, winnerIndex, reason };
}
export function compareElements(first, second) {
  if (!first.leaders.length || !second.leaders.length || first.leaders.length > 1 || second.leaders.length > 1) return { kind: 'مركّب', text: 'متعادل / مركّب — يُقرأ توزيع الطبائع بدل حكم واحد.' };
  const [a] = first.leaders; const [b] = second.leaders;
  if (a === b) return { kind: 'انسجام', text: `انسجام: الطبع ${elementDisplayName(a)} متطابق.` };
  const relation = elementRelation(a, b);
  if (relation === 'صداقة') return { kind: relation, text: `صداقة بين الطبائع: ${elementDisplayName(a)} مع ${elementDisplayName(b)}.` };
  if (relation === 'تضاد') return { kind: relation, text: `تضاد بين الطبائع: ${elementDisplayName(a)} مع ${elementDisplayName(b)}.` };
  return { kind: 'امتزاج', text: `امتزاج بين طبعَي ${elementDisplayName(a)} و${elementDisplayName(b)} دون تضاد مباشر.` };
}
export function elementDisplayName(element) { return ELEMENT_DISPLAY_NAMES[element] || element || '—'; }
export function formatElementNames(elements = []) { return elements.map(elementDisplayName).join(' / '); }
export function elementRelation(first, second) {
  if (!first || !second) return 'غير محدد';
  if (first === second) return 'انسجام';
  if (OPPOSING_ELEMENTS.has(`${first}/${second}`)) return 'تضاد';
  if (FRIENDLY_ELEMENTS.has(`${first}/${second}`)) return 'صداقة';
  return 'امتزاج';
}
export function compareCelestial(first, second) {
  const planet = !first.planetLeaders.length || !second.planetLeaders.length || first.planetLeaders.length > 1 || second.planetLeaders.length > 1
    ? 'تعادل كوكبي حرفي — لا حكم قاطع.'
    : first.planetLeaders[0] === second.planetLeaders[0] ? 'توافق كوكبي حرفي.' : `اختلاف كوكبي حرفي: ${first.planetLeaders[0]} / ${second.planetLeaders[0]}.`;
  let zodiac = 'لا توجد بروج حسابية للمقارنة.';
  if (first.zodiac && second.zodiac) zodiac = first.zodiac[0] === second.zodiac[0] ? 'تطابق البرج الحسابي.' : first.zodiac[1] === second.zodiac[1] ? `اختلاف مع اتحاد العنصر: ${first.zodiac[1]}.` : 'اختلاف كامل بين البرجين الحسابيين.';
  return { planet, zodiac };
}
export function formatNumber(num) { return new Intl.NumberFormat('ar-EG').format(num || 0); }
