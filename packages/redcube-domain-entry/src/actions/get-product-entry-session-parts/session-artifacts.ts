// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function readJsonRecord(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function publicationProjectionForDeliverable(publicationProjection, deliverableId) {
  const deliverables = publicationProjection?.publication?.deliverables || {};
  return deliverables[safeText(deliverableId)] || null;
}

function collectArtifactRefsFromPublishBundle(publishBundleFile) {
  const file = safeText(publishBundleFile);
  if (!file || !existsSync(file)) return [];
  const artifact = readJsonRecord(file);
  const exportBundle = artifact?.export_bundle || {};
  return [
    file,
    ...(Array.isArray(artifact?.artifact_refs) ? artifact.artifact_refs : []),
    exportBundle?.source_html,
    exportBundle?.pptx_file,
    exportBundle?.pdf_file,
    exportBundle?.presenter_notes_file,
    exportBundle?.final_delivery?.pptx_file,
    exportBundle?.final_delivery?.pdf_file,
    exportBundle?.final_delivery?.manifest_file,
    exportBundle?.final_delivery?.readme_file,
  ].map((entry) => safeText(entry)).filter(Boolean);
}

function classifyArtifact(path) {
  const text = safeText(path);
  if (/\.pptx$/i.test(text)) return 'pptx';
  if (/\.pdf$/i.test(text)) return 'pdf';
  if (/\.png$/i.test(text)) return 'preview_png';
  if (/shape[_-]manifest.*\.json$/i.test(text) || /native_ppt_shape_manifest.*\.json$/i.test(text)) return 'shape_manifest';
  if (/manifest.*\.json$/i.test(text)) return 'manifest';
  if (/readme\.md$/i.test(text)) return 'readme';
  return 'artifact';
}

function artifactRefsFromPublicationProjection(publicationProjection, deliverableId) {
  const deliverableProjection = publicationProjectionForDeliverable(publicationProjection, deliverableId);
  const publishBundleFile = safeText(
    deliverableProjection?.canonical_export_artifact
      || deliverableProjection?.operator_handoff?.canonical_export_artifact,
  );
  return [...new Set(collectArtifactRefsFromPublishBundle(publishBundleFile))];
}

export function mergeArtifactInventoryWithPublicationRefs({ artifactInventory, publicationProjection, deliverableId }) {
  if (Array.isArray(artifactInventory?.artifact_refs) && artifactInventory.artifact_refs.length > 0) {
    return artifactInventory;
  }
  const artifactRefs = artifactRefsFromPublicationProjection(publicationProjection, deliverableId);
  if (artifactRefs.length === 0) {
    return artifactInventory;
  }
  return {
    ...artifactInventory,
    artifact_refs: artifactRefs,
    summary: {
      ...artifactInventory.summary,
      artifact_ref_count: artifactRefs.length,
      artifact_source: 'publication_projection',
    },
  };
}

export function buildNativeProofArtifactInventory({ artifactInventory, publicationProjection, deliverableId }) {
  const refs = Array.isArray(artifactInventory?.artifact_refs) ? artifactInventory.artifact_refs : [];
  const classifiedRefs = refs.map((entry) => ({
    artifact_kind: classifyArtifact(entry),
    path: entry,
  }));
  const nativeRefs = classifiedRefs.filter((entry) => (
    ['pptx', 'pdf', 'preview_png', 'shape_manifest', 'manifest'].includes(entry.artifact_kind)
    || /native[_-]ppt|shape[_-]manifest|final[_-]delivery/i.test(entry.path)
  ));
  const deliverableProjection = publicationProjectionForDeliverable(publicationProjection, deliverableId);
  return {
    surface_kind: 'native_ppt_proof_artifact_inventory',
    artifact_refs: nativeRefs,
    source_artifact_inventory: artifactInventory,
    publication_projection_ref: deliverableProjection
      ? {
        ref_kind: 'publication_projection_deliverable',
        deliverable_id: deliverableId,
      }
      : null,
    summary: {
      artifact_ref_count: nativeRefs.length,
      has_pptx: nativeRefs.some((entry) => entry.artifact_kind === 'pptx'),
      has_pdf: nativeRefs.some((entry) => entry.artifact_kind === 'pdf'),
      has_preview_png: nativeRefs.some((entry) => entry.artifact_kind === 'preview_png'),
      has_shape_manifest: nativeRefs.some((entry) => entry.artifact_kind === 'shape_manifest'),
      blocked_reason: nativeRefs.length > 0 ? null : 'native_proof_artifacts_not_found_in_session_inventory',
    },
  };
}
