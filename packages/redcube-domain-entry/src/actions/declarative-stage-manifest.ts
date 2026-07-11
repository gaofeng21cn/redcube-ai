// @ts-nocheck
import { readJson } from './json-file.js';

export const DECLARATIVE_STAGE_MANIFEST_REF = 'agent/stages/manifest.json';

const DECLARATIVE_STAGE_MANIFEST_URL = new URL(
  '../../../../agent/stages/manifest.json',
  import.meta.url,
);
const DECLARATIVE_STAGE_MANIFEST = readJson<Record<string, unknown>>(DECLARATIVE_STAGE_MANIFEST_URL);

if (
  DECLARATIVE_STAGE_MANIFEST.surface_kind !== 'opl_standard_agent_declarative_stage_manifest'
  || DECLARATIVE_STAGE_MANIFEST.version !== 'opl-standard-agent-declarative-stage-manifest.v1'
  || !Array.isArray(DECLARATIVE_STAGE_MANIFEST.stages)
) {
  throw new Error(`Invalid RedCube declarative stage manifest: ${DECLARATIVE_STAGE_MANIFEST_REF}`);
}

export function buildRedCubeDeclarativeStageManifest() {
  return structuredClone(DECLARATIVE_STAGE_MANIFEST);
}
