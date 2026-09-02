import test from 'node:test';
import assert from 'node:assert/strict';
import { openTrustedSource, sourceOpenFailureMessage } from '../src/sources.js';

test('فتح المصدر الناجح لا ينسخ الرابط ولا يعرض رسالة فشل', async () => {
  const copied = [];
  const result = await openTrustedSource('https://example.com/source', {
    isAllowed: () => true,
    isTauriApp: () => true,
    openUrl: async () => {},
    copyText: async url => { copied.push(url); return true; },
  });
  assert.equal(result.ok, true);
  assert.equal(result.message, null);
  assert.deepEqual(copied, []);
});

test('فشل الفتح مع نجاح النسخ يعيد رسالة واحدة دون ادعاء كاذب', async () => {
  const result = await openTrustedSource('https://example.com/source', {
    isAllowed: () => true,
    isTauriApp: () => false,
    openPopup: () => null,
    copyText: async () => true,
  });
  assert.equal(result.ok, false);
  assert.equal(result.copied, true);
  assert.equal(result.message, 'تعذّر فتح المتصفح؛ تم نسخ رابط المصدر');
  assert.equal(result.message, sourceOpenFailureMessage(true));
});

test('فشل الفتح والنسخ معًا لا يدّعي أن الرابط نُسخ', async () => {
  const result = await openTrustedSource('https://example.com/source', {
    isAllowed: () => true,
    isTauriApp: () => false,
    openPopup: () => { throw new Error('blocked'); },
    copyText: async () => false,
  });
  assert.equal(result.ok, false);
  assert.equal(result.copied, false);
  assert.equal(result.message, 'تعذّر فتح المتصفح وتعذّر نسخ الرابط');
});
