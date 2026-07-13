// @ts-nocheck
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {
  commitStageArtifactAttemptRuntime,
  openStageArtifactAttemptRuntime,
  stageArtifactAttemptPaths,
  statusStageArtifactRuntime,
  writeDomainArtifact,
} from 'opl-framework/domain-artifact-runtime';

import { readJson, safeText } from './protocol-utils.js';

const unique = (value) => [...new Set((Array.isArray(value) ? value : []).map((item) => safeText(item)).filter(Boolean))];

export const RCA_STAGE_OUTPUT_CANONICAL_ROLES = Object.freeze([
  'source_truth_pack', 'material_inventory', 'strategy_brief', 'visual_direction',
  'render_manifest', 'review_verdict', 'export_bundle', 'handoff_manifest',
]);

export const RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS = Object.freeze({
  source_intake: ['source_truth_pack', 'material_inventory'],
  communication_strategy: ['strategy_brief'],
  visual_direction: ['visual_direction'],
  artifact_creation: ['render_manifest'],
  review_and_revision: ['review_verdict'],
  package_and_handoff: ['export_bundle', 'handoff_manifest'],
});

const RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY = Object.freeze({
  owner: 'one-person-lab',
  substrate_owner: 'one-person-lab',
  domain_authority_owner: 'redcube_ai',
  opl_role: 'stage_artifact_runtime_owner',
  rca_role: 'visual_stage_role_progress_receipt_quality_debt_and_owner_authority_adapter',
  stage_folder_current_pointer_role: 'artifact_attempt_pointer_not_opl_stage_run_current_pointer',
  stage_folder_terminal_status_role: 'domain_owner_closeout_receipt_projection_not_opl_stage_run_terminal_state',
  codex_cli_route_context_is_semantic_owner: true,
  framework_stage_run_current_is_passive_projection: true,
  framework_can_accept_reject_or_override_codex_route: false,
  can_write_opl_stage_run_current_pointer: false,
  can_write_opl_stage_run_terminal_state: false,
  can_publish_current_owner_delta: false,
  opl_can_issue_owner_receipt: false,
  opl_can_write_visual_truth: false,
  opl_can_write_review_export_verdict: false,
  rca_owns_artifact_authority: true,
  rca_owns_stage_folder_substrate: false,
});

export function canonicalStageForRoute(stageId) {
  const route = safeText(stageId);
  if (['source_readiness', 'research', 'source_intake'].includes(route)) return 'source_intake';
  if (['storyline', 'detailed_outline', 'single_note_plan', 'slide_blueprint', 'poster_blueprint', 'communication_strategy'].includes(route)) return 'communication_strategy';
  if (route === 'visual_direction') return 'visual_direction';
  if ([
    'render_html', 'fix_html', 'author_image_pages', 'repair_image_pages',
    'author_pptx_native', 'repair_pptx_native', 'visual_director_review', 'screenshot_review',
  ].includes(route)) return 'artifact_creation';
  if (['review_and_revision', 'deck_meta_review'].includes(route)) return 'review_and_revision';
  if (['publish_copy', 'export_bundle', 'export_pptx'].includes(route)) return 'package_and_handoff';
  return route || 'domain_specific';
}

export function stageOrderForCanonicalStage(stageId) {
  return { source_intake: 1, communication_strategy: 2, visual_direction: 3, artifact_creation: 4, review_and_revision: 5, package_and_handoff: 6 }[stageId] ?? 99;
}

function stateDir(input) {
  const explicit = safeText(input.oplStateDir || input.opl_state_dir || process.env.OPL_STATE_DIR);
  return explicit ? path.resolve(explicit) : path.join(os.homedir(), 'Library', 'Application Support', 'OPL', 'state');
}

function inferredIds(input) {
  const deliverablePaths = input.deliverablePaths || {};
  const deliverableDir = safeText(deliverablePaths.deliverableDir);
  const parts = deliverableDir ? path.resolve(deliverableDir).split(path.sep) : [];
  const index = parts.lastIndexOf('deliverables');
  const topic = safeText(input.topicId || input.topic_id || deliverablePaths.topicId || deliverablePaths.topic_id || (index > 0 ? parts[index - 1] : ''));
  return {
    program: safeText(input.programId || input.program_id || deliverablePaths.programId || deliverablePaths.program_id || topic),
    topic,
    deliverable: safeText(input.deliverableId || input.deliverable_id || deliverablePaths.deliverableId || (index >= 0 ? parts[index + 1] : '')),
  };
}

function locator(input, withAttempt = true) {
  const ids = inferredIds(input);
  const stageId = safeText(input.canonicalStageId || input.canonical_stage_id, canonicalStageForRoute(input.routeStageId || input.route_stage_id));
  const base = {
    state_dir: stateDir(input),
    domain_id: safeText(input.domainId || input.domain_id, 'redcube_ai'),
    program_id: ids.program,
    topic_id: ids.topic,
    deliverable_id: ids.deliverable,
  };
  return withAttempt ? {
    ...base,
    stage_id: stageId,
    stage_order: input.stageOrder ?? input.stage_order ?? stageOrderForCanonicalStage(stageId),
    attempt_id: normalizedAttemptId(input.attemptId || input.attempt_id),
  } : base;
}

function normalizedAttemptId(value) {
  const raw = safeText(value, 'attempt');
  const normalized = raw.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (normalized && normalized.length <= 80) return normalized;
  return `attempt-${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24)}`;
}

function outputName(input) {
  return safeText(input.outputName || input.output_name)
    || path.basename(safeText(input.artifactFile || input.artifact_file))
    || `${safeText(input.routeStageId || input.route_stage_id || input.canonicalStageId, 'stage')}.json`;
}

function roles(input) {
  const explicit = unique([input.outputRole || input.output_role, ...(input.outputRoles || input.output_roles || [])])
    .filter((role) => RCA_STAGE_OUTPUT_CANONICAL_ROLES.includes(role));
  if (explicit.length) return explicit;
  const route = safeText(input.routeStageId || input.route_stage_id);
  if (['visual_director_review', 'screenshot_review', 'review_and_revision', 'deck_meta_review'].includes(route)) {
    return ['review_verdict'];
  }
  const canonical = canonicalStageForRoute(route);
  return RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS[canonical] || [];
}

function helperOutputRefs(input, attemptDir) {
  return (input.helperOutputRefs || input.helper_output_refs || []).map((entry) => {
    const file = safeText(entry.file || entry.output_file);
    if (!file || !fs.existsSync(file)) return { ...entry };
    const body = fs.readFileSync(file);
    return {
      ...entry,
      output_ref: path.relative(attemptDir, file),
      sha256: crypto.createHash('sha256').update(body).digest('hex'),
      bytes: body.length,
    };
  });
}

function publicPaths(input) {
  const paths = stageArtifactAttemptPaths(locator(input));
  return {
    root: paths.deliverable_root,
    current_file: paths.current_file,
    latest_file: paths.current_file,
    stage_dir: paths.stage_dir,
    latest_pointer: paths.latest_pointer,
    stage_current_file: paths.current_file,
    attempt_dir: paths.attempt_dir,
    attempt_file: paths.attempt_file,
    manifest_file: paths.manifest_file,
    inputs_dir: paths.inputs_dir,
    outputs_dir: paths.outputs_dir,
    evidence_dir: paths.evidence_dir,
    receipts_dir: paths.receipts_dir,
  };
}

export function stageFolderAttemptPaths(input) {
  openStageArtifactAttemptRuntime(locator(input));
  return publicPaths(input);
}

export function stageFolderOutputPath(input) {
  return path.join(publicPaths(input).outputs_dir, outputName(input));
}

export function stageFolderArtifactPath(input) {
  return readStageFolderArtifact(input)?.output_file
    || path.join(publicPaths(input).stage_dir, 'missing-current-output', outputName(input));
}

export function writeStageFolderArtifact(input): any {
  const attemptLocator = locator(input);
  const paths = publicPaths(input);
  const output = outputName(input);
  const ownerReceiptRefs = unique(input.ownerReceiptRefs || input.owner_receipt_refs);
  const qualityDebtRefs = unique(input.qualityDebtRefs || input.quality_debt_refs);
  const typedBlockerRefs = unique(input.typedBlockerRefs || input.typed_blocker_refs);
  const artifactFile = safeText(input.artifactFile || input.artifact_file)
    || path.join(paths.outputs_dir, output);
  let artifactReadable = fs.existsSync(artifactFile) && fs.statSync(artifactFile).isFile();
  if (!artifactReadable && typedBlockerRefs.length === 0) {
    fs.mkdirSync(path.dirname(artifactFile), { recursive: true });
    fs.writeFileSync(artifactFile, `${JSON.stringify({
      surface_kind: 'rca_stage_no_output_diagnostic',
      status: 'completed_with_quality_debt',
      route_stage_id: safeText(input.routeStageId || input.route_stage_id),
      canonical_stage_id: safeText(input.canonicalStageId || input.canonical_stage_id),
      stage_attempt_diagnostic: {
        failure_kind: 'no_output_diagnostic',
        message: 'Stage produced no readable domain artifact; this diagnostic preserves progress.',
      },
      progress_first: {
        diagnostic_available: true,
        advance_allowed: true,
        next_stage_may_start: true,
      },
      quality_debt: {
        status: 'recorded_non_blocking',
        reasons: ['stage_produced_no_readable_domain_artifact'],
        blocks_stage_transition: false,
        blocks_quality_export_or_ready_claims: true,
      },
    }, null, 2)}\n`, 'utf8');
    artifactReadable = true;
  }
  const terminalStatus = typedBlockerRefs.length > 0
    ? 'blocked'
    : ownerReceiptRefs.length > 0
      ? 'success'
      : 'completed_with_quality_debt';
  const effectiveQualityDebtRefs = terminalStatus === 'completed_with_quality_debt'
    ? (qualityDebtRefs.length > 0
        ? qualityDebtRefs
        : [`rca-quality-debt:${safeText(input.canonicalStageId || input.canonical_stage_id)}:${safeText(input.routeStageId || input.route_stage_id)}:${path.basename(paths.attempt_dir)}`])
    : [];
  const progressDeltaReceiptRef = terminalStatus === 'completed_with_quality_debt'
    ? `rca-progress-delta:${safeText(input.canonicalStageId || input.canonical_stage_id)}:${safeText(input.routeStageId || input.route_stage_id)}:${path.basename(paths.attempt_dir)}`
    : null;

  if (artifactReadable) {
    writeDomainArtifact({ ...attemptLocator, role: 'output', relative_path: output, body: fs.readFileSync(artifactFile) });
  }
  const outputRoles = roles(input);
  const interfacePayload = {
    surface_kind: 'rca_stage_output_role_interface',
    version: 'rca-stage-output-role-interface.v1',
    route_stage_id: safeText(input.routeStageId || input.route_stage_id),
    required_roles: unique(input.requiredOutputRoles || input.required_output_roles).length
      ? unique(input.requiredOutputRoles || input.required_output_roles)
      : outputRoles,
    present_roles: outputRoles,
    output_roles: outputRoles.map((role) => ({ role, output_ref: `outputs/${output}` })),
    helper_output_refs: helperOutputRefs(input, paths.attempt_dir),
    artifact_refs: unique(input.artifactRefs),
    review_export_refs: unique(input.reviewExportRefs),
    stage_quality_attempt: {
      attempt_role: safeText(input.attemptRole || input.attempt_role) || null,
      quality_round_index: Number(input.qualityRoundIndex ?? input.quality_round_index ?? 0),
      parent_attempt_ref: safeText(input.parentAttemptRef || input.parent_attempt_ref) || null,
      producer_attempt_ref: safeText(input.producerAttemptRef || input.producer_attempt_ref) || null,
      producer_session_ref: safeText(input.producerSessionRef || input.producer_session_ref) || null,
      no_context_inheritance: input.noContextInheritance === true || input.no_context_inheritance === true,
      context_manifest_ref: safeText(input.contextManifestRef || input.context_manifest_ref) || null,
    },
    authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
  };
  writeDomainArtifact({ ...attemptLocator, role: 'receipt', relative_path: 'rca-stage-output-interface.json', body: `${JSON.stringify(interfacePayload, null, 2)}\n` });
  if (ownerReceiptRefs.length) {
    writeDomainArtifact({ ...attemptLocator, role: 'receipt', relative_path: 'domain-owner-receipt.json', body: `${JSON.stringify({ surface_kind: 'domain_owner_receipt_ref', owner: 'redcube_ai', receipt_refs: ownerReceiptRefs }, null, 2)}\n` });
  }
  if (typedBlockerRefs.length) {
    writeDomainArtifact({ ...attemptLocator, role: 'evidence', relative_path: 'typed-blocker-ref.json', body: `${JSON.stringify({ surface_kind: 'domain_typed_blocker_ref', typed_blocker_refs: typedBlockerRefs, blocking_reasons: unique(input.blockingReasons || input.blocking_reasons) }, null, 2)}\n` });
  }
  if (effectiveQualityDebtRefs.length) {
    writeDomainArtifact({
      ...attemptLocator,
      role: 'evidence',
      relative_path: 'quality-debt-ref.json',
      body: `${JSON.stringify({
        surface_kind: 'rca_stage_quality_debt_ref',
        quality_debt_refs: effectiveQualityDebtRefs,
        blocking_reasons: unique(input.blockingReasons || input.blocking_reasons),
        blocks_stage_transition: false,
        blocks_quality_export_or_ready_claims: true,
      }, null, 2)}\n`,
    });
  }
  if (progressDeltaReceiptRef) {
    writeDomainArtifact({
      ...attemptLocator,
      role: 'receipt',
      relative_path: 'progress-delta-receipt.json',
      body: `${JSON.stringify({
        surface_kind: 'rca_progress_delta_receipt',
        receipt_ref: progressDeltaReceiptRef,
        produced_refs: [`outputs/${output}`],
        quality_debt_refs: effectiveQualityDebtRefs,
        stage_transition_authorized: true,
        quality_or_ready_claim_authorized: false,
      }, null, 2)}\n`,
    });
  }
  const committed = commitStageArtifactAttemptRuntime({
    ...attemptLocator,
    terminal_status: terminalStatus,
    required_outputs: [output],
    owner_receipt_refs: ownerReceiptRefs,
    quality_debt_refs: effectiveQualityDebtRefs,
    typed_blocker_refs: typedBlockerRefs,
  });
  const outputHash = committed.manifest.output_hashes.find((entry) => entry.path === output) || null;
  const stageReceipts = [
    ...ownerReceiptRefs.map((receiptRef) => ({ receipt_kind: 'domain_owner_receipt', receipt_ref: receiptRef, receipt_file: 'receipts/domain-owner-receipt.json', output_roles: outputRoles, route_stage_id: interfacePayload.route_stage_id, owner: 'redcube_ai' })),
    ...(progressDeltaReceiptRef ? [{ receipt_kind: 'progress_delta_receipt', receipt_ref: progressDeltaReceiptRef, receipt_file: 'receipts/progress-delta-receipt.json', output_roles: outputRoles, route_stage_id: interfacePayload.route_stage_id, owner: 'redcube_ai' }] : []),
    ...typedBlockerRefs.map((typedBlockerRef) => ({ receipt_kind: 'domain_typed_blocker', typed_blocker_ref: typedBlockerRef, evidence_file: 'evidence/typed-blocker-ref.json', output_roles: outputRoles, route_stage_id: interfacePayload.route_stage_id, owner: 'redcube_ai' })),
  ];
  const outputRefs = outputRoles.map((role) => ({
    role,
    output_ref: `outputs/${output}`,
    output_file: path.join(paths.outputs_dir, output),
    manifest_ref: 'manifest.json',
    receipt_ref: ownerReceiptRefs.length ? 'receipts/domain-owner-receipt.json' : null,
    progress_delta_receipt_ref: progressDeltaReceiptRef ? 'receipts/progress-delta-receipt.json' : null,
    quality_debt_ref: effectiveQualityDebtRefs.length ? 'evidence/quality-debt-ref.json' : null,
    typed_blocker_ref: typedBlockerRefs.length ? 'evidence/typed-blocker-ref.json' : null,
    sha256: outputHash?.sha256 || null,
    bytes: outputHash?.bytes || null,
  }));
  const domainManifest = {
    ...committed.manifest,
    domain_id: attemptLocator.domain_id,
    program_id: attemptLocator.program_id,
    topic_id: attemptLocator.topic_id,
    deliverable_id: attemptLocator.deliverable_id,
    status: terminalStatus,
    route_stage_id: interfacePayload.route_stage_id,
    output_file: path.join(paths.outputs_dir, output),
    required_output_roles: interfacePayload.required_roles,
    present_output_roles: outputRoles,
    output_refs: outputRefs,
    stage_output_role_interface: {
      ...interfacePayload,
      canonical_roles: RCA_STAGE_OUTPUT_CANONICAL_ROLES,
      file_name_is_interface: false,
      role_manifest_receipt_is_interface: true,
      output_roles: outputRefs,
    },
    helper_output_refs: interfacePayload.helper_output_refs,
    stage_receipts: stageReceipts,
    stage_quality_attempt: interfacePayload.stage_quality_attempt,
    artifact_refs: interfacePayload.artifact_refs,
    review_export_refs: interfacePayload.review_export_refs,
    authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
  };
  fs.writeFileSync(paths.manifest_file, `${JSON.stringify(domainManifest, null, 2)}\n`, 'utf8');
  const descriptorRefs = [
    path.join(paths.root, 'deliverable.json'),
    path.join(paths.stage_dir, 'stage.json'),
    paths.attempt_file,
  ];
  return {
    ...paths,
    output_file: path.join(paths.outputs_dir, output),
    manifest: domainManifest,
    receipt_file: path.join(paths.receipts_dir, 'domain-owner-receipt.json'),
    progress_receipt_file: path.join(paths.receipts_dir, 'progress-delta-receipt.json'),
    quality_debt_evidence_file: path.join(paths.evidence_dir, 'quality-debt-ref.json'),
    blocker_evidence_file: path.join(paths.evidence_dir, 'typed-blocker-ref.json'),
    artifact_refs: [...descriptorRefs, paths.manifest_file, paths.current_file, paths.latest_pointer, path.join(paths.outputs_dir, output)],
  };
}

export function readStageFolderArtifact(input): any {
  const base = locator(input, false);
  const stageId = canonicalStageForRoute(input.canonicalStageId || input.routeStageId || input.route_stage_id);
  const status = statusStageArtifactRuntime(base);
  const stage = status.stages.find((item) => item.stage_id === stageId);
  if (!stage?.latest_attempt_id) return null;
  const requestedRoute = safeText(input.routeStageId || input.route_stage_id);
  const selectedAttempt = requestedRoute
    ? stage.attempts.filter((attempt) => {
        const candidate = stageArtifactAttemptPaths({ ...base, stage_id: stageId, stage_order: stage.stage_order, attempt_id: attempt.attempt_id });
        const sidecar = path.join(candidate.receipts_dir, 'rca-stage-output-interface.json');
        return (fs.existsSync(sidecar) && safeText(readJson(sidecar).route_stage_id) === requestedRoute)
          || attempt.present_outputs?.includes(`${requestedRoute}.json`);
      }).sort((left, right) => {
        const mtime = (attempt) => {
          try { return fs.statSync(attempt.attempt_dir).mtimeMs; } catch { return 0; }
        };
        return mtime(left) - mtime(right) || left.attempt_id.localeCompare(right.attempt_id);
      }).at(-1)
    : stage.attempts.find((attempt) => attempt.attempt_id === stage.latest_attempt_id);
  if (!selectedAttempt) return null;
  const attemptLocator = { ...base, stage_id: stageId, stage_order: stage.stage_order, attempt_id: selectedAttempt.attempt_id };
  const paths = stageArtifactAttemptPaths(attemptLocator);
  const persistedManifest = fs.existsSync(paths.manifest_file) ? readJson(paths.manifest_file) : {};
  const output = requestedRoute ? `${requestedRoute}.json` : selectedAttempt.required_outputs[0];
  const selectedOutput = fs.existsSync(path.join(paths.outputs_dir, output)) ? output : selectedAttempt.required_outputs[0];
  const outputFile = selectedOutput ? path.join(paths.outputs_dir, selectedOutput) : '';
  const interfaceFile = path.join(paths.receipts_dir, 'rca-stage-output-interface.json');
  const domainInterface = fs.existsSync(interfaceFile) ? readJson(interfaceFile) : {};
  return {
    status: selectedAttempt.status,
    artifact: ['success', 'completed_with_quality_debt', 'blocked'].includes(selectedAttempt.status)
      && outputFile
      && fs.existsSync(outputFile)
      ? readJson(outputFile)
      : null,
    manifest: { ...persistedManifest, ...domainInterface, output_file: outputFile },
    manifest_file: paths.manifest_file,
    output_file: outputFile,
    output_names: selectedAttempt.required_outputs,
    outputs_dir: paths.outputs_dir,
    missing_outputs: selectedAttempt.missing_outputs,
    orphan_outputs: selectedAttempt.orphan_outputs,
    route_stage_id: safeText(domainInterface.route_stage_id),
    attempt_id: selectedAttempt.attempt_id,
    authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
  };
}
