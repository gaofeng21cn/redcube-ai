// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function readJsonIfExists(file) {
  if (!file || !existsSync(file)) return null;
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

function artifactRefsFrom(...values) {
  return Array.from(new Set(values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((item) => safeText(item))
    .filter(Boolean)));
}

function refGroup(refs, { planned = false } = {}) {
  const normalizedRefs = artifactRefsFrom(refs);
  return {
    refs: normalizedRefs,
    exists: planned
      ? normalizedRefs.length > 0
      : normalizedRefs.length > 0 && normalizedRefs.every((ref) => existsSync(ref)),
    planned,
  };
}

export function collectNativeTerminalEvidence({
  workspaceRoot,
  topicId,
  deliverableId,
  routeRuns,
  reportFile,
  providerMode,
}) {
  const deliverableRoot = path.join(
    workspaceRoot,
    topicId ? 'topics' : '',
    topicId || '',
    topicId ? 'deliverables' : '',
    deliverableId,
  );
  const artifactsDir = path.join(deliverableRoot, 'artifacts');
  const nativeArtifactFile = path.join(artifactsDir, 'native_ppt_bundle.json');
  const directorReviewFile = path.join(artifactsDir, 'director_review.json');
  const screenshotReviewFile = path.join(artifactsDir, 'quality_gate.json');
  const exportReceiptFile = path.join(artifactsDir, 'publish_bundle.json');
  const nativeArtifact = readJsonIfExists(nativeArtifactFile);
  const directorReview = readJsonIfExists(directorReviewFile);
  const screenshotReview = readJsonIfExists(screenshotReviewFile);
  const exportReceipt = readJsonIfExists(exportReceiptFile);
  const nativeBundle = nativeArtifact?.native_ppt_bundle || {};
  const exportBundle = exportReceipt?.export_bundle || {};
  const reviewScreenshots = safeArray(screenshotReview?.slide_reviews)
    .map((slide) => safeText(slide?.screenshot_file))
    .filter(Boolean);
  const renderScreenshots = artifactRefsFrom(
    nativeBundle.preview_screenshots,
    exportBundle.renderer_proof?.preview_screenshots,
    reviewScreenshots,
  );
  const refGroups = {
    editable_pptx: refGroup([
      nativeBundle.pptx_file,
      exportBundle.source_pptx,
      exportBundle.pptx_file,
      exportBundle.final_delivery?.pptx_file,
    ]),
    pdf: refGroup([
      nativeBundle.pdf_file,
      exportBundle.source_artifacts?.pdf_file,
      exportBundle.pdf_file,
      exportBundle.final_delivery?.pdf_file,
    ]),
    render_screenshots: refGroup(renderScreenshots),
    shape_manifest: refGroup([
      nativeBundle.shape_manifest_file,
      exportBundle.native_ppt_shape_manifest,
      exportBundle.source_artifacts?.shape_manifest_file,
    ]),
    visual_director_review_receipt: refGroup([directorReviewFile]),
    screenshot_review_receipt: refGroup([screenshotReviewFile]),
    export_receipt: refGroup([exportReceiptFile]),
    artifact_gallery: refGroup([exportBundle.artifact_gallery?.index_file]),
    agent_lab_run_report: refGroup([reportFile], { planned: true }),
  };
  const requiredRefGroups = [
    'editable_pptx',
    'pdf',
    'render_screenshots',
    'shape_manifest',
    'visual_director_review_receipt',
    'screenshot_review_receipt',
    'export_receipt',
    'artifact_gallery',
    'agent_lab_run_report',
  ];
  const missingRefGroups = requiredRefGroups.filter((group) => refGroups[group]?.exists !== true);
  return {
    surface_kind: 'rca_native_pptx_terminal_evidence_refs',
    status: missingRefGroups.length > 0 ? 'missing_required_refs' : 'refs_collected',
    lane: 'native',
    deliverable_id: deliverableId,
    route_chain: [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_pptx_native',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ],
    terminal_route: 'export_pptx',
    product_entry_domain_route: {
      entry_surface: 'invokeProductEntry',
      task_intent: 'run_deliverable_route',
      route_run_count: safeArray(routeRuns).length,
      terminal_route_run_id: safeArray(routeRuns).find((run) => run.route === 'export_pptx')?.run_id || null,
      hand_written_workflow: false,
    },
    required_ref_groups: requiredRefGroups,
    missing_ref_groups: missingRefGroups,
    ref_groups: refGroups,
    review_export_receipt_refs: {
      visual_director_review_receipt_file: existsSync(directorReviewFile) ? directorReviewFile : null,
      visual_director_review_status: safeText(directorReview?.status) || null,
      screenshot_review_receipt_file: existsSync(screenshotReviewFile) ? screenshotReviewFile : null,
      screenshot_review_status: safeText(screenshotReview?.status) || null,
      export_receipt_file: existsSync(exportReceiptFile) ? exportReceiptFile : null,
      export_status: safeText(exportReceipt?.status) || null,
      export_delivery_state: safeText(exportBundle?.delivery_state?.current) || null,
    },
    mock_provider_policy: {
      provider_mode: providerMode,
      mock_allowed_for_plumbing_only: providerMode === 'mock',
      proves_visual_sample_quality: false,
      can_claim_visual_ready: false,
      can_claim_exportable: false,
      can_claim_production_soak_complete: false,
    },
    authority_boundary: {
      refs_only: true,
      agent_lab_records_refs_only: true,
      agent_lab_can_write_rca_visual_verdict: false,
      agent_lab_can_write_owner_receipt: false,
      agent_lab_can_write_artifact_body: false,
      agent_lab_can_mutate_artifact_body: false,
      can_claim_visual_ready: false,
      can_claim_exportable: false,
      can_claim_production_ready: false,
    },
  };
}
