// @ts-nocheck
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import {
  dispatchDomainHandler,
  exportDomainHandler,
} from '@redcube/domain-entry';

const DEFAULT_RUNTIME_STATE_ROOT = path.join(
  process.env.HOME || process.cwd(),
  '.codex',
  'projects',
  'redcube-ai',
  'runtime-state',
);
const DEFAULT_RUN_ID = '20260528-rca-workspace-receipt-scaleout-refresh';
const SNAPSHOT_PATH = 'contracts/production_acceptance/rca-workspace-receipt-scaleout-evidence-20260528.json';
const WORKSPACE_COUNT = 6;

function argValue(name: string): string | null {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || null : null;
}

function hasArg(name: string): boolean {
  return process.argv.includes(name);
}

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function sha256Json(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function portableWorkspaceRef(root: string, workspaceRoot: string): string {
  return `user-runtime-state:redcube-ai/${path.relative(root, workspaceRoot).split(path.sep).join('/')}`;
}

function taskFor(workspaceRoot: string, proofId: string): Record<string, unknown> {
  return {
    action: 'emit_workspace_receipt_proof',
    workspace_root: workspaceRoot,
    proof_id: proofId,
    attempt_ref: `workspace-runtime-ref:attempt:${proofId}`,
    artifact_locator_ref: '/artifact_locator_contract',
    review_export_ref: `workspace-runtime-ref:review-export:${proofId}`,
    forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
    artifact_refs: [`workspace-runtime-ref:artifact:${proofId}`],
  };
}

async function main(): Promise<void> {
  const runtimeStateRoot = path.resolve(
    argValue('--runtime-state-root') || process.env.REDCUBE_RUNTIME_STATE_ROOT || DEFAULT_RUNTIME_STATE_ROOT,
  );
  const runId = argValue('--run-id') || DEFAULT_RUN_ID;
  const outputPath = path.resolve(argValue('--output') || SNAPSHOT_PATH);
  const runRoot = path.join(runtimeStateRoot, 'evidence-scaleout', runId);
  const workspaceRoots = Array.from({ length: WORKSPACE_COUNT }, (_, index) => (
    path.join(runRoot, `workspace-${String(index + 1).padStart(2, '0')}`)
  ));

  if (existsSync(runRoot)) {
    if (!hasArg('--force')) {
      throw new Error(`run root already exists: ${runRoot}. Re-run with --force to replace this script-owned evidence run.`);
    }
    rmSync(runRoot, { recursive: true, force: true });
  }
  mkdirSync(runRoot, { recursive: true });

  const dispatchResults = [];
  for (const [index, workspaceRoot] of workspaceRoots.entries()) {
    mkdirSync(workspaceRoot, { recursive: true });
    const proofId = `${runId}-workspace-${String(index + 1).padStart(2, '0')}`;
    const taskFile = path.join(runRoot, `task-${String(index + 1).padStart(2, '0')}.json`);
    writeJson(taskFile, taskFor(workspaceRoot, proofId));
    const dispatch = await dispatchDomainHandler({ task_file: taskFile, format: 'json' });
    if (dispatch?.result_surface?.surface_kind !== 'workspace_receipt_proof') {
      throw new Error(`workspace receipt proof did not materialize for ${proofId}`);
    }
    dispatchResults.push(dispatch);
    writeJson(path.join(runRoot, `dispatch-${String(index + 1).padStart(2, '0')}.json`), dispatch);
  }

  const exportSurface = await exportDomainHandler({
    workspace_root: workspaceRoots[0],
    workspace_receipt_scaleout_roots: workspaceRoots.slice(1),
    format: 'json',
  });
  const exportPath = path.join(runRoot, 'scaleout-export.json');
  writeJson(exportPath, exportSurface);

  const scaleoutRefs =
    exportSurface?.mapped_surfaces?.production_evidence_scaleout_refs?.workspace_receipt_scaleout_refs;
  const inventory = exportSurface?.mapped_surfaces?.workspace_receipt_inventory_projection;
  if (!scaleoutRefs || !inventory) {
    throw new Error('domain-handler export did not include workspace receipt scaleout refs');
  }
  if (scaleoutRefs.observed_workspace_count !== WORKSPACE_COUNT) {
    throw new Error(`expected ${WORKSPACE_COUNT} observed workspaces, saw ${scaleoutRefs.observed_workspace_count}`);
  }

  const workspaceSources = (inventory.actual_workspace_receipt_refs?.workspace_receipt_source_refs || [])
    .map((source: Record<string, unknown>, index: number) => ({
      workspace_source_ref: `workspace_receipt_source:${index}`,
      workspace_ref: portableWorkspaceRef(runtimeStateRoot, String(source.workspace_root || workspaceRoots[index])),
      receipt_root_exists: source.receipt_root_exists === true,
      receipt_count: source.receipt_count || 0,
      valid_receipt_count: source.valid_receipt_count || 0,
      invalid_receipt_count: source.invalid_receipt_count || 0,
    }));

  const actual = scaleoutRefs.actual_workspace_receipt_refs || {};
  const snapshot = {
    surface_kind: 'rca_workspace_receipt_scaleout_evidence_snapshot',
    schema_version: 1,
    snapshot_id: 'rca.workspace_receipt_scaleout.2026-05-28.6-workspaces',
    owner: 'redcube_ai',
    consumer: 'one_person_lab',
    status: 'runtime_receipt_refs_visible_not_production_soak',
    updated_at: '2026-05-28',
    evidence_model: 'refs_only_no_visual_truth_artifact_blob_memory_body_or_review_verdict_body',
    source_runtime_export_provenance: {
      machine_boundary: 'local_evidence_path_provenance_not_portable_contract_input',
      local_export_path: exportPath,
      sha256: sha256Json(exportSurface),
      source_command_ref: 'scripts/materialize-rca-workspace-receipt-scaleout-evidence.ts --force',
      source_surface_ref: 'redcube domain-handler export#/mapped_surfaces/production_evidence_scaleout_refs/workspace_receipt_scaleout_refs',
      runtime_state_root_ref: 'user-runtime-state:redcube-ai/runtime-state',
      run_root_ref: portableWorkspaceRef(runtimeStateRoot, runRoot),
    },
    repository_boundary: {
      repo_tracks_evidence_snapshot: true,
      repo_tracks_runtime_export_body: false,
      repo_tracks_live_receipt_instances: false,
      repo_tracks_visual_truth_body: false,
      repo_tracks_review_export_verdict_body: false,
      repo_tracks_artifact_blob: false,
      repo_tracks_memory_body: false,
    },
    scaleout_projection: {
      surface_kind: 'workspace_receipt_scaleout_projection',
      status: scaleoutRefs.status,
      evidence_model: 'receipt_refs_only_multi_receipt_kind_coverage',
      required_workspace_count_for_scaleout: scaleoutRefs.required_workspace_count_for_scaleout,
      observed_workspace_count: scaleoutRefs.observed_workspace_count,
      observed_receipt_count: scaleoutRefs.observed_receipt_count,
      receipt_kind_coverage_ready: scaleoutRefs.receipt_kind_coverage_ready,
      workspace_receipt_scaleout_claimed: false,
      declares_production_soak_complete: false,
      writes_visual_truth: false,
      writes_artifact_blob: false,
      writes_memory_body: false,
      missing_receipt_kinds: inventory.gap_projection?.missing_receipt_kinds || [],
    },
    receipt_counts: inventory.receipt_counts,
    workspace_source_summary: {
      workspace_source_ref_model: 'workspace_receipt_source:<index>',
      workspace_sources: workspaceSources,
    },
    actual_workspace_receipt_refs: {
      route_id: actual.route_id,
      stage_sequence_refs: actual.stage_sequence_refs,
      artifact_producing_owner_receipt_refs: actual.artifact_producing_owner_receipt_refs || [],
      memory_lifecycle_receipt_refs: actual.memory_lifecycle_receipt_refs || [],
      no_regression_evidence_refs: actual.no_regression_evidence_refs || [],
      review_export_verdict_refs: actual.review_export_verdict_refs || [],
    },
    generated_dispatch_receipt_refs: dispatchResults.map((dispatch) => ({
      proof_ref: dispatch.result_surface.proof_ref,
      domain_owner_receipt_ref: dispatch.result_surface.receipt_refs.domain_owner_receipt_ref,
      no_regression_evidence_ref: dispatch.result_surface.receipt_refs.no_regression_evidence_ref,
      runtime_locator_ref: dispatch.result_surface.runtime_locator_ref,
    })),
    authority_boundary: {
      opl_can_store_projection_refs: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_review_export_verdict: false,
      opl_can_claim_production_soak_complete: false,
    },
    remaining_evidence_gates: {
      temporal_controlled_visual_stage_long_soak: 'open',
      cross_family_repeated_no_regression: 'open',
      production_visual_ready: 'not_claimed',
      exportable: 'not_claimed',
      handoffable: 'not_claimed',
      domain_ready: 'not_claimed',
      production_ready: 'not_claimed',
    },
    forbidden_payload_classes: [
      'visual_truth_body',
      'review_export_verdict_body',
      'artifact_blob',
      'artifact_body',
      'visual_memory_body',
      'memory_body',
      'generic_runtime_state',
      'owner_receipt_body',
    ],
  };

  writeJson(outputPath, snapshot);
  writeJson(path.join(runRoot, 'snapshot.json'), snapshot);
  process.stdout.write(`${JSON.stringify({
    ok: true,
    output_path: outputPath,
    run_root: runRoot,
    observed_workspace_count: snapshot.scaleout_projection.observed_workspace_count,
    observed_receipt_count: snapshot.scaleout_projection.observed_receipt_count,
    workspace_receipt_scaleout_claimed: snapshot.scaleout_projection.workspace_receipt_scaleout_claimed,
    declares_production_soak_complete: snapshot.scaleout_projection.declares_production_soak_complete,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exit(1);
});
