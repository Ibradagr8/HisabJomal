export const ABJAD = Object.freeze({
  ا: 1, ب: 2, ج: 3, د: 4, ه: 5, و: 6, ز: 7, ح: 8, ط: 9,
  ي: 10, ك: 20, ل: 30, م: 40, ن: 50, س: 60, ع: 70, ف: 80, ص: 90,
  ق: 100, ر: 200, ش: 300, ت: 400, ث: 500, خ: 600, ذ: 700, ض: 800, ظ: 900, غ: 1000,
});

const normalizations = Object.freeze({ أ: 'ا', إ: 'ا', آ: 'ا', ء: 'ا', ة: 'ه', ئ: 'ي', ى: 'ي', ؤ: 'و' });
export const ELEMENTS = Object.freeze({
  نار: ['ا', 'ه', 'ط', 'م', 'ف', 'ش', 'ذ'],
  هواء: ['ب', 'و', 'ي', 'ن', 'ص', 'ت', 'ض'],
  ماء: ['ج', 'ز', 'ك', 'س', 'ق', 'ث', 'ظ'],
  تراب: ['د', 'ح', 'ل', 'ع', 'ر', 'خ', 'غ'],
});
export const PLANETS = ['شمس', 'قمر', 'مريخ', 'عطارد', 'مشتري', 'زهرة', 'زحل'];
export const ZODIAC = [
  ['الحمل', 'نار'], ['الثور', 'تراب'], ['الجوزاء', 'هواء'], ['السرطان', 'ماء'],
  ['الأسد', 'نار'], ['العذراء', 'تراب'], ['الميزان', 'هواء'], ['العقرب', 'ماء'],
  ['القوس', 'نار'], ['الجدي', 'تراب'], ['الدلو', 'هواء'], ['الحوت', 'ماء'],
];
const abjadOrder = Object.keys(ABJAD);
const elementByLetter = Object.fromEntries(Object.entries(ELEMENTS).flatMap(([element, letters]) => letters.map(letter => [letter, element])));

export function normalizeLetter(char) { return normalizations[char] || char; }
export function analyze(text = '') {
  const letters = [...text].map((raw, index) => {
    const normalized = normalizeLetter(raw);
    const value = ABJAD[normalized] || 0;
    return value ? { raw, normalized, value, index } : null;
  }).filter(Boolean);
  const words = text.trim().split(/\s+/).filter(Boolean).map(word => ({ word, ...analyzeWord(word) }));
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
  let winner;
  let reason;
  if (same) { winner = bothOdd ? firstRole : (firstRole === 'طالب' ? 'مطلوب' : 'طالب'); reason = bothOdd ? 'باقيان متساويان فرديان: الطالب يغلب' : 'باقيان متساويان زوجيان: المطلوب يغلب'; }
  else if ((first.mod9 % 2) === (second.mod9 % 2)) { winner = first.mod9 < second.mod9 ? firstRole : (firstRole === 'طالب' ? 'مطلوب' : 'طالب'); reason = 'باقيان مختلفان من نفس الزوجية: الأصغر يغلب'; }
  else { winner = first.mod9 > second.mod9 ? firstRole : (firstRole === 'طالب' ? 'مطلوب' : 'طالب'); reason = 'باقيان مختلفا الزوجية: الأكبر يغلب'; }
  return { winner, reason };
}
export function compareElements(first, second) {
  if (!first.leaders.length || !second.leaders.length || first.leaders.length > 1 || second.leaders.length > 1) return { kind: 'مركّب', text: 'متعادل / مركّب — يُقرأ توزيع الطبائع بدل حكم واحد.' };
  const [a] = first.leaders; const [b] = second.leaders;
  if (a === b) return { kind: 'انسجام', text: 'انسجام: الطبع الغالب متطابق.' };
  const winningPairs = new Set(['نار/هواء', 'هواء/تراب', 'تراب/ماء', 'ماء/نار']);
  if (winningPairs.has(`${a}/${b}`)) return { kind: 'غلبة طبع', text: `غلبة طبع: ${a} يغلب ${b}.` };
  if (winningPairs.has(`${b}/${a}`)) return { kind: 'غلبة طبع', text: `غلبة طبع: ${b} يغلب ${a}.` };
  return { kind: 'تضاد', text: `تضاد: ${a} مع ${b}.` };
}
export function compareCelestial(first, second) {
  const planet = !first.planetLeaders.length || !second.planetLeaders.length || first.planetLeaders.length > 1 || second.planetLeaders.length > 1
    ? 'تعادل كوكبي حرفي — لا حكم قاطع.'
    : first.planetLeaders[0] === second.planetLeaders[0] ? 'توافق كوكبي حرفي.' : `اختلاف كوكبي حرفي: ${first.planetLeaders[0]} / ${second.planetLeaders[0]}.`;
  let zodiac = 'لا توجد بروج حسابية للمقارنة.';
  if (first.zodiac && second.zodiac) zodiac = first.zodiac[0] === second.zodiac[0] ? 'تطابق البرج الحسابي.' : first.zodiac[1] === second.zodiac[1] ? `اختلاف مع اتحاد العنصر: ${first.zodiac[1]}.` : 'اختلاف كامل بين البرجين الحسابيين.';
  return { planet, zodiac };
}
export function makeMagicSquare(n, target) {
  let grid;
  if (n % 2) grid = oddSquare(n); else grid = doublyEvenSquare(n);
  const C = n * (n * n + 1) / 2;
  let best = null;
  for (let d = 1; d <= Math.max(2, Math.ceil((target || C) / n)); d++) {
    const approxA = Math.max(1, Math.round(((target || C) - (C - n) * d) / n));
    for (const a of [approxA - 1, approxA, approxA + 1].filter(x => x >= 1)) {
      const M = n * a + (C - n) * d;
      const candidate = { a, d, M, delta: (target || 0) - M };
      if (!best || Math.abs(candidate.delta) < Math.abs(best.delta) || (Math.abs(candidate.delta) === Math.abs(best.delta) && (candidate.d < best.d || (candidate.d === best.d && candidate.a < best.a)))) best = candidate;
    }
  }
  return { n, C, ...best, grid: grid.map(row => row.map(v => best.a + (v - 1) * best.d)) };
}
function oddSquare(n) { const g = Array.from({ length: n }, () => Array(n).fill(0)); let r = 0, c = Math.floor(n / 2); for (let v = 1; v <= n * n; v++) { g[r][c] = v; const nr = (r - 1 + n) % n, nc = (c + 1) % n; if (g[nr][nc]) r = (r + 1) % n; else { r = nr; c = nc; } } return g; }
function doublyEvenSquare(n) { const g = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1)); return g.map((row, r) => row.map((v, c) => ((r % 4 === c % 4) || ((r % 4) + (c % 4) === 3)) ? n * n + 1 - v : v)); }
export function formatNumber(num) { return new Intl.NumberFormat('ar-EG').format(num || 0); }
