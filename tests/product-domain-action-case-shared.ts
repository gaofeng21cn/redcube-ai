// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  createDeliverable,
  executeSourceAugmentation,
  getProductPreflight,
  intakeSource,
  invokeOplHostedProductEntry,
  invokeProductEntry,
  prepareSourceAugmentationResult,
  researchSource,
  writeSourceAugmentationResult,
} from '@redcube/domain-entry';
import {
  buildGeneratedProductEntrySessionSurface,
} from 'opl-framework/product-entry-companions';
import {
  buildOplRouteAttemptIndexForTest,
  runDeliverableRoute,
} from './helpers/route-attempt-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';
import { assertWorkspaceGitBoundary } from './helpers/workspace-git-boundary.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.js', import.meta.url)),
]);
const DOMAIN_ENTRY_PACKAGE_JSON = fileURLToPath(
  new URL('../packages/redcube-domain-entry/package.json', import.meta.url),
);
const domainEntryRequire = createRequire(DOMAIN_ENTRY_PACKAGE_JSON);
const PRODUCT_ENTRY_COMPANIONS_SPECIFIER = 'opl-framework/product-entry-companions';
const PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER = 'opl-framework/product-entry-program-companions';

async function importDomainEntrySharedModule(moduleSpecifier) {
  return import(pathToFileURL(domainEntryRequire.resolve(moduleSpecifier)).href);
}

async function getProductEntryManifest(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductEntryManifest(request);
}

async function exportDomainHandler(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.exportDomainHandler(request);
}

async function getProductEntrySessionSurface(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductEntrySession(request);
}

async function getProductStatus(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductStatus(request);
}

async function dispatchDomainHandler(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.dispatchDomainHandler(request);
}

async function getDomainActionAdapterGuardedActionMetadata() {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return {
    guardedActions: module.listDomainActionAdapterGuardedActions(),
    guardedActionIds: module.listDomainActionAdapterGuardedActionIds(),
    forbiddenWrites: module.listDomainActionAdapterForbiddenWrites(),
    blockedActions: module.listDomainActionAdapterBlockedActions(),
  };
}

async function withMockCodexRuntimeState(testFn) {
  const upstream = await startMockCodexCli();
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-state-'));
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
  });
  try {
    return await testFn({ runtimeStateRoot });
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function withMockCodexRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function prepareProductEntryWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'Product entry proof',
    brief: '验证 direct product entry、OPL-hosted stage runtime handoff 与 session continuity。',
    keywords: ['product-entry', 'opl'],
  });

  return workspaceRoot;
}

function buildOplGeneratedProductSessionForTest({
  entrySessionId,
  handoffRefs,
  entryMode = 'direct',
}): ReturnType<typeof buildGeneratedProductEntrySessionSurface> {
  const currentness = handoffRefs.currentness_refs || {};
  const crossProviderAttemptIndex = currentness.cross_provider_attempt_index || null;
  return buildGeneratedProductEntrySessionSurface({
    domain_id: 'rca',
    domain_owner: 'redcube_ai',
    runtime_owner: 'configured_family_runtime_provider',
    entry_session_id: entrySessionId,
    session_file: `/opl-owned/product-sessions/${entrySessionId}.json`,
    delivery_identity: handoffRefs.delivery_locator_refs,
    continuation_snapshot: {
      domain_snapshot_ref: handoffRefs.domain_snapshot_ref,
      latest_surface_kind: currentness.latest_surface_kind || null,
      latest_stage_execution_plan_ref: currentness.latest_stage_execution_plan_ref || null,
      latest_run_id: currentness.latest_visual_run_ref || null,
      provider_attempt_ref: currentness.provider_attempt_ref || null,
      provider_attempt_ledger_ref: currentness.provider_attempt_ledger_ref || null,
      cross_provider_attempt_index: crossProviderAttemptIndex,
      typed_blocker_ref: currentness.typed_blocker_ref || null,
      next_forced_delta_refs: currentness.next_forced_delta_refs || [],
    },
    family_orchestration: {
      action_graph_ref: 'opl-generated:family-orchestration/rca',
    },
    review_projection: {
      review_state_ref: 'domain-handler:getReviewState',
    },
    publication_projection: {
      publication_projection_ref: 'domain-handler:getPublicationProjection',
    },
    artifact_locator_contract: {
      contract_ref: 'contracts/artifact_locator_contract.json',
    },
    artifact_refs: (handoffRefs.artifact_authority_refs || []).map((ref) => ({ ref })),
    direct_product_entry_command: 'redcube product invoke',
    opl_hosted_handoff_ref: 'opl_framework:hosted_product_entry',
    source: 'product_entry',
    entry_mode: entryMode,
    domain_projection: handoffRefs,
  });
}

function assertFamilyOrchestrationCompanion(surface, { sessionLocatorField }) {
  assert.equal(surface.family_orchestration.action_graph_ref.ref_kind, 'json_pointer');
  assert.equal(surface.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
  assert.equal(surface.family_orchestration.action_graph.graph_id, 'redcube_product_entry_overview_graph');
  assert.equal(surface.family_orchestration.action_graph.target_domain_id, 'redcube_ai');
  assert.deepEqual(
    surface.family_orchestration.action_graph.nodes.map((node) => node.node_id),
    [
      'step:open_status',
      'step:continue_current_loop',
      'step:opl_hosted_handoff',
      'step:inspect_current_progress',
    ],
  );
  assert.deepEqual(surface.family_orchestration.action_graph.entry_nodes, ['step:open_status']);
  assert.deepEqual(surface.family_orchestration.action_graph.exit_nodes, ['step:inspect_current_progress']);
  assert.equal(Array.isArray(surface.family_orchestration.human_gates), true);
  assert.equal(surface.family_orchestration.human_gates.length >= 1, true);
  assert.equal(surface.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
  assert.equal(surface.family_orchestration.resume_contract.surface_kind, 'product_entry_session');
  assert.equal(surface.family_orchestration.resume_contract.session_locator_field, sessionLocatorField);
  assert.equal(
    surface.family_orchestration.resume_contract.checkpoint_locator_field,
    'entry_session_contract.opl_generated_session_surface.domain_projection.domain_snapshot_ref',
  );
}

function buildAugmentationResultPayload(overrides = {}) {
  return {
    topic_summary: '围绕甲状腺门诊沟通，先解释判断顺序，再解释术语与下一步动作。',
    reference_source_list: [
      { reference_id: 'REF-001', label: '国家指南', url: 'https://example.com/guideline' },
      { reference_id: 'REF-002', label: '系统综述', url: 'https://example.com/review' },
    ],
    key_fact_groups: [
      { fact_id: 'FACT-001', label: 'TSH 异常后需要结合 FT4 判断下一步动作。', reference_id: 'REF-001' },
      { fact_id: 'FACT-002', label: '门诊沟通里应先解释判断顺序，再解释术语。', reference_id: 'REF-002' },
    ],
    source_quality_notes: ['优先使用公开指南与系统综述。'],
    evidence_gap_resolution: [
      { gap_id: 'public_evidence_missing', status: 'resolved', note: '已补入可追溯公开来源。' },
      { gap_id: 'consumable_material_missing', status: 'resolved', note: '已补入可直接消费的事实材料。' },
    ],
    ...overrides,
  };
}

function withAction(action, args = {}) {
  return {
    action,
    ...args,
  };
}

function withOperation(operation, args = {}) {
  return {
    operation,
    ...args,
  };
}

const SERIAL_ENV_TEST = { concurrency: false };

export {
  DOMAIN_ENTRY_PACKAGE_JSON,
  PRODUCT_ENTRY_COMPANIONS_SPECIFIER,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  assertFamilyOrchestrationCompanion,
  assertWorkspaceGitBoundary,
  buildAugmentationResultPayload,
  buildOplGeneratedProductSessionForTest,
  buildOplRouteAttemptIndexForTest,
  chmodSync,
  completeSourceReadiness,
  createDeliverable,
  execFileSync,
  exportDomainHandler,
  dispatchDomainHandler,
  executeSourceAugmentation,
  existsSync,
  fileURLToPath,
  getProductEntryManifest,
  getProductEntrySessionSurface as getProductEntrySession,
  getProductStatus,
  getProductPreflight,
  getDomainActionAdapterGuardedActionMetadata,
  importDomainEntrySharedModule,
  intakeSource,
  invokeOplHostedProductEntry,
  invokeProductEntry,
  mkdirSync,
  mkdtempSync,
  os,
  path,
  prepareProductEntryWorkspace,
  prepareSourceAugmentationResult,
  readFileSync,
  readJson,
  researchSource,
  runDeliverableRoute,
  test,
  unlinkSync,
  withAction,
  withMockCodexRuntimeState,
  withMockCodexRuntime,
  withOperation,
  writeFileSync,
  writeSourceAugmentationResult,
};
