import { createOverlayRegistry } from '@redcube/overlay-core';
import packageJson from '../package.json' with { type: 'json' };

async function loadDefaultOverlayEntries() {
  const specs = packageJson.redcube?.defaultOverlayModules || [];
  return Promise.all(specs.map(async ({ overlayId, module, exportName }) => {
    const namespace = await import(module);
    const overlay = namespace?.[exportName];
    if (!overlay) {
      throw new Error(`Overlay export not found: ${module}#${exportName}`);
    }
    if (overlay.overlayId !== overlayId) {
      throw new Error(`Overlay manifest mismatch: expected ${overlayId}, got ${overlay.overlayId}`);
    }
    return [overlayId, overlay];
  }));
}

const defaultOverlayEntries = await loadDefaultOverlayEntries();
const defaultOverlayTable = Object.fromEntries(defaultOverlayEntries);

export function getDefaultOverlayRegistry() {
  return createOverlayRegistry(defaultOverlayTable);
}

export function getDefaultOverlayCatalog() {
  const registry = getDefaultOverlayRegistry();
  return {
    surface_kind: 'overlay_catalog',
    overlays: registry.listOverlayCatalog(),
  };
}
