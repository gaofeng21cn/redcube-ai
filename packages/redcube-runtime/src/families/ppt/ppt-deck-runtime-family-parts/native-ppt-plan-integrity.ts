import { readFileSync } from 'node:fs';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativePptPlanIntegrityDeps {
  existsSync(file: string): boolean;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptPlanIntegrityParts({
  existsSync,
  safeArray,
  safeText,
}: NativePptPlanIntegrityDeps) {
  function readEditableShapePlan(file: string): JsonRecord {
    if (!file || !existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
  }

  function slideMap(slides: JsonRecord[]): Map<string, JsonRecord> {
    return new Map(safeArray(slides)
      .map((slide) => [safeText(slide?.slide_id), slide] as [string, JsonRecord])
      .filter(([slideId]) => Boolean(slideId)));
  }

  function mergeRepairEditableShapePlan({
    editableShapePlan,
    priorNativeArtifact,
    blueprintArtifact,
    unitRepairScope,
  }: {
    editableShapePlan: JsonRecord;
    priorNativeArtifact: JsonRecord | null;
    blueprintArtifact: JsonRecord | null;
    unitRepairScope: JsonRecord;
  }): JsonRecord {
    const targetSlideIds = safeArray(unitRepairScope?.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean);
    const targetSet = new Set(targetSlideIds);
    const planSlides = safeArray(editableShapePlan?.slides);
    const planById = slideMap(planSlides);
    const missingTargetSlides = targetSlideIds.filter((slideId) => !planById.has(slideId));
    if (missingTargetSlides.length > 0) {
      throw new Error(`Native PPT repair plan missing targeted slide(s): ${missingTargetSlides.join(', ')}`);
    }

    const priorPlan = readEditableShapePlan(safeText(priorNativeArtifact?.native_ppt_bundle?.editable_shape_plan_file));
    const priorSlides = safeArray(priorPlan?.slides);
    const priorById = slideMap(priorSlides);
    const blueprintSlides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
    const allSlideIds = [
      ...new Set([
        ...blueprintSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        ...priorSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        ...planSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      ]),
    ];
    if (allSlideIds.length === 0) {
      throw new Error('Native PPT repair requires a full-deck slide id list');
    }

    const mergedSlides = allSlideIds.map((slideId) => {
      if (targetSet.has(slideId)) return planById.get(slideId);
      const priorSlide = priorById.get(slideId);
      if (!priorSlide) {
        throw new Error(`Native PPT repair requires prior AI spatial plan for preserved slide: ${slideId}`);
      }
      return priorSlide;
    });

    return {
      ...editableShapePlan,
      scope: 'page_repair_full_deck_materialization',
      target_slide_ids: targetSlideIds,
      preserved_slide_ids: allSlideIds.filter((slideId) => !targetSet.has(slideId)),
      slides: mergedSlides,
    };
  }

  function assertNativeDeckCompleteness({
    route,
    shapeManifest,
    payload,
    unitRepairScope,
  }: {
    route: NativePptRoute;
    shapeManifest: JsonRecord;
    payload: JsonRecord;
    unitRepairScope: JsonRecord;
  }): void {
    const expectedSlideIds = [
      ...safeArray(unitRepairScope?.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
      ...safeArray(unitRepairScope?.preserved_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
    ];
    if (expectedSlideIds.length === 0) return;
    const expected = new Set(expectedSlideIds);
    const manifestSlideIds = safeArray(shapeManifest?.slides).map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const bundleSlideIds = safeArray(payload?.slides).map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const manifestSet = new Set(manifestSlideIds);
    const bundleSet = new Set(bundleSlideIds);
    const missingManifest = expectedSlideIds.filter((slideId) => !manifestSet.has(slideId));
    const missingBundle = expectedSlideIds.filter((slideId) => !bundleSet.has(slideId));
    const extraManifest = manifestSlideIds.filter((slideId) => !expected.has(slideId));
    const extraBundle = bundleSlideIds.filter((slideId) => !expected.has(slideId));
    if (missingManifest.length || missingBundle.length || extraManifest.length || extraBundle.length) {
      throw new Error([
        `Native PPT ${route} requires full-deck materialization before review/export`,
        `missing_manifest=${missingManifest.join(',') || 'none'}`,
        `missing_bundle=${missingBundle.join(',') || 'none'}`,
        `extra_manifest=${extraManifest.join(',') || 'none'}`,
        `extra_bundle=${extraBundle.join(',') || 'none'}`,
      ].join('; '));
    }
  }

  return {
    assertNativeDeckCompleteness,
    mergeRepairEditableShapePlan,
  };
}
