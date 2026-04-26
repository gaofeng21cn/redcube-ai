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

function isOverlayDefinition(value: unknown): value is OverlayDefinition {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as { overlayId?: unknown }).overlayId === 'string';
}

async function loadDefaultOverlayEntries(): Promise<Array<readonly [string, OverlayDefinition]>> {
  const specs = packageJson.redcube?.defaultOverlayModules || [];
  return Promise.all(specs.map(async ({ overlayId, module, exportName }) => {
    const namespace = await import(module);
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
