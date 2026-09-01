import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const arabicNames = new Map(Object.entries({
  '346201':'الزعفرانة','347542':'طامية','347749':'سمسطا السلطاني','347907':'سنورس','350207':'رأس غارب',
  '350211':'رأس البر','350661':'قصر الفرافرة','351766':'موط','352679':'مشتول السوق','353219':'مدينة السادس من أكتوبر',
  '353223':'مدينة السادات','353802':'كوم أمبو','354076':'كفر شكر','355595':'إهناسيا المدينة','355596':'إهناسيا',
  '356000':'حوش عيسى','357039':'فايد','358388':'دراو','358970':'بسيون','359541':'العين السخنة',
  '359749':'أطفيح','360159':'الرديسية قبلي','360456':'الياسينية','360464':'الواسطى','360890':'الخصوص',
  '360928':'الخانكة','361179':'الحوامدية','361405':'البصالية بحري','361473':'البدرشين','361495':'العياط',
  '362028':'أبو صوير المحطة','362071':'أبو صير','362865':'أبو النمرس','362882':'أبو المطامير','374290':'حلايب',
  '415561':'بدر','421600':'بدر','433441':'بني سويف الجديدة','434418':'الناصرية','8521413':'سانت كاترين','361320':'الفيوم','350550':'قنا',
  '12640357':'الخارجة','12640359':'المنيا الجديدة','12640363':'الروضة','12640381':'يوسف الصديق','13118928':'مدينة بني سويف الجديدة',
  '101035':'أم الساهك','101313':'طريف','101322':'تربة','101344':'التوبي','101516':'تيماء',
  '101581':'تنومة','101633':'تبالة','101732':'عنيزة','101760':'سلطانة','102451':'صامطة','102985':'رحيمة',
  '103035':'رابغ','103369':'بيشة','103922':'مليجة','104578':'مهد الذهب','104716':'ليلى',
  '104828':'مدينة الملك فيصل العسكرية','104923':'خليص','105252':'جليجلة','106102':'حقل','106744':'فرسان',
  '107744':'بدر حنين','108048':'السليل','108142':'السفانية','108419':'الرين','108890':'القرين',
  '108957':'القارة','109059':'المنيزلة','109118':'المندق','109165':'المركز','109253':'الليث',
  '109306':'الخرمة','109380':'الخفجي','109436':'الجبيل','109481':'الجرادية','109563':'الحلوة',
  '109915':'البطالية','110059':'العقيق','110250':'عفيف','110325':'الدوادمي','392753':'صوير',
  '399518':'المجاردة','409682':'ثول','409993':'المويه','7288343':'شيبة','9031043':'الرمثية',
  '11524299':'مدينة الملك عبدالله الاقتصادية','12495725':'بارق','13631408':'حوطة بني تميم','110619':'أبو عريش','107304':'بريدة','109223':'المدينة المنورة',
}));

const administrativeAreas = new Map(Object.entries({
  'EG-01':'الدقهلية','EG-02':'البحر الأحمر','EG-03':'البحيرة','EG-04':'الفيوم','EG-05':'الغربية','EG-06':'الإسكندرية',
  'EG-07':'الإسماعيلية','EG-08':'الجيزة','EG-09':'المنوفية','EG-10':'المنيا','EG-11':'القاهرة','EG-12':'القليوبية',
  'EG-13':'الوادي الجديد','EG-14':'الشرقية','EG-15':'السويس','EG-16':'أسوان','EG-17':'أسيوط','EG-18':'بني سويف',
  'EG-19':'بورسعيد','EG-20':'دمياط','EG-21':'كفر الشيخ','EG-22':'مطروح','EG-23':'قنا','EG-24':'سوهاج',
  'EG-26':'جنوب سيناء','EG-27':'شمال سيناء','EG-28':'الأقصر',
  'SA-02':'الباحة','SA-05':'المدينة المنورة','SA-06':'المنطقة الشرقية','SA-08':'القصيم','SA-10':'الرياض',
  'SA-11':'عسير','SA-13':'حائل','SA-14':'مكة المكرمة','SA-15':'الحدود الشمالية','SA-16':'نجران',
  'SA-17':'جازان','SA-19':'تبوك','SA-20':'الجوف',
}));

const countrySources = [
  { code:'EG', country:'مصر', archive:'/tmp/geonames-eg.zip' },
];
const cityCodes = new Set(['PPL','PPLA','PPLA2','PPLC']);

function arabicName(fields) {
  if (arabicNames.has(fields[0])) return arabicNames.get(fields[0]);
  return fields[3].split(',')
    .map(name => name.replace(/[\u200e\u200f\u202a-\u202e\ufeff]/g, '').trim())
    .find(name => /^[\u0600-\u06ff\sـ\-]+$/.test(name) && name.length > 1) || '';
}

const cities = countrySources.flatMap(source => {
  const text = execFileSync('unzip', ['-p', source.archive, `${source.code}.txt`], { encoding:'utf8', maxBuffer:20_000_000 });
  return text.trim().split(/\n/).map(line => line.split('\t')).flatMap(fields => {
    if (fields[6] !== 'P' || !cityCodes.has(fields[7]) || Number(fields[14]) <= 0) return [];
    const name = arabicName(fields);
    if (!name) throw new Error(`لا يوجد اسم عربي للمدينة ${fields[0]}: ${fields[1]}`);
    const area = administrativeAreas.get(`${source.code}-${fields[10]}`) || '';
    return [{
      id:`${source.code.toLowerCase()}-${fields[0]}`,
      label:[name, area, source.country].filter(Boolean).join('، '),
      country:source.country,
      lat:Number(Number(fields[4]).toFixed(5)),
      lon:Number(Number(fields[5]).toFixed(5)),
      zone:fields[17],
      population:Number(fields[14]),
    }];
  });
}).sort((a, b) => a.country.localeCompare(b.country, 'ar') || a.label.localeCompare(b.label, 'ar'));

const output = `// Generated from GeoNames country dumps (CC BY 4.0): https://www.geonames.org/export/\n`+
  `// Includes populated city records with a reported population for Egypt only.\n`+
  `export const LOCAL_BIRTH_CITIES = Object.freeze(${JSON.stringify(cities, null, 2)});\n`;
writeFileSync(resolve('src/cities-data.js'), output);
console.log(`Generated ${cities.length} Arabic city records.`);
