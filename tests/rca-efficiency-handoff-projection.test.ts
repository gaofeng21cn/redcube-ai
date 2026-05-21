// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  exportProductSidecar,
  prepareProductEntryWorkspace,
  SERIAL_ENV_TEST,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const contractPath = 'contracts/production_acceptance/rca-efficiency-handoff-projection.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function assertRefString(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.notEqual(value.trim(), '', label);
  assert.equal(value.startsWith('/'), false, `${label} must be portable, not an absolute path`);
  assert.equal(value.includes('\n'), false, label);
}

function assertRefArray(values, label) {
  assert.equal(Array.isArray(values), true, label);
  assert.equal(values.length > 0, true, label);
  values.forEach((value, index) => assertRefString(value, `${label}[${index}]`));
}

function assertEfficiencySuiteShape(suite) {
  assert.equal(suite.surface_kind, 'rca_efficiency_handoff_projection');
  assert.equal(suite.owner, 'redcube_ai');
  assert.equal(suite.consumer, 'opl_agent_lab');
  assert.equal(suite.refs_only, true);
  assert.equal(suite.read_only, true);
  assert.equal(suite.agent_lab_suite_input.suite_kind, 'standard');
  assert.equal(suite.agent_lab_suite_input.domain_specific_suite_kind_required, false);
  assert.equal(suite.agent_lab_suite_input.domain_id, 'redcube-ai');
  assert.equal(suite.agent_lab_suite_input.claims_visual_ready, false);
  assert.equal(suite.agent_lab_suite_input.claims_exportable, false);
  assert.equal(suite.agent_lab_suite_input.claims_handoffable, false);

  assertRefArray(suite.efficiency_signal_refs.duration_refs, 'duration_refs');
  assertRefArray(suite.efficiency_signal_refs.cost_refs, 'cost_refs');
  assertRefArray(suite.efficiency_signal_refs.cache_refs, 'cache_refs');
  assertRefArray(suite.efficiency_signal_refs.reuse_refs, 'reuse_refs');
  assertRefArray(suite.efficiency_signal_refs.render_execution_refs, 'render_execution_refs');
  assertRefArray(suite.efficiency_signal_refs.export_result_refs, 'export_result_refs');

  assert.equal(suite.efficiency_fields.cache_status.source_ref.includes('cache_status'), true);
  assert.equal(suite.efficiency_fields.elapsed_ms.source_ref.includes('elapsed_ms'), true);
  assert.equal(suite.efficiency_fields.render_execution.source_ref.includes('render_execution'), true);
  assert.equal(suite.efficiency_fields.reused_slide_ids.source_ref.includes('reused_slide_ids'), true);
  assert.equal(suite.efficiency_fields.cost_summary.source_ref.includes('cost_summary'), true);
  assert.equal(suite.efficiency_fields.export_result.source_ref.includes('export'), true);

  assertRefArray(suite.quality_floor_refs.review_export_gate_refs, 'review_export_gate_refs');
  assertRefArray(suite.quality_floor_refs.screenshot_review_gate_refs, 'screenshot_review_gate_refs');
  assertRefArray(suite.quality_floor_refs.visual_memory_authority_refs, 'visual_memory_authority_refs');
  assertRefArray(suite.quality_floor_refs.owner_receipt_refs, 'owner_receipt_refs');

  assert.equal(suite.authority_boundary.no_forbidden_write, true);
  assert.equal(suite.authority_boundary.opl_agent_lab_can_write_rca_visual_truth, false);
  assert.equal(suite.authority_boundary.opl_agent_lab_can_authorize_quality_verdict, false);
  assert.equal(suite.authority_boundary.opl_agent_lab_can_authorize_exportable, false);
  assert.equal(suite.authority_boundary.rca_quality_floor_owner, 'redcube_ai');
  assert.equal(suite.optimization_policy.efficiency_improves_observability_only, true);
  assert.equal(suite.optimization_policy.quality_gates_may_be_lowered, false);
}

test('RCA efficiency handoff contract exposes a refs-only standard Agent Lab suite input', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, contractPath)), true);
  const suite = readJson(contractPath);

  assertEfficiencySuiteShape(suite);
});

test('product sidecar projection includes RCA efficiency handoff without claiming visual readiness', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const projection = await exportProductSidecar({
      workspace_root: workspaceRoot,
    });

    assertEfficiencySuiteShape(projection.mapped_surfaces.rca_efficiency_handoff_projection);
    assert.equal(
      projection.source_manifest_refs.rca_efficiency_handoff_projection_ref,
      '/rca_efficiency_handoff_projection',
    );
  });
});
