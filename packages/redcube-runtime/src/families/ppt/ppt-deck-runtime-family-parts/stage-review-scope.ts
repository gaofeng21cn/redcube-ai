// @ts-nocheck

export function createPptDeckStageReviewScopeParts(deps) {
  const {
    safeArray,
    safeText,
  } = deps;

  function slideIdSet(slideIds = []) {
    return new Set(safeArray(slideIds).map((slideId) => safeText(slideId)).filter(Boolean));
  }

  function filterSlideScopedArray(value, slideIds) {
    const allowedSlideIds = slideIdSet(slideIds);
    return safeArray(value).filter((item) => {
      const itemSlideId = safeText(typeof item === 'string' ? item : item?.slide_id);
      return itemSlideId && allowedSlideIds.has(itemSlideId);
    });
  }

  function buildPageLocalVisualDirectionContext(visualDirection, slideIds) {
    const normalizedVisualDirection = visualDirection || {};
    return {
      mode: normalizedVisualDirection.mode,
      what_it_is: normalizedVisualDirection.what_it_is,
      what_it_is_not: normalizedVisualDirection.what_it_is_not,
      visual_manifest: normalizedVisualDirection.visual_manifest,
      palette: normalizedVisualDirection.palette,
      typography_plan: normalizedVisualDirection.typography_plan,
      page_family_ceiling: normalizedVisualDirection.page_family_ceiling || {},
      final_instruction_to_html_generator: safeArray(normalizedVisualDirection.final_instruction_to_html_generator),
      forbidden_regressions: safeArray(normalizedVisualDirection.forbidden_regressions),
      peak_pages: filterSlideScopedArray(normalizedVisualDirection.peak_pages, slideIds),
      page_role_table: filterSlideScopedArray(normalizedVisualDirection.page_role_table, slideIds),
      rhythm_curve: filterSlideScopedArray(normalizedVisualDirection.rhythm_curve, slideIds),
    };
  }


  return {
    buildPageLocalVisualDirectionContext,
    filterSlideScopedArray,
    slideIdSet,
  };
}
