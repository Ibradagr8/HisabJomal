import { cp, mkdir } from 'node:fs/promises';

await mkdir('release-web', { recursive: true });
await Promise.all([
  ...['index.html', 'app.js', 'app.css'].map(file => cp(file, `release-web/${file}`)),
  cp('assets', 'release-web/assets', { recursive: true }),
]);
