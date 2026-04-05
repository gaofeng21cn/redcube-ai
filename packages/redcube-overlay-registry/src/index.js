import { createOverlayRegistry } from '@redcube/overlay-core';
import { pptDeckOverlay } from '@redcube/overlay-ppt';
import { xiaohongshuOverlay } from '@redcube/overlay-xiaohongshu';

export function getDefaultOverlayRegistry() {
  return createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
    xiaohongshu: xiaohongshuOverlay,
  });
}

export function getDefaultOverlayCatalog() {
  const registry = getDefaultOverlayRegistry();
  return {
    surface_kind: 'overlay_catalog',
    overlays: registry.listOverlayCatalog(),
  };
}
