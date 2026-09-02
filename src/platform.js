export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

export async function copyText(text, clipboard = globalThis.navigator?.clipboard, doc = globalThis.document) {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(String(text));
      return true;
    } catch {
      // بعض إصدارات WebView2 تمنع Clipboard API؛ نستخدم بديلًا محليًا آمنًا.
    }
  }
  if (!doc?.body || typeof doc.execCommand !== 'function') return false;
  const area = doc.createElement('textarea');
  area.value = String(text);
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  doc.body.append(area);
  area.select();
  let copied = false;
  try { copied = doc.execCommand('copy'); } catch { copied = false; }
  area.remove();
  return copied;
}
