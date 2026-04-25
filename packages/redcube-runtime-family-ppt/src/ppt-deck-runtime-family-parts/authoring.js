export function createPptDeckAuthoringParts(deps) {
  const {
    ALLOWED_RECIPE_IDS,
    CREATIVE_MATERIALIZED_FROM,
    DEFAULT_TYPOGRAPHY_PLAN,
    PROMPT_PACK,
    PPT_PAGE_LIBRARY,
    attachCommon,
    audienceFacingMaterials,
    creativeExecution,
    deckPreset,
    extractAudienceFacingSnippet,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeStringList,
    pageBudget,
    requireText,
    resolveSpeakerIdentity,
    runtimeCreativeSource,
    safeArray,
    safeText,
    sharedFactLibrarySummary,
    sharedOperatorMaterials,
    sharedSourceAudience,
    sharedSourceConfidence,
    sharedSourceDeepResearchState,
    sharedSourceInputMode,
    sharedSourceLabels,
    sharedSourceMaterialIds,
    sharedSourceSufficiencyStatus,
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

  function extractApprovedSlidePlan(contract) {
    const operatorCorpus = sharedOperatorMaterials(contract)
      .map((material) => safeText(material?.content_text || material?.excerpt))
      .filter(Boolean)
      .join('\n\n');
    const matches = [...operatorCorpus.matchAll(/^##\s+Slide\s+(\d+)\s*[：:.-]?\s*(.*)$/gim)];
    if (matches.length === 0) return null;

    const slides = matches.map((match, index) => ({
      slide_no: Number(match[1]) || index + 1,
      title: safeText(match[2]),
    }));
    return {
      total_slides: slides.length,
      slides,
    };
  }

  function assertApprovedSlidePlan(slides, contract, label) {
    const approvedPlan = extractApprovedSlidePlan(contract);
    if (!approvedPlan) return;

    if (slides.length !== approvedPlan.total_slides) {
      throw new Error(`${label} must preserve approved slide plan: expected ${approvedPlan.total_slides} slides, got ${slides.length}`);
    }

    for (let index = 0; index < approvedPlan.slides.length; index += 1) {
      const expected = approvedPlan.slides[index];
      const actual = slides[index];
      if (actual.slide_no !== expected.slide_no) {
        throw new Error(`${label} must preserve approved slide order at index ${index + 1}: expected Slide ${expected.slide_no}, got Slide ${actual.slide_no}`);
      }
    }
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
    if (slides.length < 6) {
      throw new Error('upstream ppt detailed_outline must contain at least 6 slides');
    }
    assertApprovedSlidePlan(slides, contract, 'upstream ppt detailed_outline');
    return {
      chapter_structure: normalizeChapterStructure(data?.chapter_structure, slides),
      slides,
    };
  }

  function normalizeBlueprintDraft(data, contract) {
    const defaultPublicSources = sharedSourceLabels(contract);
    const slides = safeArray(data?.slides).map((slide, index) => normalizeOutlineSlide(slide, index, defaultPublicSources));
    if (slides.length < 6) {
      throw new Error('upstream ppt slide_blueprint must contain at least 6 slides');
    }
    assertApprovedSlidePlan(slides, contract, 'upstream ppt slide_blueprint');
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
      peak_pages: normalizeStringList(data?.peak_pages, 'visual_direction.peak_pages', { min: 2, max: 6 }),
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

  function storylineOutputContract() {
    return {
      speaker: '<string>',
      audience: '<string>',
      style: '<string>',
      core_metaphor: '<string>',
      hook: ['<string>'],
      journey: ['<string>', '<string>', '<string>'],
      resolution: ['<string>'],
    };
  }

  function detailedOutlineOutputContract() {
    return {
      chapter_structure: [
        { chapter_id: 'C1', title: '<string>', slide_range: '01-03' },
      ],
      slides: [
        {
          slide_id: 'S01',
          slide_no: 1,
          chapter_id: 'C1',
          page_type: 'cover_signal',
          layout_family: 'cover_signal',
          title: '<string>',
          page_goal: '<string>',
          page_objective: '<string>',
          core_sentence: '<string>',
          evidence_points: ['<string>', '<string>'],
          public_sources: ['<string>'],
          page_core_content: ['<string>', '<string>'],
          visual_anchor_tracks: ['<string>', '<string>'],
          speaker_notes: '<string>',
          transition_sentence: '<string>',
          render_recipe_id: 'ppt.hero_signal',
        },
      ],
    };
  }

  function slideBlueprintOutputContract() {
    return {
      chapter_goal: '<string>',
      slides: detailedOutlineOutputContract().slides,
    };
  }

  function visualDirectionOutputContract() {
    return {
      visual_manifest: '<string>',
      what_it_is: ['<string>', '<string>'],
      what_it_is_not: ['<string>', '<string>'],
      palette: {
        canvas: '#F7F8FC',
        ink: '#0F172A',
        accent: '#2563EB',
        accentSoft: '#DBEAFE',
        success: '#0F766E',
      },
      typography_plan: {
        cover_title: { font_size: 56, line_height: 1.08, font_weight: 800 },
        body_title: { font_size: 44, line_height: 1.12, font_weight: 780 },
        section_lead: { font_size: 24, line_height: 1.4, font_weight: 650 },
        card_title: { font_size: 21, line_height: 1.18, font_weight: 720 },
        card_body: { font_size: 16.5, line_height: 1.45, font_weight: 600 },
        meta_label: { font_size: 12.5, line_height: 1.1, font_weight: 600 },
        page_no: { font_size: 18, line_height: 1.0, font_weight: 600 },
      },
      continuity_constraints: ['<string>', '<string>'],
      rhythm_curve: [{ slide_id: 'S01', role: 'opening_peak' }],
      peak_pages: ['S01', 'S04'],
      page_family_ceiling: {
        cover_signal: 1,
        multi_zone_compare: 2,
        timeline_band: 1,
        judgement_ladder: 1,
        ring_cross: 1,
        summary_peak: 1,
      },
      forbidden_regressions: ['<string>', '<string>'],
      final_instruction_to_html_generator: ['<string>', '<string>'],
    };
  }

  function renderHtmlOutputContract() {
    return {
      slides: [
        {
          slide_id: 'S01',
          content_html: '<div data-slide-root="true" data-slide-id="S01">...</div>',
        },
      ],
      render_summary: ['<string>', '<string>'],
    };
  }

  function renderHtmlSummaryOutputContract() {
    return {
      render_summary: ['<string>', '<string>'],
    };
  }

  function directorReviewOutputContract() {
    return {
      director_intent_landed: true,
      anti_template_ok: true,
      peak_pages_landed: true,
      memory_hook_present: true,
      homogeneous_layout_risk: 0.22,
      weak_pages: ['S06'],
      review_summary: '<string>',
      rewrite_action: 'none | revise_render_html',
    };
  }

  function screenshotReviewSlideBatchOutputContract() {
    return {
      slide_reviews: [
        {
          slide_id: 'S01',
          judgement: 'pass',
          visual_findings: ['<string>'],
          recommended_fix: 'none',
        },
      ],
    };
  }

  function screenshotReviewSummaryOutputContract() {
    return {
      director_intent_landed: true,
      anti_template_ok: true,
      weak_pages: ['S06'],
      review_summary: '<string>',
    };
  }

  function buildAuthoringContext(contract) {
    const preset = deckPreset(contract.profile_id);
    const speakerIdentity = resolveSpeakerIdentity(contract, preset.speaker);
    return {
      title: safeText(contract.title),
      delivery_goal: safeText(contract.goal),
      profile_id: contract.profile_id,
      speaker: speakerIdentity,
      speaker_signature: speakerIdentity,
      speaker_role: preset.speaker,
      audience: sharedSourceAudience(contract, preset.audience),
      promise: preset.promise,
      page_budget: pageBudget(contract.profile_id),
      page_library: PPT_PAGE_LIBRARY,
      source_fact_summary: sharedFactLibrarySummary(contract),
      ready_sources: sharedSourceLabels(contract),
      evidence_excerpts: audienceFacingMaterials(contract)
        .slice(0, 6)
        .map((material) => ({
          material_id: material.material_id,
          source_id: material.source_id,
          excerpt: extractAudienceFacingSnippet(material.content_text || material.excerpt, 220),
        }))
        .filter((material) => material.excerpt),
      source_truth: {
        input_mode: sharedSourceInputMode(contract) || 'seed_only',
        confidence: sharedSourceConfidence(contract) || 'low',
        sufficiency_status: sharedSourceSufficiencyStatus(contract),
        deep_research_state: sharedSourceDeepResearchState(contract),
        material_ids: sharedSourceMaterialIds(contract),
      },
      approved_slide_plan: extractApprovedSlidePlan(contract),
      operator_playbook: sharedOperatorMaterials(contract)
        .slice(0, 6)
        .map((material) => ({
          source_id: material.source_id,
          excerpt: extractAudienceFacingSnippet(material.content_text || material.excerpt, 220),
        }))
        .filter((item) => item.excerpt),
      authoring_guardrails: [
        '如果 operator_playbook 提供了具名讲者署名，speaker / speaker_signature 必须保留 exact identity，不得泛化成“同行讲者”“正式讲者”等占位标签',
        'delivery_goal 只表示制作目标，不得原样进入 slide 标题、正文、讲稿或视觉宣言',
        '不要把“封面必须署名”“重点回答三件事”“先讲什么后讲什么”等系统操作说明写成 audience-facing 内容',
        'operator_playbook 只作为制作约束，不得被改写成课堂正文、标题、来源或讲稿台词',
        '如果共享事实材料不足，只能做保守抽象，不要发明内部流程细节或伪来源',
      ],
    };
  }

  async function generateStorylineDraft(contract, adapter) {
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'storyline',
      promptRelativePath: PROMPT_PACK.storyline,
      context: buildAuthoringContext(contract),
      outputContract: storylineOutputContract(),
    });
    return {
      authoredStoryline: {
        speaker: requireText(data?.speaker, 'storyline.speaker'),
        audience: requireText(data?.audience, 'storyline.audience'),
        style: requireText(data?.style, 'storyline.style'),
        core_metaphor: requireText(data?.core_metaphor, 'storyline.core_metaphor'),
        hook: normalizeStringList(data?.hook, 'storyline.hook', { min: 1, max: 3 }),
        journey: normalizeStringList(data?.journey, 'storyline.journey', { min: 3, max: 5 }),
        resolution: normalizeStringList(data?.resolution, 'storyline.resolution', { min: 1, max: 3 }),
      },
      generationRuntime,
    };
  }

  function buildOutlineContext(contract, storylineArtifact) {
    return {
      ...buildAuthoringContext(contract),
      storyline: {
        speaker: safeText(storylineArtifact?.storyline?.speaker),
        audience: safeText(storylineArtifact?.storyline?.audience),
        style: safeText(storylineArtifact?.storyline?.style),
        core_metaphor: safeText(storylineArtifact?.storyline?.core_metaphor),
        hook: safeArray(storylineArtifact?.storyline?.narrative_arc?.hook),
        journey: safeArray(storylineArtifact?.storyline?.narrative_arc?.journey),
        resolution: safeArray(storylineArtifact?.storyline?.narrative_arc?.resolution),
      },
    };
  }

  async function generateOutlineDraft(contract, storylineArtifact, adapter) {
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'detailed_outline',
      promptRelativePath: PROMPT_PACK.detailed_outline,
      context: buildOutlineContext(contract, storylineArtifact),
      outputContract: detailedOutlineOutputContract(),
    });
    return {
      authoredOutline: normalizeOutlineDraft(data, contract),
      generationRuntime,
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

  async function generateBlueprintDraft(contract, outlineArtifact, adapter) {
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'slide_blueprint',
      promptRelativePath: PROMPT_PACK.slide_blueprint,
      context: {
        ...buildAuthoringContext(contract),
        outline: {
          chapter_structure: safeArray(outlineArtifact?.detailed_outline?.chapter_structure),
          slides: summarizeOutlineSlides(outlineArtifact),
        },
      },
      outputContract: slideBlueprintOutputContract(),
    });
    return {
      authoredBlueprint: normalizeBlueprintDraft(data, contract),
      generationRuntime,
    };
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

  async function generateVisualDirectionDraft(contract, blueprintArtifact, mode, baselineDeliverableId, adapter) {
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'visual_direction',
      promptRelativePath: PROMPT_PACK.visual_direction,
      context: {
        ...buildAuthoringContext(contract),
        mode,
        baseline_deliverable_id: safeText(baselineDeliverableId) || null,
        blueprint: {
          slides: summarizeBlueprintSlides(blueprintArtifact),
        },
      },
      outputContract: visualDirectionOutputContract(),
    });
    return {
      authoredVisualDirection: normalizeVisualDirectionDraft(data, blueprintArtifact.slide_blueprint.slides),
      generationRuntime,
    };
  }

  async function buildStoryline(contract, adapter) {
    const { authoredStoryline, generationRuntime } = await generateStorylineDraft(contract, adapter);
    return {
      ...attachCommon('storyline', contract, generationRuntime, adapter),
      creative_execution: {
        ...creativeExecution('storyline', generationRuntime, adapter),
        lifecycle_stage: lifecycleStageForRoute(contract, 'storyline'),
      },
      storyline: {
        speaker: safeText(authoredStoryline.speaker),
        audience: safeText(authoredStoryline.audience),
        goal: safeText(contract.goal),
        style: safeText(authoredStoryline.style),
        core_metaphor: safeText(authoredStoryline.core_metaphor),
        narrative_arc: {
          hook: safeArray(authoredStoryline.hook),
          journey: safeArray(authoredStoryline.journey),
          resolution: safeArray(authoredStoryline.resolution),
        },
        source_truth_input_mode: sharedSourceInputMode(contract) || 'seed_only',
        source_truth_confidence: sharedSourceConfidence(contract) || 'low',
        source_truth_material_ids: sharedSourceMaterialIds(contract),
        source_sufficiency_judgement: sharedSourceSufficiencyStatus(contract),
        deep_research_state: sharedSourceDeepResearchState(contract),
        fact_library_summary: sharedFactLibrarySummary(contract),
        creative_sources: {
          core_metaphor: runtimeCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM, generationRuntime, adapter),
          narrative_arc: runtimeCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM, generationRuntime, adapter),
        },
      },
    };
  }

  return {
    buildAuthoringContext,
    buildStoryline,
    directorReviewOutputContract,
    generateBlueprintDraft,
    generateOutlineDraft,
    generateVisualDirectionDraft,
    normalizeTypographyPlan,
    renderHtmlOutputContract,
    renderHtmlSummaryOutputContract,
    screenshotReviewSlideBatchOutputContract,
    screenshotReviewSummaryOutputContract,
    summarizeBlueprintSlides,
  };
}
