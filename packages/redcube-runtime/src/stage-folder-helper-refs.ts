// @ts-nocheck
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { safeText } from './runtime-utils.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function fileContentHash(file) {
  const safeFile = safeText(file);
  if (!safeFile || !existsSync(safeFile)) return null;
  return createHash('sha256').update(readFileSync(safeFile)).digest('hex');
}

function fileSize(file) {
  const safeFile = safeText(file);
  if (!safeFile || !existsSync(safeFile)) return null;
  return Number(statSync(safeFile).size || 0);
}

function helperOutputRef({ file, role, evidenceRef = '', reviewReceiptRef = '' }) {
  const safeFile = safeText(file);
  const safeRole = safeText(role);
  if (!safeFile || !safeRole || !existsSync(safeFile)) return null;
  return {
    role: safeRole,
    file: safeFile,
    sha256: fileContentHash(safeFile),
    bytes: fileSize(safeFile),
    evidence_ref: safeText(evidenceRef),
    review_receipt_ref: safeText(reviewReceiptRef),
  };
}

export function helperOutputRefsForArtifact({ route, artifact }) {
  const refs = [];
  const add = (input) => {
    const ref = helperOutputRef(input);
    if (ref) refs.push(ref);
  };
  const reviewReceiptRef = safeText(artifact?.review_state_patch?.review_ref)
    || safeText(artifact?.review_capture?.manifest_file);

  add({ file: artifact?.image_page_manifest?.prompt_manifest, role: 'image_prompt_manifest' });
  add({ file: artifact?.image_page_manifest?.style_manifest, role: 'image_style_manifest' });
  add({ file: artifact?.image_page_manifest?.generation_metadata_file, role: 'image_generation_metadata' });
  for (const slide of safeArray(artifact?.image_page_manifest?.slides)) {
    add({ file: slide?.image_file || slide?.png_file, role: 'rendered_page_image' });
    add({ file: slide?.prompt_manifest_file, role: 'image_prompt_manifest' });
    add({ file: slide?.style_manifest_file, role: 'image_style_manifest' });
  }
  for (const page of safeArray(artifact?.image_pages_bundle?.pages)) {
    add({ file: page?.image_file || page?.png_file || page?.screenshot_file, role: 'rendered_page_image' });
    add({ file: page?.prompt_manifest_file, role: 'image_prompt_manifest' });
    add({ file: page?.style_manifest_file, role: 'image_style_manifest' });
  }

  add({
    file: artifact?.review_capture?.manifest_file,
    role: 'screenshot_capture_manifest',
    evidenceRef: 'review_capture.manifest_file',
    reviewReceiptRef,
  });
  add({
    file: artifact?.review_capture?.export_manifest_file,
    role: 'export_capture_manifest',
    evidenceRef: 'export_bundle.review_capture.export_manifest_file',
    reviewReceiptRef,
  });
  for (const slide of safeArray(artifact?.slide_reviews)) {
    add({
      file: slide?.screenshot_file,
      role: 'review_screenshot',
      evidenceRef: 'slide_reviews.screenshot_file',
      reviewReceiptRef,
    });
  }

  const nativeBundle = artifact?.native_ppt_bundle || {};
  add({ file: nativeBundle.editable_shape_plan_file, role: 'native_editable_shape_plan' });
  add({ file: nativeBundle.shape_manifest_file, role: 'native_shape_manifest' });
  add({ file: nativeBundle.repair_log_file, role: 'native_repair_log' });
  add({ file: nativeBundle.pptx_file, role: 'native_pptx' });
  add({ file: nativeBundle.pdf_file, role: 'native_pdf' });
  for (const file of safeArray(nativeBundle.preview_screenshots)) {
    add({ file, role: 'native_preview_screenshot' });
  }

  const exportBundle = artifact?.export_bundle || {};
  add({ file: exportBundle.pptx_file, role: route === 'export_pptx' ? 'export_pptx' : 'export_bundle_file' });
  add({ file: exportBundle.pdf_file, role: 'export_pdf' });
  add({ file: exportBundle.presenter_notes_file, role: 'export_presenter_notes' });
  add({ file: exportBundle.final_delivery?.manifest_file, role: 'handoff_manifest' });
  add({ file: exportBundle.artifact_gallery?.index_file, role: 'artifact_gallery_ref_index' });
  return refs.filter((ref, index, all) => (
    all.findIndex((candidate) => candidate.file === ref.file && candidate.role === ref.role) === index
  ));
}
