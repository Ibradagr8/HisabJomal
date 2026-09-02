export function restoredDisclosures({ previousMode, nextMode, openKeys = [] }) {
  if (previousMode === 'full' && nextMode === 'simple') return [];
  return [...openKeys];
}

export function detailsShouldStartOpen(detailMode) {
  return detailMode === 'full';
}

export function planetDisclosureId(planetKey) {
  return `planet-reading-${String(planetKey || '')}`;
}
