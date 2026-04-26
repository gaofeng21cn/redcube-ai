import {
  bootstrapPrivateProfile as bootstrapPrivateProfileJs,
  exportPrivateProfile as exportPrivateProfileJs,
  installPrivateProfile as installPrivateProfileJs,
  resolveConfigHome as resolveConfigHomeJs,
} from './private-profile.js';

import type {
  RedcubePrivateProfileOptions,
  RedcubePrivateProfileResult,
} from './types.js';

export function resolveConfigHome(options: RedcubePrivateProfileOptions = {}): string {
  return resolveConfigHomeJs(options) as string;
}

export function bootstrapPrivateProfile(
  options: RedcubePrivateProfileOptions = {},
): RedcubePrivateProfileResult {
  return bootstrapPrivateProfileJs(options) as RedcubePrivateProfileResult;
}

export function exportPrivateProfile(
  options: RedcubePrivateProfileOptions = {},
): RedcubePrivateProfileResult {
  return exportPrivateProfileJs(options) as RedcubePrivateProfileResult;
}

export function installPrivateProfile(
  options: RedcubePrivateProfileOptions = {},
): RedcubePrivateProfileResult {
  return installPrivateProfileJs(options) as RedcubePrivateProfileResult;
}

export type {
  RedcubePrivateProfileOptions,
  RedcubePrivateProfileResult,
} from './types.js';
