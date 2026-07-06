// @ts-nocheck
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(value) {
  return [...new Set(safeArray(value).map((entry) => safeText(entry)).filter(Boolean))];
}

export const RCA_STAGE_OUTPUT_CANONICAL_ROLES = Object.freeze([
  'source_truth_pack',
  'material_inventory',
  'strategy_brief',
  'visual_direction',
  'render_manifest',
  'review_verdict',
  'export_bundle',
  'handoff_manifest',
]);

export const RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS = Object.freeze({
  source_intake: ['source_truth_pack', 'material_inventory'],
  communication_strategy: ['strategy_brief'],
  visual_direction: ['visual_direction'],
  artifact_creation: ['render_manifest'],
  review_and_revision: ['review_verdict'],
  package_and_handoff: ['export_bundle', 'handoff_manifest'],
});

function canonicalRole(value) {
  const text = safeText(value);
  return RCA_STAGE_OUTPUT_CANONICAL_ROLES.includes(text) ? text : '';
}

function inferStageOutputRoles(input = {}) {
  const route = safeText(input.routeStageId || input.route_stage_id || input.canonicalStageId || input.canonical_stage_id);
  const explicit = uniqueStrings([
    input.outputRole || input.output_role,
    ...safeArray(input.outputRoles || input.output_roles),
  ]).map((role) => canonicalRole(role)).filter(Boolean);
  if (explicit.length > 0) return explicit;
  if (['source_readiness'].includes(route)) return ['source_truth_pack'];
  if (['research'].includes(route)) return ['material_inventory'];
  if (['storyline', 'detailed_outline', 'single_note_plan', 'communication_strategy'].includes(route)) {
    return ['strategy_brief'];
  }
  if (['slide_blueprint', 'poster_blueprint', 'visual_direction'].includes(route)) return ['visual_direction'];
  if ([
    'render_html',
    'fix_html',
    'author_image_pages',
    'repair_image_pages',
    'author_pptx_native',
    'repair_pptx_native',
  ].includes(route)) return ['render_manifest'];
  if (['visual_director_review', 'screenshot_review'].includes(route)) return ['review_verdict'];
  if (['publish_copy', 'export_bundle'].includes(route)) return ['export_bundle', 'handoff_manifest'];
  if (['export_pptx'].includes(route)) return ['export_bundle', 'handoff_manifest'];
  return [];
}

function requiredOutputNames(input, outputName, outputRoles) {
  const requested = uniqueStrings(input.requiredOutputs);
  const roleSet = new Set(outputRoles);
  const names = requested.filter((entry) => !roleSet.has(entry));
  return names.length > 0 ? names : [outputName];
}

function normalizeHelperOutputRefs(input, attemptDir) {
  return safeArray(input.helperOutputRefs || input.helper_output_refs).map((entry) => {
    const record = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
    const file = safeText(record.file || record.path || record.ref);
    const role = safeText(record.role);
    return {
      role,
      ref: file,
      output_ref: file && path.isAbsolute(file)
        ? path.relative(attemptDir, file).split(path.sep).join('/')
        : file,
      sha256: safeText(record.sha256),
      bytes: Number.isFinite(Number(record.bytes)) ? Number(record.bytes) : null,
      evidence_ref: safeText(record.evidence_ref || record.evidenceRef) || null,
      review_receipt_ref: safeText(record.review_receipt_ref || record.reviewReceiptRef) || null,
      review_receipt_refs: uniqueStrings(record.review_receipt_refs || record.reviewReceiptRefs),
    };
  }).filter((entry) => entry.role && entry.ref);
}

function safeSegment(value, fallback) {
  const text = safeText(value, fallback);
  if (!text || text.includes('/') || text.includes('\\') || text.includes('..')) {
    throw new Error(`Invalid stage folder segment: ${fallback}`);
  }
  return text;
}

function safeSegmentFromText(value, fallback) {
  const text = safeText(value, fallback);
  if (!text) return safeSegment(fallback, fallback);
  const normalized = text.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const compact = normalized || createHash('sha256').update(text).digest('hex').slice(0, 16);
  return safeSegment(compact.slice(0, 96), fallback);
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeTextAtomic(file, payload) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, payload, 'utf-8');
  renameSync(tmp, file);
}

function writeJson(file, payload) {
  writeTextAtomic(file, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function fileHashRecord(rootDir, file, role) {
  if (!existsSync(file)) return null;
  const content = readFileSync(file);
  return {
    path: path.relative(rootDir, file).split(path.sep).join('/'),
    role,
    sha256: createHash('sha256').update(content).digest('hex'),
    bytes: content.byteLength,
  };
}

function listRelativeFilesRecursive(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  const targetDir = path.join(dir, prefix);
  return readdirSync(targetDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) return listRelativeFilesRecursive(dir, relativePath);
    if (!entry.isFile()) return [];
    return [relativePath.split(path.sep).join('/')];
  }).sort();
}

function hashFiles(dir, role) {
  return listRelativeFilesRecursive(dir).map((relativePath) => {
    const file = path.join(dir, relativePath);
    const content = readFileSync(file);
    return {
      path: relativePath,
      role,
      sha256: createHash('sha256').update(content).digest('hex'),
      bytes: content.byteLength,
    };
  });
}

function fileMtimeMs(file) {
  if (!file || !existsSync(file)) return 0;
  try {
    return Number(statSync(file).mtimeMs || 0);
  } catch {
    return 0;
  }
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

function resolveOplStateRoot(input = {}) {
  const explicit = safeText(input.oplStateDir || input.opl_state_dir || process.env.OPL_STATE_DIR);
  if (explicit) return path.resolve(explicit);
  const homeDir = safeText(process.env.HOME, os.homedir());
  return path.join(homeDir, 'Library', 'Application Support', 'OPL', 'state');
}

function inferLocatorFromDeliverablePaths(deliverablePaths = {}) {
  const programId = safeText(deliverablePaths.programId || deliverablePaths.program_id);
  const explicitTopicId = safeText(deliverablePaths.topicId || deliverablePaths.topic_id);
  const deliverableDir = safeText(deliverablePaths.deliverableDir);
  const deliverableId = safeText(deliverablePaths.deliverableId);
  if (!deliverableDir) {
    return {
      programId,
      topicId: explicitTopicId,
      deliverableId,
    };
  }
  const parts = path.resolve(deliverableDir).split(path.sep);
  const deliverablesIndex = parts.lastIndexOf('deliverables');
  const topicId = explicitTopicId || (deliverablesIndex > 0 ? parts[deliverablesIndex - 1] : '');
  return {
    programId,
    topicId,
    deliverableId: deliverableId || safeText(parts[deliverablesIndex + 1]),
  };
}

function stageArtifactLocator(input = {}) {
  const inferred = inferLocatorFromDeliverablePaths(input.deliverablePaths);
  const topicId = safeText(input.topicId || input.topic_id, inferred.topicId);
  return {
    domainId: safeText(input.domainId || input.domain_id, 'redcube_ai'),
    programId: safeText(input.programId || input.program_id, inferred.programId || topicId),
    topicId,
    deliverableId: safeText(input.deliverableId || input.deliverable_id, inferred.deliverableId),
  };
}

function stageFolderName(canonicalStageId, stageOrder) {
  const stageId = safeSegment(canonicalStageId, 'stage');
  return Number.isInteger(stageOrder) && stageOrder > 0
    ? `${String(stageOrder).padStart(2, '0')}-${stageId}`
    : stageId;
}

function resolveStageDir(stageRoot, canonicalStageId) {
  const direct = path.join(stageRoot, safeSegment(canonicalStageId, 'stage'));
  if (existsSync(direct)) return direct;
  if (!existsSync(stageRoot)) return direct;
  const match = readdirSync(stageRoot, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.replace(/^\d+-/, '') === canonicalStageId);
  return match ? path.join(stageRoot, match.name) : direct;
}

const RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY = {
  owner: 'redcube_ai',
  opl_role: 'stage_folder_locator_and_index_consumer',
  stage_folder_current_pointer_role: 'artifact_attempt_pointer_not_opl_stage_run_current_pointer',
  stage_folder_terminal_status_role: 'domain_owner_closeout_receipt_projection_not_opl_stage_run_terminal_state',
  stage_transition_authority_required_for_opl_stage_run_current: true,
  can_write_opl_stage_run_current_pointer: false,
  can_write_opl_stage_run_terminal_state: false,
  can_publish_current_owner_delta: false,
  opl_can_issue_owner_receipt: false,
  opl_can_write_visual_truth: false,
  opl_can_write_review_export_verdict: false,
  opl_can_write_domain_artifact_body: false,
  rca_owns_artifact_authority: true,
};

export function canonicalStageForRoute(stageId) {
  const route = safeText(stageId);
  if (['source_readiness', 'research', 'storyline'].includes(route)) return 'source_intake';
  if (['detailed_outline', 'single_note_plan', 'communication_strategy'].includes(route)) return 'communication_strategy';
  if (['slide_blueprint', 'poster_blueprint', 'visual_direction'].includes(route)) return 'visual_direction';
  if ([
    'render_html',
    'fix_html',
    'author_image_pages',
    'repair_image_pages',
    'author_pptx_native',
    'repair_pptx_native',
  ].includes(route)) return 'artifact_creation';
  if (['visual_director_review', 'screenshot_review'].includes(route)) return 'review_and_revision';
  if (['publish_copy', 'export_bundle', 'export_pptx'].includes(route)) return 'package_and_handoff';
  return route || 'domain_specific';
}

export function stageOrderForCanonicalStage(stageId) {
  return {
    source_intake: 1,
    communication_strategy: 2,
    visual_direction: 3,
    artifact_creation: 4,
    review_and_revision: 5,
    package_and_handoff: 6,
  }[stageId] ?? 99;
}

function stageFolderRoot(input = {}) {
  const locator = stageArtifactLocator(input);
  return path.join(
    resolveOplStateRoot(input),
    'runtime-state',
    'domains',
    safeSegment(locator.domainId, 'domain'),
    'deliverables',
    safeSegment(locator.programId, 'program'),
    safeSegment(locator.topicId, 'topic'),
    safeSegment(locator.deliverableId, 'deliverable'),
  );
}

function buildStageFolderAttemptPaths(input, { createDirs = false } = {}) {
  const canonicalStageId = safeSegment(input.canonicalStageId, 'stage');
  const attemptId = safeSegmentFromText(input.attemptId, 'attempt');
  const root = stageFolderRoot(input);
  const stage_dir = path.join(root, 'stages', stageFolderName(canonicalStageId, input.stageOrder));
  const attempt_dir = path.join(stage_dir, 'attempts', attemptId);
  const paths = {
    root,
    current_file: path.join(root, 'current.json'),
    latest_file: path.join(root, 'latest.json'),
    stage_dir,
    latest_pointer: path.join(stage_dir, 'latest'),
    stage_current_file: path.join(stage_dir, 'current.json'),
    attempt_dir,
    attempt_file: path.join(attempt_dir, 'attempt.json'),
    manifest_file: path.join(attempt_dir, 'manifest.json'),
    inputs_dir: path.join(attempt_dir, 'inputs'),
    outputs_dir: path.join(attempt_dir, 'outputs'),
    evidence_dir: path.join(attempt_dir, 'evidence'),
    receipts_dir: path.join(attempt_dir, 'receipts'),
  };
  if (createDirs) {
    for (const dir of [paths.inputs_dir, paths.outputs_dir, paths.evidence_dir, paths.receipts_dir]) {
      ensureDir(dir);
    }
  }
  return paths;
}

export function stageFolderAttemptPaths(input) {
  return buildStageFolderAttemptPaths(input, { createDirs: true });
}

export function stageFolderOutputPath(input) {
  const canonicalStageId = safeText(input.canonicalStageId, canonicalStageForRoute(input.routeStageId));
  const paths = buildStageFolderAttemptPaths({
    ...input,
    canonicalStageId,
    stageOrder: input.stageOrder ?? stageOrderForCanonicalStage(canonicalStageId),
    attemptId: input.attemptId,
  });
  return path.join(paths.outputs_dir, outputNameForStage(input));
}

function outputNameForStage(input) {
  return safeText(input.outputName || input.output_name)
    || path.basename(safeText(input.artifactFile || input.artifact_file))
    || `${safeText(input.routeStageId || input.route_stage_id || input.canonicalStageId || input.canonical_stage_id, 'stage')}.json`;
}

export function stageFolderArtifactPath(input) {
  const canonicalStageId = safeText(input.canonicalStageId, canonicalStageForRoute(input.routeStageId));
  const loaded = readStageFolderArtifact({
    ...input,
    canonicalStageId,
  });
  if (loaded?.status && ['success', 'blocked'].includes(loaded.status) && loaded.output_file) {
    return loaded.output_file;
  }
  const root = stageFolderRoot(input);
  return path.join(
    root,
    'stages',
    stageFolderName(canonicalStageId, input.stageOrder ?? stageOrderForCanonicalStage(canonicalStageId)),
    'missing-current-output',
    outputNameForStage(input),
  );
}

function ownerReceiptRefsFor(input) {
  return uniqueStrings(input.ownerReceiptRefs || input.owner_receipt_refs);
}

function typedBlockerRefsFor(input) {
  return uniqueStrings(input.typedBlockerRefs || input.typed_blocker_refs);
}

function closeoutStatus(input) {
  const explicit = safeText(input.status);
  if (explicit === 'blocked' || explicit === 'success' || explicit === 'in_progress') return explicit;
  if (uniqueStrings(input.typedBlockerRefs || input.typed_blocker_refs).length > 0) return 'blocked';
  if (uniqueStrings(input.ownerReceiptRefs || input.owner_receipt_refs).length > 0) return 'success';
  return 'success';
}

function refsFromWritten(paths) {
  return [
    paths.deliverable_file,
    paths.stage_file,
    paths.attempt_file,
    paths.manifest_file,
    paths.receipt_file,
    paths.blocker_evidence_file,
    paths.current_file,
    paths.latest_file,
    paths.latest_pointer,
    paths.stage_current_file,
    paths.output_file,
  ].filter(Boolean);
}

function assertExplicitTerminalCloseoutRefs({ status, ownerReceiptRefs, typedBlockerRefs, canonicalStageId, attemptId }) {
  if (status === 'success' && ownerReceiptRefs.length === 0) {
    throw new Error(
      `RCA Stage Folder success closeout requires explicit ownerReceiptRefs for ${canonicalStageId}/${attemptId}`,
    );
  }
  if (status === 'blocked' && typedBlockerRefs.length === 0) {
    throw new Error(
      `RCA Stage Folder blocked closeout requires explicit typedBlockerRefs for ${canonicalStageId}/${attemptId}`,
    );
  }
}

function writeStageFolderDescriptors({ paths, locator, canonicalStageId, stageOrder }) {
  const deliverableFile = path.join(paths.root, 'deliverable.json');
  const stageFile = path.join(paths.stage_dir, 'stage.json');
  if (!existsSync(deliverableFile)) {
    writeJson(deliverableFile, {
      surface_kind: 'opl_stage_artifact_deliverable',
      domain_id: locator.domainId,
      program_id: locator.programId,
      topic_id: locator.topicId,
      deliverable_id: locator.deliverableId,
      authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
    });
  }
  if (!existsSync(stageFile)) {
    writeJson(stageFile, {
      surface_kind: 'opl_stage_artifact_stage',
      stage_id: canonicalStageId,
      stage_order: stageOrder,
      authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
    });
  }
  return {
    deliverable_file: deliverableFile,
    stage_file: stageFile,
  };
}

export function writeStageFolderArtifact(input) {
  const canonicalStageId = safeText(input.canonicalStageId, canonicalStageForRoute(input.routeStageId));
  const attemptId = safeSegmentFromText(input.attemptId, 'attempt');
  const stageOrder = input.stageOrder ?? stageOrderForCanonicalStage(canonicalStageId);
  const status = closeoutStatus(input);
  const ownerReceiptRefs = ownerReceiptRefsFor(input);
  const typedBlockerRefs = typedBlockerRefsFor(input);
  assertExplicitTerminalCloseoutRefs({
    status,
    ownerReceiptRefs,
    typedBlockerRefs,
    canonicalStageId,
    attemptId,
  });
  const paths = stageFolderAttemptPaths({
    ...input,
    deliverablePaths: input.deliverablePaths,
    canonicalStageId,
    stageOrder,
    attemptId,
  });
  const locator = stageArtifactLocator(input);
  const descriptors = writeStageFolderDescriptors({
    paths,
    locator,
    canonicalStageId,
    stageOrder,
  });
  const outputName = outputNameForStage(input);
  const outputFile = path.join(paths.outputs_dir, outputName);
  if (existsSync(input.artifactFile) && path.resolve(input.artifactFile) !== path.resolve(outputFile)) {
    writeFileSync(outputFile, readFileSync(input.artifactFile));
  }
  const outputRoles = inferStageOutputRoles(input);
  const requiredOutputRoles = uniqueStrings(input.requiredOutputRoles || input.required_output_roles)
    .map((role) => canonicalRole(role)).filter(Boolean);
  const effectiveRequiredOutputRoles = requiredOutputRoles.length > 0 ? requiredOutputRoles : outputRoles;
  const requiredOutputs = requiredOutputNames(input, outputName, outputRoles);
  const outputRef = path.relative(paths.attempt_dir, outputFile);
  const outputHash = fileHashRecord(paths.outputs_dir, outputFile, 'output');
  const outputHashes = outputHash ? [outputHash] : [];
  const receiptRef = ownerReceiptRefs.length > 0 ? 'receipts/domain-owner-receipt.json' : null;
  const blockerRef = typedBlockerRefs.length > 0 ? 'evidence/typed-blocker-ref.json' : null;
  const outputRoleRefs = outputRoles.map((role) => ({
    role,
    output_ref: outputRef,
    output_file: outputFile,
    manifest_ref: 'manifest.json',
    receipt_ref: receiptRef,
    typed_blocker_ref: blockerRef,
    sha256: outputHash?.sha256 || null,
    bytes: outputHash?.bytes || null,
  }));
  const helperOutputRefs = normalizeHelperOutputRefs(input, paths.attempt_dir);
  const stageReceipts = [
    ...ownerReceiptRefs.map((receiptRefValue) => ({
      receipt_kind: 'domain_owner_receipt',
      receipt_ref: receiptRefValue,
      receipt_file: receiptRef,
      output_roles: outputRoles,
      route_stage_id: safeText(input.routeStageId),
      owner: 'redcube_ai',
    })),
    ...typedBlockerRefs.map((blockerRefValue) => ({
      receipt_kind: 'domain_typed_blocker',
      typed_blocker_ref: blockerRefValue,
      evidence_file: blockerRef,
      output_roles: outputRoles,
      route_stage_id: safeText(input.routeStageId),
      owner: 'redcube_ai',
    })),
  ];
  writeJson(paths.attempt_file, {
    surface_kind: 'opl_stage_artifact_attempt',
    attempt_id: attemptId,
    route_stage_id: safeText(input.routeStageId),
    canonical_stage_id: canonicalStageId,
    stage_id: canonicalStageId,
    domain_id: locator.domainId,
    program_id: locator.programId,
    topic_id: locator.topicId,
    deliverable_id: locator.deliverableId,
    authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
  });
  if (ownerReceiptRefs.length > 0) {
    writeJson(path.join(paths.receipts_dir, 'domain-owner-receipt.json'), {
      surface_kind: 'domain_owner_receipt_ref',
      owner: 'redcube_ai',
      stage_id: canonicalStageId,
      route_stage_id: safeText(input.routeStageId),
      attempt_id: attemptId,
      receipt_refs: ownerReceiptRefs,
      output_hashes: outputHashes,
      authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
    });
  }
  if (typedBlockerRefs.length > 0) {
    writeJson(path.join(paths.evidence_dir, 'typed-blocker-ref.json'), {
      surface_kind: 'domain_typed_blocker_ref',
      owner: 'redcube_ai',
      stage_id: canonicalStageId,
      route_stage_id: safeText(input.routeStageId),
      attempt_id: attemptId,
      typed_blocker_refs: typedBlockerRefs,
      blocking_reasons: uniqueStrings(input.blockingReasons || input.blocking_reasons),
      authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
    });
  }
  const manifest = {
    surface_kind: 'opl_stage_artifact_manifest',
    version: 'stage-artifact-runtime.v1',
    manifest_version: 'stage-artifact-manifest.v1',
    domain_id: locator.domainId,
    program_id: locator.programId,
    topic_id: locator.topicId,
    deliverable_id: locator.deliverableId,
    route_stage_id: safeText(input.routeStageId),
    canonical_stage_id: canonicalStageId,
    stage_id: canonicalStageId,
    stage_order: stageOrder,
    attempt_id: attemptId,
    status,
    terminal_status: status === 'in_progress' ? null : status,
    artifact_file: input.artifactFile,
    output_file: outputFile,
    required_outputs: requiredOutputs,
    required_output_roles: effectiveRequiredOutputRoles,
    present_outputs: listRelativeFilesRecursive(paths.outputs_dir),
    present_output_roles: outputRoleRefs.map((entry) => entry.role),
    output_refs: outputRoleRefs,
    stage_output_role_interface: {
      surface_kind: 'rca_stage_output_role_interface',
      version: 'rca-stage-output-role-interface.v1',
      canonical_roles: RCA_STAGE_OUTPUT_CANONICAL_ROLES,
      required_roles: effectiveRequiredOutputRoles,
      present_roles: outputRoleRefs.map((entry) => entry.role),
      file_name_is_interface: false,
      role_manifest_receipt_is_interface: true,
      output_roles: outputRoleRefs,
    },
    helper_output_refs: helperOutputRefs,
    output_hashes: outputHashes,
    evidence_hashes: hashFiles(paths.evidence_dir, 'evidence'),
    receipt_hashes: hashFiles(paths.receipts_dir, 'receipt'),
    owner_receipt_refs: ownerReceiptRefs,
    typed_blocker_refs: typedBlockerRefs,
    decision_receipt_refs: [],
    stage_receipts: stageReceipts,
    review_export_refs: uniqueStrings(input.reviewExportRefs),
    artifact_refs: uniqueStrings(input.artifactRefs ?? []),
    authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
  };
  writeJson(paths.manifest_file, manifest);
  const pointer = {
    surface_kind: 'rca_stage_folder_current_pointer',
    current_stage: {
      stage_id: canonicalStageId,
      route_stage_id: safeText(input.routeStageId),
      attempt_id: attemptId,
      manifest_file: paths.manifest_file,
      output_file: outputFile,
      status,
    },
    authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
  };
  if (status === 'success' || status === 'blocked') {
    writeTextAtomic(paths.latest_pointer, `${attemptId}\n`);
    writeJson(paths.current_file, pointer);
    writeJson(paths.latest_file, pointer);
    writeJson(paths.stage_current_file, pointer);
  }
  const receiptFile = path.join(paths.receipts_dir, 'domain-owner-receipt.json');
  const blockerEvidenceFile = path.join(paths.evidence_dir, 'typed-blocker-ref.json');
  const writtenRefs = refsFromWritten({
    ...paths,
    ...descriptors,
    output_file: outputFile,
    receipt_file: existsSync(receiptFile) ? receiptFile : null,
    blocker_evidence_file: existsSync(blockerEvidenceFile) ? blockerEvidenceFile : null,
  });
  return {
    ...paths,
    output_file: outputFile,
    manifest,
    receipt_file: receiptFile,
    blocker_evidence_file: blockerEvidenceFile,
    artifact_refs: writtenRefs,
  };
}

export function readStageFolderArtifact(input) {
  const canonicalStageId = safeText(input.canonicalStageId, canonicalStageForRoute(input.routeStageId));
  const stageDir = resolveStageDir(path.join(stageFolderRoot(input), 'stages'), canonicalStageId);
  const latestPointer = path.join(stageDir, 'latest');
  const expectedRouteStageId = safeText(input.routeStageId || input.route_stage_id);
  const candidates = listAttemptDirs(stageDir);
  if (existsSync(latestPointer)) {
    const latestAttemptId = safeText(readFileSync(latestPointer, 'utf-8'));
    const latestAttemptDir = path.join(stageDir, 'attempts', latestAttemptId);
    if (existsSync(latestAttemptDir) && !candidates.includes(latestAttemptDir)) {
      candidates.push(latestAttemptDir);
    }
  }
  if (candidates.length === 0) return null;
  const inspected = candidates.map((attemptDir) => inspectStageFolderAttempt({
    attemptDir,
    expectedStageId: canonicalStageId,
  }));
  const routeMatched = expectedRouteStageId
    ? inspected.filter((attempt) => attempt.route_stage_id === expectedRouteStageId || !attempt.route_stage_id)
    : inspected;
  if (expectedRouteStageId && routeMatched.length === 0) {
    return null;
  }
  const ranked = [...routeMatched]
    .sort((left, right) => (
      Number(left.attempt_sort_key || 0) - Number(right.attempt_sort_key || 0)
      || String(left.attempt_id || '').localeCompare(String(right.attempt_id || ''))
    ));
  return ranked.at(-1) ?? null;
}

function listAttemptDirs(stageDir) {
  const attemptsDir = path.join(stageDir, 'attempts');
  if (!existsSync(attemptsDir)) return [];
  return readdirSync(attemptsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(attemptsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function inspectStageFolderAttempt({ attemptDir, expectedStageId }) {
  const manifestFile = path.join(attemptDir, 'manifest.json');
  const outputsDir = path.join(attemptDir, 'outputs');
  const outputNames = listFiles(outputsDir);
  if (!existsSync(manifestFile)) {
    const outputFiles = outputNames.map((name) => path.join(outputsDir, name));
    return {
      status: 'orphan',
      artifact: null,
      manifest: null,
      manifest_file: manifestFile,
      output_file: '',
      missing_outputs: [],
      orphan_outputs: outputNames,
      route_stage_id: '',
      attempt_id: path.basename(attemptDir),
      attempt_sort_key: Math.max(fileMtimeMs(attemptDir), ...outputFiles.map((file) => fileMtimeMs(file))),
      authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
    };
  }
  const manifest = readJson(manifestFile);
  const requiredOutputs = uniqueStrings(manifest.required_outputs);
  const missingOutputs = requiredOutputs.filter((name) => !existsSync(path.join(outputsDir, name)));
  const ownerReceiptRefs = uniqueStrings(manifest.owner_receipt_refs);
  const typedBlockerRefs = uniqueStrings(manifest.typed_blocker_refs);
  const receiptFiles = listFiles(path.join(attemptDir, 'receipts'));
  const evidenceFiles = listFiles(path.join(attemptDir, 'evidence'));
  const manifestStageId = safeText(manifest.stage_id || manifest.canonical_stage_id);
  const manifestAttemptId = safeText(manifest.attempt_id);
  const manifestValid = manifestStageId === expectedStageId && manifestAttemptId === path.basename(attemptDir);
  const status = !manifestValid
    ? (outputNames.length > 0 ? 'orphan' : 'broken')
    : missingOutputs.length > 0 && typedBlockerRefs.length === 0
      ? 'broken'
      : ownerReceiptRefs.length > 0 && receiptFiles.length > 0 && missingOutputs.length === 0
        ? 'success'
        : typedBlockerRefs.length > 0 && evidenceFiles.length > 0
          ? 'blocked'
          : 'in_progress';
  const outputFile = safeText(manifest.output_file) || (requiredOutputs[0] ? path.join(outputsDir, requiredOutputs[0]) : '');
  const receiptFilesAbs = receiptFiles.map((name) => path.join(attemptDir, 'receipts', name));
  const evidenceFilesAbs = evidenceFiles.map((name) => path.join(attemptDir, 'evidence', name));
  return {
    status,
    artifact: ['success', 'blocked'].includes(status) && outputFile && existsSync(outputFile) ? readJson(outputFile) : null,
    manifest,
    manifest_file: manifestFile,
    output_file: outputFile,
    missing_outputs: missingOutputs,
    orphan_outputs: status === 'orphan' ? outputNames : [],
    route_stage_id: safeText(manifest.route_stage_id),
    attempt_id: path.basename(attemptDir),
    attempt_sort_key: Math.max(
      fileMtimeMs(manifestFile),
      fileMtimeMs(outputFile),
      ...receiptFilesAbs.map((file) => fileMtimeMs(file)),
      ...evidenceFilesAbs.map((file) => fileMtimeMs(file)),
    ),
    authority_boundary: RCA_STAGE_FOLDER_AUTHORITY_BOUNDARY,
  };
}
