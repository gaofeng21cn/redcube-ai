import packageJson from '../package.json' with { type: 'json' };

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function buildCatalogEntry(spec = {}) {
  return {
    overlay_id: safeText(spec.overlayId),
    deliverable_kind: safeText(spec.deliverableKind),
    module_name: safeText(spec.module),
    export_name: safeText(spec.exportName),
  };
}

export function listDefaultRuntimeFamilyModules() {
  const specs = packageJson.redcube?.defaultRuntimeFamilyModules || [];
  return specs.map((spec) => buildCatalogEntry(spec));
}

export function getDefaultRuntimeFamilyCatalog() {
  return {
    surface_kind: 'runtime_family_catalog',
    families: listDefaultRuntimeFamilyModules(),
  };
}

export function resolveRuntimeFamilyModule(contract) {
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

export async function loadRuntimeFamilyRunner(contract) {
  const moduleRef = resolveRuntimeFamilyModule(contract);
  let loaded;
  try {
    loaded = await import(moduleRef.module_name);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load runtime family package ${moduleRef.module_name}: ${detail}`, { cause: error });
  }

  const runRoute = loaded?.[moduleRef.export_name];
  if (typeof runRoute !== 'function') {
    throw new Error(`Runtime family export missing: ${moduleRef.module_name}#${moduleRef.export_name}`);
  }

  return {
    ...moduleRef,
    runRoute,
  };
}
