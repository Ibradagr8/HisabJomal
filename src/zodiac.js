export const ZODIAC_DETAILS = Object.freeze([
  { name:'الحمل', symbol:'♈︎', element:'نار', quality:'منقلب', ruler:'المريخ', dates:'٢١ مارس — ١٩ أبريل', summary:'طاقة البدء والمبادرة والحركة المباشرة.', strengths:['المبادرة','الشجاعة','الحسم'], balance:['التريث','الاستماع','إكمال ما بدأ'] },
  { name:'الثور', symbol:'♉︎', element:'تراب', quality:'ثابت', ruler:'الزهرة', dates:'٢٠ أبريل — ٢٠ مايو', summary:'الثبات والواقعية وبناء الأمان خطوة بعد خطوة.', strengths:['الصبر','الاستقرار','العملية'], balance:['المرونة','تقبّل التغيير','ترك العناد'] },
  { name:'الجوزاء', symbol:'♊︎', element:'هواء', quality:'ذو جسدين', ruler:'عطارد', dates:'٢١ مايو — ٢٠ يونيو', summary:'الفضول والتواصل وسرعة الانتقال بين الأفكار.', strengths:['التعلّم','التعبير','التكيّف'], balance:['التركيز','الإنصات','تقليل التشتت'] },
  { name:'السرطان', symbol:'♋︎', element:'ماء', quality:'منقلب', ruler:'القمر', dates:'٢١ يونيو — ٢٢ يوليو', summary:'الرعاية وحماية الدائرة القريبة والاستجابة الوجدانية.', strengths:['التعاطف','الاحتواء','الحدس'], balance:['الحدود','الوضوح','عدم الانغلاق'] },
  { name:'الأسد', symbol:'♌︎', element:'نار', quality:'ثابت', ruler:'الشمس', dates:'٢٣ يوليو — ٢٢ أغسطس', summary:'الحضور والتعبير والثبات على ما يمنح المعنى.', strengths:['الكرم','الثقة','الإبداع'], balance:['التواضع','مشاركة المساحة','تقبّل النقد'] },
  { name:'العذراء', symbol:'♍︎', element:'تراب', quality:'ذو جسدين', ruler:'عطارد', dates:'٢٣ أغسطس — ٢٢ سبتمبر', summary:'التحليل والتنظيم وتحسين التفاصيل القابلة للعمل.', strengths:['الدقة','الخدمة','التخطيط'], balance:['تقبّل النقص','الراحة','رؤية الصورة الكبرى'] },
  { name:'الميزان', symbol:'♎︎', element:'هواء', quality:'منقلب', ruler:'الزهرة', dates:'٢٣ سبتمبر — ٢٢ أكتوبر', summary:'التوازن وبناء الجسور والنظر إلى أكثر من وجه.', strengths:['الدبلوماسية','العدل','الذوق'], balance:['الحسم','وضوح الرغبة','عدم إرضاء الجميع'] },
  { name:'العقرب', symbol:'♏︎', element:'ماء', quality:'ثابت', ruler:'المريخ', dates:'٢٣ أكتوبر — ٢١ نوفمبر', summary:'العمق والتركيز والثبات أمام التحولات الصعبة.', strengths:['الإصرار','الخصوصية','قوة الملاحظة'], balance:['الثقة','الإفصاح','ترك السيطرة'] },
  { name:'القوس', symbol:'♐︎', element:'نار', quality:'ذو جسدين', ruler:'المشتري', dates:'٢٢ نوفمبر — ٢١ ديسمبر', summary:'الاستكشاف وتوسيع الأفق والبحث عن المعنى.', strengths:['التفاؤل','الصراحة','حب المعرفة'], balance:['الالتزام','مراعاة التفاصيل','اختيار الكلمات'] },
  { name:'الجدي', symbol:'♑︎', element:'تراب', quality:'منقلب', ruler:'زحل', dates:'٢٢ ديسمبر — ١٩ يناير', summary:'المسؤولية وبناء النتائج على المدى الطويل.', strengths:['الانضباط','التحمل','الطموح'], balance:['الراحة','المرونة','التعبير عن الاحتياج'] },
  { name:'الدلو', symbol:'♒︎', element:'هواء', quality:'ثابت', ruler:'زحل', dates:'٢٠ يناير — ١٨ فبراير', summary:'الاستقلال الفكري ورؤية الأنظمة من زاوية مختلفة.', strengths:['الابتكار','الاستقلال','الاهتمام بالمجتمع'], balance:['القرب العاطفي','المرونة','تحويل الفكرة إلى فعل'] },
  { name:'الحوت', symbol:'♓︎', element:'ماء', quality:'ذو جسدين', ruler:'المشتري', dates:'١٩ فبراير — ٢٠ مارس', summary:'الخيال والتعاطف والقدرة على التكيف مع المحيط.', strengths:['الرحمة','الخيال','المرونة'], balance:['الحدود','الواقعية','وضوح القرار'] },
]);

export const ELEMENT_GUIDE = Object.freeze({
  نار: { label:'الحركة والإقدام', text:'يرمز تراثيًا إلى النشاط والتعبير والمبادرة.' },
  تراب: { label:'البناء والثبات', text:'يرمز تراثيًا إلى الواقع والمادة والاستقرار.' },
  هواء: { label:'الفكر والتواصل', text:'يرمز تراثيًا إلى العقل واللغة والعلاقات.' },
  ماء: { label:'الشعور والاستجابة', text:'يرمز تراثيًا إلى الوجدان والحدس والاحتواء.' },
});

export const QUALITY_GUIDE = Object.freeze({
  منقلب: 'بداية ودفع وتغيير اتجاه.',
  ثابت: 'استمرار وتركيز وحفظ للطاقة.',
  'ذو جسدين': 'تكيّف وانتقال وجمع بين وجهين.',
});

export function zodiacFromNumber(number) {
  if (!number) return null;
  const index = ((number - 1) % 12 + 12) % 12;
  return { ...ZODIAC_DETAILS[index], number:index + 1 };
}

export function zodiacFromDate(value) {
  if (!value) return null;
  const [, monthRaw, dayRaw] = String(value).split('-').map(Number);
  if (!monthRaw || !dayRaw) return null;
  const md = monthRaw * 100 + dayRaw;
  const number = md >= 321 && md <= 419 ? 1
    : md >= 420 && md <= 520 ? 2
    : md >= 521 && md <= 620 ? 3
    : md >= 621 && md <= 722 ? 4
    : md >= 723 && md <= 822 ? 5
    : md >= 823 && md <= 922 ? 6
    : md >= 923 && md <= 1022 ? 7
    : md >= 1023 && md <= 1121 ? 8
    : md >= 1122 && md <= 1221 ? 9
    : md >= 1222 || md <= 119 ? 10
    : md >= 120 && md <= 218 ? 11
    : 12;
  return zodiacFromNumber(number);
}

export const ZODIAC_SOURCES = Object.freeze([
  ['SCIAMVS', 'نشر أكاديمي لطريقة الأسماء والباقي ١–١٢ وبيوت الكواكب', 'https://sciamvs.org/files/SCIAMVS_19_167-200_Thomann.pdf'],
  ['مكتبة قطر الرقمية', 'مخطوط عربي: الاسم واسم الأم، والطبائع والكيفيات', 'https://www.qdl.qa/en/archive/81055/vdc_100088125470.0x00000e'],
  ['المكتبة الوطنية الأمريكية للطب', 'توثيق استعمال قيم الأسماء والبروج في مخطوطات الفراسة', 'https://sites.wip.nlm.nih.gov/hmd/arabic/physiognomy2.html'],
  ['متحف المتروبوليتان', 'الفلك والتنجيم وصور الأبراج في العالم الإسلامي الوسيط', 'https://www.metmuseum.org/essays/astronomy-and-astrology-in-the-medieval-islamic-world'],
  ['متحف Getty', 'الفترات الحديثة للأبراج وسياقها التاريخي الوسيط', 'https://www.getty.edu/news/written-in-the-stars-astronomy-and-astrology-in-medieval-manuscripts/'],
  ['الجمعية الأمريكية لعلم النفس', 'تعريف التنجيم وغياب الدليل على تأثيره في الشخصية', 'https://dictionary.apa.org/astrology'],
  ['PubMed', 'اختبار مزدوج التعمية لم يجد قدرة للخرائط الفلكية على وصف الشخصية', 'https://pubmed.ncbi.nlm.nih.gov/18649494/'],
  ['دار الإفتاء المصرية', 'فتوى رسمية بشأن الاعتقاد بالأبراج وقراءة الطالع', 'https://www.dar-alifta.org/en/fatwa/details/7985/are-muslims-allowed-to-believe-in-palmistry-and-horoscopes'],
]);
