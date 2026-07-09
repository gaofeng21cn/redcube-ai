import { createOverlayRegistry } from '@redcube/overlay-core';

import { posterOnepagerOverlay } from './families/poster-onepager/overlay/index.js';
import { runPosterOnepagerRoute } from './families/poster-onepager/index.js';
import { pptDeckOverlay } from './families/ppt/overlay/index.js';
import { runPptDeckRoute } from './families/ppt/index.js';
import { xiaohongshuOverlay } from './families/xiaohongshu/overlay/index.js';
import { runXiaohongshuRoute } from './families/xiaohongshu/index.js';

import type {
  OverlayCatalogEntry,
  OverlayDefinition,
  OverlayRegistry,
} from '@redcube/overlay-core';

export interface OverlayCatalogSurface {
  surface_kind: 'overlay_catalog';
  overlays: OverlayCatalogEntry[];
}

export type DefaultOverlayCatalogSurface = OverlayCatalogSurface;

const defaultOverlayTable: Record<string, OverlayDefinition> = {
  ppt_deck: pptDeckOverlay as unknown as OverlayDefinition,
  xiaohongshu: xiaohongshuOverlay as unknown as OverlayDefinition,
  poster_onepager: posterOnepagerOverlay as unknown as OverlayDefinition,
};

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
}

export interface LoadedRuntimeFamilyRunner extends RuntimeFamilyModuleSpec {
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

interface RuntimeFamilyModuleEntry extends RuntimeFamilyModuleSpec {
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

const defaultRuntimeFamilyModules: RuntimeFamilyModuleEntry[] = [
  {
    overlay_id: 'ppt_deck',
    deliverable_kind: 'ppt_deck',
    runner_id: 'families/ppt',
    runRoute: runPptDeckRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlay_id: 'xiaohongshu',
    deliverable_kind: 'xiaohongshu_note',
    runner_id: 'families/xiaohongshu',
    runRoute: runXiaohongshuRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlay_id: 'poster_onepager',
    deliverable_kind: 'poster_onepager',
    runner_id: 'families/poster-onepager',
    runRoute: runPosterOnepagerRoute as (...args: unknown[]) => Promise<unknown>,
  },
];

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function publicRuntimeFamilyModule(spec: RuntimeFamilyModuleEntry): RuntimeFamilyModuleSpec {
  return {
    overlay_id: safeText(spec.overlay_id),
    deliverable_kind: safeText(spec.deliverable_kind),
    runner_id: safeText(spec.runner_id),
  };
}

export function listDefaultRuntimeFamilyModules(): RuntimeFamilyModuleSpec[] {
  return defaultRuntimeFamilyModules.map((spec) => publicRuntimeFamilyModule(spec));
}

export function resolveRuntimeFamilyModule(contract: RuntimeFamilyContract): RuntimeFamilyModuleSpec {
  const overlayId = safeText(contract?.overlay);
  const deliverableKind = safeText(contract?.deliverable_kind);
  const spec = defaultRuntimeFamilyModules.find((entry) => (
    (overlayId && entry.overlay_id === overlayId)
    || (deliverableKind && entry.deliverable_kind === deliverableKind)
  ));

  if (!spec) {
    throw new Error(
      `Unsupported runtime family: overlay=${overlayId || '<missing>'}, deliverable_kind=${deliverableKind || '<missing>'}`,
    );
  }

  return publicRuntimeFamilyModule(spec);
}

export async function loadRuntimeFamilyRunner(contract: RuntimeFamilyContract): Promise<LoadedRuntimeFamilyRunner> {
  const registryEntry = defaultRuntimeFamilyModules.find((entry) => {
    const overlayId = safeText(contract?.overlay);
    const deliverableKind = safeText(contract?.deliverable_kind);
    return (overlayId && entry.overlay_id === overlayId)
      || (deliverableKind && entry.deliverable_kind === deliverableKind);
  });
  if (!registryEntry) {
    throw new Error(
      `Unsupported runtime family: overlay=${safeText(contract?.overlay) || '<missing>'}, deliverable_kind=${safeText(contract?.deliverable_kind) || '<missing>'}`,
    );
  }

  return {
    ...publicRuntimeFamilyModule(registryEntry),
    runRoute: registryEntry.runRoute,
  };
}

export type {
  OverlayCatalogEntry,
};
