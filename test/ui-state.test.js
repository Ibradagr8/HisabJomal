import test from 'node:test';
import assert from 'node:assert/strict';
import { detailsShouldStartOpen, planetDisclosureId, restoredDisclosures } from '../src/ui-state.js';

test('العرض الكامل يفتح التفاصيل المطلوبة', () => {
  assert.equal(detailsShouldStartOpen('full'), true);
  assert.equal(detailsShouldStartOpen('simple'), false);
});

test('العودة من الكامل إلى المبسط تغلق الأقسام التي فُتحت تلقائيًا', () => {
  const openKeys = ['panel-القراءة المركبة', 'panel-الكواكب السبعة', 'calculator-details'];
  assert.deepEqual(restoredDisclosures({ previousMode: 'full', nextMode: 'simple', openKeys }), []);
});

test('إعادة الرسم أثناء الكتابة لا تغلق قسمًا فتحه المستخدم في الوضع نفسه', () => {
  const openKeys = ['comparison-details', 'calculator-word-0'];
  assert.deepEqual(restoredDisclosures({ previousMode: 'simple', nextMode: 'simple', openKeys }), openKeys);
  assert.deepEqual(restoredDisclosures({ previousMode: 'full', nextMode: 'full', openKeys }), openKeys);
});

test('الانتقال من المبسط إلى الكامل يفتح الأقسام حسب وضع العرض الكامل', () => {
  assert.equal(detailsShouldStartOpen('full'), true);
  assert.deepEqual(restoredDisclosures({ previousMode: 'simple', nextMode: 'full', openKeys: ['comparison-details'] }), ['comparison-details']);
});

test('مفتاح تفاصيل الكوكب ثابت على المعرّف وليس النص أو الترتيب', () => {
  assert.equal(planetDisclosureId('mercury'), 'planet-reading-mercury');
  assert.equal(planetDisclosureId('venus'), 'planet-reading-venus');
  assert.notEqual(planetDisclosureId('mercury'), planetDisclosureId('venus'));
});
