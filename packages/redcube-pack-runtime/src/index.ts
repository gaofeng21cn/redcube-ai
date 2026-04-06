import {
  loadRenderPackCompiler as loadRenderPackCompilerJs,
  resolveRenderCompilerModule as resolveRenderCompilerModuleJs,
} from './index.js';

import type {
  LoadedRenderPackCompiler,
  RenderCompilerContract,
  ResolvedRenderCompilerModule,
} from './types.js';

export function resolveRenderCompilerModule(contract: RenderCompilerContract): ResolvedRenderCompilerModule {
  return resolveRenderCompilerModuleJs(contract) as ResolvedRenderCompilerModule;
}

export async function loadRenderPackCompiler(contract: RenderCompilerContract): Promise<LoadedRenderPackCompiler> {
  return loadRenderPackCompilerJs(contract) as Promise<LoadedRenderPackCompiler>;
}

export type {
  LoadedRenderPackCompiler,
  PackCompilerRegistryEntry,
  RenderCompilerContract,
  ResolvedRenderCompilerModule,
} from './types.js';
