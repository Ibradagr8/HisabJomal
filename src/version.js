export function serviceWorkerCacheName(version) {
  return `atlas-al-huruf-v${String(version).replaceAll('.', '')}`;
}
