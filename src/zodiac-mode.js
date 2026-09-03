export const ZODIAC_MODES = Object.freeze(['heritage', 'natal']);

export function allowedZodiacMode(value) {
  return ZODIAC_MODES.includes(value) ? value : 'heritage';
}

export function shouldComputeHeritageZodiac(mode) {
  return allowedZodiacMode(mode) === 'heritage';
}

export function shouldComputeNatalChart(mode) {
  return allowedZodiacMode(mode) === 'natal';
}

export function selectZodiacMode(state, mode) {
  return { ...state, zodiacMode: allowedZodiacMode(mode) };
}

export function selectedZodiacPanel(mode, panels) {
  return panels[allowedZodiacMode(mode)];
}

export function applyZodiacToolClear(state, mode) {
  if (allowedZodiacMode(mode) === 'natal') {
    return {
      ...state,
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      birthCity: '',
      birthTimeKnown: false,
      birthHour: '12',
      birthMinute: '0',
    };
  }
  return { ...state, zodiacName: '', zodiacMother: '' };
}

export function zodiacModeSwitcherMarkup(mode) {
  const selected = allowedZodiacMode(mode);
  const card = (value, icon, title, note) => `<button type="button" class="${selected === value ? 'active' : ''}" data-zodiac-mode="${value}" aria-pressed="${selected === value}"><span aria-hidden="true">${icon}</span><b>${title}</b><small>${note}</small></button>`;
  return `<section class="mode-switch zodiac-mode-switch" aria-label="اختيار أداة الأبراج">${card('heritage', 'أ', 'البرج الحرفي', 'الاسم واسم الأم · الباقي من ١٢')}${card('natal', '☉', 'خريطة الميلاد', 'الشمس والقمر والطالع · التاريخ والوقت والمدينة')}</section>`;
}
