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
