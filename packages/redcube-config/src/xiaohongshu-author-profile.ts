import {
  ensureWorkspaceXiaohongshuAuthorTemplate as ensureWorkspaceXiaohongshuAuthorTemplateJs,
  resolveWorkspaceXiaohongshuAuthorProfile as resolveWorkspaceXiaohongshuAuthorProfileJs,
} from './xiaohongshu-author-profile.js';

import type {
  RedcubeWorkspaceAuthorProfile,
  RedcubeWorkspaceAuthorProfileRequest,
  RedcubeWorkspaceAuthorTemplateRequest,
  RedcubeWorkspaceAuthorTemplateResult,
} from './types.js';

export function ensureWorkspaceXiaohongshuAuthorTemplate(
  request: RedcubeWorkspaceAuthorTemplateRequest,
): RedcubeWorkspaceAuthorTemplateResult {
  return ensureWorkspaceXiaohongshuAuthorTemplateJs(
    request,
  ) as RedcubeWorkspaceAuthorTemplateResult;
}

export function resolveWorkspaceXiaohongshuAuthorProfile(
  request: RedcubeWorkspaceAuthorProfileRequest,
): RedcubeWorkspaceAuthorProfile {
  return resolveWorkspaceXiaohongshuAuthorProfileJs(
    request,
  ) as RedcubeWorkspaceAuthorProfile;
}

export type {
  RedcubeWorkspaceAuthorProfile,
  RedcubeWorkspaceAuthorProfileRequest,
  RedcubeWorkspaceAuthorTemplateRequest,
  RedcubeWorkspaceAuthorTemplateResult,
} from './types.js';
