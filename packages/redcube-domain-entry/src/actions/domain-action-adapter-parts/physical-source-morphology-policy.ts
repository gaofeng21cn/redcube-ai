// @ts-nocheck

import {
  readJson,
} from '../json-file.js';

const PHYSICAL_SOURCE_MORPHOLOGY_POLICY_URL = new URL(
  '../../../../../contracts/physical_source_morphology_policy.json',
  import.meta.url,
);

export function buildPhysicalSourceMorphologyPolicy() {
  return readJson(PHYSICAL_SOURCE_MORPHOLOGY_POLICY_URL);
}
