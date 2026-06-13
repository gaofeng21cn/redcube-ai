// @ts-nocheck
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REDCUBE_CODEX_RUNTIME_OWNER = 'codex_cli';
export const REDCUBE_CREATIVE_GENERATION_META_BEGIN = 'REDCUBE_CREATIVE_GENERATION_META_BEGIN';
export const REDCUBE_CREATIVE_GENERATION_META_END = 'REDCUBE_CREATIVE_GENERATION_META_END';
export const REDCUBE_STAGE_JSON_BEGIN = 'REDCUBE_STAGE_JSON_BEGIN';
export const REDCUBE_STAGE_JSON_END = 'REDCUBE_STAGE_JSON_END';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');
export const DEFAULT_CODEX_COMMAND = Object.freeze(['codex']);
export const DEFAULT_CODEX_SANDBOX = 'workspace-write';
export const DEFAULT_CODEX_PROBE_TIMEOUT_MS = 60000;
export const DEFAULT_CODEX_GENERATION_TIMEOUT_MS = 600000;
export const DEFAULT_CODEX_VISUAL_REVIEW_TIMEOUT_MS = 1800000;
