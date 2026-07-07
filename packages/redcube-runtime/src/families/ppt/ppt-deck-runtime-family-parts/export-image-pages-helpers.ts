import path from 'node:path';

import { materializeScreenshotCaptureStore } from '@redcube/runtime-protocol';

type JsonRecord = Record<string, any>;

export function createPptDeckExportImagePageHelpers(deps: {
  ensureDir(dir: string): string;
  fileSha256(file: unknown): string | null;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  writeJson(file: string, data: unknown): void;
}) {
  const {
    ensureDir,
    fileSha256,
    safeArray,
    safeText,
    writeJson,
  } = deps;

  function imagePagesSourceRefs(renderArtifact: JsonRecord): JsonRecord {
    const bundle = renderArtifact?.image_pages_bundle || renderArtifact?.image_pages || {};
    const pages = safeArray(bundle?.pages || renderArtifact?.pages).map((page) => ({
      slide_id: safeText(page?.slide_id),
      title: safeText(page?.title),
      png_file: safeText(page?.png_file || page?.image_file || page?.screenshot_file || page?.file),
      prompt_manifest_file: safeText(page?.prompt_manifest_file || bundle?.prompt_manifest_file || renderArtifact?.prompt_manifest_file),
      style_manifest_file: safeText(page?.style_manifest_file || bundle?.style_manifest_file || renderArtifact?.style_manifest_file),
    }));
    return {
      source_visual_route: safeText(renderArtifact?.route),
      prompt_manifest_file: safeText(bundle?.prompt_manifest_file || renderArtifact?.prompt_manifest_file),
      style_manifest_file: safeText(bundle?.style_manifest_file || renderArtifact?.style_manifest_file),
      pages,
      png_files: pages.map((page) => page.png_file).filter(Boolean),
      prompt_manifest_files: [...new Set(pages.map((page) => page.prompt_manifest_file).filter(Boolean))],
      style_manifest_files: [...new Set(pages.map((page) => page.style_manifest_file).filter(Boolean))],
    };
  }

  function buildImagePagesArtifactGallery({
    contract,
    deliverableId,
    renderArtifact,
    pptxPath,
    pdfPath,
    notesFile,
    finalDelivery,
  }: JsonRecord): JsonRecord {
    const sourceArtifacts = imagePagesSourceRefs(renderArtifact);
    const artifactGalleryDir = ensureDir(path.join(path.dirname(pptxPath), 'artifact_gallery'));
    const artifactGalleryIndexFile = path.join(artifactGalleryDir, 'index.json');
    const gallery = {
      surface_kind: 'image_pages_export_operator_artifact_gallery_v1',
      status: 'output_ready',
      title: safeText(contract?.title),
      deliverable_id: deliverableId,
      source_visual_route: safeText(renderArtifact?.route),
      editable: false,
      artifacts: {
        source: sourceArtifacts,
        final: {
          pptx_file: pptxPath,
          pdf_file: pdfPath,
          presenter_notes_file: notesFile,
          final_delivery_pptx_file: finalDelivery.pptx_file,
          final_delivery_pdf_file: finalDelivery.pdf_file,
        },
        evidence: {
          final_delivery_manifest_file: finalDelivery.manifest_file,
          final_delivery_readme_file: finalDelivery.readme_file,
        },
      },
      hashes: {
        source_png_sha256: sourceArtifacts.png_files.map((file: string) => ({ file, sha256: fileSha256(file) })),
        prompt_manifest_sha256: sourceArtifacts.prompt_manifest_files.map((file: string) => ({ file, sha256: fileSha256(file) })),
        style_manifest_sha256: sourceArtifacts.style_manifest_files.map((file: string) => ({ file, sha256: fileSha256(file) })),
        final_pptx_sha256: fileSha256(pptxPath),
        final_pdf_sha256: fileSha256(pdfPath),
      },
      updated_at: new Date().toISOString(),
    };
    writeJson(artifactGalleryIndexFile, gallery);
    return {
      ...gallery,
      index_file: artifactGalleryIndexFile,
    };
  }

  function materializeFullCaptureForExport({
    deliverablePaths,
    reviewArtifact,
    screenshotsDir,
  }: {
    deliverablePaths: JsonRecord;
    reviewArtifact: JsonRecord;
    screenshotsDir: string;
  }): { screenshotsDir: string; manifest: JsonRecord | null } {
    if (safeText(reviewArtifact?.review_capture?.capture_mode, 'full') !== 'delta') {
      return { screenshotsDir, manifest: null };
    }
    const captureId = `${safeText(reviewArtifact?.review_capture?.capture_id, 'review-capture')}-full`;
    const fullScreenshotsDir = path.join(deliverablePaths.reportsDir, 'screenshots', captureId);
    const manifest = materializeScreenshotCaptureStore({
      reportsDir: deliverablePaths.reportsDir,
      captureId,
      screenshotsDir: fullScreenshotsDir,
      slideReviews: safeArray(reviewArtifact?.slide_reviews),
      currentViewMode: 'hardlink',
      captureMode: 'full',
    }) as JsonRecord;
    return {
      screenshotsDir: fullScreenshotsDir,
      manifest,
    };
  }

  return {
    buildImagePagesArtifactGallery,
    imagePagesSourceRefs,
    materializeFullCaptureForExport,
  };
}
