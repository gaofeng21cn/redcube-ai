import { createHash } from 'node:crypto';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativePptRepairEvidenceDeps {
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptRepairEvidenceParts({
  safeArray,
  safeText,
}: NativePptRepairEvidenceDeps) {
  function stableJson(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableJson(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.keys(value as JsonRecord).sort().map((key) => (
        `${JSON.stringify(key)}:${stableJson((value as JsonRecord)[key])}`
      )).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function slideEvidencePayload(slide: JsonRecord | undefined): JsonRecord | null {
    if (!slide) return null;
    const {
      preview_screenshot_file: _previewScreenshotFile,
      screenshot_file: _screenshotFile,
      redcube_svg_ir_file: _redcubeSvgIrFile,
      ...content
    } = slide;
    return content;
  }

  function slideEvidenceHash(slide: JsonRecord | undefined): string | null {
    const payload = slideEvidencePayload(slide);
    if (!payload) return null;
    return createHash('sha256').update(stableJson(payload)).digest('hex');
  }

  function repairReasonFromFeedback(feedback: JsonRecord | undefined): JsonRecord {
    return {
      issues: safeArray(feedback?.issues).map((issue) => safeText(issue)).filter(Boolean),
      mechanical_issues: safeArray(feedback?.mechanical_issues).map((issue) => safeText(issue)).filter(Boolean),
      visual_findings: safeArray(feedback?.visual_findings).map((issue) => safeText(issue)).filter(Boolean),
      recommended_fix: safeText(feedback?.recommended_fix),
    };
  }

  function buildRepairEvidence({
    route,
    priorShapeManifest,
    shapeManifest,
    repairFeedback,
    unitRepairScope,
  }: {
    route: NativePptRoute;
    priorShapeManifest: JsonRecord;
    shapeManifest: JsonRecord;
    repairFeedback: JsonRecord[];
    unitRepairScope: JsonRecord;
  }): JsonRecord {
    const priorSlidesById = new Map(
      safeArray(priorShapeManifest?.slides).map((slide) => [safeText(slide?.slide_id), slide]),
    );
    const afterSlides = safeArray(shapeManifest?.slides);
    const afterSlidesById = new Map(afterSlides.map((slide) => [safeText(slide?.slide_id), slide]));
    const feedbackById = new Map(safeArray(repairFeedback).map((slide) => [safeText(slide?.slide_id), slide]));
    const targetSlideIds = safeArray(unitRepairScope?.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean);
    const preservedSlideIds = safeArray(unitRepairScope?.preserved_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean);
    const targetSet = new Set(targetSlideIds);
    const allSlideIds = [...new Set([
      ...safeArray(priorShapeManifest?.slides).map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      ...afterSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
    ])];
    const perSlideHashes = allSlideIds.map((slideId) => {
      const beforeSlide = priorSlidesById.get(slideId);
      const afterSlide = afterSlidesById.get(slideId);
      const beforeHash = slideEvidenceHash(beforeSlide);
      const afterHash = slideEvidenceHash(afterSlide);
      const targeted = targetSet.has(slideId);
      return {
        slide_id: slideId,
        targeted,
        before_slide_hash: beforeHash,
        after_slide_hash: afterHash,
        preserved_slide_hash: targeted ? null : beforeHash,
        hash_status: beforeHash && afterHash && beforeHash === afterHash ? 'unchanged' : targeted ? 'changed_by_targeted_repair' : 'changed_without_target',
        targeted_repair_reason: targeted ? repairReasonFromFeedback(feedbackById.get(slideId)) : null,
      };
    });
    const preservedSlideHashes = preservedSlideIds.map((slideId) => {
      const evidence = perSlideHashes.find((slide) => slide.slide_id === slideId);
      return {
        slide_id: slideId,
        before_slide_hash: evidence?.before_slide_hash || null,
        after_slide_hash: evidence?.after_slide_hash || null,
        preserved_slide_hash: evidence?.preserved_slide_hash || null,
        proof_status: evidence?.hash_status === 'unchanged' ? 'unchanged' : 'changed_without_target',
      };
    });
    const repairUnits = targetSlideIds.map((slideId) => {
      const feedback = feedbackById.get(slideId);
      const beforeSlide = priorSlidesById.get(slideId);
      const afterSlide = afterSlidesById.get(slideId);
      return {
        slide_id: slideId,
        reason: repairReasonFromFeedback(feedback),
        input: {
          source_review_stage: 'screenshot_review',
          review_feedback: feedback || null,
          before_slide_hash: slideEvidenceHash(beforeSlide),
          before_slide_manifest: beforeSlide || null,
        },
        output: {
          after_slide_hash: slideEvidenceHash(afterSlide),
          after_slide_manifest: afterSlide || null,
        },
      };
    });
    return {
      evidence_surface: 'native_ppt_repair_evidence_v1',
      route,
      source_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      per_slide_hashes: perSlideHashes,
      preserved_slide_hashes: preservedSlideHashes,
      repair_units: repairUnits,
      non_blocking_slide_reuse_ok: preservedSlideHashes.every((slide) => slide.proof_status === 'unchanged'),
    };
  }

  return {
    buildRepairEvidence,
  };
}
