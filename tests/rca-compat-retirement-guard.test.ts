// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ACTIVE_ROOTS = [
  'apps',
  'packages',
  'contracts',
  'plugins',
  'scripts',
  'tests',
  'tools',
  'python',
];
const TEXT_EXTENSIONS = new Set([
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.py',
  '.sh',
  '.yaml',
  '.yml',
]);
const RETIRED_CONTRACTS = Object.freeze([
  'contracts/runtime-program/hermes-runtime-substrate-activation-package.json',
  'contracts/runtime-program/hermes-runtime-capability-extraction-map.json',
  'contracts/runtime-program/hermes-runtime-substrate-canonical-closure.json',
  'contracts/runtime-program/hermes-stable-family-closure-truth.json',
  'contracts/runtime-program/hermes-managed-family-closure-truth.json',
]);
const RETIRED_ACTIVE_PATTERNS = Object.freeze([
  /\bgateway_interaction_contract\b/,
  /\bfrontdoor_owner\b/,
  /\bfrontdoor_surface\b/,
  /\bfrontdoor_command\b/,
  /\bfrontdoor_node_id\b/,
  /\bfrontdoor_title\b/,
  /\bfrontdoor_surface_kind\b/,
  /\bGatewayInteractionContractSurface\b/,
  /\bFamilyFrontdoorEntrySurfaces\b/,
  /\bbuildFamilyGatewayInteractionContract\b/,
  /\bbuildFamilyProductFrontdoorFromManifest\b/,
  /\bbuildFamilyFrontdoorProductEntryOrchestration\b/,
  /@redcube\/hermes-substrate/,
  /\bhost_agent\b/,
  /\bhermes_native_proof\b/,
  /\bredcube product frontdesk\b/,
  /\bproduct_frontdesk\b/,
  /\bfrontdesk\b/,
  /\binvokeFederatedProductEntry\b/,
  /\bFederatedProductEntry\b/,
  /\bfederated_product_entry\b/,
  /\bfederated_/,
  /\bsource_pack_federation\b/,
  /\bsourcePackFederation\b/,
  /\bsource-pack-federation\b/,
  /\bcross_family_source_pack_federation\b/,
  /\bOPL federation\b/,
  /\bOPL product-entry federation\b/,
  /\bproduct federate\b/,
  /\bopl_gateway\b/,
  /\bopl_bridge\b/,
  /opl-gateway-shared/,
  /\blegacy_command_key\b/,
  /\bcompat_product_entry_overview_command\b/,
]);

function listTextFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    const normalized = file.split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'build' || entry.name === 'node_modules') return [];
      return listTextFiles(file);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

test('RCA active surfaces do not reintroduce retired runtime compatibility terms', () => {
  for (const contractFile of RETIRED_CONTRACTS) {
    assert.equal(existsSync(path.resolve(contractFile)), false, contractFile);
  }
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-substrate')), false);

  const violations = [];
  for (const file of ACTIVE_ROOTS.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    if (file === 'tests/rca-compat-retirement-guard.test.ts') continue;
    const text = readFileSync(file, 'utf-8');
    for (const pattern of RETIRED_ACTIVE_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`${file}: ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
