import './styles.css';
import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ABJAD, ELEMENTS, PLANETS, ZODIAC, analyze, compareCelestial, compareElements, compareProfiles, elementDisplayName, formatElementNames, formatNumber, profile } from './engine.js';
import { femaleNames, maleNames } from './data.js';
import { assessBabyName, assessBabyProfile, babyVerdict, buildIndexedNames, suggestionEmptyMessage } from './names-engine.js';
import { BIRTH_CITIES, HOUSE_MEANINGS, calculateNatalChart, signReading } from './natal-chart.js';
import { createNatalChartCache } from './natal-cache.js';
import { copyText, escapeHtml } from './platform.js';
import { runReferenceChecks } from './self-tests.js';
import { openTrustedSource } from './sources.js';
import { createState, parseStoredState } from './state.js';
import { restoredDisclosures, detailsShouldStartOpen, planetDisclosureId } from './ui-state.js';
import { applyZodiacToolClear, selectZodiacMode, selectedZodiacPanel, zodiacModeSwitcherMarkup } from './zodiac-mode.js';
import { ARABIC_MONTHS, ELEMENT_GUIDE, QUALITY_GUIDE, ZODIAC_DETAILS, ZODIAC_SOURCES, visibleDayCount, isAllowedSourceUrl, parseBirthDate, westernDigits, zodiacFromDate, zodiacFromNumber } from './zodiac.js';

function readSharedState() {
  // توافق خلفي: روابط ?state= القديمة ما زالت تُقرأ، بدون زر لإنشاء رابط جديد.
  try {
    const encoded = new URLSearchParams(location.search).get('state');
    return encoded ? JSON.parse(decodeURIComponent(escape(atob(encoded))) || '{}') : {};
  } catch { return {}; }
}
let stored = {};
try { stored = parseStoredState(localStorage.getItem('hisab-jomal-state')); } catch { stored = {}; }
const state = createState(stored, readSharedState());
const app = document.querySelector('#app');
const indexedNames = Object.freeze(buildIndexedNames(maleNames, femaleNames, profile));
const natalCache = createNatalChartCache(calculateNatalChart);
const suggestionCache = new Map();
let lastDetailMode = state.detailMode;
let pendingFocusSelector = '';

function persist() { try { localStorage.setItem('hisab-jomal-state', JSON.stringify(state)); return true; } catch { return false; } }
const esc = escapeHtml;
function toast(message) { document.querySelector('.toast')?.remove(); const e = document.createElement('div'); e.className = 'toast'; e.textContent = message; document.body.append(e); setTimeout(() => e.remove(), 2200); }
async function copy(text, { silent = false } = {}) {
  const ok = await copyText(text);
  if (!silent) toast(ok ? 'تم النسخ' : 'تعذّر النسخ');
  return ok;
}
async function openExternalSource(url) {
  const result = await openTrustedSource(url, {
    isAllowed: isAllowedSourceUrl,
    isTauriApp: isTauri,
    openUrl,
    openPopup: href => window.open(href, '_blank', 'noopener,noreferrer'),
    copyText,
  });
  if (result.message) toast(result.message);
}
function setSection(id) { state.section = id; persist(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function num(n) { return formatNumber(n); }
function profileCard(p) { const total = p.count || 1; return `<div class="metric"><span>المجموع</span><b>${num(p.total)}</b></div><div class="metric"><span>الباقي ÷٩</span><b>${p.mod9 ? num(p.mod9) : '—'}</b></div><div class="metric"><span>الطبع</span><b>${p.leaders.length ? formatElementNames(p.leaders) : '—'}</b></div><div class="metric"><span>الكوكب</span><b>${p.planetLeaders.length ? p.planetLeaders.join(' / ') : '—'}</b></div><div class="metric"><span>البرج</span><b>${p.zodiac ? `${p.zodiac[0]} · ${elementDisplayName(p.zodiac[1])}` : '—'}</b></div><div class="element-bars">${Object.entries(p.elements).map(([name, count]) => `<div class="element-row"><span>${elementDisplayName(name)}</span><div class="bar"><i style="width:${count / total * 100}%"></i></div><span>${num(count)}</span></div>`).join('')}</div>`; }
function calculator() {
  const result = analyze(state.text); const target = parseArabicNumber(state.target); const percent = target > 0 ? Math.min(100, result.total / target * 100) : 0;
  const wordDetails = result.words.length ? result.words.map((w,index) => `<details class="word" data-disclosure="calculator-word-${index}"><summary><b>${esc(w.word)}</b><span>${num(w.total)}</span></summary><div class="letters">${w.letters.map(l => `<span class="letter">${esc(l.raw)}${l.raw !== l.normalized ? ` ← ${esc(l.normalized)}` : ''} = ${num(l.value)}</span>`).join('')}</div></details>`).join('') : '<p class="muted">ستظهر الكلمات والحروف المحتسبة هنا.</p>';
  return `<div class="grid calculator-grid"><main><section class="card calculator-main"><div class="section-heading"><div><h2>الحاسبة</h2><p class="muted">اكتب أي نص عربي، وستظهر النتيجة فورًا وفق حساب الجمل المشرقي.</p></div><span class="tag">حساب الجمل المشرقي</span></div><textarea id="text" rows="4" placeholder="اكتب العبارة هنا…">${esc(state.text)}</textarea><div class="chips">${['بسم الله الرحمن الرحيم','محمد','داود'].map(x => `<button class="chip" data-example="${x}">${x}</button>`).join('')}</div><div class="split calculator-target"><div><label class="muted">الرقم المستهدف (اختياري)</label><input id="target" inputmode="numeric" value="${esc(state.target)}" placeholder="مثال: ٧٨٦"></div><div class="actions"><button class="btn" data-send="names">إرسال إلى الأسماء</button></div></div>${target > 0 ? `<div class="result"><div class="metric"><span>التقدم نحو الهدف</span><b>${num(Math.round(percent))}%</b></div><div class="bar"><i style="width:${percent}%"></i></div>${result.total === target ? '<b>تطابق تام مع الرقم المستهدف</b>' : ''}</div>` : ''}<div class="actions streamlined-actions"><button class="btn" data-clear="calculator">مسح</button></div></section><details class="card progressive-section" data-disclosure="calculator-details" ${detailsShouldStartOpen(state.detailMode) ? 'open' : ''}><summary><span><small>التفاصيل</small><b>تفصيل الكلمات والحروف</b></span><i>⌄</i></summary><div class="progressive-content">${wordDetails}</div></details></main><aside><section class="card total-card"><span class="muted">المجموع الحالي</span><div class="hero-number">${num(result.total)}</div><span class="muted">${num(result.count)} حرفًا محتسبًا</span></section></aside></div>`;
}
function comparePersonCard(label, role, name, motherName, p, isWinner) {
  return `<article class="compare-person ${p.count ? '' : 'is-empty'} ${isWinner ? 'is-winner' : ''}"><div class="compare-person-top"><span>${esc(label)} · ${esc(role)}</span>${isWinner ? '<b class="winner-chip">الغالب حسابيًا</b>' : ''}</div><h3>${esc(name.trim() || 'الاسم غير مُدخل')}</h3>${motherName ? `<small>مع اسم الأم: ${esc(motherName)}</small>` : ''}${p.count ? `<div class="compare-total"><strong>${num(p.total)}</strong><span>المجموع</span></div><div class="person-stats"><span>الباقي ÷٩ <b>${num(p.mod9)}</b></span><span>الطبع <b>${formatElementNames(p.leaders) || '—'}</b></span><span>البرج <b>${p.zodiac ? p.zodiac[0] : '—'}</b></span></div>` : '<p>أدخل الاسم لعرض بياناته.</p>'}</article>`;
}
function nameComparison(a, b) {
  const firstRole = state.role;
  const secondRole = firstRole === 'طالب' ? 'مطلوب' : 'طالب';
  const ready = Boolean(state.nameA.trim() && state.nameB.trim() && a.mod9 && b.mod9);
  const comparison = ready ? compareProfiles(a, b, firstRole) : null;
  const elements = ready ? compareElements(a, b) : null;
  const celestial = ready ? compareCelestial(a, b) : null;
  const firstWins = Boolean(comparison && comparison.winnerIndex === 0);
  const winnerName = firstWins ? state.nameA : state.nameB;
  const loserName = firstWins ? state.nameB : state.nameA;
  const winnerProfile = firstWins ? a : b;
  const loserProfile = firstWins ? b : a;
  const dominancePanel = ready ? `<section class="dominance-dashboard" id="comparison-result"><div class="dominance-dashboard-head"><div><span class="eyebrow">النتيجة وفق الحساب التراثي</span><h3>الغالب والمغلوب</h3></div><span class="comparison-note">نتيجة حسابية وليست حكمًا على قيمة الشخص.</span></div><div class="dominance-match"><article class="dominance-side winner"><span>الغالب حسابيًا</span><b>${esc(winnerName)}</b><small>الباقي من ٩: ${num(winnerProfile.mod9)}</small></article><div class="dominance-arrow" aria-hidden="true">←<small>مقارنة</small></div><article class="dominance-side loser"><span>المغلوب حسابيًا</span><b>${esc(loserName)}</b><small>الباقي من ٩: ${num(loserProfile.mod9)}</small></article></div><div class="dominance-rule"><b>سبب الحكم</b><p>${comparison.reason}</p></div></section><div class="comparison-insights"><article><span class="insight-number">١</span><div><small>قاعدة الحكم</small><h3>الباقي من القسمة على ٩</h3><p>${comparison.reason}</p></div></article><article><span class="insight-number">٢</span><div><small>علاقة الطبائع</small><h3>${elements.kind}</h3><p>${elements.text}</p></div></article><article><span class="insight-number">٣</span><div><small>المراسلات الحرفية</small><h3>${celestial.planet}</h3><p>${celestial.zodiac}</p></div></article></div>` : '<div class="comparison-placeholder"><b>أدخل الاسمين لإظهار الغالب والمغلوب</b><span>ستظهر النتيجة وسبب الحكم وتفاصيل الطبائع في لوحة واحدة.</span></div>';
  return `<section class="card comparison-workspace" id="name-comparison"><div class="section-heading"><div><h2>الغالب والمغلوب</h2><p class="muted">نتيجة حسابية تراثية تُظهر قاعدة الحكم وتفاصيل الطرفين.</p></div><span class="tag">مقارنة حسابية</span></div><div class="comparison-inputs"><label><span>الشخص الأول</span><input data-field="nameA" value="${esc(state.nameA)}" placeholder="الاسم"><input data-field="motherA" value="${esc(state.motherA)}" placeholder="اسم الأم (اختياري)"></label><label><span>الشخص الثاني</span><input data-field="nameB" value="${esc(state.nameB)}" placeholder="الاسم"><input data-field="motherB" value="${esc(state.motherB)}" placeholder="اسم الأم (اختياري)"></label></div><div class="actions comparison-actions"><label class="chip">دور الشخص الأول <select data-field="role" style="width:auto;padding:0;border:0;background:transparent"><option ${firstRole === 'طالب' ? 'selected' : ''}>طالب</option><option ${firstRole === 'مطلوب' ? 'selected' : ''}>مطلوب</option></select></label><button class="btn" data-clear="names">مسح</button></div>${dominancePanel}${ready ? `<section class="comparison-evidence"><div class="comparison-evidence-head"><h3>تفاصيل الحساب للطرفين</h3><span>للمراجعة والاطلاع</span></div><div class="duel-grid">${comparePersonCard('الشخص الأول', firstRole, state.nameA, state.motherA, a, firstWins)}<div class="versus-mark"><b>↔</b><span>تفاصيل</span></div>${comparePersonCard('الشخص الثاني', secondRole, state.nameB, state.motherB, b, !firstWins)}</div></section><details class="comparison-details" data-disclosure="comparison-details"><summary>عرض التفاصيل الحسابية الكاملة للشخصين</summary><div class="split"><div class="profile-detail"><h3>${esc(state.nameA)}</h3>${profileCard(a)}</div><div class="profile-detail"><h3>${esc(state.nameB)}</h3>${profileCard(b)}</div></div></details>` : ''}</section>`;
}
function names() {
  const a = profile(`${state.nameA} ${state.motherA}`), b = profile(`${state.nameB} ${state.motherB}`);
  const switcher = `<section class="mode-switch" aria-label="اختيار أداة الأسماء"><button class="${state.namesMode === 'baby' ? 'active' : ''}" data-names-mode="baby"><span>◌</span><b>اقتراح اسم مولود</b><small>حساب الاسم وعرض المقترحات</small></button><button class="${state.namesMode === 'comparison' ? 'active' : ''}" data-names-mode="comparison"><span>↔</span><b>الغالب والمغلوب</b><small>قاعدة الحكم وتفاصيل الطرفين</small></button></section>`;
  return `${switcher}${state.namesMode === 'comparison' ? nameComparison(a, b) : suggestions()}`;
}
function suggestedNameList(items, emptyText) {
  if (!items.length) return `<p class="muted empty-state">${emptyText}</p>`;
  return `<div class="name-options">${items.slice(0, state.suggestionLimit).map(x => `<button class="name-option" data-select-name="${esc(x.name)}"><span><strong>${esc(x.name)}</strong><small>${formatElementNames(x.p.leaders)} · ${x.relations.map(r => r.relation).join(' + ')}</small></span><em>${babyVerdict(x, x.relations.length)}</em></button>`).join('')}</div>`;
}
function rankedSuggestions(kind, parentEntries) {
  const parentKey = parentEntries.map(entry => `${entry.label}:${entry.profile.leaders.slice().sort().join('/')}`).join('|');
  const key = `${kind}|${parentKey}`;
  if (suggestionCache.has(key)) return suggestionCache.get(key);
  const ranked = indexedNames[kind]
    .map(({ name, p }) => ({ name, ...assessBabyProfile(p, parentEntries) }))
    .filter(item => item.compatible)
    .sort((a,b) => b.score-a.score || a.p.count-b.p.count || a.name.localeCompare(b.name, 'ar'));
  if (suggestionCache.size >= 24) suggestionCache.clear();
  suggestionCache.set(key, ranked);
  return ranked;
}
function babyRelationCard(item) {
  const tone = item.relation === 'تضاد' ? 'is-conflict' : item.relation === 'انسجام' ? 'is-harmony' : 'is-balanced';
  const title = item.label === 'الأب' ? 'العلاقة مع الأب' : 'العلاقة مع الأم';
  return `<article class="parent-relation-card ${tone}"><div class="parent-relation-head"><div><span>${title}</span><h3>${esc(item.name || item.label)}</h3></div><b>${item.relation}</b></div><div class="parent-element-pair"><span><small>اسم المولود</small><b>${formatElementNames(item.candidateElements)}</b></span><i>↔</i><span><small>${item.label}</small><b>${formatElementNames(item.parentElements)}</b></span></div><p>${item.explanation}</p></article>`;
}
function suggestions() {
  const father = profile(state.father), mother = profile(state.mother);
  const parentEntries = [{ label: 'الأب', name: state.father, profile: father }, { label: 'الأم', name: state.mother, profile: mother }].filter(entry => entry.profile.count);
  const desired = profile(state.desiredBabyName);
  const desiredMatch = desired.count && parentEntries.length ? assessBabyName(state.desiredBabyName, parentEntries) : null;
  const list = (kind, query) => rankedSuggestions(kind, parentEntries)
    .filter(item => item.name !== state.father && item.name !== state.mother)
    .filter(item => !query.trim() || item.name.includes(query.trim()));
  const males = parentEntries.length ? list('male', state.maleSearch) : [];
  const females = parentEntries.length ? list('female', state.femaleSearch) : [];
  const maleEmpty = suggestionEmptyMessage(state.maleSearch, maleNames, 'ذكور');
  const femaleEmpty = suggestionEmptyMessage(state.femaleSearch, femaleNames, 'إناث');
  const desiredResult = !desired.count
    ? '<div class="baby-empty"><b>اكتب الاسم المرغوب</b><span>سنحسب قيمته ونقارنه بالأب والأم فورًا.</span></div>'
    : !parentEntries.length
      ? `<div class="baby-result neutral"><div><span class="muted">حساب الاسم</span><strong>${num(desired.total)}</strong></div><p>أدخل اسم الأب أو الأم لإظهار درجة التوافق.</p></div>`
      : `<section class="baby-result ${desiredMatch.compatible ? 'compatible' : 'incompatible'}"><div class="baby-result-head"><div><span class="muted">نتيجة الاسم المقترح</span><h3>${esc(state.desiredBabyName)}</h3><strong>${num(desired.total)}</strong></div><span class="status-badge">${babyVerdict(desiredMatch, parentEntries.length)}</span></div><div class="baby-facts"><span>الطبع <b>${formatElementNames(desired.leaders) || '—'}</b></span><span>الكوكب <b>${desired.planetLeaders.join(' / ') || '—'}</b></span><span>البرج <b>${desired.zodiac ? desired.zodiac[0] : '—'}</b></span></div><div class="family-compatibility"><div class="family-compatibility-head"><div><span class="eyebrow">علاقة الاسم بالعائلة</span><h3>التوافق مع الوالدين</h3></div><p>${desiredMatch.reason}</p></div><div class="parent-relations">${desiredMatch.relations.map(babyRelationCard).join('')}</div></div></section>`;
  return `<section class="card baby-planner"><div class="section-heading"><div><h2>اقتراح اسم مولود</h2><p class="muted">أدخل بيانات الوالدين ثم جرّب اسمًا مرغوبًا أو اختر من المقترحات.</p></div><span class="tag">اقتراح الأسماء</span></div><p class="notice">اقتراح حسابي تراثي اختياري؛ المعنى الحسن وسنّة التسمية مقدمان، وليس حكمًا شرعيًا.</p><div class="baby-inputs"><label><span>اسم الأب</span><input data-field="father" value="${esc(state.father)}" placeholder="مثال: محمد"></label><label><span>اسم الأم</span><input data-field="mother" value="${esc(state.mother)}" placeholder="مثال: فاطمة"></label><label class="desired-name"><span>الاسم المرغوب للمولود</span><input data-field="desiredBabyName" value="${esc(state.desiredBabyName)}" placeholder="اكتب الاسم الذي تفكران فيه"></label></div>${desiredResult}<div class="actions"><button class="btn" data-clear="parents">مسح بيانات المولود</button></div></section>${parentEntries.length ? `<div class="suggestion-columns"><section class="card suggestion-panel"><div class="suggestion-title"><div><span class="gender-mark male">ذ</span><div><h3>أسماء ذكور مقترحة</h3><span class="muted">${num(males.length)} اسمًا متوافقًا</span></div></div></div><input data-field="maleSearch" value="${esc(state.maleSearch)}" placeholder="ابحث في أسماء الذكور…">${suggestedNameList(males, maleEmpty)}</section><section class="card suggestion-panel"><div class="suggestion-title"><div><span class="gender-mark female">أ</span><div><h3>أسماء إناث مقترحة</h3><span class="muted">${num(females.length)} اسمًا متوافقًا</span></div></div></div><input data-field="femaleSearch" value="${esc(state.femaleSearch)}" placeholder="ابحث في أسماء الإناث…">${suggestedNameList(females, femaleEmpty)}</section></div>${(males.length>state.suggestionLimit || females.length>state.suggestionLimit) ? '<div class="actions centered"><button class="btn" data-more-names>عرض كل الأسماء</button></div>' : ''}` : '<section class="card baby-prompt"><b>ابدأ باسم الأب أو الأم</b><span>بعدها ستظهر هنا قوائم منفصلة للأسماء الذكور والإناث.</span></section>'}`;
}
function heritageZodiacResult() {
  const person = analyze(state.zodiacName);
  const mother = analyze(state.zodiacMother);
  const total = person.total + mother.total;
  const remainder = total ? total % 12 || 12 : null;
  return { person, mother, total, remainder, sign: zodiacFromNumber(remainder) };
}
function traitList(items) { return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`; }
function zodiacGuideCard(sign, index) {
  return `<article class="zodiac-card"><div class="zodiac-card-top"><span>${sign.symbol}</span><small>${num(index + 1)}</small></div><h3>${sign.name}</h3><p class="zodiac-dates">${sign.dates}</p><div class="zodiac-tags"><span>${elementDisplayName(sign.element)}</span><span>${sign.quality}</span><span>${sign.ruler}</span></div><p>${sign.summary}</p></article>`;
}
function dateOptions(length, selected, labels = null) {
  return Array.from({ length }, (_, index) => {
    const value = String(index + 1);
    return `<option value="${value}" ${String(selected) === value ? 'selected' : ''}>${labels ? labels[index] : num(index + 1)}</option>`;
  }).join('');
}
function zeroOptions(length, selected) {
  return Array.from({ length }, (_, value) => `<option value="${value}" ${String(selected) === String(value) ? 'selected' : ''}>${num(value)}</option>`).join('');
}
const degreeFormatter = new Intl.NumberFormat('ar-EG', { minimumFractionDigits:1, maximumFractionDigits:1 });
function degreeLabel(item) { return `${degreeFormatter.format(item.degree)}° ${item.sign.name}`; }
function cityOptions(selected) {
  const countries = [...new Set(BIRTH_CITIES.map(city => city.country))];
  return countries.map(country => `<optgroup label="${esc(country)}">${BIRTH_CITIES.filter(city => city.country === country).map(city => `<option value="${city.id}" ${city.id === selected ? 'selected' : ''}>${esc(city.label)}</option>`).join('')}</optgroup>`).join('');
}
function chartPoint(longitude, radius, center = 180) {
  const angle = (longitude - 90) * Math.PI / 180;
  return { x:center + radius * Math.cos(angle), y:center + radius * Math.sin(angle) };
}
function natalWheel(chart) {
  const aspectLines = chart.aspects.slice(0, 8).map(aspect => {
    const first = chartPoint(aspect.first.longitude, 108);
    const second = chartPoint(aspect.second.longitude, 108);
    const tension = ['تربيع','مقابلة'].includes(aspect.name);
    return `<line x1="${first.x}" y1="${first.y}" x2="${second.x}" y2="${second.y}" class="${tension ? 'aspect-tension' : 'aspect-flow'}" />`;
  }).join('');
  const spokes = ZODIAC_DETAILS.map((_, index) => {
    const edge = chartPoint(index * 30, 154);
    const inner = chartPoint(index * 30, 84);
    return `<line x1="${edge.x}" y1="${edge.y}" x2="${inner.x}" y2="${inner.y}" />`;
  }).join('');
  const signs = ZODIAC_DETAILS.map((sign, index) => {
    const point = chartPoint(index * 30 + 15, 137);
    return `<text x="${point.x}" y="${point.y}" class="wheel-sign">${sign.symbol}</text>`;
  }).join('');
  const bodies = chart.placements.map((body, index) => {
    const point = chartPoint(body.longitude, 108 - (index % 2) * 13);
    return `<g><circle cx="${point.x}" cy="${point.y}" r="11"/><text x="${point.x}" y="${point.y}" class="wheel-body">${body.symbol}</text></g>`;
  }).join('');
  const angles = chart.angles ? Object.values(chart.angles).map(angle => {
    const from = chartPoint(angle.longitude, 156);
    const to = chartPoint(angle.longitude, 82);
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="angle-line"/><text x="${to.x}" y="${to.y}" class="wheel-angle">${angle.symbol}</text>`;
  }).join('') : '';
  return `<svg class="natal-wheel" viewBox="0 0 360 360" role="img" aria-label="عجلة خريطة الميلاد"><circle class="wheel-base" cx="180" cy="180" r="158"/><circle class="wheel-ring" cx="180" cy="180" r="120"/><circle class="wheel-core" cx="180" cy="180" r="82"/><g class="wheel-spokes">${spokes}</g><g>${signs}</g><g class="wheel-aspects">${aspectLines}</g><g class="wheel-bodies">${bodies}</g><g>${angles}</g><text x="180" y="174" class="wheel-center">خريطة الميلاد</text><text x="180" y="194" class="wheel-center-small">دائرة البروج الاستوائية</text></svg>`;
}
function placementUncertainty(chart, item) {
  const alternatives = chart.uncertainty?.[item.key];
  return alternatives ? `<span class="precision-warning">قد ينتقل بين ${alternatives.map(sign => sign.name).join(' و')}</span>` : '';
}
function bigThreeCard(item, label, chart) {
  if (!item) return `<article class="big-three-card is-locked"><span class="big-symbol">?</span><small>${label}</small><h3>غير متاح</h3><p>أدخل وقت الميلاد الدقيق ومدينة الميلاد لحسابه.</p><span class="precision-badge unavailable">يتطلب وقت الميلاد</span></article>`;
  return `<article class="big-three-card"><span class="big-symbol">${item.symbol}</span><small>${label}</small><h3>${degreeLabel(item)}</h3><div class="mini-tags"><span>${elementDisplayName(item.sign.element)}</span><span>${item.sign.quality}</span></div><p>${signReading(item)}</p>${placementUncertainty(chart, item)}<span class="precision-badge">${item.key === 'sun' || item.key === 'moon' ? 'موضع محسوب فلكيًا' : 'محسوب من الوقت والمكان'}</span></article>`;
}
function balanceBars(entries) {
  const max = Math.max(...Object.values(entries), 1);
  return Object.entries(entries).map(([label, value]) => `<div class="balance-row"><span>${label}</span><div><i style="width:${value / max * 100}%"></i></div><b>${num(value)}</b></div>`).join('');
}
function personalitySynthesis(chart) {
  const sun = chart.placements.find(item => item.key === 'sun');
  const moon = chart.placements.find(item => item.key === 'moon');
  const asc = chart.angles?.ascendant;
  const dominant = Object.entries(chart.elements).sort((a,b)=>b[1]-a[1])[0];
  const relation = sun.sign.element === moon.sign.element
    ? `الشمس والقمر في عنصر ${elementDisplayName(sun.sign.element)}؛ لذلك تميل الإرادة والاستجابة العاطفية إلى العمل باللغة الرمزية نفسها.`
    : `الشمس في عنصر ${elementDisplayName(sun.sign.element)} والقمر في عنصر ${elementDisplayName(moon.sign.element)}؛ وهذا يصف اختلافًا بين طريقة السعي وما يمنح الأمان العاطفي، ويمكن أن يصنع مرونة إذا أُعطي كل جانب مساحته.`;
  return `<div class="synthesis-grid"><article><span>١</span><div><small>الهوية والشعور</small><h3>${sun.sign.name} × ${moon.sign.name}</h3><p>${relation}</p></div></article><article><span>٢</span><div><small>الحضور الخارجي</small><h3>${asc ? `طالع ${asc.sign.name}` : 'الوقت غير معروف'}</h3><p>${asc ? `قد يظهر الشخص للآخرين من خلال أسلوب ${asc.sign.summary.replace(/\.$/,'')}، حتى لو كانت دوافع الشمس والقمر مختلفة.` : 'لم نفترض طالعًا؛ لأن تخمينه من التاريخ وحده يعطي نتيجة مضللة.'}</p></div></article><article><span>٣</span><div><small>النبرة الغالبة</small><h3>عنصر ${elementDisplayName(dominant[0])}</h3><p>ظهر ${num(dominant[1])} مرات بين المواضع المعروضة. هذا ملخص بنيوي للخريطة وليس حكمًا ثابتًا على الشخصية.</p></div></article>${chart.chartRuler ? `<article><span>٤</span><div><small>حاكم الخريطة</small><h3>${chart.chartRuler}</h3><p>هو الحاكم التقليدي لبرج الطالع، ويُستخدم كمفتاح رمزي لربط موضوعات الخريطة.</p></div></article>` : ''}</div>`;
}
function progressivePanel(title, kicker, content, open = false) {
  return `<details class="card progressive-section" data-disclosure="panel-${esc(title)}" ${open ? 'open' : ''}><summary><span><small>${esc(kicker)}</small><b>${esc(title)}</b></span><i>⌄</i></summary><div class="progressive-content">${content}</div></details>`;
}
function natalChartResult(chart) {
  const sun = chart.placements.find(item => item.key === 'sun');
  const moon = chart.placements.find(item => item.key === 'moon');
  const asc = chart.angles?.ascendant;
  const secondary = chart.placements.filter(item => !['sun','moon'].includes(item.key));
  const planetsTable = chart.placements.map(item => `<tr><td><b class="planet-symbol">${item.symbol}</b> ${item.name}</td><td>${degreeLabel(item)}${placementUncertainty(chart,item)}</td><td>${item.house ? `البيت ${num(item.house)}` : '—'}</td><td>${item.retrograde ? '<span class="retrograde">متراجع ظاهريًا</span>' : 'مباشر'}</td></tr>`).join('');
  const angles = chart.angles ? Object.values(chart.angles).map(item => `<article><span>${item.symbol}</span><div><small>${item.role}</small><h3>${degreeLabel(item)}</h3></div></article>`).join('') : '';
  const aspects = chart.aspects.length ? chart.aspects.map(item => `<article class="aspect-card"><b>${item.first.symbol} ${item.name} ${item.second.symbol}</b><span>${item.first.name} × ${item.second.name} · أورب ${degreeFormatter.format(item.distance)}°</span><p><strong>${item.tone}:</strong> ${item.text}</p></article>`).join('') : '<p class="muted">لا توجد زوايا رئيسية ضمن الهوامش المعتمدة.</p>';
  const houses = chart.houses.map(item => {
    const bodies = chart.placements.filter(body => body.house === item.house);
    return `<article><span>${num(item.house)}</span><div><h3>${item.sign.name}</h3><p>${HOUSE_MEANINGS[item.house-1]}</p>${bodies.length ? `<small>${bodies.map(body=>`${body.symbol} ${body.name}`).join(' · ')}</small>` : '<small>لا كواكب من السبعة المعروضة</small>'}</div></article>`;
  }).join('');
  const full = state.detailMode === 'full';
  const synthesis = `<div class="section-heading"><div><span class="eyebrow">قراءة مركّبة</span><h2>كيف تتداخل أجزاء الشخصية رمزيًا؟</h2><p class="muted">كل استنتاج يوضح العناصر التي بُني عليها.</p></div><span class="precision-badge symbolic">قراءة رمزية غير علمية</span></div>${personalitySynthesis(chart)}`;
  const angleContent = chart.angles ? `<div class="angle-grid">${angles}</div>` : '<div class="missing-time"><span>⌁</span><div><h3>الطالع والبيوت غير محسوبين</h3><p>فعّل «وقت الميلاد معروف» وأدخل الساعة والدقيقة لتظهر المحاور والبيوت.</p></div></div>';
  const planets = `<p class="muted">الدرجة والبرج بيانات حسابية؛ المعنى النصي تفسير رمزي.</p><div class="table-wrap"><table class="planet-table"><thead><tr><th>الجرم</th><th>الموضع</th><th>البيت</th><th>الحركة</th></tr></thead><tbody>${planetsTable}</tbody></table></div><div class="planet-readings">${secondary.map(item=>`<details data-disclosure="${planetDisclosureId(item.key)}"><summary><span>${item.symbol}</span><div><small>${item.role}</small><b>${item.name} في ${item.sign.name}${item.house ? ` · البيت ${num(item.house)}` : ''}</b></div></summary><p>${signReading(item)}</p>${item.house ? `<p class="house-note"><b>مجال الظهور الرمزي:</b> ${HOUSE_MEANINGS[item.house-1]}</p>` : ''}</details>`).join('')}</div>`;
  return `<section class="natal-result"><div class="result-ribbon"><div><span class="eyebrow">ملخص الخريطة</span><h2>خريطة الميلاد الرمزية</h2><p>${esc(chart.city.label)} · ${chart.date.toLocaleString('ar-EG',{dateStyle:'long',timeStyle:'short',timeZone:chart.city.zone})}</p></div><div class="accuracy-stack"><span class="precision-badge">دقيق حسابيًا</span><small>${chart.accuracy}</small></div></div>
  <div class="big-three"><div class="section-heading"><div><span class="eyebrow">الثلاثة الكبار</span><h2>الشمس والقمر والطالع</h2></div><span class="tag">البروج الاستوائية · البيوت الكاملة</span></div><div class="big-three-grid">${bigThreeCard(sun,'البرج الشمسي',chart)}${bigThreeCard(moon,'البرج القمري',chart)}${bigThreeCard(asc,'الطالع',chart)}</div></div>
  <div class="chart-layout"><section class="card wheel-card"><div class="section-heading"><div><h2>عجلة الخريطة</h2><p class="muted">مواضع الأجرام والزوايا الرئيسية وقت الميلاد.</p></div></div>${natalWheel(chart)}</section><section class="card balance-card"><h2>بصمة الخريطة</h2><h3>العناصر</h3>${balanceBars(chart.elements)}<h3>الكيفيات</h3>${balanceBars(chart.qualities)}<div class="moon-phase"><span>☾</span><div><small>طور القمر</small><b>${chart.moonPhase.name}</b><p>إضاءة تقريبية ${num(Math.round(chart.moonPhase.illumination*100))}%</p></div></div></section></div>
  <div class="detail-accordion">${progressivePanel('القراءة المركبة','الخلاصة الرمزية',synthesis,full)}${progressivePanel('المحاور الأربعة','الطالع والغارب ووسط السماء',angleContent,full)}${progressivePanel('الكواكب السبعة','المواضع والحركة والتفسير',planets,full)}${progressivePanel('الزوايا الرئيسية','العلاقات بين الكواكب',`<div class="aspects-grid">${aspects}</div>`,full)}${chart.houses.length ? progressivePanel('البيوت الاثنا عشر','نظام البيوت الكاملة',`<div class="houses-grid">${houses}</div>`,full) : ''}</div>
  <section class="interpretation-boundary"><b>طريقة قراءة النتيجة</b><p>المواضع والدرجات محسوبة فلكيًا. أما ربطها بالشخصية فهو تقليد رمزي للتأمل والترفيه، وليس اختبارًا نفسيًا أو تنبؤًا بالمستقبل.</p></section></section>`;
}
function heritageZodiacTool() {
  const heritage = heritageZodiacResult();
  const heritageResult = heritage.sign ? `<section class="zodiac-result"><div class="zodiac-emblem"><span>${heritage.sign.symbol}</span><small>الباقي ${num(heritage.remainder)} من ١٢</small></div><div class="zodiac-reading"><span class="eyebrow">البرج الحرفي التراثي</span><h2>${heritage.sign.name}</h2><p>${heritage.sign.summary}</p><div class="zodiac-facts"><span>العنصر<b>${elementDisplayName(heritage.sign.element)}</b></span><span>الكيفية<b>${heritage.sign.quality}</b></span><span>الكوكب المنسوب تراثيًا<b>${heritage.sign.ruler}</b></span></div><div class="calculation-strip"><span>${esc(state.zodiacName)} <b>${num(heritage.person.total)}</b></span><i>+</i><span>${state.zodiacMother.trim() ? esc(state.zodiacMother) : 'اسم الأم غير مُدخل'} <b>${state.zodiacMother.trim() ? num(heritage.mother.total) : '—'}</b></span><i>=</i><span>المجموع <b>${num(heritage.total)}</b></span></div>${!state.zodiacMother.trim() ? '<p class="partial-note">هذه نتيجة جزئية من الاسم وحده؛ الطريقة التراثية الموثّقة تذكر جمع الاسم مع اسم الأم.</p>' : ''}<div class="trait-columns"><div><h3>رموز إيجابية محتملة</h3>${traitList(heritage.sign.strengths)}</div><div><h3>مساحات للتوازن</h3>${traitList(heritage.sign.balance)}</div></div><p class="reading-note">هذا الحساب الحرفي منفصل تمامًا عن الشمس والقمر والطالع، وليس تشخيصًا للشخصية.</p><div class="actions"><button class="btn" data-clear="heritage-zodiac">مسح الحساب الحرفي</button></div></div></section>` : '<p class="muted zodiac-tool-hint">اكتب الاسم واسم الأم لتظهر القراءة الحرفية.</p>';
  return `<div class="zodiac-tool-panel" data-zodiac-panel="heritage"><section class="card zodiac-calculator heritage-panel heritage-first"><div class="section-heading"><div><span class="eyebrow">الحساب الحرفي</span><h2>الحساب الحرفي التراثي</h2><p class="muted">الاسم واسم الأم والباقي من ١٢.</p></div><span class="tag">الباقي من ١٢</span></div><div class="zodiac-inputs"><label><span>اسم الشخص</span><input data-field="zodiacName" value="${esc(state.zodiacName)}" placeholder="مثال: محمد"></label><label><span>اسم الأم</span><input data-field="zodiacMother" value="${esc(state.zodiacMother)}" placeholder="مثال: فاطمة"></label></div><div class="actions"><button class="btn primary" data-calculate-heritage>احسب</button><button class="btn" data-clear="heritage-zodiac">مسح</button></div></section>${heritageResult}</div>`;
}
function natalZodiacTool() {
  const birth = parseBirthDate(state.birthDay, state.birthMonth, state.birthYear);
  const birthErrorFields = new Set(birth.errorFields || []);
  const birthFieldAttributes = field => birthErrorFields.has(field)
    ? 'class="has-error" aria-invalid="true" aria-describedby="birth-date-error"'
    : '';
  const birthMessage = birth.status === 'incomplete' ? 'أكمل اليوم والشهر والسنة بأربعة أرقام.'
    : birth.status === 'future' ? 'تاريخ الميلاد لا يمكن أن يكون في المستقبل.'
      : birth.status === 'non-leap' ? 'هذه السنة ليست كبيسة؛ فبراير فيها ٢٨ يومًا. أبقينا يوم ٢٩ كما اخترته حتى تعدّل اليوم أو السنة.'
      : birth.status === 'invalid' ? 'التاريخ غير صحيح؛ راجع اليوم والشهر والسنة.'
        : !state.birthCity ? 'اختر مدينة الميلاد حتى نطبّق التوقيت التاريخي الصحيح.' : '';
  let chartMarkup = `<section class="natal-placeholder"><span>✦</span><div><h2>أدخل بيانات الميلاد</h2><p>${birthMessage || 'ستظهر هنا الشمس والقمر والطالع والكواكب والبيوت والزوايا.'}</p></div></section>`;
  if (birth.status === 'valid' && state.birthCity) {
    const cached = natalCache.get({
      year:birth.year, month:birth.month, day:birth.day,
      hour:state.birthHour || '12', minute:state.birthMinute || '0',
      cityId:state.birthCity, timeKnown:state.birthTimeKnown,
    });
    if (cached.error) {
      chartMarkup = `<section class="natal-placeholder is-error"><span>!</span><div><h2>تعذّر حساب هذا الوقت</h2><p>${cached.error.message === 'invalid-local-time' ? 'هذه الساعة غير موجودة أو مكررة بسبب تغيير التوقيت الصيفي. جرّب دقيقة أو ساعة أخرى وراجع بيانات الميلاد.' : 'راجع التاريخ والوقت والمدينة.'}</p></div></section>`;
    } else {
      chartMarkup = natalChartResult(cached.chart);
    }
  }
  return `<div class="zodiac-tool-panel" data-zodiac-panel="natal"><section class="card natal-input-card"><div class="section-heading"><div><span class="eyebrow">بيانات الخريطة</span><h2>بيانات الميلاد</h2><p class="muted">كل البيانات تبقى على جهازك.</p></div><span class="tag">محلي</span></div><div class="birth-date-card natal-birth-fields"><div class="natal-field-grid"><label><span>اليوم</span><select data-birth-field="birthDay" ${birthFieldAttributes('birthDay')}><option value="">اليوم</option>${dateOptions(visibleDayCount(state.birthMonth,state.birthYear,state.birthDay),state.birthDay)}</select></label><label><span>الشهر</span><select data-birth-field="birthMonth" ${birthFieldAttributes('birthMonth')}><option value="">الشهر</option>${dateOptions(12,state.birthMonth,ARABIC_MONTHS)}</select></label><label><span>السنة</span><input type="text" inputmode="numeric" autocomplete="bday-year" maxlength="4" dir="ltr" data-birth-field="birthYear" ${birthFieldAttributes('birthYear')} value="${esc(state.birthYear)}" placeholder="مثال: 1990"></label><label class="city-field"><span>مدينة الميلاد داخل مصر</span><select data-birth-field="birthCity"><option value="">اختر المدينة</option>${cityOptions(state.birthCity)}</select></label></div><label class="time-known"><input type="checkbox" data-birth-time-known ${state.birthTimeKnown ? 'checked' : ''}><span><b>وقت الميلاد معروف</b><small>اختياري لحساب الطالع والبيوت</small></span></label>${state.birthTimeKnown ? `<div class="time-fields"><label><span>الساعة بنظام ٢٤</span><select data-birth-field="birthHour">${zeroOptions(24,state.birthHour)}</select></label><label><span>الدقيقة</span><select data-birth-field="birthMinute">${zeroOptions(60,state.birthMinute)}</select></label><div class="time-help"><b>لماذا الوقت مهم؟</b><span>الطالع والبيوت يتغيران مع دوران السماء.</span></div></div>` : ''}<div class="actions"><button class="btn primary" data-calculate-birth>احسب خريطة الميلاد</button><button class="btn" data-clear="natal">مسح</button></div>${birthMessage ? `<p class="form-error" id="birth-date-error" role="alert">${birthMessage}</p>` : ''}</div></section>${chartMarkup}</div>`;
}
function zodiac() {
  const full = state.detailMode === 'full';
  const sources = ZODIAC_SOURCES.map(([institution, title, url], index) => `<a class="source-link" href="${esc(url)}" data-source-url="${esc(url)}" rel="noreferrer"><span>${num(index + 1)}</span><div><strong>${institution}</strong><small>${title}</small></div><b aria-hidden="true">↗</b></a>`).join('');
  const selectedTool = selectedZodiacPanel(state.zodiacMode, {
    heritage: heritageZodiacTool,
    natal: natalZodiacTool,
  })();
  const boundaries = `<section class="zodiac-boundaries"><article><span>✓</span><div><small>دقيق حسابيًا</small><h3>المواضع والدرجات</h3><p>تُحسب محليًا وفق التوقيت التاريخي للمدينة.</p></div></article><article><span>≈</span><div><small>تفسير رمزي</small><h3>ليس اختبار شخصية</h3><p>الربط بين المواضع والسمات غير مثبت علميًا.</p></div></article><article><span>!</span><div><small>لا ادعاء غيب</small><h3>لا حظ ولا مستقبل</h3><p>لا يقدم التطبيق توقعات للمال أو الزواج أو الصحة أو المصير.</p></div></article></section>`;
  return `<section class="zodiac-hero natal-hero compact-hero"><div><span class="eyebrow">حساب واضح · تفسير رمزي بحدود معلنة</span><h2>الأبراج وخريطة الميلاد</h2><p>ملخص مريح أولًا، وكل التفاصيل الفلكية والتراثية محفوظة عند طلبها.</p><div class="hero-methods"><span>☉ مواضع فلكية</span><span>⌖ توقيت ومكان</span><span>◎ البيوت الكاملة</span></div></div><div class="zodiac-orbit"><span>✦</span>${ZODIAC_DETAILS.map((_, index) => `<i style="--i:${index}"></i>`).join('')}</div></section>
  ${zodiacModeSwitcherMarkup(state.zodiacMode)}
  <div class="view-mode"><div><b>طريقة العرض</b><small>${full ? 'كل الأقسام مفتوحة' : 'الملخص أولًا والتفاصيل عند الطلب'}</small></div><button class="btn ${full ? '' : 'primary'}" data-detail-mode>${full ? 'العودة للعرض المبسط' : 'عرض كامل'}</button></div>
  ${selectedTool}
  <div class="detail-accordion supporting-details">${progressivePanel('دليل الأبراج','الأبراج الاثنا عشر',`<div class="zodiac-guide">${ZODIAC_DETAILS.map(zodiacGuideCard).join('')}</div>`,full)}${progressivePanel('حدود القراءة','ما هو حسابي وما هو رمزي',boundaries,full)}${progressivePanel('المصادر والمنهج','مراجع الحساب والسياق',`<div class="source-list">${sources}</div>`,full)}</div>`;
}
function reference() {
  const full = state.detailMode === 'full';
  const abjad = `<div class="reference-values">${Object.entries(ABJAD).map(([l,v])=>`<span class="letter">${l} = ${num(v)}</span>`).join(' ')}</div>`;
  const elements = Object.entries(ELEMENTS).map(([e,l])=>`<p><b>${elementDisplayName(e)}</b>: ${l.join(' ')}</p>`).join('');
  const planets = PLANETS.map((p,i)=>`<p>${num(i+1)}. ${p}</p>`).join('');
  const signs = ZODIAC.map(([z,e],i)=>`<p>${num(i+1)}. ${z} · ${e}</p>`).join('');
  return `<section class="reference-intro card"><div><span class="eyebrow">مرجع قابل للمراجعة</span><h2>المرجع والمنهج</h2><p class="muted">اختر الباب الذي تحتاجه؛ كل التفاصيل الحسابية محفوظة دون إغراق الصفحة.</p></div><span class="tag">منهج معلن</span></section><div class="detail-accordion reference-accordion">${progressivePanel('الأبجد المشرقي','قيم الحروف المعتمدة',abjad,full)}${progressivePanel('الطبائع','توزيع الحروف',elements,full)}${progressivePanel('الكواكب','الترتيب المستخدم',planets,full)}${progressivePanel('البروج','الترتيب والعناصر',signs,full)}</div><section class="card reference-tools"><div><small>تطوير</small><b>إبراهيم بن صلاح الدين</b><span>حساب فلكي محلي · البيوت الكاملة · الباقي من ١٢</span></div><div class="actions"><button class="btn primary" data-run-tests>تشغيل الاختبارات الذاتية</button><button class="btn" data-reset-storage>مسح البيانات المحفوظة</button></div></section>`;
}
function render() {
  const previousMode = lastDetailMode;
  const nextMode = state.detailMode;
  const previouslyOpen = [...app.querySelectorAll('details[data-disclosure][open]')].map(item => item.dataset.disclosure);
  const keysToRestore = restoredDisclosures({ previousMode, nextMode, openKeys: previouslyOpen });
  lastDetailMode = nextMode;
  const sectionViews = { names, calculator, zodiac, reference }; const result = analyze(state.text); const view = sectionViews[state.section] || names;
  app.innerHTML = `<div class="shell"><header class="top"><div class="brand"><img src="./icons/icon-192.png" alt=""><div class="brand-copy"><div class="brand-title-row"><h1>أطلس الحروف</h1><span class="developer-mark"><i>تطوير</i><b>إبراهيم بن صلاح الدين</b></span></div><small>الأسماء وحساب الحروف · قراءة تراثية موثّقة</small></div></div><button class="sum-chip" data-go-calculator><span>المجموع الحالي</span>${num(result.total)}</button></header><nav class="nav">${[['names','الأسماء'],['calculator','الحاسبة'],['zodiac','الأبراج'],['reference','المرجع']].map(([id,label])=>`<button class="${state.section===id?'active':''}" data-nav="${id}">${label}</button>`).join('')}</nav>${view()}<footer class="app-footer"><span>أطلس الحروف</span><b>تطوير إبراهيم بن صلاح الدين</b><small>حسابات محلية · لا تنبؤات غيبية</small></footer></div>`;
  keysToRestore.forEach(key => { const item = [...app.querySelectorAll('details[data-disclosure]')].find(detail => detail.dataset.disclosure === key); if (item) item.open = true; });
  attach();
  if (pendingFocusSelector) {
    const field = document.querySelector(pendingFocusSelector);
    pendingFocusSelector = '';
    field?.focus();
  }
}
function parseArabicNumber(raw) { return Number(String(raw).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g,'')) || 0; }
function commitText(value) { state.text = value; persist(); }
function maybeFocusBirthDateError() {
  const result = parseBirthDate(state.birthDay, state.birthMonth, state.birthYear);
  if (result.focusField) pendingFocusSelector = `[data-birth-field="${result.focusField}"]`;
}
let redrawTimer;
function redrawKeepingFocus(selector, cursor) {
  clearTimeout(redrawTimer);
  redrawTimer = setTimeout(() => {
    render();
    const field = document.querySelector(selector);
    if (field) { field.focus(); if (cursor !== null) { try { field.setSelectionRange?.(cursor, cursor); } catch {} } }
  }, 260);
}
function attach() { document.querySelectorAll('[data-nav]').forEach(e=>e.onclick=()=>setSection(e.dataset.nav)); document.querySelector('[data-go-calculator]')?.addEventListener('click',()=>setSection('calculator'));
  document.querySelectorAll('[data-names-mode]').forEach(button=>button.addEventListener('click',()=>{state.namesMode=button.dataset.namesMode;state.suggestionLimit=6;persist();render();}));
  document.querySelectorAll('[data-zodiac-mode]').forEach(button=>button.addEventListener('click',()=>{Object.assign(state,selectZodiacMode(state,button.dataset.zodiacMode));persist();render();}));
  document.querySelector('[data-detail-mode]')?.addEventListener('click',()=>{state.detailMode=state.detailMode==='simple'?'full':'simple';persist();render();});
  document.querySelector('[data-more-names]')?.addEventListener('click',event=>{event.stopImmediatePropagation();state.suggestionLimit=500;persist();render();});
  document.querySelector('[data-calculate-heritage]')?.addEventListener('click',()=>{persist();render();});
  document.querySelector('#text')?.addEventListener('input', e=>{ const cursor=e.target.selectionStart; commitText(e.target.value); redrawKeepingFocus('#text', cursor); }); document.querySelector('#target')?.addEventListener('input', e=>{const cursor=e.target.selectionStart;state.target=e.target.value;persist();redrawKeepingFocus('#target',cursor);}); document.querySelectorAll('[data-example]').forEach(e=>e.onclick=()=>{commitText(e.dataset.example);render();});
  document.querySelectorAll('[data-field]').forEach(field=>{const update=event=>{const input=event.currentTarget;const cursor=typeof input.selectionStart==='number'?input.selectionStart:null;const selector=`[data-field="${input.dataset.field}"]`;state[input.dataset.field]=input.value;persist();if(input.tagName==='SELECT'||input.type==='date')render();else redrawKeepingFocus(selector,cursor);};field.addEventListener('input',update);field.addEventListener('change',update);});
  document.querySelectorAll('select[data-birth-field]').forEach(field=>field.addEventListener('change',event=>{const changedField=event.currentTarget.dataset.birthField;state[changedField]=event.currentTarget.value;if(changedField==='birthDay'||changedField==='birthMonth')maybeFocusBirthDateError();persist();render();}));
  document.querySelector('input[data-birth-field="birthYear"]')?.addEventListener('input',event=>{const input=event.currentTarget;input.value=westernDigits(input.value).replace(/\D/g,'').slice(0,4);state.birthYear=input.value;persist();});
  document.querySelector('input[data-birth-field="birthYear"]')?.addEventListener('change',()=>{maybeFocusBirthDateError();persist();render();});
  document.querySelector('[data-calculate-birth]')?.addEventListener('click',()=>{document.querySelector('input[data-birth-field="birthYear"]')?.blur();maybeFocusBirthDateError();render();});
  document.querySelector('[data-birth-time-known]')?.addEventListener('change',event=>{state.birthTimeKnown=event.currentTarget.checked;persist();render();});
  document.querySelectorAll('[data-source-url]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openExternalSource(event.currentTarget.dataset.sourceUrl);}));
  document.querySelectorAll('[data-send]').forEach(e=>e.onclick=()=>{state.nameA=state.text;state.namesMode='comparison';setSection('names');}); document.querySelectorAll('[data-select-name]').forEach(e=>e.addEventListener('click',()=>{state.desiredBabyName=e.dataset.selectName;persist();render();document.querySelector('[data-field="desiredBabyName"]')?.scrollIntoView({behavior:'smooth',block:'center'});}));
  document.querySelectorAll('[data-clear]').forEach(e=>e.onclick=()=>{if(e.dataset.clear==='calculator'){state.text='';state.target='';}if(e.dataset.clear==='names'){state.nameA='';state.nameB='';state.motherA='';state.motherB='';}if(e.dataset.clear==='parents'){state.father='';state.mother='';state.desiredBabyName='';state.maleSearch='';state.femaleSearch='';state.suggestionLimit=6;}if(e.dataset.clear==='heritage-zodiac')Object.assign(state,applyZodiacToolClear(state,'heritage'));if(e.dataset.clear==='natal')Object.assign(state,applyZodiacToolClear(state,'natal'));if(e.dataset.clear==='zodiac'){Object.assign(state,applyZodiacToolClear(state,'heritage'));Object.assign(state,applyZodiacToolClear(state,'natal'));}persist();render();toast('تم المسح');}); document.querySelector('[data-run-tests]')?.addEventListener('click',()=>{const result=runReferenceChecks({analyze,zodiacFromNumber,zodiacFromDate,parseBirthDate});toast(result.ok?`نجحت جميع الاختبارات المرجعية (${num(result.passed)}/${num(result.checks)})`:`فشل اختبار ذاتي (${num(result.passed)}/${num(result.checks)})`);}); document.querySelector('[data-reset-storage]')?.addEventListener('click',()=>{try{localStorage.removeItem('hisab-jomal-state');}catch{}location.reload();}); }
render();
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isTauri()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
