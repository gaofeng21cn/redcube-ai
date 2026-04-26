import {
  generateNoteDraft as generateNoteDraftJs,
  generateStorylineLogic as generateStorylineLogicJs,
  listStorylinePromptFiles as listStorylinePromptFilesJs,
} from './index.js';

import type {
  RedcubeNoteDraftRequest,
  RedcubeNoteDraftResult,
  RedcubeRuntimePromptFile,
  RedcubeStorylineRequest,
} from './types.js';

export function listStorylinePromptFiles(
  runtimeConfig: unknown = null,
): RedcubeRuntimePromptFile[] {
  return listStorylinePromptFilesJs(runtimeConfig) as RedcubeRuntimePromptFile[];
}

export async function generateStorylineLogic(
  request: RedcubeStorylineRequest,
): Promise<string> {
  return generateStorylineLogicJs(request) as Promise<string>;
}

export async function generateNoteDraft(
  request: RedcubeNoteDraftRequest,
): Promise<RedcubeNoteDraftResult> {
  return generateNoteDraftJs(request) as Promise<RedcubeNoteDraftResult>;
}

export type {
  RedcubeLlmConfig,
  RedcubeNoteDraftRequest,
  RedcubeNoteDraftResult,
  RedcubeRuntimePromptFile,
  RedcubeStorylineRequest,
} from './types.js';
