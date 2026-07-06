export interface RuntimeFamilyContract {
  overlay?: string;
  deliverable_kind?: string;
}

export interface RuntimeFamilyModuleSpec {
  overlay_id: string;
  deliverable_kind: string;
  module_name: string;
  export_name: string;
}

export interface RuntimeFamilyCatalogSurface {
  surface_kind: 'runtime_family_catalog';
  families: RuntimeFamilyModuleSpec[];
}

export interface DefaultRuntimeFamilyCatalogSurface extends RuntimeFamilyCatalogSurface {}

export interface LoadedRuntimeFamilyRunner extends RuntimeFamilyModuleSpec {
  runRoute: (...args: unknown[]) => Promise<unknown>;
}

interface RuntimeFamilyModuleManifestSpec {
  overlayId: string;
  deliverableKind: string;
  module: string;
  exportName: string;
}

interface RuntimeFamilyRegistryEntry extends RuntimeFamilyModuleManifestSpec {
  load: () => Promise<Record<string, unknown>>;
}

const defaultRuntimeFamilyModules: RuntimeFamilyRegistryEntry[] = [
  {
    overlayId: 'ppt_deck',
    deliverableKind: 'ppt_deck',
    module: '@redcube/runtime-family-ppt',
    exportName: 'runPptDeckRoute',
    load: async () => await import('@redcube/runtime-family-ppt') as Record<string, unknown>,
  },
  {
    overlayId: 'xiaohongshu',
    deliverableKind: 'xiaohongshu_note',
    module: '@redcube/runtime-family-xiaohongshu',
    exportName: 'runXiaohongshuRoute',
    load: async () => await import('@redcube/runtime-family-xiaohongshu') as Record<string, unknown>,
  },
  {
    overlayId: 'poster_onepager',
    deliverableKind: 'poster_onepager',
    module: '@redcube/runtime-family-poster-onepager',
    exportName: 'runPosterOnepagerRoute',
    load: async () => await import('@redcube/runtime-family-poster-onepager') as Record<string, unknown>,
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
    module_name: safeText(spec.module),
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
  const moduleRef = resolveRuntimeFamilyModule(contract);
  let loaded: Record<string, unknown>;
  try {
    const registryEntry = defaultRuntimeFamilyModules.find((entry) => entry.module === moduleRef.module_name);
    if (!registryEntry) {
      throw new Error(`Runtime family module is not declared in the default registry: ${moduleRef.module_name}`);
    }
    loaded = await registryEntry.load();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load runtime family package ${moduleRef.module_name}: ${detail}`, { cause: error });
  }

  const runRoute = loaded[moduleRef.export_name];
  if (typeof runRoute !== 'function') {
    throw new Error(`Runtime family export missing: ${moduleRef.module_name}#${moduleRef.export_name}`);
  }

  return {
    ...moduleRef,
    runRoute: runRoute as LoadedRuntimeFamilyRunner['runRoute'],
  };
}
