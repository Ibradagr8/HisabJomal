import { Temporal } from '@js-temporal/polyfill';
import {
  Body,
  CombineRotation,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  MakeTime,
  Observer,
  Rotation_ECT_EQJ,
  Rotation_EQJ_HOR,
  Rotation_HOR_EQJ,
  Rotation_EQJ_ECT,
  RotateVector,
  SunPosition,
  Vector,
} from 'astronomy-engine';
import { LOCAL_BIRTH_CITIES } from './cities-data.js';
import { ZODIAC_DETAILS } from './zodiac.js';

export const BIRTH_CITIES = LOCAL_BIRTH_CITIES;

export const PLANET_DEFINITIONS = Object.freeze([
  { key:'sun', body:Body.Sun, name:'الشمس', symbol:'☉', role:'الهوية والإرادة', roleKey:'identity' },
  { key:'moon', body:Body.Moon, name:'القمر', symbol:'☾', role:'الاحتياج العاطفي والعادات', roleKey:'emotions' },
  { key:'mercury', body:Body.Mercury, name:'عطارد', symbol:'☿', role:'التفكير والتواصل', roleKey:'mind' },
  { key:'venus', body:Body.Venus, name:'الزهرة', symbol:'♀', role:'القيم والذوق والارتباط', roleKey:'relating' },
  { key:'mars', body:Body.Mars, name:'المريخ', symbol:'♂', role:'الدافع والمبادرة', roleKey:'drive' },
  { key:'jupiter', body:Body.Jupiter, name:'المشتري', symbol:'♃', role:'التوسع والمعنى', roleKey:'growth' },
  { key:'saturn', body:Body.Saturn, name:'زحل', symbol:'♄', role:'الحدود والمسؤولية', roleKey:'structure' },
]);

export const ANGLE_DEFINITIONS = Object.freeze({
  ascendant: { name:'الطالع', symbol:'ط', role:'أسلوب الظهور والانطباع الأول', roleKey:'outward' },
  descendant: { name:'الغارب', symbol:'غ', role:'محور الشراكة والآخر', roleKey:'relating' },
  midheaven: { name:'وسط السماء', symbol:'س', role:'الصورة العامة والاتجاه المهني الرمزي', roleKey:'growth' },
  imumCoeli: { name:'قاع السماء', symbol:'ق', role:'الجذور والمساحة الخاصة', roleKey:'emotions' },
});

export const HOUSE_MEANINGS = Object.freeze([
  'الذات والبدايات وطريقة الحضور', 'الموارد والقيم والشعور بالأمان', 'التعلّم والتواصل والبيئة القريبة',
  'الجذور والمنزل والمساحة الخاصة', 'الإبداع والتعبير واللعب', 'العادات والعمل اليومي والعناية بالتفاصيل',
  'الشراكات والتوازن مع الآخر', 'المشاركة والتحوّل والحدود العميقة', 'المعرفة الواسعة والسفر والرؤية',
  'المسؤولية والصورة العامة والإنجاز', 'الأصدقاء والجماعات والآمال', 'العزلة والتأمل وما يجري خلف المشهد',
]);

export const SIGN_PROFILES = Object.freeze({
  الحمل:{ identity:'يميل إلى تعريف نفسه بالفعل والمبادرة، ويشعر بالحيوية حين يبدأ شيئًا أو يواجه تحديًا واضحًا.', emotions:'يستجيب بسرعة وبصراحة، ويحتاج مساحة آمنة للتعبير المباشر ثم الهدوء.', outward:'يظهر حاسمًا ومتحركًا ويعطي انطباعًا بأنه مستعد للبدء قبل اكتمال كل التفاصيل.', mind:'يفكر بخط مستقيم ويفضل الإجابة الواضحة والقرار السريع.', relating:'يقدّر الصراحة والحيوية ويحتاج علاقة تحتمل الاستقلال والمبادرة.', drive:'تتحرك طاقته بالمنافسة والتحدي، ويستفيد من التمهل قبل رد الفعل.', growth:'يتوسع بالتجربة والشجاعة وخوض المسارات الجديدة.', structure:'يتعلم الصبر وإكمال ما بدأ وتحويل الاندفاع إلى التزام.' },
  الثور:{ identity:'يبني هويته على الثبات والواقعية والقدرة على إنشاء شيء ملموس يدوم.', emotions:'يحتاج الأمان والوتيرة الهادئة والاستقرار الحسي، وقد يتأخر في تغيير موقف اعتاد عليه.', outward:'يظهر هادئًا ومتزنًا ويبعث على الثقة، لكنه لا يحب الضغط أو الاستعجال.', mind:'يفكر عمليًا ويتحقق من الفكرة من خلال فائدتها وإمكان تطبيقها.', relating:'يقدّر الوفاء والراحة والجمال والاستمرارية أكثر من الإثارة العابرة.', drive:'يتحرك بثبات وتحمل، ويحتاج إلى بدء الحركة قبل أن يتحول الصبر إلى جمود.', growth:'يتوسع ببناء موارد مستقرة وتقدير البساطة والجودة.', structure:'يتعلم المرونة والتخلي عن التمسك بما فقد فائدته.' },
  الجوزاء:{ identity:'يتعرّف إلى نفسه عبر السؤال والتجربة وتبادل الأفكار، وتغذيه الحركة الذهنية.', emotions:'يحتاج إلى تسمية مشاعره والتحدث عنها، وقد يبدّل زاوية النظر كي لا يثقل عليه الشعور.', outward:'يظهر فضوليًا وسريع التكيف وسهل التواصل مع البيئات المختلفة.', mind:'يجمع المعلومات بسرعة ويربط بين موضوعات متباعدة، ويستفيد من التركيز حتى النهاية.', relating:'ينجذب إلى الحوار والذكاء والتنوع ويحتاج أن تبقى العلاقة حيّة ذهنيًا.', drive:'يتحرك بالفكرة والفضول وتعدد المهام، وقد تتوزع طاقته على أكثر مما يحتمل.', growth:'يتوسع بالتعلم والكتابة والشبكات وتغيير المنظور.', structure:'يتعلم ترتيب الأولويات وتحويل المعرفة المتفرقة إلى مهارة متماسكة.' },
  السرطان:{ identity:'يبني هويته حول الرعاية والانتماء وحماية ما يعتبره بيته أو دائرته القريبة.', emotions:'حساس لتغير الجو العاطفي ويحتاج الأمان والخصوصية والاعتراف بما يشعر به.', outward:'يظهر متحفظًا في البداية ثم دافئًا وحاميًا حين يطمئن.', mind:'تعمل ذاكرته وروابطه الوجدانية بقوة، وقد يقرأ النبرة بقدر ما يسمع الكلمات.', relating:'يقدّر الحنان والولاء والشعور بالبيت، ويحتاج حدودًا تمنع الرعاية من التحول إلى استنزاف.', drive:'تتحرك طاقته لحماية شخص أو مكان أو معنى عاطفي.', growth:'يتوسع بصنع الانتماء وفهم الاحتياجات الإنسانية.', structure:'يتعلم الفصل بين الحدس والخوف، وطلب الاحتياج بوضوح.' },
  الأسد:{ identity:'يحتاج إلى التعبير الصادق والإبداع والشعور بأن حضوره يصنع أثرًا له معنى.', emotions:'يدفأ بالتقدير والكرم المتبادل، وقد يتألم حين يشعر أن مشاعره غير مرئية.', outward:'يظهر واثقًا وواضح الحضور، وغالبًا ما يملأ المكان بطاقة شخصية ملحوظة.', mind:'يفكر بصورة شاملة وقصصية ويعبّر بثقة عندما يؤمن بالفكرة.', relating:'يقدّر الولاء والاحتفاء والمودة الواضحة ويحتاج تبادل الضوء لا احتكاره.', drive:'يتحرك بالفخر والإبداع والرغبة في الإنجاز الذي يمكن رؤيته.', growth:'يتوسع بالقيادة الكريمة وتشجيع مواهب الآخرين.', structure:'يتعلم تقبل النقد والتواضع دون تصغير ذاته.' },
  العذراء:{ identity:'يجد المعنى في التحسين والدقة والخدمة العملية وتحويل الفوضى إلى نظام مفيد.', emotions:'يطمئن حين تصبح التفاصيل مفهومة وقابلة للإدارة، وقد يحلل الشعور بدل عيشه.', outward:'يظهر منتبهًا ومنظمًا ومتحفظًا، ويلتقط ما يحتاج إلى إصلاح بسرعة.', mind:'يميز الفروق الدقيقة ويختبر الأفكار ويبحث عن الصياغة الأكثر نفعًا.', relating:'يعبّر عن الاهتمام بالمساعدة والتفاصيل، ويحتاج ألا تتحول الملاحظة إلى نقد دائم.', drive:'تتحرك طاقته بالمهمة الواضحة والتحسين التدريجي.', growth:'يتوسع بإتقان حرفة وربط المعرفة بالخدمة.', structure:'يتعلم قبول الكفاية والراحة ورؤية الصورة الكبرى.' },
  الميزان:{ identity:'يتعرّف إلى نفسه عبر التوازن والجمال والحوار ورؤية الموقف من أكثر من جانب.', emotions:'يحتاج الهدوء والعدل والتبادل، وقد يؤجل مواجهة الشعور حفاظًا على الانسجام.', outward:'يظهر لبقًا ومتزنًا وقادرًا على قراءة قواعد المساحة الاجتماعية.', mind:'يقارن الخيارات بعناية ويبرع في عرض الحجج المتقابلة، لكنه يحتاج موعدًا للحسم.', relating:'يقدّر الشراكة والاحترام والذوق، ويتعلم ألا يضيع صوته في إرضاء الجميع.', drive:'يتحرك لصنع التوازن أو الدفاع عن العدالة والتعاون.', growth:'يتوسع بالدبلوماسية والفن وبناء الجسور.', structure:'يتعلم القرار المستقل وتحمل توتر الاختلاف.' },
  العقرب:{ identity:'يبني هويته على العمق والخصوصية والقدرة على مواجهة التحول وما لا يقال بسهولة.', emotions:'يشعر بكثافة ويحتاج الثقة والصدق، وقد يحمي هشاشته بالمراقبة أو السيطرة.', outward:'يظهر مركزًا وغامضًا وقوي الحضور حتى حين يتحدث قليلًا.', mind:'يبحث تحت السطح ويتتبع الدوافع والتناقضات ولا يرضى بالإجابة السهلة.', relating:'يقدّر الولاء والعمق والخصوصية ويحتاج مساحة آمنة للإفصاح دون اختبار الآخر.', drive:'تتحرك طاقته بالإصرار والتركيز والرغبة في الوصول إلى جوهر المسألة.', growth:'يتوسع بتحويل الأزمات إلى فهم وقوة داخلية.', structure:'يتعلم الثقة والتخفف من السيطرة وترك ما انتهى.' },
  القوس:{ identity:'يجد نفسه في الاستكشاف والمعرفة والحرية والسعي إلى معنى أوسع من التفاصيل اليومية.', emotions:'يحتاج الأفق والأمل والحركة، وقد يهرب إلى الفكرة الكبيرة من شعور يحتاج حضورًا هادئًا.', outward:'يظهر منفتحًا وصريحًا ومحبًا للتجربة، وأحيانًا يتجاوز حساسية اللحظة.', mind:'يفكر في المبادئ والصورة الكبرى ويربط الخبرة بقصة أو فلسفة.', relating:'يقدّر الصدق والمغامرة ومساحة النمو المشترك.', drive:'تتحرك طاقته بالهدف البعيد والتجربة والتحدي الفكري أو الجسدي.', growth:'يتوسع بالتعليم والسفر وتغيير القناعات عبر التجربة.', structure:'يتعلم الالتزام بالتفاصيل ووزن أثر كلماته.' },
  الجدي:{ identity:'يبني هويته عبر المسؤولية والإنجاز التدريجي وصناعة شيء يمكن الاعتماد عليه.', emotions:'يحتاج الاحترام والثبات وقد يخفي احتياجه خلف العمل أو التحكم في نفسه.', outward:'يظهر جادًا ومحسوبًا وكفؤًا، ثم يظهر دفؤه تدريجيًا مع الثقة.', mind:'يفكر استراتيجيًا ويقدّر الوقت والنتيجة والهيكل الواضح.', relating:'يقدّر الالتزام والموثوقية ويحتاج السماح باللين لا إدارة العلاقة كمهمة.', drive:'تتحرك طاقته بالطموح والتحمل والهدف طويل المدى.', growth:'يتوسع ببناء الخبرة والسلطة المسؤولة.', structure:'يتعلم الراحة والتعبير عن الاحتياج وعدم قياس القيمة بالإنجاز وحده.' },
  الدلو:{ identity:'يتعرّف إلى نفسه عبر الاستقلال الفكري ورؤية الأنظمة من زاوية مختلفة وخدمة فكرة أوسع.', emotions:'يحتاج الحرية والمسافة لفهم شعوره، وقد يحوّل الانفعال إلى تحليل قبل مشاركته.', outward:'يظهر مستقلًا وغير تقليدي وودودًا دون أن يكون سهل القراءة دائمًا.', mind:'يفكر شبكيًا ومستقبليًا ويختبر المسلمات ويبحث عن الحل المختلف.', relating:'يقدّر الصداقة والمساواة والمساحة الشخصية والارتباط حول قيمة مشتركة.', drive:'تتحرك طاقته بالفكرة والإصلاح والعمل الجماعي المنظم.', growth:'يتوسع بالمجتمع والابتكار وربط الناس حول رؤية.', structure:'يتعلم القرب العاطفي والمرونة مع الواقع الإنساني غير المنتظم.' },
  الحوت:{ identity:'يجد نفسه في الخيال والتعاطف والمرونة والاتصال بما يتجاوز الحدود الصلبة.', emotions:'يلتقط الجو المحيط بسهولة ويحتاج العزلة الهادئة والحدود حتى يميز شعوره عن شعور الآخرين.', outward:'يظهر لينًا ومتقبلًا ومتغير الإيقاع، وقد يعكس مزاج البيئة.', mind:'يفكر بالصور والحدس والروابط غير المباشرة ويحتاج أدوات تثبت الفكرة في الواقع.', relating:'يقدّر الرحمة والانسجام الروحي والحنان، ويحتاج وضوحًا يمنع المثالية أو الذوبان.', drive:'تتحرك طاقته بالإلهام والمعنى والمساعدة أكثر من المنافسة المباشرة.', growth:'يتوسع بالفن والتأمل والتعاطف والقدرة على احتواء التعقيد.', structure:'يتعلم الحدود والواقعية وتحويل الخيال إلى خطوات محددة.' },
});

const ASPECTS = Object.freeze([
  { name:'اقتران', angle:0, orb:8, tone:'دمج وتركيز', text:'طاقتان تعملان في المساحة نفسها؛ قد تتعاضدان أو تتزاحمان بحسب طبيعتهما.' },
  { name:'تسديس', angle:60, orb:4, tone:'فرصة تعاون', text:'صلة مرنة يمكن تنميتها بالاختيار والممارسة.' },
  { name:'تربيع', angle:90, orb:6, tone:'توتر دافع', text:'احتكاك رمزي يطلب مهارة ووعيًا كي يتحول إلى حركة بناءة.' },
  { name:'تثليث', angle:120, orb:6, tone:'انسياب', text:'توافق رمزي يعمل بسهولة وقد يحتاج قصدًا حتى لا يبقى غير مستثمر.' },
  { name:'مقابلة', angle:180, orb:8, tone:'استقطاب وتوازن', text:'طرفان متقابلان يطلبان رؤية العلاقة بينهما بدل الانحياز لطرف واحد.' },
]);

const norm = value => ((value % 360) + 360) % 360;
const signedDelta = (to, from) => ((to - from + 540) % 360) - 180;
const deg = value => value * Math.PI / 180;

export function cityById(id) {
  return BIRTH_CITIES.find(city => city.id === id) || null;
}

export function localBirthToDate({ year, month, day, hour = 12, minute = 0, city }) {
  if (!city) throw new Error('city-required');
  try {
    const zoned = Temporal.ZonedDateTime.from({
      timeZone: city.zone,
      year:Number(year), month:Number(month), day:Number(day),
      hour:Number(hour), minute:Number(minute), second:0,
    }, { disambiguation:'reject' });
    return new Date(zoned.epochMilliseconds);
  } catch {
    throw new Error('invalid-local-time');
  }
}

export function zodiacPosition(longitude) {
  const value = norm(longitude);
  const index = Math.floor(value / 30);
  return {
    longitude:value,
    signIndex:index,
    sign:ZODIAC_DETAILS[index],
    degree:value - index * 30,
  };
}

function bodyLongitude(body, date) {
  if (body === Body.Sun) return SunPosition(date).elon;
  if (body === Body.Moon) return EclipticGeoMoon(date).lon;
  return Ecliptic(GeoVector(body, date, true)).elon;
}

function retrograde(body, date) {
  if ([Body.Sun, Body.Moon].includes(body)) return false;
  const before = new Date(date.getTime() - 12 * 60 * 60 * 1000);
  const after = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  return signedDelta(bodyLongitude(body, after), bodyLongitude(body, before)) < 0;
}

function cross(a, b, time) {
  return new Vector(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
    time,
  );
}

function neg(vector) {
  return new Vector(-vector.x, -vector.y, -vector.z, vector.t);
}

function vectorLongitude(vector) {
  return norm(Math.atan2(vector.y, vector.x) / deg(1));
}

export function calculateAngles(date, city) {
  const time = MakeTime(date);
  const observer = new Observer(city.lat, city.lon, 0);
  const ectToHor = CombineRotation(Rotation_ECT_EQJ(time), Rotation_EQJ_HOR(time, observer));
  const horToEct = CombineRotation(Rotation_HOR_EQJ(time, observer), Rotation_EQJ_ECT(time));
  const eclipticPoleHor = RotateVector(ectToHor, new Vector(0, 0, 1, time));
  const horizonPole = new Vector(0, 0, 1, time);
  const meridianPole = new Vector(0, 1, 0, time);
  let ascHor = cross(eclipticPoleHor, horizonPole, time);
  if (ascHor.y > 0) ascHor = neg(ascHor); // y السالب هو الشرق في نظام Astronomy Engine.
  let mcHor = cross(eclipticPoleHor, meridianPole, time);
  if (mcHor.z < 0) mcHor = neg(mcHor);
  const ascendant = vectorLongitude(RotateVector(horToEct, ascHor));
  const midheaven = vectorLongitude(RotateVector(horToEct, mcHor));
  return {
    ascendant,
    descendant:norm(ascendant + 180),
    midheaven,
    imumCoeli:norm(midheaven + 180),
  };
}

function planetHouse(signIndex, ascSignIndex) {
  return ((signIndex - ascSignIndex + 12) % 12) + 1;
}

function calculateAspects(placements) {
  const results = [];
  for (let a = 0; a < placements.length; a += 1) {
    for (let b = a + 1; b < placements.length; b += 1) {
      const separation = Math.abs(signedDelta(placements[b].longitude, placements[a].longitude));
      const match = ASPECTS
        .map(aspect => ({ ...aspect, distance:Math.abs(separation - aspect.angle) }))
        .filter(aspect => aspect.distance <= aspect.orb)
        .sort((x, y) => x.distance - y.distance)[0];
      if (match) results.push({ ...match, first:placements[a], second:placements[b], separation });
    }
  }
  return results.sort((a, b) => a.distance - b.distance).slice(0, 10);
}

function tally(placements, key, values) {
  const counts = Object.fromEntries(values.map(value => [value, 0]));
  placements.forEach(item => { counts[item.sign[key]] += 1; });
  return counts;
}

function moonPhase(sunLongitude, moonLongitude) {
  const angle = norm(moonLongitude - sunLongitude);
  const illumination = (1 - Math.cos(deg(angle))) / 2;
  const phases = [
    [22.5,'محاق'], [67.5,'هلال متزايد'], [112.5,'التربيع الأول'], [157.5,'أحدب متزايد'],
    [202.5,'بدر'], [247.5,'أحدب متناقص'], [292.5,'التربيع الأخير'], [337.5,'هلال متناقص'], [360,'محاق'],
  ];
  return { angle, illumination, name:phases.find(([limit]) => angle < limit)?.[1] || 'محاق' };
}

export function calculateNatalChart(input) {
  const city = cityById(input.cityId);
  const exactTime = Boolean(input.timeKnown);
  const date = localBirthToDate({
    year:input.year, month:input.month, day:input.day,
    hour:exactTime ? input.hour : 12,
    minute:exactTime ? input.minute : 0,
    city,
  });
  const anglesRaw = exactTime ? calculateAngles(date, city) : null;
  const ascSignIndex = anglesRaw ? zodiacPosition(anglesRaw.ascendant).signIndex : null;
  const placements = PLANET_DEFINITIONS.map(definition => {
    const position = zodiacPosition(bodyLongitude(definition.body, date));
    return {
      ...definition,
      ...position,
      retrograde:retrograde(definition.body, date),
      house:ascSignIndex === null ? null : planetHouse(position.signIndex, ascSignIndex),
    };
  });
  const angles = anglesRaw ? Object.fromEntries(Object.entries(anglesRaw).map(([key, longitude]) => [key, {
    ...ANGLE_DEFINITIONS[key],
    ...zodiacPosition(longitude),
  }])) : null;
  const counted = angles ? [...placements, angles.ascendant] : placements;
  const sun = placements.find(item => item.key === 'sun');
  const moon = placements.find(item => item.key === 'moon');
  let uncertainty = {};
  if (!exactTime) {
    const start = localBirthToDate({ year:input.year, month:input.month, day:input.day, hour:0, minute:0, city });
    const end = localBirthToDate({ year:input.year, month:input.month, day:input.day, hour:23, minute:59, city });
    uncertainty = Object.fromEntries([Body.Sun, Body.Moon].map(body => {
      const first = zodiacPosition(bodyLongitude(body, start));
      const last = zodiacPosition(bodyLongitude(body, end));
      return [body === Body.Sun ? 'sun' : 'moon', first.signIndex === last.signIndex ? null : [first.sign, last.sign]];
    }));
  }
  return {
    city, date, exactTime, placements, angles,
    aspects:calculateAspects(angles ? [...placements, angles.ascendant] : placements),
    elements:tally(counted, 'element', ['نار','تراب','هواء','ماء']),
    qualities:tally(counted, 'quality', ['منقلب','ثابت','ذو جسدين']),
    houses:angles ? ZODIAC_DETAILS.map((sign, signIndex) => ({ house:planetHouse(signIndex, ascSignIndex), sign })).sort((a,b)=>a.house-b.house) : [],
    chartRuler:angles?.ascendant.sign.ruler || null,
    moonPhase:moonPhase(sun.longitude, moon.longitude),
    uncertainty,
    accuracy:exactTime ? 'وقت ومكان الميلاد محددان' : 'الوقت غير معروف؛ الطالع والبيوت غير محسوبين',
  };
}

export function signReading(item) {
  const profile = SIGN_PROFILES[item.sign.name];
  return profile?.[item.roleKey] || item.sign.summary;
}
