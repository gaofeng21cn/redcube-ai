import { createOverlayRegistry } from '@redcube/overlay-core';
import { posterOnepagerOverlay } from '@redcube/overlay-poster-onepager';
import { pptDeckOverlay } from '@redcube/overlay-ppt';
import { xiaohongshuOverlay } from '@redcube/overlay-xiaohongshu';

import { runPosterOnepagerRoute } from './families/poster-onepager/index.js';
import { runPptDeckRoute } from './families/ppt/index.js';
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

export interface RuntimeFamilyCatalogSurface {
  surface_kind: 'runtime_family_catalog';
  owner_boundary: {
    generic_runtime_family_registry_owner: 'one-person-lab';
    rca_role: 'visual_route_family_handler_refs';
    rca_owns_generic_runtime: false;
    rca_owns_generic_registry: false;
    rca_owns_generic_attempt_ledger: false;
    retained_authority_refs: string[];
  };
  families: RuntimeFamilyModuleSpec[];
}

export interface LoadedRuntimeFamilyRunner extends RuntimeFamilyModuleSpec {
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

interface RuntimeFamilyModuleManifestSpec {
  overlayId: string;
  deliverableKind: string;
  runnerId: string;
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

const defaultRuntimeFamilyModules: RuntimeFamilyModuleManifestSpec[] = [
  {
    overlayId: 'ppt_deck',
    deliverableKind: 'ppt_deck',
    runnerId: 'families/ppt',
    runRoute: runPptDeckRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlayId: 'xiaohongshu',
    deliverableKind: 'xiaohongshu_note',
    runnerId: 'families/xiaohongshu',
    runRoute: runXiaohongshuRoute as (...args: unknown[]) => Promise<unknown>,
  },
  {
    overlayId: 'poster_onepager',
    deliverableKind: 'poster_onepager',
    runnerId: 'families/poster-onepager',
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
  };
}

export function listDefaultRuntimeFamilyModules(): RuntimeFamilyModuleSpec[] {
  return defaultRuntimeFamilyModules.map((spec) => buildCatalogEntry(spec));
}

export function getDefaultRuntimeFamilyCatalog(): RuntimeFamilyCatalogSurface {
  return {
    surface_kind: 'runtime_family_catalog',
    owner_boundary: {
      generic_runtime_family_registry_owner: 'one-person-lab',
      rca_role: 'visual_route_family_handler_refs',
      rca_owns_generic_runtime: false,
      rca_owns_generic_registry: false,
      rca_owns_generic_attempt_ledger: false,
      retained_authority_refs: [
        'visual_route_truth',
        'route_family_policy_refs',
        'review_export_gate_refs',
        'stage_artifact_refs',
      ],
    },
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
