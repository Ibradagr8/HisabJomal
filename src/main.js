import './styles.css';
import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ABJAD, ELEMENTS, PLANETS, ZODIAC, analyze, compareCelestial, compareElements, compareProfiles, formatNumber, profile } from './engine.js';
import { femaleNames, maleNames } from './data.js';
import { assessBabyName, babyVerdict } from './names-engine.js';
import { BIRTH_CITIES, HOUSE_MEANINGS, calculateNatalChart, signReading } from './natal-chart.js';
import { copyText } from './platform.js';
import { createState, parseStoredState, STATE_KEYS } from './state.js';
import { ARABIC_MONTHS, ELEMENT_GUIDE, QUALITY_GUIDE, ZODIAC_DETAILS, ZODIAC_SOURCES, isAllowedSourceUrl, parseBirthDate, westernDigits, zodiacFromDate, zodiacFromNumber } from './zodiac.js';

function readSharedState() {
  try {
    const encoded = new URLSearchParams(location.search).get('state');
    return encoded ? JSON.parse(decodeURIComponent(escape(atob(encoded))) || '{}') : {};
  } catch { return {}; }
}
let stored = {};
try { stored = parseStoredState(localStorage.getItem('hisab-jomal-state')); } catch { stored = {}; }
const state = createState(stored, readSharedState());
const app = document.querySelector('#app');
const arabicDate = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long' }).format(new Date());

function persist() { try { localStorage.setItem('hisab-jomal-state', JSON.stringify(state)); return true; } catch { return false; } }
function esc(s = '') { return String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function toast(message) { document.querySelector('.toast')?.remove(); const e = document.createElement('div'); e.className = 'toast'; e.textContent = message; document.body.append(e); setTimeout(() => e.remove(), 2200); }
async function copy(text) { toast(await copyText(text) ? 'تم النسخ' : 'تعذّر النسخ'); }
async function openExternalSource(url) {
  if (!isAllowedSourceUrl(url)) return toast('رابط المصدر غير معتمد');
  try {
    if (isTauri()) await openUrl(url);
    else {
      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      if (!popup) throw new Error('popup blocked');
    }
  } catch {
    await copy(url);
    toast('تعذّر فتح المتصفح؛ تم نسخ رابط المصدر');
  }
}
function shareLink() {
  const shared = Object.fromEntries(STATE_KEYS.map(key => [key, state[key]]));
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shared))));
  return `${location.href.split('?')[0]}?state=${encodeURIComponent(encoded)}`;
}
function copyShareLink() { copy(shareLink()); }
function copyNameComparison() {
  const a = profile(`${state.nameA} ${state.motherA}`), b = profile(`${state.nameB} ${state.motherB}`);
  if (!state.nameA.trim() || !state.nameB.trim() || !a.mod9 || !b.mod9) return toast('أدخل الاسمين أولًا');
  const firstRole = state.role, secondRole = firstRole === 'طالب' ? 'مطلوب' : 'طالب';
  const comparison = compareProfiles(a, b, firstRole), elements = compareElements(a, b), celestial = compareCelestial(a, b);
  const firstWins = comparison.winnerIndex === 0;
  const winner = firstWins ? state.nameA : state.nameB, loser = firstWins ? state.nameB : state.nameA;
  copy([`مقارنة الأسماء`,`${state.nameA} (${firstRole}): المجموع ${num(a.total)} · الباقي ${num(a.mod9)} · الطبع ${a.leaders.join(' / ') || '—'}`,`${state.nameB} (${secondRole}): المجموع ${num(b.total)} · الباقي ${num(b.mod9)} · الطبع ${b.leaders.join(' / ') || '—'}`,`${winner} غالب — ${loser} مغلوب`,comparison.reason,`${elements.kind}: ${elements.text}`,celestial.planet,celestial.zodiac].join('\n'));
}
function exportCard(title, lines, filename) {
  const canvas = document.createElement('canvas'); const width = 1200; const height = Math.max(630, 260 + lines.length * 68);
  canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f6f3ea'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#123c35'; ctx.fillRect(0, 0, width, 18);
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillStyle = '#123c35'; ctx.font = '700 50px Arial'; ctx.fillText(title, width - 75, 110);
  ctx.fillStyle = '#6a756e'; ctx.font = '28px Arial'; ctx.fillText(`أطلس الحروف · تطوير إبراهيم بن صلاح الدين · ${arabicDate}`, width - 75, 158);
  ctx.strokeStyle = '#d5ddd7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(75, 190); ctx.lineTo(width - 75, 190); ctx.stroke();
  ctx.fillStyle = '#17322e'; ctx.font = '34px Arial'; lines.forEach((line, i) => ctx.fillText(line, width - 75, 258 + i * 62));
  canvas.toBlob(blob => { if (!blob) return toast('تعذّر إنشاء الصورة'); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${filename}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('تم تصدير البطاقة كصورة'); }, 'image/png');
}
function setSection(id) { state.section = id; persist(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function num(n) { return formatNumber(n); }
function profileCard(p) { const total = p.count || 1; return `<div class="metric"><span>المجموع</span><b>${num(p.total)}</b></div><div class="metric"><span>الباقي ÷٩</span><b>${p.mod9 ? num(p.mod9) : '—'}</b></div><div class="metric"><span>الطبع</span><b>${p.leaders.length ? p.leaders.join(' / ') : '—'}</b></div><div class="metric"><span>الكوكب</span><b>${p.planetLeaders.length ? p.planetLeaders.join(' / ') : '—'}</b></div><div class="metric"><span>البرج</span><b>${p.zodiac ? `${p.zodiac[0]} · ${p.zodiac[1]}` : '—'}</b></div><div class="element-bars">${Object.entries(p.elements).map(([name, count]) => `<div class="element-row"><span>${name}</span><div class="bar"><i style="width:${count / total * 100}%"></i></div><span>${num(count)}</span></div>`).join('')}</div>`; }
function calculator() {
  const result = analyze(state.text); const target = parseArabicNumber(state.target); const percent = target > 0 ? Math.min(100, result.total / target * 100) : 0;
  const wordDetails = result.words.length ? result.words.map(w => `<details class="word"><summary><b>${esc(w.word)}</b><span>${num(w.total)}</span></summary><div class="letters">${w.letters.map(l => `<span class="letter">${l.raw}${l.raw !== l.normalized ? ` ← ${l.normalized}` : ''} = ${num(l.value)}</span>`).join('')}</div></details>`).join('') : '<p class="muted">ستظهر الكلمات والحروف المحتسبة هنا.</p>';
  const history = state.history.length ? state.history.map((item,i) => `<div class="metric"><button class="btn history" data-history="${i}">${esc(item.text)}</button><b>${num(item.total)}</b></div>`).join('') : '<p class="muted">آخر خمسة إدخالات تظهر هنا.</p>';
  return `<div class="grid calculator-grid"><main><section class="card calculator-main"><div class="section-heading"><div><h2>الحاسبة</h2><p class="muted">اكتب أي نص عربي، وستظهر النتيجة فورًا وفق حساب الجمل المشرقي.</p></div><span class="tag">حساب الجمل المشرقي</span></div><textarea id="text" rows="4" placeholder="اكتب العبارة هنا…">${esc(state.text)}</textarea><div class="chips">${['بسم الله الرحمن الرحيم','محمد','داود','جالوت','لا حول ولا قوة إلا بالله'].map(x => `<button class="chip" data-example="${x}">${x}</button>`).join('')}</div><div class="split calculator-target"><div><label class="muted">الرقم المستهدف (اختياري)</label><input id="target" inputmode="numeric" value="${esc(state.target)}" placeholder="مثال: ٧٨٦"></div><div class="actions"><button class="btn" data-send="names">إرسال إلى الأسماء</button></div></div>${target > 0 ? `<div class="result"><div class="metric"><span>التقدم نحو الهدف</span><b>${num(Math.round(percent))}%</b></div><div class="bar"><i style="width:${percent}%"></i></div>${result.total === target ? '<b>تطابق تام مع الرقم المستهدف</b>' : ''}</div>` : ''}<div class="actions streamlined-actions"><button class="btn primary" data-copy-result>نسخ النتيجة</button><details class="action-menu"><summary class="btn">المزيد</summary><div><button class="btn" data-export-calculator>تصدير بطاقة</button><button class="btn" data-copy-link>نسخ الرابط</button><button class="btn" data-clear="calculator">مسح</button></div></details></div></section><details class="card progressive-section" ${state.detailMode === 'full' ? 'open' : ''}><summary><span><small>التفاصيل</small><b>تفصيل الكلمات والحروف</b></span><i>⌄</i></summary><div class="progressive-content">${wordDetails}</div></details></main><aside><section class="card total-card"><span class="muted">المجموع الحالي</span><div class="hero-number">${num(result.total)}</div><span class="muted">${num(result.count)} حرفًا محتسبًا</span></section><details class="card progressive-section history-panel"><summary><span><small>محفوظ محليًا</small><b>السجل</b></span><i>⌄</i></summary><div class="progressive-content">${history}</div></details></aside></div>`;
}
function comparePersonCard(label, role, name, motherName, p, isWinner) {
  return `<article class="compare-person ${p.count ? '' : 'is-empty'} ${isWinner ? 'is-winner' : ''}"><div class="compare-person-top"><span>${label} · ${role}</span>${isWinner ? '<b class="winner-chip">الغالب</b>' : ''}</div><h3>${esc(name.trim() || 'الاسم غير مُدخل')}</h3>${motherName ? `<small>مع اسم الأم: ${esc(motherName)}</small>` : ''}${p.count ? `<div class="compare-total"><strong>${num(p.total)}</strong><span>المجموع</span></div><div class="person-stats"><span>الباقي ÷٩ <b>${num(p.mod9)}</b></span><span>الطبع <b>${p.leaders.join(' / ') || '—'}</b></span><span>البرج <b>${p.zodiac ? p.zodiac[0] : '—'}</b></span></div>` : '<p>أدخل الاسم لعرض بياناته.</p>'}</article>`;
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
  const result = ready ? `<div class="dominance-verdict" id="comparison-result"><span class="verdict-label">نتيجة الغالب والمغلوب</span><div class="verdict-line"><strong>${esc(winnerName)}</strong><b>غالب</b><i></i><span>${esc(loserName)}</span><small>مغلوب</small></div><p>${comparison.reason}</p></div><div class="comparison-insights"><article><span class="insight-number">١</span><div><small>قاعدة الحكم</small><h3>الباقي من القسمة على ٩</h3><p>${comparison.reason}</p></div></article><article><span class="insight-number">٢</span><div><small>علاقة الطبائع</small><h3>${elements.kind}</h3><p>${elements.text}</p></div></article><article><span class="insight-number">٣</span><div><small>المراسلات الحرفية</small><h3>${celestial.planet}</h3><p>${celestial.zodiac}</p></div></article></div><details class="comparison-details"><summary>عرض التفاصيل الحسابية الكاملة للشخصين</summary><div class="split"><div class="profile-detail"><h3>${esc(state.nameA)}</h3>${profileCard(a)}</div><div class="profile-detail"><h3>${esc(state.nameB)}</h3>${profileCard(b)}</div></div></details><div class="method-tags"><span class="tag">حكم الغالب والمغلوب</span><span class="tag">علاقة الطبائع</span><span class="tag">المراسلات الحرفية</span></div>` : '<div class="comparison-placeholder"><b>أدخل الاسمين لإظهار المقارنة الموحّدة</b><span>ستظهر النتيجة والطبائع والمراسلات في لوحة واحدة.</span></div>';
  return `<section class="card comparison-workspace" id="name-comparison"><div class="section-heading"><div><h2>مقارنة الأسماء</h2><p class="muted">لوحة واحدة تجمع الحساب والغالب والمغلوب والتوافق.</p></div><span class="tag">مقارنة موحّدة</span></div><div class="comparison-inputs"><label><span>الشخص الأول</span><input data-field="nameA" value="${esc(state.nameA)}" placeholder="الاسم"><input data-field="motherA" value="${esc(state.motherA)}" placeholder="اسم الأم (اختياري)"></label><label><span>الشخص الثاني</span><input data-field="nameB" value="${esc(state.nameB)}" placeholder="الاسم"><input data-field="motherB" value="${esc(state.motherB)}" placeholder="اسم الأم (اختياري)"></label></div><div class="actions comparison-actions"><label class="chip">دور الشخص الأول <select data-field="role" style="width:auto;padding:0;border:0;background:transparent"><option ${firstRole === 'طالب' ? 'selected' : ''}>طالب</option><option ${firstRole === 'مطلوب' ? 'selected' : ''}>مطلوب</option></select></label><button class="btn" data-name-example>تجربة داود × جالوت</button><button class="btn primary" data-copy-comparison>نسخ المقارنة</button><button class="btn" data-export-names>تصدير بطاقة</button><button class="btn" data-copy-link>نسخ الرابط</button><button class="btn" data-clear="names">مسح</button></div><div class="duel-grid">${comparePersonCard('الشخص الأول', firstRole, state.nameA, state.motherA, a, ready && firstWins)}<div class="versus-mark"><b>↔</b><span>مقارنة</span></div>${comparePersonCard('الشخص الثاني', secondRole, state.nameB, state.motherB, b, ready && !firstWins)}</div>${result}</section>`;
}
function names() {
  const a = profile(`${state.nameA} ${state.motherA}`), b = profile(`${state.nameB} ${state.motherB}`);
  const switcher = `<section class="mode-switch" aria-label="اختيار أداة الأسماء"><button class="${state.namesMode === 'baby' ? 'active' : ''}" data-names-mode="baby"><span>◌</span><b>اقتراح اسم مولود</b><small>حساب الاسم وعرض المقترحات</small></button><button class="${state.namesMode === 'comparison' ? 'active' : ''}" data-names-mode="comparison"><span>↔</span><b>مقارنة الأسماء</b><small>التوافق والغالب والمغلوب</small></button></section>`;
  return `${switcher}${state.namesMode === 'comparison' ? nameComparison(a, b) : suggestions()}`;
}
function suggestedNameList(items, emptyText) {
  if (!items.length) return `<p class="muted empty-state">${emptyText}</p>`;
  return `<div class="name-options">${items.slice(0, state.suggestionLimit).map(x => `<button class="name-option" data-select-name="${esc(x.name)}"><span><strong>${esc(x.name)}</strong><small>${x.p.leaders.join(' / ')} · ${x.relations.map(r => r.relation).join(' + ')}</small></span><em>${babyVerdict(x, x.relations.length)}</em></button>`).join('')}</div>`;
}
function suggestions() {
  const father = profile(state.father), mother = profile(state.mother);
  const parentEntries = [{ label: 'الأب', name: state.father, profile: father }, { label: 'الأم', name: state.mother, profile: mother }].filter(entry => entry.profile.count);
  const desired = profile(state.desiredBabyName);
  const desiredMatch = desired.count && parentEntries.length ? assessBabyName(state.desiredBabyName, parentEntries) : null;
  const list = (names, query) => names
    .filter(name => name !== state.father && name !== state.mother)
    .filter(name => !query.trim() || name.includes(query.trim()))
    .map(name => ({ name, ...assessBabyName(name, parentEntries) }))
    .filter(item => item.compatible)
    .sort((a,b) => b.score-a.score || a.p.count-b.p.count || a.name.localeCompare(b.name, 'ar'));
  const males = parentEntries.length ? list(maleNames, state.maleSearch) : [];
  const females = parentEntries.length ? list(femaleNames, state.femaleSearch) : [];
  const desiredResult = !desired.count
    ? '<div class="baby-empty"><b>اكتب الاسم المرغوب</b><span>سنحسب قيمته ونقارنه بالأب والأم فورًا.</span></div>'
    : !parentEntries.length
      ? `<div class="baby-result neutral"><div><span class="muted">حساب الاسم</span><strong>${num(desired.total)}</strong></div><p>أدخل اسم الأب أو الأم لإظهار درجة التوافق.</p></div>`
      : `<div class="baby-result ${desiredMatch.compatible ? 'compatible' : 'incompatible'}"><div class="baby-result-head"><div><span class="muted">نتيجة ${esc(state.desiredBabyName)}</span><strong>${num(desired.total)}</strong></div><span class="status-badge">${babyVerdict(desiredMatch, parentEntries.length)}</span></div><div class="baby-facts"><span>الطبع <b>${desired.leaders.join(' / ') || '—'}</b></span><span>الكوكب <b>${desired.planetLeaders.join(' / ') || '—'}</b></span><span>البرج <b>${desired.zodiac ? desired.zodiac[0] : '—'}</b></span></div>${desiredMatch.relations.length ? `<div class="relation-chips">${desiredMatch.relations.map(item => `<span>${item.label}: <b>${item.relation}</b></span>`).join('')}</div>` : ''}<p>${desiredMatch.reason}</p></div>`;
  return `<section class="card baby-planner"><div class="section-heading"><div><h2>اقتراح اسم مولود</h2><p class="muted">أدخل بيانات الوالدين ثم جرّب اسمًا مرغوبًا أو اختر من المقترحات.</p></div><span class="tag">اقتراح الأسماء</span></div><p class="notice">اقتراح حسابي تراثي اختياري؛ المعنى الحسن وسنّة التسمية مقدمان، وليس حكمًا شرعيًا.</p><div class="baby-inputs"><label><span>اسم الأب</span><input data-field="father" value="${esc(state.father)}" placeholder="مثال: محمد"></label><label><span>اسم الأم</span><input data-field="mother" value="${esc(state.mother)}" placeholder="مثال: فاطمة"></label><label class="desired-name"><span>الاسم المرغوب للمولود</span><input data-field="desiredBabyName" value="${esc(state.desiredBabyName)}" placeholder="اكتب الاسم الذي تفكران فيه"></label></div>${desiredResult}<div class="actions"><button class="btn" data-parent-example>تجربة محمد × فاطمة</button><button class="btn" data-clear="parents">مسح بيانات المولود</button></div></section>${parentEntries.length ? `<div class="suggestion-columns"><section class="card suggestion-panel"><div class="suggestion-title"><div><span class="gender-mark male">ذ</span><div><h3>أسماء ذكور مقترحة</h3><span class="muted">${num(males.length)} اسمًا متوافقًا</span></div></div></div><input data-field="maleSearch" value="${esc(state.maleSearch)}" placeholder="ابحث في أسماء الذكور…">${suggestedNameList(males, 'لا توجد أسماء ذكور مطابقة للبحث.')}</section><section class="card suggestion-panel"><div class="suggestion-title"><div><span class="gender-mark female">أ</span><div><h3>أسماء إناث مقترحة</h3><span class="muted">${num(females.length)} اسمًا متوافقًا</span></div></div></div><input data-field="femaleSearch" value="${esc(state.femaleSearch)}" placeholder="ابحث في أسماء الإناث…">${suggestedNameList(females, 'لا توجد أسماء إناث مطابقة للبحث.')}</section></div>${(males.length>state.suggestionLimit || females.length>state.suggestionLimit) ? '<div class="actions centered"><button class="btn" data-more-names>عرض كل الأسماء</button></div>' : ''}` : '<section class="card baby-prompt"><b>ابدأ باسم الأب أو الأم</b><span>بعدها ستظهر هنا قوائم منفصلة للأسماء الذكور والإناث.</span></section>'}`;
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
  return `<article class="zodiac-card"><div class="zodiac-card-top"><span>${sign.symbol}</span><small>${num(index + 1)}</small></div><h3>${sign.name}</h3><p class="zodiac-dates">${sign.dates}</p><div class="zodiac-tags"><span>${sign.element}</span><span>${sign.quality}</span><span>${sign.ruler}</span></div><p>${sign.summary}</p></article>`;
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
  return `<article class="big-three-card"><span class="big-symbol">${item.symbol}</span><small>${label}</small><h3>${degreeLabel(item)}</h3><div class="mini-tags"><span>${item.sign.element}</span><span>${item.sign.quality}</span></div><p>${signReading(item)}</p>${placementUncertainty(chart, item)}<span class="precision-badge">${item.key === 'sun' || item.key === 'moon' ? 'موضع محسوب فلكيًا' : 'محسوب من الوقت والمكان'}</span></article>`;
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
    ? `الشمس والقمر في عنصر ${sun.sign.element}؛ لذلك تميل الإرادة والاستجابة العاطفية إلى العمل باللغة الرمزية نفسها.`
    : `الشمس في عنصر ${sun.sign.element} والقمر في عنصر ${moon.sign.element}؛ وهذا يصف اختلافًا بين طريقة السعي وما يمنح الأمان العاطفي، ويمكن أن يصنع مرونة إذا أُعطي كل جانب مساحته.`;
  return `<div class="synthesis-grid"><article><span>١</span><div><small>الهوية والشعور</small><h3>${sun.sign.name} × ${moon.sign.name}</h3><p>${relation}</p></div></article><article><span>٢</span><div><small>الحضور الخارجي</small><h3>${asc ? `طالع ${asc.sign.name}` : 'الوقت غير معروف'}</h3><p>${asc ? `قد يظهر الشخص للآخرين من خلال أسلوب ${asc.sign.summary.replace(/\.$/,'')}، حتى لو كانت دوافع الشمس والقمر مختلفة.` : 'لم نفترض طالعًا؛ لأن تخمينه من التاريخ وحده يعطي نتيجة مضللة.'}</p></div></article><article><span>٣</span><div><small>النبرة الغالبة</small><h3>عنصر ${dominant[0]}</h3><p>ظهر ${num(dominant[1])} مرات بين المواضع المعروضة. هذا ملخص بنيوي للخريطة وليس حكمًا ثابتًا على الشخصية.</p></div></article>${chart.chartRuler ? `<article><span>٤</span><div><small>حاكم الخريطة</small><h3>${chart.chartRuler}</h3><p>هو الحاكم التقليدي لبرج الطالع، ويُستخدم كمفتاح رمزي لربط موضوعات الخريطة.</p></div></article>` : ''}</div>`;
}
function progressivePanel(title, kicker, content, open = false) {
  return `<details class="card progressive-section" ${open ? 'open' : ''}><summary><span><small>${kicker}</small><b>${title}</b></span><i>⌄</i></summary><div class="progressive-content">${content}</div></details>`;
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
  const planets = `<p class="muted">الدرجة والبرج بيانات حسابية؛ المعنى النصي تفسير رمزي.</p><div class="table-wrap"><table class="planet-table"><thead><tr><th>الجرم</th><th>الموضع</th><th>البيت</th><th>الحركة</th></tr></thead><tbody>${planetsTable}</tbody></table></div><div class="planet-readings">${secondary.map(item=>`<details><summary><span>${item.symbol}</span><div><small>${item.role}</small><b>${item.name} في ${item.sign.name}${item.house ? ` · البيت ${num(item.house)}` : ''}</b></div></summary><p>${signReading(item)}</p>${item.house ? `<p class="house-note"><b>مجال الظهور الرمزي:</b> ${HOUSE_MEANINGS[item.house-1]}</p>` : ''}</details>`).join('')}</div>`;
  return `<section class="natal-result"><div class="result-ribbon"><div><span class="eyebrow">ملخص الخريطة</span><h2>خريطة الميلاد الرمزية</h2><p>${esc(chart.city.label)} · ${chart.date.toLocaleString('ar-EG',{dateStyle:'long',timeStyle:'short',timeZone:chart.city.zone})}</p></div><div class="accuracy-stack"><span class="precision-badge">دقيق حسابيًا</span><small>${chart.accuracy}</small></div></div>
  <div class="big-three"><div class="section-heading"><div><span class="eyebrow">الثلاثة الكبار</span><h2>الشمس والقمر والطالع</h2></div><span class="tag">البروج الاستوائية · البيوت الكاملة</span></div><div class="big-three-grid">${bigThreeCard(sun,'البرج الشمسي',chart)}${bigThreeCard(moon,'البرج القمري',chart)}${bigThreeCard(asc,'الطالع',chart)}</div></div>
  <div class="chart-layout"><section class="card wheel-card"><div class="section-heading"><div><h2>عجلة الخريطة</h2><p class="muted">مواضع الأجرام والزوايا الرئيسية وقت الميلاد.</p></div></div>${natalWheel(chart)}</section><section class="card balance-card"><h2>بصمة الخريطة</h2><h3>العناصر</h3>${balanceBars(chart.elements)}<h3>الكيفيات</h3>${balanceBars(chart.qualities)}<div class="moon-phase"><span>☾</span><div><small>طور القمر</small><b>${chart.moonPhase.name}</b><p>إضاءة تقريبية ${num(Math.round(chart.moonPhase.illumination*100))}%</p></div></div></section></div>
  <div class="detail-accordion">${progressivePanel('القراءة المركبة','الخلاصة الرمزية',synthesis,full)}${progressivePanel('المحاور الأربعة','الطالع والغارب ووسط السماء',angleContent,full)}${progressivePanel('الكواكب السبعة','المواضع والحركة والتفسير',planets,full)}${progressivePanel('الزوايا الرئيسية','العلاقات بين الكواكب',`<div class="aspects-grid">${aspects}</div>`,full)}${chart.houses.length ? progressivePanel('البيوت الاثنا عشر','نظام البيوت الكاملة',`<div class="houses-grid">${houses}</div>`,full) : ''}</div>
  <section class="interpretation-boundary"><b>طريقة قراءة النتيجة</b><p>المواضع والدرجات محسوبة فلكيًا. أما ربطها بالشخصية فهو تقليد رمزي للتأمل والترفيه، وليس اختبارًا نفسيًا أو تنبؤًا بالمستقبل.</p></section></section>`;
}
function legacyZodiac() {
  const heritage = heritageZodiacResult();
  const birth = parseBirthDate(state.birthDay, state.birthMonth, state.birthYear);
  const solar = birth.sign;
  const sources = ZODIAC_SOURCES.map(([institution, title, url], index) => `<a class="source-link" href="${esc(url)}" data-source-url="${esc(url)}" rel="noreferrer"><span>${num(index + 1)}</span><div><strong>${institution}</strong><small>${title}</small></div><b aria-hidden="true">↗</b></a>`).join('');
  const result = heritage.sign ? `<section class="zodiac-result"><div class="zodiac-emblem"><span>${heritage.sign.symbol}</span><small>الباقي ${num(heritage.remainder)} من ١٢</small></div><div class="zodiac-reading"><span class="eyebrow">البرج الحرفي التراثي</span><h2>${heritage.sign.name}</h2><p>${heritage.sign.summary}</p><div class="zodiac-facts"><span>العنصر<b>${heritage.sign.element}</b></span><span>الكيفية<b>${heritage.sign.quality}</b></span><span>الكوكب المنسوب تراثيًا<b>${heritage.sign.ruler}</b></span></div><div class="calculation-strip"><span>${esc(state.zodiacName)} <b>${num(heritage.person.total)}</b></span><i>+</i><span>${state.zodiacMother.trim() ? esc(state.zodiacMother) : 'اسم الأم غير مُدخل'} <b>${state.zodiacMother.trim() ? num(heritage.mother.total) : '—'}</b></span><i>=</i><span>المجموع <b>${num(heritage.total)}</b></span></div>${!state.zodiacMother.trim() ? '<p class="partial-note">هذه نتيجة جزئية من الاسم وحده؛ النص التراثي الموثّق يذكر جمع الاسم مع اسم الأم.</p>' : ''}<div class="trait-columns"><div><h3>رموز إيجابية محتملة</h3>${traitList(heritage.sign.strengths)}</div><div><h3>مساحات للتوازن</h3>${traitList(heritage.sign.balance)}</div></div><p class="reading-note">هذه قراءة رمزية حديثة مبنية على عنصر البرج وكيفيته، وليست تشخيصًا علميًا للشخصية.</p><div class="actions"><button class="btn primary" data-copy-zodiac>نسخ النتيجة</button><button class="btn" data-copy-link>نسخ الرابط</button><button class="btn" data-clear="zodiac">مسح</button></div></div></section>` : '<section class="zodiac-empty"><span>١٢</span><div><b>اكتب الاسم لتظهر القراءة الحرفية</b><p>ويُفضّل إضافة اسم الأم لتطبيق الطريقة كما وردت في المصدر التراثي.</p></div></section>';
  const heritageDisplay = heritageResult.replace('الموجودة بالأعلى', 'الموجودة بعد هذا القسم');
  const birthMessage = birth.status === 'incomplete' ? 'أكمل اليوم والشهر والسنة بأربعة أرقام.'
    : birth.status === 'future' ? 'تاريخ الميلاد لا يمكن أن يكون في المستقبل.'
      : birth.status === 'invalid' ? 'التاريخ غير صحيح؛ راجع اليوم والشهر والسنة.'
        : 'أدخل تاريخ الميلاد لعرض البرج الشمسي المتداول بجانب الحساب الحرفي.';
  const solarResult = solar ? `<article class="solar-result"><span class="solar-symbol">${solar.symbol}</span><div><small>برج تاريخ الميلاد المتداول</small><h3>${solar.name}</h3><p>${solar.dates}</p></div><p>${heritage.sign ? (heritage.sign.name === solar.name ? 'اتفقت الطريقتان في الاسم فقط؛ لا يمنح ذلك دلالة إضافية.' : 'الاختلاف طبيعي: الحساب الحرفي وتاريخ الميلاد طريقتان مختلفتان.') : 'هذا تصنيف شمسي متداول بحسب تاريخ الميلاد، وليس طالعًا فلكيًا.'}</p></article>` : `<article class="solar-placeholder ${birth.status !== 'empty' ? 'has-error' : ''}"><b>المقارنة بالتاريخ اختيارية</b><span>${birthMessage}</span></article>`;
  return `<section class="zodiac-hero"><div><span class="eyebrow">معرفة تراثية بحدود واضحة</span><h2>الأبراج بين الحروف والتاريخ</h2><p>حاسبة موثّقة لطريقة الاسم واسم الأم، ودليل بصري للأبراج الاثني عشر دون تنبؤات أو ادعاءات غيبية.</p></div><div class="zodiac-orbit"><span>١٢</span>${ZODIAC_DETAILS.map((_, index) => `<i style="--i:${index}"></i>`).join('')}</div></section>
  <section class="card zodiac-calculator"><div class="section-heading"><div><h2>احسب البرج الحرفي</h2><p class="muted">نجمع قيمة الاسم واسم الأم بالأبجد المشرقي، ثم نأخذ الباقي من القسمة على ١٢.</p></div><span class="tag">BURJ-NAME-MOD12-1.0</span></div><div class="zodiac-inputs"><label><span>اسم الشخص</span><input data-field="zodiacName" value="${esc(state.zodiacName)}" placeholder="مثال: محمد"></label><label><span>اسم الأم</span><input data-field="zodiacMother" value="${esc(state.zodiacMother)}" placeholder="مثال: فاطمة"></label></div><div class="birth-date-card"><div class="birth-date-heading"><div><b>تاريخ الميلاد</b><span>اختياري · بالترتيب الواضح: يوم، شهر، سنة</span></div><small>لا يتم تحديث الصفحة أثناء كتابة السنة</small></div><div class="birth-date-fields"><label><span>اليوم</span><select data-birth-field="birthDay"><option value="">اختر اليوم</option>${dateOptions(31, state.birthDay)}</select></label><label><span>الشهر</span><select data-birth-field="birthMonth"><option value="">اختر الشهر</option>${dateOptions(12, state.birthMonth, ARABIC_MONTHS)}</select></label><label><span>السنة</span><input type="text" inputmode="numeric" autocomplete="bday-year" maxlength="4" dir="ltr" data-birth-field="birthYear" value="${esc(state.birthYear)}" placeholder="مثال: 1990"></label><button class="btn birth-calculate" data-calculate-birth>عرض برج الميلاد</button></div></div><div class="actions"><button class="btn" data-zodiac-example>تجربة محمد بن فاطمة</button></div>${result}${solarResult}</section>
  <section class="card zodiac-method"><div class="section-heading"><div><span class="eyebrow">كيف تم الحساب؟</span><h2>طريقة قابلة للمراجعة خطوة بخطوة</h2></div><span class="tag">HERITAGE · NOT SCIENCE</span></div><div class="method-steps"><article><span>١</span><h3>تحويل الحروف</h3><p>تُحوّل حروف الاسم واسم الأم إلى قيم الأبجد المشرقي.</p></article><article><span>٢</span><h3>جمع القيم</h3><p>يُجمع الاسمان كما يذكر المخطوط المنشور في مكتبة قطر الرقمية.</p></article><article><span>٣</span><h3>الباقي من ١٢</h3><p>١ للحمل، ثم بالترتيب حتى ١٢ للحوت؛ وهو ما تؤكده الدراسة الأكاديمية.</p></article></div><div class="element-quality-grid">${Object.entries(ELEMENT_GUIDE).map(([element, guide]) => `<article><b>${element}</b><span>${guide.label}</span><p>${guide.text}</p></article>`).join('')}${Object.entries(QUALITY_GUIDE).map(([quality, text]) => `<article><b>${quality}</b><span>كيفية تراثية</span><p>${text}</p></article>`).join('')}</div></section>
  <section class="zodiac-boundaries"><article><span>✓</span><div><small>موثّق تاريخيًا</small><h3>طريقة الأسماء والباقي ١–١٢</h3><p>وجودها في مخطوط ودراسة أكاديمية يثبت تاريخ الفكرة وطريقة حسابها.</p></div></article><article><span>≈</span><div><small>غير مثبت علميًا</small><h3>ليست اختبار شخصية</h3><p>علم النفس لا يعد الأبراج وسيلة مثبتة لقياس الشخصية؛ وقد فشلت اختبارات مضبوطة في إثبات قدرتها الوصفية.</p></div></article><article><span>!</span><div><small>تنبيه ديني</small><h3>لا تنبؤ ولا ادعاء غيب</h3><p>لا يقدم التطبيق حظًا أو مستقبلًا أو أحكامًا مصيرية، اتساقًا مع تحذير دار الإفتاء المصرية من الاعتقاد بالطالع.</p></div></article></section>
  <section class="card"><div class="section-heading"><div><span class="eyebrow">الدليل الكامل</span><h2>الأبراج الاثنا عشر</h2><p class="muted">العناصر والكيفيات والكواكب هنا مراسلات تاريخية؛ والعبارات الشخصية قراءة رمزية مختصرة.</p></div></div><div class="zodiac-guide">${ZODIAC_DETAILS.map(zodiacGuideCard).join('')}</div></section>
  <section class="card sources-section"><div class="section-heading"><div><span class="eyebrow">المراجع</span><h2>مصادر أصلية وأكاديمية وعلمية</h2><p class="muted">تفتح الروابط المادة الأصلية حتى تستطيع مراجعة المنهج وحدوده بنفسك.</p></div><span class="tag">SOURCES-2.0</span></div><div class="source-list">${sources}</div></section>`;
}
function zodiac() {
  const heritage = heritageZodiacResult();
  const birth = parseBirthDate(state.birthDay, state.birthMonth, state.birthYear);
  const sources = ZODIAC_SOURCES.map(([institution, title, url], index) => `<a class="source-link" href="${esc(url)}" data-source-url="${esc(url)}" rel="noreferrer"><span>${num(index + 1)}</span><div><strong>${institution}</strong><small>${title}</small></div><b aria-hidden="true">↗</b></a>`).join('');
  const heritageResult = heritage.sign ? `<section class="zodiac-result"><div class="zodiac-emblem"><span>${heritage.sign.symbol}</span><small>الباقي ${num(heritage.remainder)} من ١٢</small></div><div class="zodiac-reading"><span class="eyebrow">البرج الحرفي التراثي</span><h2>${heritage.sign.name}</h2><p>${heritage.sign.summary}</p><div class="zodiac-facts"><span>العنصر<b>${heritage.sign.element}</b></span><span>الكيفية<b>${heritage.sign.quality}</b></span><span>الكوكب المنسوب تراثيًا<b>${heritage.sign.ruler}</b></span></div><div class="calculation-strip"><span>${esc(state.zodiacName)} <b>${num(heritage.person.total)}</b></span><i>+</i><span>${state.zodiacMother.trim() ? esc(state.zodiacMother) : 'اسم الأم غير مُدخل'} <b>${state.zodiacMother.trim() ? num(heritage.mother.total) : '—'}</b></span><i>=</i><span>المجموع <b>${num(heritage.total)}</b></span></div>${!state.zodiacMother.trim() ? '<p class="partial-note">هذه نتيجة جزئية من الاسم وحده؛ الطريقة التراثية الموثّقة تذكر جمع الاسم مع اسم الأم.</p>' : ''}<div class="trait-columns"><div><h3>رموز إيجابية محتملة</h3>${traitList(heritage.sign.strengths)}</div><div><h3>مساحات للتوازن</h3>${traitList(heritage.sign.balance)}</div></div><p class="reading-note">هذا الحساب الحرفي منفصل تمامًا عن الشمس والقمر والطالع، وليس تشخيصًا للشخصية.</p><div class="actions"><button class="btn primary" data-copy-zodiac>نسخ النتيجة</button><button class="btn" data-clear="heritage-zodiac">مسح الحساب الحرفي</button></div></div></section>` : '<section class="zodiac-empty"><span>١٢</span><div><b>اكتب الاسم لتظهر القراءة الحرفية</b><p>هذه الطريقة منفصلة عن خريطة الميلاد الموجودة بالأعلى.</p></div></section>';
  const heritageDisplay = heritageResult.replace('الموجودة بالأعلى', 'الموجودة بعد هذا القسم');
  const birthMessage = birth.status === 'incomplete' ? 'أكمل اليوم والشهر والسنة بأربعة أرقام.'
    : birth.status === 'future' ? 'تاريخ الميلاد لا يمكن أن يكون في المستقبل.'
      : birth.status === 'invalid' ? 'التاريخ غير صحيح؛ راجع اليوم والشهر والسنة.'
        : !state.birthCity ? 'اختر مدينة الميلاد حتى نطبّق التوقيت التاريخي الصحيح.' : '';
  let chartMarkup = `<section class="natal-placeholder"><span>✦</span><div><h2>أدخل بيانات الميلاد</h2><p>${birthMessage || 'ستظهر هنا الشمس والقمر والطالع والكواكب والبيوت والزوايا.'}</p></div></section>`;
  if (birth.status === 'valid' && state.birthCity) {
    try {
      const chart = calculateNatalChart({
        year:birth.year, month:birth.month, day:birth.day,
        hour:state.birthHour || '12', minute:state.birthMinute || '0',
        cityId:state.birthCity, timeKnown:state.birthTimeKnown,
      });
      chartMarkup = natalChartResult(chart);
    } catch (error) {
      chartMarkup = `<section class="natal-placeholder is-error"><span>!</span><div><h2>تعذّر حساب هذا الوقت</h2><p>${error.message === 'invalid-local-time' ? 'هذه الساعة غير موجودة أو مكررة بسبب تغيير التوقيت الصيفي. جرّب دقيقة أو ساعة أخرى وراجع بيانات الميلاد.' : 'راجع التاريخ والوقت والمدينة.'}</p></div></section>`;
    }
  }
  const full = state.detailMode === 'full';
  const boundaries = `<section class="zodiac-boundaries"><article><span>✓</span><div><small>دقيق حسابيًا</small><h3>المواضع والدرجات</h3><p>تُحسب محليًا وفق التوقيت التاريخي للمدينة.</p></div></article><article><span>≈</span><div><small>تفسير رمزي</small><h3>ليس اختبار شخصية</h3><p>الربط بين المواضع والسمات غير مثبت علميًا.</p></div></article><article><span>!</span><div><small>لا ادعاء غيب</small><h3>لا حظ ولا مستقبل</h3><p>لا يقدم التطبيق توقعات للمال أو الزواج أو الصحة أو المصير.</p></div></article></section>`;
  return `<section class="zodiac-hero natal-hero compact-hero"><div><span class="eyebrow">حساب واضح · تفسير رمزي بحدود معلنة</span><h2>الأبراج وخريطة الميلاد</h2><p>ملخص مريح أولًا، وكل التفاصيل الفلكية والتراثية محفوظة عند طلبها.</p><div class="hero-methods"><span>☉ مواضع فلكية</span><span>⌖ توقيت ومكان</span><span>◎ البيوت الكاملة</span></div></div><div class="zodiac-orbit"><span>✦</span>${ZODIAC_DETAILS.map((_, index) => `<i style="--i:${index}"></i>`).join('')}</div></section>
  <div class="view-mode"><div><b>طريقة العرض</b><small>${full ? 'كل الأقسام مفتوحة' : 'الملخص أولًا والتفاصيل عند الطلب'}</small></div><button class="btn ${full ? '' : 'primary'}" data-detail-mode>${full ? 'العودة للعرض المبسط' : 'عرض كامل'}</button></div>
  <div class="zodiac-input-pair"><section class="card zodiac-calculator heritage-panel heritage-first"><div class="section-heading"><div><span class="eyebrow">الحساب الأول</span><h2>الحساب الحرفي التراثي</h2><p class="muted">الاسم واسم الأم والباقي من ١٢.</p></div><span class="tag">الباقي من ١٢</span></div><div class="zodiac-inputs"><label><span>اسم الشخص</span><input data-field="zodiacName" value="${esc(state.zodiacName)}" placeholder="مثال: محمد"></label><label><span>اسم الأم</span><input data-field="zodiacMother" value="${esc(state.zodiacMother)}" placeholder="مثال: فاطمة"></label></div><div class="actions"><button class="btn primary" data-calculate-heritage>احسب</button><button class="btn" data-clear="heritage-zodiac">مسح</button></div></section>
  <section class="card natal-input-card"><div class="section-heading"><div><span class="eyebrow">بيانات الخريطة</span><h2>بيانات الميلاد</h2><p class="muted">كل البيانات تبقى على جهازك.</p></div><span class="tag">محلي</span></div><div class="birth-date-card natal-birth-fields"><div class="natal-field-grid"><label><span>اليوم</span><select data-birth-field="birthDay"><option value="">اليوم</option>${dateOptions(31,state.birthDay)}</select></label><label><span>الشهر</span><select data-birth-field="birthMonth"><option value="">الشهر</option>${dateOptions(12,state.birthMonth,ARABIC_MONTHS)}</select></label><label><span>السنة</span><input type="text" inputmode="numeric" autocomplete="bday-year" maxlength="4" dir="ltr" data-birth-field="birthYear" value="${esc(state.birthYear)}" placeholder="مثال: 1990"></label><label class="city-field"><span>مدينة الميلاد داخل مصر</span><select data-birth-field="birthCity"><option value="">اختر المدينة</option>${cityOptions(state.birthCity)}</select></label></div><label class="time-known"><input type="checkbox" data-birth-time-known ${state.birthTimeKnown ? 'checked' : ''}><span><b>وقت الميلاد معروف</b><small>اختياري لحساب الطالع والبيوت</small></span></label>${state.birthTimeKnown ? `<div class="time-fields"><label><span>الساعة بنظام ٢٤</span><select data-birth-field="birthHour">${zeroOptions(24,state.birthHour)}</select></label><label><span>الدقيقة</span><select data-birth-field="birthMinute">${zeroOptions(60,state.birthMinute)}</select></label><div class="time-help"><b>لماذا الوقت مهم؟</b><span>الطالع والبيوت يتغيران مع دوران السماء.</span></div></div>` : ''}<div class="actions"><button class="btn primary" data-calculate-birth>احسب خريطة الميلاد</button><button class="btn" data-natal-example>بيانات نموذجية</button><button class="btn" data-clear="natal">مسح</button></div>${birthMessage ? `<p class="form-error">${birthMessage}</p>` : ''}</div></section></div>
  ${heritage.sign ? heritageDisplay : ''}${chartMarkup}
  <div class="detail-accordion supporting-details">${progressivePanel('دليل الأبراج','الأبراج الاثنا عشر',`<div class="zodiac-guide">${ZODIAC_DETAILS.map(zodiacGuideCard).join('')}</div>`,full)}${progressivePanel('حدود القراءة','ما هو حسابي وما هو رمزي',boundaries,full)}${progressivePanel('المصادر والمنهج','مراجع الحساب والسياق',`<div class="source-list">${sources}</div>`,full)}</div>`;
}
function reference() {
  const full = state.detailMode === 'full';
  const abjad = `<div class="reference-values">${Object.entries(ABJAD).map(([l,v])=>`<span class="letter">${l} = ${num(v)}</span>`).join(' ')}</div>`;
  const elements = Object.entries(ELEMENTS).map(([e,l])=>`<p><b>${e}</b>: ${l.join(' ')}</p>`).join('');
  const planets = PLANETS.map((p,i)=>`<p>${num(i+1)}. ${p}</p>`).join('');
  const signs = ZODIAC.map(([z,e],i)=>`<p>${num(i+1)}. ${z} · ${e}</p>`).join('');
  return `<section class="reference-intro card"><div><span class="eyebrow">مرجع قابل للمراجعة</span><h2>المرجع والمنهج</h2><p class="muted">اختر الباب الذي تحتاجه؛ كل التفاصيل الحسابية محفوظة دون إغراق الصفحة.</p></div><span class="tag">منهج معلن</span></section><div class="detail-accordion reference-accordion">${progressivePanel('الأبجد المشرقي','قيم الحروف المعتمدة',abjad,full)}${progressivePanel('الطبائع','توزيع الحروف',elements,full)}${progressivePanel('الكواكب','الترتيب المستخدم',planets,full)}${progressivePanel('البروج','الترتيب والعناصر',signs,full)}</div><section class="card reference-tools"><div><small>تطوير</small><b>إبراهيم بن صلاح الدين</b><span>حساب فلكي محلي · البيوت الكاملة · الباقي من ١٢</span></div><div class="actions"><button class="btn primary" data-run-tests>تشغيل الاختبارات الذاتية</button><button class="btn" data-reset-storage>مسح البيانات المحفوظة</button></div></section>`;
}
function render() { const sectionViews = { names, calculator, zodiac, reference }; const result = analyze(state.text); const view = sectionViews[state.section] || names; app.innerHTML = `<div class="shell"><header class="top"><div class="brand"><img src="./assets/atlas-al-huruf-icon.png" alt=""><div class="brand-copy"><div class="brand-title-row"><h1>أطلس الحروف</h1><span class="developer-mark"><i>تطوير</i><b>إبراهيم بن صلاح الدين</b></span></div><small>الأسماء وحساب الحروف · قراءة تراثية موثّقة</small></div></div><button class="sum-chip" data-go-calculator><span>المجموع الحالي</span>${num(result.total)}</button></header><nav class="nav">${[['names','الأسماء'],['calculator','الحاسبة'],['zodiac','الأبراج'],['reference','المرجع']].map(([id,label])=>`<button class="${state.section===id?'active':''}" data-nav="${id}">${label}</button>`).join('')}</nav>${view()}<footer class="app-footer"><span>أطلس الحروف</span><b>تطوير إبراهيم بن صلاح الدين</b><small>حسابات محلية · لا تنبؤات غيبية</small></footer></div>`; attach(); }
function parseArabicNumber(raw) { return Number(String(raw).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g,'')) || 0; }
function commitText(value) { state.text = value; persist(); }
function recordHistory() { const value = state.text.trim(); const result = analyze(value); if (value && result.total) state.history = [{ text:value, total:result.total }, ...state.history.filter(x => x.text !== value)].slice(0, 5); }
let redrawTimer;
function redrawKeepingFocus(selector, cursor) {
  clearTimeout(redrawTimer);
  redrawTimer = setTimeout(() => {
    if (selector === '#text') recordHistory();
    render();
    const field = document.querySelector(selector);
    if (field) { field.focus(); if (cursor !== null) { try { field.setSelectionRange?.(cursor, cursor); } catch {} } }
  }, 260);
}
function attach() { document.querySelectorAll('[data-nav]').forEach(e=>e.onclick=()=>setSection(e.dataset.nav)); document.querySelector('[data-go-calculator]')?.addEventListener('click',()=>setSection('calculator'));
  document.querySelectorAll('[data-names-mode]').forEach(button=>button.addEventListener('click',()=>{state.namesMode=button.dataset.namesMode;state.suggestionLimit=6;persist();render();}));
  document.querySelector('[data-detail-mode]')?.addEventListener('click',()=>{state.detailMode=state.detailMode==='simple'?'full':'simple';persist();render();});
  document.querySelector('[data-more-names]')?.addEventListener('click',event=>{event.stopImmediatePropagation();state.suggestionLimit=500;persist();render();});
  document.querySelector('[data-calculate-heritage]')?.addEventListener('click',()=>{persist();render();});
  document.querySelector('#text')?.addEventListener('input', e=>{ const cursor=e.target.selectionStart; commitText(e.target.value); redrawKeepingFocus('#text', cursor); }); document.querySelector('#target')?.addEventListener('input', e=>{const cursor=e.target.selectionStart;state.target=e.target.value;persist();redrawKeepingFocus('#target',cursor);}); document.querySelectorAll('[data-example]').forEach(e=>e.onclick=()=>{commitText(e.dataset.example);render();}); document.querySelectorAll('[data-history]').forEach(e=>e.onclick=()=>{state.text=state.history[e.dataset.history].text;persist();render();});
  document.querySelectorAll('[data-field]').forEach(field=>{const update=event=>{const input=event.currentTarget;const cursor=typeof input.selectionStart==='number'?input.selectionStart:null;const selector=`[data-field="${input.dataset.field}"]`;state[input.dataset.field]=input.value;persist();if(input.tagName==='SELECT'||input.type==='date')render();else redrawKeepingFocus(selector,cursor);};field.addEventListener('input',update);field.addEventListener('change',update);});
  document.querySelectorAll('select[data-birth-field]').forEach(field=>field.addEventListener('change',event=>{state[event.currentTarget.dataset.birthField]=event.currentTarget.value;persist();render();}));
  document.querySelector('input[data-birth-field="birthYear"]')?.addEventListener('input',event=>{const input=event.currentTarget;input.value=westernDigits(input.value).replace(/\D/g,'').slice(0,4);state.birthYear=input.value;persist();});
  document.querySelector('input[data-birth-field="birthYear"]')?.addEventListener('change',()=>render());
  document.querySelector('[data-calculate-birth]')?.addEventListener('click',()=>{document.querySelector('input[data-birth-field="birthYear"]')?.blur();render();});
  document.querySelector('[data-birth-time-known]')?.addEventListener('change',event=>{state.birthTimeKnown=event.currentTarget.checked;persist();render();});
  document.querySelectorAll('[data-source-url]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openExternalSource(event.currentTarget.dataset.sourceUrl);}));
  document.querySelectorAll('[data-send]').forEach(e=>e.onclick=()=>{state.nameA=state.text;setSection('names');}); document.querySelector('[data-name-example]')?.addEventListener('click',()=>{state.nameA='داود';state.nameB='جالوت';persist();render();}); document.querySelector('[data-parent-example]')?.addEventListener('click',()=>{state.father='محمد';state.mother='فاطمة';state.desiredBabyName='';state.maleSearch='';state.femaleSearch='';state.suggestionLimit=6;persist();render();}); document.querySelector('[data-zodiac-example]')?.addEventListener('click',()=>{state.zodiacName='محمد';state.zodiacMother='فاطمة';persist();render();}); document.querySelector('[data-natal-example]')?.addEventListener('click',()=>{state.birthDay='1';state.birthMonth='4';state.birthYear='1990';state.birthCity='eg-360630';state.birthTimeKnown=true;state.birthHour='12';state.birthMinute='0';persist();render();}); document.querySelectorAll('[data-select-name]').forEach(e=>e.addEventListener('click',()=>{state.desiredBabyName=e.dataset.selectName;persist();render();document.querySelector('[data-field="desiredBabyName"]')?.scrollIntoView({behavior:'smooth',block:'center'});})); document.querySelector('[data-more-names]')?.addEventListener('click',()=>{state.suggestionLimit+=12;persist();render();});
  document.querySelector('[data-copy-result]')?.addEventListener('click',()=>{const r=analyze(state.text);copy(`${state.text}\nالمجموع: ${num(r.total)}\nعدد الحروف: ${num(r.count)}`)}); document.querySelector('[data-copy-comparison]')?.addEventListener('click',copyNameComparison); document.querySelector('[data-copy-zodiac]')?.addEventListener('click',()=>{const r=heritageZodiacResult();if(!r.sign)return toast('اكتب الاسم أولًا');copy([`أطلس الحروف — البرج الحرفي التراثي`,`الاسم: ${state.zodiacName} (${num(r.person.total)})`,`اسم الأم: ${state.zodiacMother || 'غير مُدخل'}${state.zodiacMother ? ` (${num(r.mother.total)})` : ''}`,`المجموع: ${num(r.total)} · الباقي من ١٢: ${num(r.remainder)}`,`النتيجة: ${r.sign.name} · ${r.sign.element} · ${r.sign.quality} · ${r.sign.ruler}`,'قراءة رمزية تراثية؛ ليست وصفًا علميًا للشخصية أو تنبؤًا.'].join('\n'));}); document.querySelectorAll('[data-copy-name]').forEach(e=>e.onclick=()=>copy(e.dataset.copyName)); document.querySelectorAll('[data-copy-link]').forEach(e=>e.onclick=copyShareLink);
  document.querySelector('[data-export-calculator]')?.addEventListener('click',()=>{const r=analyze(state.text);if(!r.total)return toast('اكتب نصًا أولًا');exportCard('بطاقة حساب الجمل',[state.text,`المجموع: ${num(r.total)}`,`الحروف المحتسبة: ${num(r.count)}`,`عيّنة الحروف: ${r.letters.slice(0,24).map(x=>x.normalized).join(' ')}`],'atlas-al-huruf');}); document.querySelector('[data-export-names]')?.addEventListener('click',()=>{const a=profile(`${state.nameA} ${state.motherA}`),b=profile(`${state.nameB} ${state.motherB}`);if(!a.total&&!b.total)return toast('أدخل اسمًا أولًا');exportCard('بطاقة الأسماء',[`${state.nameA || '—'}: ${num(a.total)} · ${a.leaders.join(' / ') || '—'}`,`${state.nameB || '—'}: ${num(b.total)} · ${b.leaders.join(' / ') || '—'}`],'atlas-al-huruf-names');});
  document.querySelectorAll('[data-clear]').forEach(e=>e.onclick=()=>{if(e.dataset.clear==='calculator'){state.text='';state.target='';}if(e.dataset.clear==='names'){state.nameA='';state.nameB='';state.motherA='';state.motherB='';}if(e.dataset.clear==='parents'){state.father='';state.mother='';state.desiredBabyName='';state.maleSearch='';state.femaleSearch='';state.suggestionLimit=6;}if(e.dataset.clear==='heritage-zodiac'){state.zodiacName='';state.zodiacMother='';}if(e.dataset.clear==='natal'){state.birthDay='';state.birthMonth='';state.birthYear='';state.birthCity='';state.birthTimeKnown=false;state.birthHour='12';state.birthMinute='0';}if(e.dataset.clear==='zodiac'){state.zodiacName='';state.zodiacMother='';state.birthDay='';state.birthMonth='';state.birthYear='';state.birthCity='';state.birthTimeKnown=false;}persist();render();toast('تم المسح');}); document.querySelector('[data-run-tests]')?.addEventListener('click',()=>{const tests=[['بسم الله الرحمن الرحيم',786],['داود',15],['جالوت',440],['محمد',92],['فاطمة',135],['أإآء',4]];const passed=tests.every(([x,n])=>analyze(x).total===n)&&zodiacFromNumber((92+135)%12).name==='الدلو'&&zodiacFromDate('1990-04-01').name==='الحمل'&&parseBirthDate('١','٤','١٩٩٠').sign.name==='الحمل';toast(passed?'نجحت جميع الاختبارات المرجعية':'فشل اختبار ذاتي');}); document.querySelector('[data-reset-storage]')?.addEventListener('click',()=>{try{localStorage.removeItem('hisab-jomal-state');}catch{}location.reload();}); }
render();
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isTauri()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
