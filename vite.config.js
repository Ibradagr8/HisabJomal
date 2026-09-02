import { defineConfig } from 'vite';

export const PRODUCTION_CONNECT_SRC = "connect-src 'self' ipc: http://ipc.localhost";

export const VITE_DEV_WS_ORIGINS = Object.freeze([
  'ws://127.0.0.1:5173',
  'ws://localhost:5173',
]);

export function withViteDevWebSockets(policy) {
  const origins = VITE_DEV_WS_ORIGINS.filter(origin => origin.startsWith('ws://') && origin !== 'ws:');
  if (!/connect-src\b/i.test(policy)) {
    return `${policy.trim().replace(/;?\s*$/, '')}; connect-src ${origins.join(' ')}`;
  }
  return policy.replace(/connect-src\b([^;]*)/i, (_directive, sources) => {
    const tokens = sources.trim().split(/\s+/).filter(Boolean);
    for (const origin of origins) {
      if (!tokens.includes(origin) && origin !== 'ws:' && origin !== 'wss:') tokens.push(origin);
    }
    return `connect-src ${tokens.join(' ')}`;
  });
}

export function applyDevConnectSrc(html) {
  const meta = html.match(/<meta\b[^>]*\bhttp-equiv=(["'])Content-Security-Policy\1[^>]*>/i);
  if (!meta) return { html, applied: false };
  const tag = meta[0];
  const content = tag.match(/\bcontent=(["'])([\s\S]*?)\1/i);
  if (!content) return { html, applied: false };
  const quote = content[1];
  const nextPolicy = withViteDevWebSockets(content[2]);
  const nextTag = tag.replace(content[0], `content=${quote}${nextPolicy}${quote}`);
  return { html: html.replace(tag, nextTag), applied: nextPolicy !== content[2] };
}

export default defineConfig({
  base: './',
  clearScreen: false,
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: 'release-web', emptyOutDir: true, target: 'es2021' },
  plugins: [
    {
      name: 'dev-vite-websocket-csp',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (!ctx.server) return html;
          const { html: next, applied } = applyDevConnectSrc(html);
          const hasLocalSockets = VITE_DEV_WS_ORIGINS.every(origin => next.includes(origin));
          if (!applied && !hasLocalSockets) {
            throw new Error('تعذّر إضافة عناوين WebSocket الخاصة بـ Vite إلى سياسة أمان المحتوى');
          }
          return next;
        },
      },
    },
  ],
});
