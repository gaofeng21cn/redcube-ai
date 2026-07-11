// @ts-nocheck
import { readJson } from './json-file.js';

export const FAMILY_STAGE_CONTROL_PLANE_CONTRACT_REF = 'contracts/stage_control_plane.json';

const STAGE_CONTROL_PLANE_URL = new URL(
  '../../../../contracts/stage_control_plane.json',
  import.meta.url,
);
const STAGE_CONTROL_PLANE = readJson<Record<string, unknown>>(STAGE_CONTROL_PLANE_URL);

if (
  STAGE_CONTROL_PLANE.surface_kind !== 'family_stage_control_plane'
  || STAGE_CONTROL_PLANE.version !== 'family-stage-control-plane.v1'
) {
  throw new Error(`Invalid RedCube stage control plane: ${FAMILY_STAGE_CONTROL_PLANE_CONTRACT_REF}`);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function buildRedCubeFamilyStageControlPlane() {
  return clone(STAGE_CONTROL_PLANE);
}

export function buildRedCubeFamilyStageControlPlaneContract() {
  return buildRedCubeFamilyStageControlPlane();
}
