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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import {
  callDomainTool,
  getToolDefinitions,
  listDomainTools,
} from '../apps/redcube-mcp/dist/server.js';
import {
  createDeliverable,
  executeSourceAugmentation,
  getProductPreflight,
  getProductStart,
  intakeSource,
  invokeOplHostedProductEntry,
  invokeProductEntry,
  prepareSourceAugmentationResult,
  researchSource,
  writeSourceAugmentationResult,
} from '@redcube/domain-entry';
import { runDeliverableRoute } from './helpers/route-attempt-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import {
  assertReceiptOnlyHostedAttemptProjection as assertReceiptOnlyHostedAttemptProjectionImpl,
  buildHostedAttemptBridgeFixture as buildHostedAttemptBridgeFixtureImpl,
  reconcileHostedAttemptReceipt as reconcileHostedAttemptReceiptImpl,
} from './helpers/hosted-attempt-reconciliation.ts';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.ts';
import { assertWorkspaceGitBoundary } from './helpers/workspace-git-boundary.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);
const DOMAIN_ENTRY_PACKAGE_JSON = fileURLToPath(
  new URL('../packages/redcube-domain-entry/package.json', import.meta.url),
);
const domainEntryRequire = createRequire(DOMAIN_ENTRY_PACKAGE_JSON);
const PRODUCT_ENTRY_COMPANIONS_SPECIFIER = 'opl-framework-shared/product-entry-companions';
const PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER = 'opl-framework-shared/product-entry-program-companions';

async function importDomainEntrySharedModule(moduleSpecifier) {
  return import(pathToFileURL(domainEntryRequire.resolve(moduleSpecifier)).href);
}

async function getProductEntryManifest(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductEntryManifest(request);
}

async function getProductEntrySessionSurface(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductEntrySession(request);
}

async function getProductStatus(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductStatus(request);
}

async function exportDomainActionAdapter(request) {
  const module = await import('../packages/redcube-domain-entry/dist/actions/domain-action-adapter.js');
  return module.exportDomainActionAdapter(request);
}

async function dispatchDomainActionAdapter(request) {
  const module = await import('../packages/redcube-domain-entry/dist/actions/domain-action-adapter.js');
  return module.dispatchDomainActionAdapter(request);
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

async function buildHostedAttemptBridgeFixture(request) {
  return buildHostedAttemptBridgeFixtureImpl(request);
}

async function reconcileHostedAttemptReceipt(request) {
  return reconcileHostedAttemptReceiptImpl(request);
}

async function assertReceiptOnlyHostedAttemptProjection(projection) {
  return assertReceiptOnlyHostedAttemptProjectionImpl(projection);
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
    'continuation_snapshot.latest_stage_execution_plan_ref',
  );
}

function assertRuntimeLoopClosureShape(surface, { source, entryMode, runtimeOwner = 'configured_family_runtime_provider' }) {
  assert.equal(surface.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
  assert.equal(surface.runtime_loop_closure.loop_owner.runtime_owner, runtimeOwner);
  assert.equal(surface.runtime_loop_closure.loop_owner.domain_owner, 'redcube_ai');
  assert.equal(surface.runtime_loop_closure.loop_owner.product_entry_owner, 'redcube_ai');
  assert.equal(surface.runtime_loop_closure.resume_point.entry_session_id, surface.entry_session?.entry_session_id ?? null);
  assert.equal(
    surface.runtime_loop_closure.resume_point.latest_handle,
    surface.summary?.target_handle ?? surface.summary?.latest_handle ?? null,
  );
  assert.equal(surface.runtime_loop_closure.continuity_cursor.surface_kind, 'session_continuity');
  assert.equal(surface.runtime_loop_closure.continuity_cursor.surface_ref, '/session_continuity');
  assert.equal(
    surface.runtime_loop_closure.continuity_cursor.entry_session_id,
    surface.entry_session?.entry_session_id ?? null,
  );
  assert.equal(surface.runtime_loop_closure.progress_cursor.surface_kind, 'progress_projection');
  assert.equal(surface.runtime_loop_closure.progress_cursor.surface_ref, '/progress_projection');
  assert.equal(surface.runtime_loop_closure.artifact_pickup.surface_kind, 'artifact_inventory');
  assert.equal(surface.runtime_loop_closure.artifact_pickup.surface_ref, '/artifact_inventory');
  assert.equal(surface.runtime_loop_closure.control_policy.approval_gate_id, 'redcube_operator_review_gate');
  assert.equal(surface.runtime_loop_closure.control_policy.default_run_mode, 'auto_to_terminal');
  assert.equal(
    surface.runtime_loop_closure.control_policy.stop_policy,
    'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
  );
  assert.equal(
    surface.runtime_loop_closure.control_policy.gate_status,
    surface.runtime_loop_closure.control_policy.approval_required ? 'requested' : 'approved',
  );
  assert.equal(
    surface.runtime_loop_closure.control_policy.interrupt_policy,
    surface.runtime_loop_closure.control_policy.approval_required
      ? 'human_gate_required_before_continuation'
      : 'continue_autonomously_until_runtime_gate',
  );
  assert.equal(surface.runtime_loop_closure.control_policy.continue_action.surface_kind, 'product_entry_session');
  assert.equal(surface.runtime_loop_closure.source_linkage.current_source, source);
  assert.equal(surface.runtime_loop_closure.source_linkage.entry_mode, entryMode);
  assert.equal(surface.runtime_loop_closure.source_linkage.direct_surface_kind, 'product_entry');
  assert.equal(surface.runtime_loop_closure.source_linkage.opl_hosted_surface_kind, 'opl_hosted_product_entry');
  assert.equal(surface.runtime_loop_closure.source_linkage.session_surface_kind, 'product_entry_session');
  assert.equal(surface.runtime_loop_closure.source_linkage.downstream_entry_surface_kind, 'domain_entry');
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
  Client,
  DOMAIN_ENTRY_PACKAGE_JSON,
  PRODUCT_ENTRY_COMPANIONS_SPECIFIER,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  StdioClientTransport,
  assert,
  assertFamilyOrchestrationCompanion,
  assertReceiptOnlyHostedAttemptProjection,
  assertRuntimeLoopClosureShape,
  assertWorkspaceGitBoundary,
  buildAugmentationResultPayload,
  buildHostedAttemptBridgeFixture,
  callDomainTool,
  chmodSync,
  completeSourceReadiness,
  createDeliverable,
  execFileSync,
  exportDomainActionAdapter,
  dispatchDomainActionAdapter,
  executeSourceAugmentation,
  existsSync,
  fileURLToPath,
  getProductEntryManifest,
  getProductEntrySessionSurface as getProductEntrySession,
  getProductStatus,
  getProductPreflight,
  getProductStart,
  getDomainActionAdapterGuardedActionMetadata,
  getToolDefinitions,
  importDomainEntrySharedModule,
  intakeSource,
  invokeOplHostedProductEntry,
  invokeProductEntry,
  listDomainTools,
  mkdirSync,
  mkdtempSync,
  os,
  path,
  prepareProductEntryWorkspace,
  prepareSourceAugmentationResult,
  readFileSync,
  readJson,
  reconcileHostedAttemptReceipt,
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
