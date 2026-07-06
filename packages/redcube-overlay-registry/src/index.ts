import { createOverlayRegistry } from '@redcube/overlay-core';

import type {
  OverlayCatalogEntry,
  OverlayDefinition,
  OverlayRegistry,
} from '@redcube/overlay-core';

export interface DefaultOverlayModuleSpec {
  overlayId: string;
  module: string;
  exportName: string;
}

export interface OverlayCatalogSurface {
  surface_kind: 'overlay_catalog';
  overlays: OverlayCatalogEntry[];
}

export interface DefaultOverlayCatalogSurface extends OverlayCatalogSurface {}

interface DefaultOverlayRegistryEntry extends DefaultOverlayModuleSpec {
  load: () => Promise<Record<string, unknown>>;
}

const defaultOverlayModules: DefaultOverlayRegistryEntry[] = [
  {
    overlayId: 'ppt_deck',
    module: '@redcube/overlay-ppt',
    exportName: 'pptDeckOverlay',
    load: async () => await import('@redcube/overlay-ppt') as Record<string, unknown>,
  },
  {
    overlayId: 'xiaohongshu',
    module: '@redcube/overlay-xiaohongshu',
    exportName: 'xiaohongshuOverlay',
    load: async () => await import('@redcube/overlay-xiaohongshu') as Record<string, unknown>,
  },
  {
    overlayId: 'poster_onepager',
    module: '@redcube/overlay-poster-onepager',
    exportName: 'posterOnepagerOverlay',
    load: async () => await import('@redcube/overlay-poster-onepager') as Record<string, unknown>,
  },
];

function isOverlayDefinition(value: unknown): value is OverlayDefinition {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as { overlayId?: unknown }).overlayId === 'string';
}

async function loadDefaultOverlayEntries(): Promise<Array<readonly [string, OverlayDefinition]>> {
  return Promise.all(defaultOverlayModules.map(async ({ overlayId, module, exportName, load }) => {
    const namespace = await load();
    const overlay = namespace?.[exportName];
    if (!isOverlayDefinition(overlay)) {
      throw new Error(`Overlay export not found: ${module}#${exportName}`);
    }
    if (overlay.overlayId !== overlayId) {
      throw new Error(`Overlay manifest mismatch: expected ${overlayId}, got ${overlay.overlayId}`);
    }
    return [overlayId, overlay] as const;
  }));
}

export function listDefaultOverlayModules(): DefaultOverlayModuleSpec[] {
  return defaultOverlayModules.map(({ overlayId, module, exportName }) => ({
    overlayId,
    module,
    exportName,
  }));
}

const defaultOverlayEntries = await loadDefaultOverlayEntries();
const defaultOverlayTable: Record<string, OverlayDefinition> = Object.fromEntries(defaultOverlayEntries);

export function getDefaultOverlayRegistry(): OverlayRegistry {
  return createOverlayRegistry(defaultOverlayTable);
}

export function getDefaultOverlayCatalog(): DefaultOverlayCatalogSurface {
  const registry = getDefaultOverlayRegistry();
  return {
    surface_kind: 'overlay_catalog',
    overlays: registry.listOverlayCatalog(),
  };
}

export type {
  OverlayCatalogEntry,
};
