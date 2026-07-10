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
  overlayDefinition: OverlayDefinition;
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

const defaultFamilyTable: RuntimeFamilyModuleEntry[] = [
  {
    overlay_id: 'ppt_deck',
    deliverable_kind: 'ppt_deck',
    runner_id: 'families/ppt',
    overlayDefinition: pptDeckOverlay as unknown as OverlayDefinition,
    runRoute: runPptDeckRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlay_id: 'xiaohongshu',
    deliverable_kind: 'xiaohongshu_note',
    runner_id: 'families/xiaohongshu',
    overlayDefinition: xiaohongshuOverlay as unknown as OverlayDefinition,
    runRoute: runXiaohongshuRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlay_id: 'poster_onepager',
    deliverable_kind: 'poster_onepager',
    runner_id: 'families/poster-onepager',
    overlayDefinition: posterOnepagerOverlay as unknown as OverlayDefinition,
    runRoute: runPosterOnepagerRoute as (...args: unknown[]) => Promise<unknown>,
  },
];

export interface OverlayCatalogSurface {
  surface_kind: 'overlay_catalog';
  overlays: OverlayCatalogEntry[];
}

export type DefaultOverlayCatalogSurface = OverlayCatalogSurface;

export function getDefaultOverlayRegistry(): OverlayRegistry {
  return createOverlayRegistry(Object.fromEntries(
    defaultFamilyTable.map(({ overlay_id, overlayDefinition }) => [overlay_id, overlayDefinition]),
  ));
}

export function getDefaultOverlayCatalog(): DefaultOverlayCatalogSurface {
  return {
    surface_kind: 'overlay_catalog',
    overlays: getDefaultOverlayRegistry().listOverlayCatalog(),
  };
}

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
  return defaultFamilyTable.map((spec) => publicRuntimeFamilyModule(spec));
}

function resolveRuntimeFamilyEntry(contract: RuntimeFamilyContract): RuntimeFamilyModuleEntry {
  const overlayId = safeText(contract?.overlay);
  const deliverableKind = safeText(contract?.deliverable_kind);
  const entry = defaultFamilyTable.find((candidate) => (
    (overlayId && candidate.overlay_id === overlayId)
    || (deliverableKind && candidate.deliverable_kind === deliverableKind)
  ));

  if (!entry) {
    throw new Error(
      `Unsupported runtime family: overlay=${overlayId || '<missing>'}, deliverable_kind=${deliverableKind || '<missing>'}`,
    );
  }

  return entry;
}

export function resolveRuntimeFamilyModule(contract: RuntimeFamilyContract): RuntimeFamilyModuleSpec {
  return publicRuntimeFamilyModule(resolveRuntimeFamilyEntry(contract));
}

export async function loadRuntimeFamilyRunner(contract: RuntimeFamilyContract): Promise<LoadedRuntimeFamilyRunner> {
  const registryEntry = resolveRuntimeFamilyEntry(contract);

  return {
    ...publicRuntimeFamilyModule(registryEntry),
    runRoute: registryEntry.runRoute,
  };
}

export type {
  OverlayCatalogEntry,
};
