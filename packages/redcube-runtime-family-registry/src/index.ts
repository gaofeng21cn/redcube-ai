import {
  getDefaultRuntimeFamilyCatalog as getDefaultRuntimeFamilyCatalogJs,
  listDefaultRuntimeFamilyModules as listDefaultRuntimeFamilyModulesJs,
  loadRuntimeFamilyRunner as loadRuntimeFamilyRunnerJs,
  resolveRuntimeFamilyModule as resolveRuntimeFamilyModuleJs,
} from './index.js';

import type {
  DefaultRuntimeFamilyCatalogSurface,
  LoadedRuntimeFamilyRunner,
  RuntimeFamilyContract,
  RuntimeFamilyModuleSpec,
} from './types.js';

export function listDefaultRuntimeFamilyModules(): RuntimeFamilyModuleSpec[] {
  return listDefaultRuntimeFamilyModulesJs() as RuntimeFamilyModuleSpec[];
}

export function getDefaultRuntimeFamilyCatalog(): DefaultRuntimeFamilyCatalogSurface {
  return getDefaultRuntimeFamilyCatalogJs() as DefaultRuntimeFamilyCatalogSurface;
}

export function resolveRuntimeFamilyModule(contract: RuntimeFamilyContract): RuntimeFamilyModuleSpec {
  return resolveRuntimeFamilyModuleJs(contract) as RuntimeFamilyModuleSpec;
}

export async function loadRuntimeFamilyRunner(contract: RuntimeFamilyContract): Promise<LoadedRuntimeFamilyRunner> {
  return loadRuntimeFamilyRunnerJs(contract) as Promise<LoadedRuntimeFamilyRunner>;
}

export type {
  DefaultRuntimeFamilyCatalogSurface,
  LoadedRuntimeFamilyRunner,
  RuntimeFamilyCatalogSurface,
  RuntimeFamilyContract,
  RuntimeFamilyModuleSpec,
} from './types.js';
