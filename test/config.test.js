import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ZODIAC_SOURCES } from '../src/zodiac.js';
import { serviceWorkerCacheName } from '../src/version.js';
import { PRODUCTION_CONNECT_SRC, VITE_DEV_WS_ORIGINS, applyDevConnectSrc, withViteDevWebSockets } from '../vite.config.js';

const root = new URL('../', import.meta.url);

test('صلاحيات تطبيق ويندوز تسمح بكل روابط المصادر المعروضة', async () => {
  const capability = JSON.parse(await readFile(new URL('src-tauri/capabilities/default.json', root), 'utf8'));
  const permission = capability.permissions.find(item => typeof item === 'object' && item.identifier === 'opener:allow-open-url');
  const allowed = new Set(permission?.allow?.map(item => item.url) || []);
  for (const [, , url] of ZODIAC_SOURCES) assert.ok(allowed.has(url), `الرابط غير مسموح: ${url}`);
});

test('عامل الخدمة يطابق إصدار الحزمة ولا يخزن الأخطاء أو يعيد HTML لملفات JavaScript', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const source = await readFile(new URL('public/sw.js', root), 'utf8');
  const expected = serviceWorkerCacheName(pkg.version);
  assert.match(source, new RegExp(`CACHE_NAME = '${expected}'`));
  assert.match(source, /event\.request\.mode === 'navigate'/);
  assert.match(source, /response\.ok/);
  assert.doesNotMatch(source, /atlas-al-huruf-icon\.png/);
  assert.doesNotMatch(source, /cached\s*\|\|\s*caches\.match\(['"]\.\/index\.html/);
});

test('نسخة الويب تضع سياسة أمان للمحتوى وتستخدم أيقونة هيدر خفيفة', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const main = await readFile(new URL('src/main.js', root), 'utf8');
  const vite = await readFile(new URL('vite.config.js', root), 'utf8');
  const manifest = await readFile(new URL('public/manifest.webmanifest', root), 'utf8');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /object-src 'none'/);
  assert.doesNotMatch(html, /connect-src[^"]*ws:/);
  assert.match(vite, /http:\/\/ipc\.localhost/);
  assert.match(vite, /ws:\/\/127\.0\.0\.1:5173/);
  assert.match(vite, /ws:\/\/localhost:5173/);
  assert.doesNotMatch(vite, /\[[^\]]*\]\(https?:\/\//);
  assert.doesNotMatch(vite, /connect-src[^;]*\sWS:(?:\s|;|"|'|$)/i);
  assert.match(main, /\.\/icons\/icon-192\.png/);
  assert.doesNotMatch(main, /assets\/atlas-al-huruf-icon\.png/);
  assert.doesNotMatch(main, /الموجودة بالأعلى/);
  assert.doesNotMatch(manifest, /any maskable/);
  assert.match(manifest, /"purpose": "any"/);
});

test('سياسة التطوير تضيف فقط عناوين WebSocket المحلية لـ Vite', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const productionConnect = html.match(/connect-src([^;"]*)/)[1].trim().split(/\s+/);
  assert.ok(!productionConnect.includes('ws:'));
  assert.ok(!productionConnect.includes('wss:'));
  assert.ok(!productionConnect.some(token => token.startsWith('ws:')));

  const { html: devHtml, applied } = applyDevConnectSrc(html);
  assert.equal(applied, true);
  const devConnect = devHtml.match(/connect-src([^;"]*)/)[1].trim().split(/\s+/);
  assert.ok(!devConnect.includes('ws:'));
  assert.deepEqual(
    VITE_DEV_WS_ORIGINS.filter(origin => !productionConnect.includes(origin)),
    VITE_DEV_WS_ORIGINS,
  );
  for (const origin of VITE_DEV_WS_ORIGINS) assert.ok(devConnect.includes(origin));
  assert.deepEqual(
    withViteDevWebSockets(PRODUCTION_CONNECT_SRC),
    `${PRODUCTION_CONNECT_SRC} ws://127.0.0.1:5173 ws://localhost:5173`,
  );
  const { html: prodPath } = applyDevConnectSrc(html);
  assert.match(prodPath, /ws:\/\/127\.0\.0\.1:5173/);
  assert.doesNotMatch(html, /ws:\/\/127\.0\.0\.1:5173/);
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
  assert.match(main, /planetDisclosureId/);
  assert.match(main, /restoredDisclosures/);
  assert.match(main, /createNatalChartCache/);
  assert.match(main, /aria-invalid="true"/);
  assert.match(main, /aria-describedby="birth-date-error"/);
  assert.match(main, /maybeFocusBirthDateError/);
});
