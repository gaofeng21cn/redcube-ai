import { createOverlayRegistry } from '@redcube/overlay-core';

import { runPosterOnepagerRoute } from './families/poster-onepager/index.js';
import { runPptDeckRoute } from './families/ppt/index.js';
import { runXiaohongshuRoute } from './families/xiaohongshu/index.js';

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

export type DefaultOverlayCatalogSurface = OverlayCatalogSurface;

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

export interface RuntimeFamilyContract {
  overlay?: string;
  deliverable_kind?: string;
}

export interface RuntimeFamilyModuleSpec {
  overlay_id: string;
  deliverable_kind: string;
  runner_id: string;
  export_name: string;
}

export interface RuntimeFamilyCatalogSurface {
  surface_kind: 'runtime_family_catalog';
  families: RuntimeFamilyModuleSpec[];
}

export type DefaultRuntimeFamilyCatalogSurface = RuntimeFamilyCatalogSurface;

export interface LoadedRuntimeFamilyRunner extends RuntimeFamilyModuleSpec {
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

interface RuntimeFamilyModuleManifestSpec {
  overlayId: string;
  deliverableKind: string;
  runnerId: string;
  exportName: string;
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

const defaultRuntimeFamilyModules: RuntimeFamilyModuleManifestSpec[] = [
  {
    overlayId: 'ppt_deck',
    deliverableKind: 'ppt_deck',
    runnerId: 'families/ppt',
    exportName: 'runPptDeckRoute',
    runRoute: runPptDeckRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlayId: 'xiaohongshu',
    deliverableKind: 'xiaohongshu_note',
    runnerId: 'families/xiaohongshu',
    exportName: 'runXiaohongshuRoute',
    runRoute: runXiaohongshuRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlayId: 'poster_onepager',
    deliverableKind: 'poster_onepager',
    runnerId: 'families/poster-onepager',
    exportName: 'runPosterOnepagerRoute',
    runRoute: runPosterOnepagerRoute as (...args: unknown[]) => Promise<unknown>,
  },
];

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function buildCatalogEntry(spec: RuntimeFamilyModuleManifestSpec): RuntimeFamilyModuleSpec {
  return {
    overlay_id: safeText(spec.overlayId),
    deliverable_kind: safeText(spec.deliverableKind),
    runner_id: safeText(spec.runnerId),
    export_name: safeText(spec.exportName),
  };
}

export function listDefaultRuntimeFamilyModules(): RuntimeFamilyModuleSpec[] {
  return defaultRuntimeFamilyModules.map((spec) => buildCatalogEntry(spec));
}

export function getDefaultRuntimeFamilyCatalog(): DefaultRuntimeFamilyCatalogSurface {
  return {
    surface_kind: 'runtime_family_catalog',
    families: listDefaultRuntimeFamilyModules(),
  };
}

export function resolveRuntimeFamilyModule(contract: RuntimeFamilyContract): RuntimeFamilyModuleSpec {
  const overlayId = safeText(contract?.overlay);
  const deliverableKind = safeText(contract?.deliverable_kind);
  const spec = listDefaultRuntimeFamilyModules().find((entry) => (
    (overlayId && entry.overlay_id === overlayId)
    || (deliverableKind && entry.deliverable_kind === deliverableKind)
  ));

  if (!spec) {
    throw new Error(
      `Unsupported runtime family: overlay=${overlayId || '<missing>'}, deliverable_kind=${deliverableKind || '<missing>'}`,
    );
  }

  return spec;
}

export async function loadRuntimeFamilyRunner(contract: RuntimeFamilyContract): Promise<LoadedRuntimeFamilyRunner> {
  const runnerRef = resolveRuntimeFamilyModule(contract);
  const registryEntry = defaultRuntimeFamilyModules.find((entry) => entry.runnerId === runnerRef.runner_id);
  if (!registryEntry) {
    throw new Error(`Runtime family runner is not declared in the default registry: ${runnerRef.runner_id}`);
  }

  return {
    ...runnerRef,
    runRoute: registryEntry.runRoute,
  };
}

export type {
  OverlayCatalogEntry,
};
