export interface PackCompilerRegistryEntry {
  packId: string;
  module: string;
  exportName: string;
}

export interface ResolvedRenderCompilerModule {
  pack_id: string;
  module_name: string;
  export_name: string;
}

export interface RenderCompilerContract {
  prompt_pack?: {
    pack_id?: string;
  };
}

export interface LoadedRenderPackCompiler extends ResolvedRenderCompilerModule {
  compileRenderSlides: (...args: unknown[]) => unknown;
}
