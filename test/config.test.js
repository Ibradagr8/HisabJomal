import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ZODIAC_SOURCES } from '../src/zodiac.js';

const root = new URL('../', import.meta.url);

test('صلاحيات تطبيق ويندوز تسمح بكل روابط المصادر المعروضة', async () => {
  const capability = JSON.parse(await readFile(new URL('src-tauri/capabilities/default.json', root), 'utf8'));
  const permission = capability.permissions.find(item => typeof item === 'object' && item.identifier === 'opener:allow-open-url');
  const allowed = new Set(permission?.allow?.map(item => item.url) || []);
  for (const [, , url] of ZODIAC_SOURCES) assert.ok(allowed.has(url), `الرابط غير مسموح: ${url}`);
});

test('عامل الخدمة لا يخزن الأخطاء أو روابط المشاركة ولا يعيد HTML لملفات JavaScript', async () => {
  const source = await readFile(new URL('public/sw.js', root), 'utf8');
  assert.match(source, /atlas-al-huruf-v0110/);
  assert.match(source, /event\.request\.mode === 'navigate'/);
  assert.match(source, /response\.ok/);
  assert.doesNotMatch(source, /atlas-al-huruf-icon\.png/);
  assert.doesNotMatch(source, /cached\s*\|\|\s*caches\.match\(['"]\.\/index\.html/);
});

test('نسخة الويب تضع سياسة أمان للمحتوى وتستخدم أيقونة هيدر خفيفة', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const main = await readFile(new URL('src/main.js', root), 'utf8');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /object-src 'none'/);
  assert.match(main, /\.\/icons\/icon-192\.png/);
  assert.doesNotMatch(main, /assets\/atlas-al-huruf-icon\.png/);
});

test('أزرار المسح مميزة بصريًا في جميع الشاشات', async () => {
  const styles = await readFile(new URL('src/styles.css', root), 'utf8');
  assert.match(styles, /button\.btn\[data-clear\]/);
  assert.match(styles, /button\.btn\[data-reset-storage\]/);
  assert.match(styles, /:focus-visible/);
});

test('الواجهة خالية من التصدير ونسخ الرابط وتعرض ثلاثة أمثلة فقط', async () => {
  const main = await readFile(new URL('src/main.js', root), 'utf8');
  assert.doesNotMatch(main, /تصدير بطاقة|نسخ الرابط|data-export|data-copy-link|exportCard|copyShareLink/);
  assert.doesNotMatch(main, /نسخ النتيجة|نسخ المقارنة|data-copy-(?:result|comparison|zodiac)|السجل|data-history|recordHistory/);
  assert.doesNotMatch(main, /data-(?:name|parent|zodiac|natal)-example/);
  assert.match(main, /\['بسم الله الرحمن الرحيم','محمد','داود'\]\.map/);
});
