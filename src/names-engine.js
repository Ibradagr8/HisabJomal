import { elementRelation, profile } from './engine.js';

export function buildIndexedNames(maleList, femaleList, profileFn = profile) {
  return {
    male: maleList.map(name => ({ name, p: profileFn(name) })),
    female: femaleList.map(name => ({ name, p: profileFn(name) })),
  };
}

export function assessBabyName(candidate, parentEntries = []) {
  return assessBabyProfile(profile(candidate), parentEntries);
}

export function assessBabyProfile(p, parentEntries = []) {
  if (!p.leaders.length) return { compatible: false, score: 0, p, relations: [], reason: 'الاسم لا يحتوي على حروف عربية محسوبة.' };
  if (p.leaders.some(x => p.leaders.some(y => x !== y && elementRelation(x, y) === 'تضاد'))) {
    return { compatible: false, score: 0, p, relations: [], reason: 'طبائع الاسم نفسه متضادة حسابيًا.' };
  }
  let score = 0;
  const relations = [];
  for (const entry of parentEntries) {
    const parent = entry.profile;
    if (p.leaders.some(x => parent.leaders.some(y => elementRelation(x, y) === 'تضاد'))) {
      return { compatible: false, score: 0, p, relations, reason: `يوجد تضاد حسابي مع ${entry.label}.` };
    }
    const relation = p.leaders.some(x => parent.leaders.includes(x))
      ? 'انسجام'
      : p.leaders.some(x => parent.leaders.some(y => elementRelation(x, y) === 'صداقة')) ? 'صداقة' : 'امتزاج';
    score += relation === 'انسجام' ? 3 : relation === 'صداقة' ? 2 : 1;
    relations.push({ label: entry.label, relation });
  }
  return { compatible: true, score, p, relations, reason: 'لا يوجد تضاد حسابي مع بيانات الوالدين المدخلة.' };
}

export function suggestionEmptyMessage(query, sourceNames, genderLabel) {
  const term = String(query || '').trim();
  if (term && sourceNames.some(name => name.includes(term))) {
    return `توجد أسماء ${genderLabel} مطابقة، لكنها غير متوافقة حسابيًا مع بيانات الوالدين الحالية.`;
  }
  return `لا توجد أسماء ${genderLabel} مطابقة للبحث.`;
}

export function babyVerdict(match, parentCount) {
  if (!match?.compatible) return 'غير متوافق حسابيًا';
  const ratio = match.score / Math.max(1, parentCount * 3);
  return ratio >= 1 ? 'متوافق جدًا' : ratio >= 0.67 ? 'متوافق' : 'متوافق بدرجة مقبولة';
}
