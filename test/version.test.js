import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { serviceWorkerCacheName } from '../src/version.js';

test('اسم كاش عامل الخدمة يُشتق من رقم الإصدار', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(serviceWorkerCacheName('0.1.10'), 'atlas-al-huruf-v0110');
  assert.equal(serviceWorkerCacheName('0.1.8'), 'atlas-al-huruf-v018');
  assert.equal(serviceWorkerCacheName(pkg.version), `atlas-al-huruf-v${pkg.version.replaceAll('.', '')}`);
});
