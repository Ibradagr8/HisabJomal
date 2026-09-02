export function sourceOpenFailureMessage(copied) {
  return copied
    ? 'تعذّر فتح المتصفح؛ تم نسخ رابط المصدر'
    : 'تعذّر فتح المتصفح وتعذّر نسخ الرابط';
}

export async function openTrustedSource(url, deps = {}) {
  const {
    isAllowed = () => false,
    isTauriApp = () => false,
    openUrl = async () => {},
    openPopup = () => null,
    copyText = async () => false,
  } = deps;
  if (!isAllowed(url)) return { ok: false, copied: false, message: 'رابط المصدر غير معتمد' };
  try {
    if (isTauriApp()) await openUrl(url);
    else {
      const popup = openPopup(url);
      if (!popup) throw new Error('popup blocked');
    }
    return { ok: true, copied: false, message: null };
  } catch {
    const copied = await copyText(url);
    return { ok: false, copied, message: sourceOpenFailureMessage(copied) };
  }
}
