import { profile } from './engine.js';

const opposing = new Set(['نار/ماء', 'ماء/نار', 'هواء/تراب', 'تراب/هواء']);
const friends = new Set(['نار/هواء', 'هواء/نار', 'ماء/تراب', 'تراب/ماء']);

export function assessBabyName(candidate, parentEntries = []) {
  const p = profile(candidate);
  if (!p.leaders.length) return { compatible: false, score: 0, p, relations: [], reason: 'الاسم لا يحتوي على حروف عربية محسوبة.' };
  if (p.leaders.some(x => p.leaders.some(y => x !== y && opposing.has(`${x}/${y}`)))) {
    return { compatible: false, score: 0, p, relations: [], reason: 'طبائع الاسم نفسه متضادة حسابيًا.' };
  }
  let score = 0;
  const relations = [];
  for (const entry of parentEntries) {
    const parent = entry.profile;
    if (p.leaders.some(x => parent.leaders.some(y => opposing.has(`${x}/${y}`)))) {
      return { compatible: false, score: 0, p, relations, reason: `يوجد تضاد حسابي مع ${entry.label}.` };
    }
    const relation = p.leaders.some(x => parent.leaders.includes(x))
      ? 'انسجام'
      : p.leaders.some(x => parent.leaders.some(y => friends.has(`${x}/${y}`))) ? 'صداقة' : 'امتزاج';
    score += relation === 'انسجام' ? 3 : relation === 'صداقة' ? 2 : 1;
    relations.push({ label: entry.label, relation });
  }
  return { compatible: true, score, p, relations, reason: 'لا يوجد تضاد حسابي مع بيانات الوالدين المدخلة.' };
}

export function babyVerdict(match, parentCount) {
  if (!match?.compatible) return 'غير متوافق حسابيًا';
  const ratio = match.score / Math.max(1, parentCount * 3);
  return ratio >= 1 ? 'متوافق جدًا' : ratio >= 0.67 ? 'متوافق' : 'متوافق بدرجة مقبولة';
}
