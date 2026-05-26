import { createOverlayRegistry } from '@redcube/overlay-core';
import packageJsonData from '../package.json' with { type: 'json' };

import type {
  DefaultOverlayCatalogSurface,
  DefaultOverlayModuleSpec,
} from './types.js';
import type {
  OverlayDefinition,
  OverlayRegistry,
} from '@redcube/overlay-core';

interface OverlayRegistryPackageJson {
  redcube?: {
    defaultOverlayModules?: DefaultOverlayModuleSpec[];
  };
}

const packageJson = packageJsonData as OverlayRegistryPackageJson;
const defaultOverlayModuleLoaders: Record<string, () => Promise<Record<string, unknown>>> = {
  '@redcube/overlay-ppt': async () => await import('@redcube/overlay-ppt') as Record<string, unknown>,
  '@redcube/overlay-xiaohongshu': async () => await import('@redcube/overlay-xiaohongshu') as Record<string, unknown>,
  '@redcube/overlay-poster-onepager': async () => await import('@redcube/overlay-poster-onepager') as Record<string, unknown>,
};

function isOverlayDefinition(value: unknown): value is OverlayDefinition {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as { overlayId?: unknown }).overlayId === 'string';
}

async function loadDefaultOverlayEntries(): Promise<Array<readonly [string, OverlayDefinition]>> {
  const specs = packageJson.redcube?.defaultOverlayModules || [];
  return Promise.all(specs.map(async ({ overlayId, module, exportName }) => {
    const loader = defaultOverlayModuleLoaders[module];
    if (!loader) {
      throw new Error(`Overlay module is not declared as a direct registry dependency: ${module}`);
    }
    const namespace = await loader();
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
  DefaultOverlayCatalogSurface,
  DefaultOverlayModuleSpec,
} from './types.js';
