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
  const selfConflict = p.leaders.some(x => p.leaders.some(y => x !== y && elementRelation(x, y) === 'تضاد'));
  const relations = parentEntries.map(entry => assessParentRelation(p, entry));
  const conflict = relations.find(item => item.relation === 'تضاد');
  const compatible = !selfConflict && !conflict;
  const score = compatible ? relations.reduce((sum, item) => sum + ({ انسجام: 3, صداقة: 2, امتزاج: 1 }[item.relation] || 0), 0) : 0;
  const reason = selfConflict
    ? 'طبائع الاسم نفسه متضادة حسابيًا.'
    : conflict ? `يوجد تضاد حسابي مع ${conflict.label}.`
      : 'لا يوجد تضاد حسابي مع بيانات الوالدين المدخلة.';
  return { compatible, score, p, relations, reason };
}

function assessParentRelation(p, entry) {
  const parent = entry.profile;
  const candidateElements = p.leaders;
  const parentElements = parent.leaders;
  const relation = candidateElements.some(x => parentElements.some(y => elementRelation(x, y) === 'تضاد'))
    ? 'تضاد'
    : candidateElements.some(x => parentElements.includes(x))
      ? 'انسجام'
      : candidateElements.some(x => parentElements.some(y => elementRelation(x, y) === 'صداقة'))
        ? 'صداقة'
        : 'امتزاج';
  const explanation = {
    انسجام: 'يوجد طبع مشترك بين الاسم واسم الوالد.',
    صداقة: 'تجمع الطبائع بين الاسم واسم الوالد علاقة صداقة حسابية.',
    امتزاج: 'لا يوجد تضاد مباشر؛ العلاقة الحسابية متوازنة بدرجة مقبولة.',
    تضاد: 'توجد طبائع متقابلة حسابيًا بين الاسم واسم الوالد.',
  }[relation];
  return { label: entry.label, name: entry.name || '', relation, candidateElements, parentElements, explanation };
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
