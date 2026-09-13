// Usage: npm run bump -- 0.1.12
// يوحد رقم الإصدار في كل الملفات من مصدر واحد (argument سطر الأوامر).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = new URL('..', import.meta.url);
const next = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(next || '')) {
  console.error('Usage: npm run bump -- <x.y.z>  (مثال: npm run bump -- 0.1.12)');
  process.exit(1);
}

function editJson(path, mutate) {
  const file = new URL(path, root);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  mutate(data);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

editJson('package.json', data => { data.version = next; });
editJson('package-lock.json', data => {
  data.version = next;
  if (data.packages?.['']) data.packages[''].version = next;
});

// tauri.conf.json يستخدم تنسيقًا مضغوطًا للمصفوفات، فنستبدل السطر جراحيًا للحفاظ على التنسيق.
const tauriFile = new URL('src-tauri/tauri.conf.json', root);
writeFileSync(tauriFile, readFileSync(tauriFile, 'utf8').replace(/"version":\s*"\d+\.\d+\.\d+"/, `"version": "${next}"`));

const cargoFile = new URL('src-tauri/Cargo.toml', root);
writeFileSync(cargoFile, readFileSync(cargoFile, 'utf8').replace(/^version = "\d+\.\d+\.\d+"$/m, `version = "${next}"`));

const cacheName = `atlas-al-huruf-v${next.replaceAll('.', '')}`;
const swFile = new URL('public/sw.js', root);
writeFileSync(swFile, readFileSync(swFile, 'utf8').replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = '${cacheName}';`));

console.log(`Bumped to ${next} (package.json, package-lock.json, tauri.conf.json, Cargo.toml, sw.js)`);
