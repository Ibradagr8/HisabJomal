import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  clearScreen: false,
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: 'release-web', emptyOutDir: true, target: 'es2021' },
});
