export function runReferenceChecks({ analyze, zodiacFromNumber, zodiacFromDate, parseBirthDate }) {
  const totals = [
    ['بسم الله الرحمن الرحيم', 786],
    ['﷽', 786],
    ['داود', 15],
    ['جالوت', 440],
    ['محمد', 92],
    ['فاطمة', 530],
    ['أإآء', 4],
  ];
  const totalsPassed = totals.filter(([text, expected]) => analyze(text).total === expected).length;
  const remainderZeroPassed = analyze('يب').total === 12
    && zodiacFromNumber(0).name === 'الحوت'
    && zodiacFromNumber(12).name === 'الحوت';
  const heritagePassed = zodiacFromNumber((92 + 530) % 12).name === 'الجدي';
  const datePassed = zodiacFromDate('1990-04-01').name === 'الحمل'
    && parseBirthDate('١', '٤', '١٩٩٠').sign.name === 'الحمل';
  const checks = totals.length + 3;
  const passed = totalsPassed + Number(remainderZeroPassed) + Number(heritagePassed) + Number(datePassed);
  return { passed, checks, ok: passed === checks };
}
