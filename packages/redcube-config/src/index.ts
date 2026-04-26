import { loadRuntimeConfig as loadRuntimeConfigJs } from './index.js';

import type {
  RedcubeRuntimeConfig,
  RedcubeRuntimeConfigOptions,
} from './types.js';

export function loadRuntimeConfig(
  options: RedcubeRuntimeConfigOptions = {},
): RedcubeRuntimeConfig {
  return loadRuntimeConfigJs(options) as RedcubeRuntimeConfig;
}

export type {
  RedcubeIdentityConfig,
  RedcubeIdentityProfile,
  RedcubeIdentityRouting,
  RedcubeRuntimeConfig,
  RedcubeRuntimeConfigDirs,
  RedcubeRuntimeConfigOptions,
  RedcubeRuntimeConfigSources,
  RedcubeRuntimeExplicitConfig,
} from './types.js';
