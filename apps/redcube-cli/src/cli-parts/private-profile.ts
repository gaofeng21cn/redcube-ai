import type { JsonMap } from './types.js';

let privateProfileModulePromise: Promise<JsonMap> | undefined;

export async function loadPrivateProfileModule() {
  if (!privateProfileModulePromise) {
    privateProfileModulePromise = import('@redcube/redcube-config/private-profile');
  }

  return privateProfileModulePromise;
}
