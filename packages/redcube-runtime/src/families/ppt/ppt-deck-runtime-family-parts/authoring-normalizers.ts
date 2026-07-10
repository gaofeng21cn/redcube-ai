// @ts-nocheck
export function createPptDeckAuthoringNormalizers(deps) {
  const {
    ALLOWED_RECIPE_IDS,
    DEFAULT_TYPOGRAPHY_PLAN,
    assertManuscriptEvidenceDensity,
    assertPageConstraints,
    normalizeStringList,
    requireText,
    safeArray,
    safeText,
    sharedSourceLabels,
  } = deps;

  function normalizePageCoreContent(value, label) {
    const items = safeArray(value)
      .map((item) => (item && typeof item === 'object'
        ? {
            label: safeText(item.label),
            text: safeText(item.text),
          }
        : {
            label: '',
            text: safeText(item),
          }))
      .filter((item) => item.text);
    if (items.length === 0) {
      throw new Error(`Missing ${label} in upstream ppt generation output`);
    }
    return items;
  }

  function normalizeUniqueClaimStringList(value, label, { min, max }) {
    const items = safeArray(value).map((item) => safeText(item)).filter(Boolean);
    if (items.length > max) {
      throw new Error(`${label} must contain at most ${max} entries in upstream ppt generation output`);
    }
    if (new Set(items).size !== items.length) {
      throw new Error(`Duplicate ${label} entry in upstream ppt generation output`);
    }
    return normalizeStringList(items, label, { min, max });
  }

  function normalizeClaimSpineLock(value, label = 'claim_spine_lock') {
    const claimIds = new Set();
    const claims = safeArray(value).map((claim, index) => {
      const claimLabel = `${label}[${index}]`;
      const claimId = requireText(claim?.claim_id, `${claimLabel}.claim_id`);
      if (claimIds.has(claimId)) {
        throw new Error(`Duplicate ${label} claim_id in upstream ppt generation output: ${claimId}`);
      }
      claimIds.add(claimId);
      const acceptedAbbreviation = safeText(claim?.first_use_naming?.accepted_abbreviation);
      return {
        claim_id: claimId,
        claim_text: requireText(claim?.claim_text, `${claimLabel}.claim_text`),
        source_refs: normalizeUniqueClaimStringList(
          claim?.source_refs,
          `${claimLabel}.source_refs`,
          { min: 1, max: 12 },
        ),
        first_use_naming: {
          full_visible_name: requireText(
            claim?.first_use_naming?.full_visible_name,
            `${claimLabel}.first_use_naming.full_visible_name`,
          ),
          accepted_abbreviation: acceptedAbbreviation || null,
          first_use_slide_id: requireText(
            claim?.first_use_naming?.first_use_slide_id,
            `${claimLabel}.first_use_naming.first_use_slide_id`,
          ),
        },
        introduction_slide_id: requireText(
          claim?.introduction_slide_id,
          `${claimLabel}.introduction_slide_id`,
        ),
        proof_slide_ids: normalizeUniqueClaimStringList(
          claim?.proof_slide_ids,
          `${claimLabel}.proof_slide_ids`,
          { min: 1, max: 12 },
        ),
        resolution_slide_id: requireText(
          claim?.resolution_slide_id,
          `${claimLabel}.resolution_slide_id`,
        ),
        forbidden_drift: normalizeUniqueClaimStringList(
          claim?.forbidden_drift,
          `${claimLabel}.forbidden_drift`,
          { min: 1, max: 8 },
        ),
      };
    });
    if (claims.length === 0) {
      throw new Error(`Missing ${label} in upstream ppt generation output`);
    }
    return claims;
  }

  function preserveClaimSpineLock(value, canonicalValue, label) {
    const canonical = normalizeClaimSpineLock(canonicalValue, 'storyline.claim_spine_lock');
    const candidate = normalizeClaimSpineLock(value, label);
    if (JSON.stringify(candidate) !== JSON.stringify(canonical)) {
      throw new Error(`${label} must preserve the canonical storyline claim_spine_lock without semantic drift`);
    }
    return canonical;
  }

  function assertClaimSpineSlideMapping(claimSpineLock, slides, label) {
    const orderedSlideIds = safeArray(slides).map((slide, index) => (
      requireText(slide?.slide_id, `${label}.slides[${index}].slide_id`)
    ));
    if (new Set(orderedSlideIds).size !== orderedSlideIds.length) {
      throw new Error(`${label} contains duplicate slide_id values`);
    }
    const slidePositions = new Map(orderedSlideIds.map((slideId, index) => [slideId, index]));
    for (const claim of claimSpineLock) {
      const mappedSlideIds = [
        claim.first_use_naming.first_use_slide_id,
        claim.introduction_slide_id,
        ...claim.proof_slide_ids,
        claim.resolution_slide_id,
      ];
      const missingSlideIds = [...new Set(mappedSlideIds)].filter((slideId) => !slidePositions.has(slideId));
      if (missingSlideIds.length > 0) {
        throw new Error(`${label} claim ${claim.claim_id} references missing slide ids: ${missingSlideIds.join(', ')}`);
      }
      const mappedPositions = mappedSlideIds.map((slideId) => slidePositions.get(slideId));
      if (mappedPositions.some((position, index) => index > 0 && position < mappedPositions[index - 1])) {
        throw new Error(`${label} claim ${claim.claim_id} must use non-decreasing slide order for first-use, introduction, proof, and resolution`);
      }
    }
  }

  function assertClaimSpineArtifactContinuity(
    storylineArtifact,
    outlineArtifact,
    blueprintArtifact,
    visualArtifact,
  ) {
    const storylineLock = normalizeClaimSpineLock(
      storylineArtifact?.storyline?.claim_spine_lock,
      'storyline.claim_spine_lock',
    );
    const outlineLock = preserveClaimSpineLock(
      outlineArtifact?.detailed_outline?.claim_spine_lock,
      storylineLock,
      'detailed_outline.claim_spine_lock',
    );
    assertClaimSpineSlideMapping(
      outlineLock,
      outlineArtifact?.detailed_outline?.slides,
      'detailed_outline.claim_spine_lock',
    );
    const blueprintLock = preserveClaimSpineLock(
      blueprintArtifact?.slide_blueprint?.claim_spine_lock,
      storylineLock,
      'slide_blueprint.claim_spine_lock',
    );
    assertClaimSpineSlideMapping(
      blueprintLock,
      blueprintArtifact?.slide_blueprint?.slides,
      'slide_blueprint.claim_spine_lock',
    );
    preserveClaimSpineLock(
      visualArtifact?.visual_direction?.claim_spine_lock,
      storylineLock,
      'visual_direction.claim_spine_lock',
    );
    return storylineLock;
  }

  function normalizeOutlineSlide(slide, index, defaultPublicSources) {
    const slideNo = Number(slide?.slide_no || index + 1);
    const renderRecipeId = requireText(slide?.render_recipe_id, `slides[${index}].render_recipe_id`);
    if (!ALLOWED_RECIPE_IDS.has(renderRecipeId)) {
      throw new Error(`Unsupported render_recipe_id in upstream ppt generation output: ${renderRecipeId}`);
    }

    return {
      slide_id: requireText(slide?.slide_id, `slides[${index}].slide_id`),
      slide_no: Number.isFinite(slideNo) ? slideNo : index + 1,
      chapter_id: safeText(slide?.chapter_id) || `C${Math.min(Math.floor(index / 3) + 1, 3)}`,
      page_type: requireText(slide?.page_type, `slides[${index}].page_type`),
      layout_family: requireText(slide?.layout_family, `slides[${index}].layout_family`),
      title: requireText(slide?.title, `slides[${index}].title`),
      page_goal: requireText(slide?.page_goal, `slides[${index}].page_goal`),
      page_objective: requireText(slide?.page_objective, `slides[${index}].page_objective`),
      core_sentence: requireText(slide?.core_sentence, `slides[${index}].core_sentence`),
      evidence_points: normalizeStringList(slide?.evidence_points, `slides[${index}].evidence_points`, { min: 2, max: 5 }),
      public_sources: normalizeStringList(
        slide?.public_sources,
        `slides[${index}].public_sources`,
        { min: 1, max: 4 },
      ),
      page_core_content: normalizePageCoreContent(slide?.page_core_content, `slides[${index}].page_core_content`),
      visual_anchor_tracks: normalizeStringList(
        slide?.visual_anchor_tracks,
        `slides[${index}].visual_anchor_tracks`,
        { min: 2, max: 6 },
      ),
      speaker_notes: requireText(slide?.speaker_notes, `slides[${index}].speaker_notes`),
      transition_sentence: requireText(slide?.transition_sentence, `slides[${index}].transition_sentence`),
      render_recipe_id: renderRecipeId,
      ...(safeArray(slide?.public_sources).length === 0
        ? { public_sources: defaultPublicSources.slice(0, 3) }
        : {}),
    };
  }

  function deriveChapterStructure(slides) {
    const groups = new Map();
    for (const slide of slides) {
      if (!groups.has(slide.chapter_id)) {
        groups.set(slide.chapter_id, []);
      }
      groups.get(slide.chapter_id).push(slide.slide_no);
    }
    return [...groups.entries()].map(([chapterId, slideNos], index) => ({
      chapter_id: chapterId,
      title: `第 ${index + 1} 章`,
      slide_range: `${String(Math.min(...slideNos)).padStart(2, '0')}-${String(Math.max(...slideNos)).padStart(2, '0')}`,
    }));
  }

  function normalizeChapterStructure(chapterStructure, slides) {
    const normalized = safeArray(chapterStructure)
      .map((chapter, index) => ({
        chapter_id: safeText(chapter?.chapter_id) || `C${index + 1}`,
        title: requireText(chapter?.title, `chapter_structure[${index}].title`),
        slide_range: requireText(chapter?.slide_range, `chapter_structure[${index}].slide_range`),
      }))
      .filter((chapter) => chapter.title);
    return normalized.length > 0 ? normalized : deriveChapterStructure(slides);
  }

  function normalizeOutlineDraft(data, contract) {
    const defaultPublicSources = sharedSourceLabels(contract);
    const slides = safeArray(data?.slides).map((slide, index) => normalizeOutlineSlide(slide, index, defaultPublicSources));
    if (slides.length === 0) {
      throw new Error('upstream ppt detailed_outline must contain at least one slide');
    }
    assertPageConstraints(slides, contract, 'upstream ppt detailed_outline');
    assertManuscriptEvidenceDensity(slides, contract, 'upstream ppt detailed_outline');
    return {
      chapter_structure: normalizeChapterStructure(data?.chapter_structure, slides),
      slides,
    };
  }

  function normalizeBlueprintDraft(data, contract) {
    const defaultPublicSources = sharedSourceLabels(contract);
    const slides = safeArray(data?.slides).map((slide, index) => normalizeOutlineSlide(slide, index, defaultPublicSources));
    if (slides.length === 0) {
      throw new Error('upstream ppt slide_blueprint must contain at least one slide');
    }
    assertPageConstraints(slides, contract, 'upstream ppt slide_blueprint');
    assertManuscriptEvidenceDensity(slides, contract, 'upstream ppt slide_blueprint');
    return {
      chapter_goal: requireText(data?.chapter_goal, 'slide_blueprint.chapter_goal'),
      slides,
    };
  }

  function normalizeRhythmCurve(value, slides) {
    const normalized = safeArray(value)
      .map((item) => ({
        slide_id: safeText(item?.slide_id),
        role: safeText(item?.role),
      }))
      .filter((item) => item.slide_id && item.role);
    if (normalized.length > 0) return normalized;
    return slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      role: index === 0 ? 'opening_peak' : (index === slides.length - 1 ? 'closing_peak' : 'progression'),
    }));
  }

  function normalizeTypographyTier(value, fallback) {
    const tier = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const fontSize = Number(tier.font_size);
    const lineHeight = Number(tier.line_height);
    const fontWeight = Number(tier.font_weight);
    return {
      font_size: Number.isFinite(fontSize) && fontSize > 0 ? fontSize : fallback.font_size,
      line_height: Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : fallback.line_height,
      font_weight: Number.isFinite(fontWeight) && fontWeight > 0 ? fontWeight : fallback.font_weight,
    };
  }

  function normalizeTypographyPlan(value) {
    const plan = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      cover_title: normalizeTypographyTier(plan.cover_title, DEFAULT_TYPOGRAPHY_PLAN.cover_title),
      body_title: normalizeTypographyTier(plan.body_title, DEFAULT_TYPOGRAPHY_PLAN.body_title),
      section_lead: normalizeTypographyTier(plan.section_lead, DEFAULT_TYPOGRAPHY_PLAN.section_lead),
      card_title: normalizeTypographyTier(plan.card_title, DEFAULT_TYPOGRAPHY_PLAN.card_title),
      card_body: normalizeTypographyTier(plan.card_body, DEFAULT_TYPOGRAPHY_PLAN.card_body),
      meta_label: normalizeTypographyTier(plan.meta_label, DEFAULT_TYPOGRAPHY_PLAN.meta_label),
      page_no: normalizeTypographyTier(plan.page_no, DEFAULT_TYPOGRAPHY_PLAN.page_no),
    };
  }

  function normalizeVisualDirectionDraft(data, slides) {
    return {
      visual_manifest: requireText(data?.visual_manifest, 'visual_direction.visual_manifest'),
      what_it_is: normalizeStringList(data?.what_it_is, 'visual_direction.what_it_is', { min: 2, max: 5 }),
      what_it_is_not: normalizeStringList(data?.what_it_is_not, 'visual_direction.what_it_is_not', { min: 2, max: 5 }),
      palette: data?.palette && typeof data.palette === 'object'
        ? data.palette
        : (() => {
            throw new Error('Missing visual_direction.palette in upstream ppt generation output');
          })(),
      typography_plan: normalizeTypographyPlan(data?.typography_plan),
      continuity_constraints: normalizeStringList(
        data?.continuity_constraints,
        'visual_direction.continuity_constraints',
        { min: 2, max: 6 },
      ),
      rhythm_curve: normalizeRhythmCurve(data?.rhythm_curve, slides),
      peak_pages: normalizeStringList(data?.peak_pages, 'visual_direction.peak_pages', { min: 1, max: 12 }),
      page_family_ceiling: data?.page_family_ceiling && typeof data.page_family_ceiling === 'object'
        ? data.page_family_ceiling
        : (() => {
            throw new Error('Missing visual_direction.page_family_ceiling in upstream ppt generation output');
          })(),
      forbidden_regressions: normalizeStringList(
        data?.forbidden_regressions,
        'visual_direction.forbidden_regressions',
        { min: 2, max: 6 },
      ),
      final_instruction_to_html_generator: normalizeStringList(
        data?.final_instruction_to_html_generator,
        'visual_direction.final_instruction_to_html_generator',
        { min: 2, max: 6 },
      ),
    };
  }

  function summarizeOutlineSlides(outlineArtifact) {
    return safeArray(outlineArtifact?.detailed_outline?.slides).map((slide) => ({
      slide_id: slide.slide_id,
      slide_no: slide.slide_no,
      chapter_id: slide.chapter_id,
      page_type: slide.page_type,
      layout_family: slide.layout_family,
      title: slide.title,
      page_goal: slide.page_goal,
      page_objective: slide.page_objective,
      core_sentence: slide.core_sentence,
      evidence_points: slide.evidence_points,
      public_sources: slide.public_sources,
      page_core_content: slide.page_core_content,
      visual_anchor_tracks: slide.visual_anchor_tracks,
      speaker_notes: slide.speaker_notes,
      transition_sentence: slide.transition_sentence,
      render_recipe_id: slide.render_recipe_id,
    }));
  }

  function summarizeBlueprintSlides(blueprintArtifact) {
    return safeArray(blueprintArtifact?.slide_blueprint?.slides).map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      page_type: slide.page_type,
      layout_family: slide.visual_presentation?.layout_family,
      page_goal: slide.page_goal,
      anchor_tracks: slide.visual_presentation?.anchor_tracks,
    }));
  }

  return {
    assertClaimSpineArtifactContinuity,
    assertClaimSpineSlideMapping,
    normalizeBlueprintDraft,
    normalizeClaimSpineLock,
    normalizeOutlineDraft,
    normalizeTypographyPlan,
    normalizeVisualDirectionDraft,
    preserveClaimSpineLock,
    summarizeBlueprintSlides,
    summarizeOutlineSlides,
  };
}
