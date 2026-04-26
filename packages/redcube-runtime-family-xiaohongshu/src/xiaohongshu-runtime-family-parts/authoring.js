export function createXiaohongshuAuthoringParts(deps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    attachCommon,
    buildAuthoringContext,
    buildStorylineInputs,
    creativeExecution,
    creativeSourceStamp,
    generateStructuredArtifact,
    isSeries,
    normalizeSignatureExposureGrammar,
    normalizeStringList,
    normalizeVisualAnchorSystem,
    promptRoute,
    publicSources,
    readStageArtifact,
    requireObjectArray,
    requireText,
    safeArray,
    safeText,
    singleNotePlanOutputContract,
    sourceBlockingEvidenceGaps,
    sourceConfidence,
    sourceDeepResearchState,
    sourceEvidenceGaps,
    sourceInputMode,
    sourceLabels,
    sourceMaterialIds,
    sourceResidualEvidenceGaps,
    sourceSufficiencyStatus,
    sourceTopicSummary,
    sourceTruth,
    storylineOutputContract,
    summarizePlanSlides,
    visualDirectionOutputContract,
  } = deps;

  function buildResearch(contract, adapter = CODEX_DEFAULT_ADAPTER) {
    const references = sourceTruth(contract)
      ? sourceLabels(contract)
      : publicSources();
    const topicSummary = sourceTopicSummary(contract)
      || `${safeText(contract.title, '本主题')} 需要根据任务目标和可用资料生成可信、可发布的小红书图文`;
    return {
      ...attachCommon('research', contract, null, adapter),
      source_readiness: {
        research_positioning: 'shared_source_readiness_augmentation',
        augmentation_triggered: sourceDeepResearchState(contract) === 'required',
        planning_ready: sourceSufficiencyStatus(contract) === 'planning_ready',
        blocking_evidence_gaps: sourceBlockingEvidenceGaps(contract),
        residual_evidence_gaps: sourceResidualEvidenceGaps(contract),
        trigger_signals: {
          source_missing_or_insufficient: sourceSufficiencyStatus(contract) !== 'planning_ready',
          task_requires_public_evidence: true,
        },
      },
      research: {
        topic_summary: topicSummary,
        fact_library_summary: topicSummary,
        mode: isSeries(contract) ? 'series' : 'single',
        reference_source_list: references,
        public_sources: references,
        evidence_gaps: sourceEvidenceGaps(contract),
        blocking_evidence_gaps: sourceBlockingEvidenceGaps(contract),
        residual_evidence_gaps: sourceResidualEvidenceGaps(contract),
        forbidden_source_hit_count: 0,
        input_mode: sourceInputMode(contract) || 'seed_only',
        confidence: sourceConfidence(contract) || 'low',
        source_sufficiency_judgement: sourceSufficiencyStatus(contract),
        source_truth_material_count: sourceMaterialIds(contract).length,
        source_truth_material_ids: sourceMaterialIds(contract),
        input_output_state: {
          current: 'input_ready',
          next: 'planning_ready',
        },
      },
    };
  }

  async function generateStorylineDraft(
    workspaceRoot,
    contract,
    researchArtifact,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'storyline',
      promptRelativePath: promptRoute(contract, 'storyline'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research: researchArtifact }),
        research: researchArtifact?.research || null,
        framing: buildStorylineInputs(contract, researchArtifact),
      },
      outputContract: storylineOutputContract(),
    });
    return {
      authoredStoryline: {
        mode: requireText(data?.mode, 'storyline.mode'),
        audience_judgement: requireText(data?.audience_judgement, 'storyline.audience_judgement'),
        tension: requireText(data?.tension, 'storyline.tension'),
        why_now: requireText(data?.why_now, 'storyline.why_now'),
        memory_hook: requireText(data?.memory_hook, 'storyline.memory_hook'),
        hook: requireText(data?.hook, 'storyline.hook'),
        narrative_progression: normalizeStringList(data?.narrative_progression, 'storyline.narrative_progression', { min: 3, max: 6 }),
        journey: normalizeStringList(data?.journey, 'storyline.journey', { min: 3, max: 5 }),
        resolution: requireText(data?.resolution, 'storyline.resolution'),
      },
      generationRuntime,
    };
  }

  async function buildStoryline(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const { authoredStoryline, generationRuntime } = await generateStorylineDraft(
      workspaceRoot,
      contract,
      research,
      adapter,
    );
    return {
      ...attachCommon('storyline', contract, generationRuntime, adapter),
      creative_execution: creativeExecution('storyline', generationRuntime, adapter),
      storyline: {
        mode: safeText(authoredStoryline.mode, research?.research?.mode || 'single'),
        audience_judgement: safeText(authoredStoryline.audience_judgement),
        tension: safeText(authoredStoryline.tension),
        why_now: safeText(authoredStoryline.why_now),
        memory_hook: safeText(authoredStoryline.memory_hook),
        hook: safeText(authoredStoryline.hook),
        narrative_progression: safeArray(authoredStoryline.narrative_progression),
        journey: safeArray(authoredStoryline.journey),
        resolution: safeText(authoredStoryline.resolution),
        series_needed: (research?.research?.mode || 'single') === 'series',
        source_truth_material_ids: safeArray(research?.research?.source_truth_material_ids),
        source_truth_confidence: safeText(research?.research?.confidence),
        creative_sources: {
          narrative_arc: creativeSourceStamp({
            route: 'storyline',
            lifecycleStage: 'story_architecture',
            authoredSurface: 'narrative_arc',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          memory_hook: creativeSourceStamp({
            route: 'storyline',
            lifecycleStage: 'story_architecture',
            authoredSurface: 'memory_hook',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
    };
  }

  function normalizePlanSlide(
    slide,
    index,
    sources,
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    return {
      slide_id: requireText(slide?.slide_id, `single_note_plan.slides[${index}].slide_id`),
      slide_no: index + 1,
      title: requireText(slide?.title, `single_note_plan.slides[${index}].title`),
      layout_family: requireText(slide?.layout_family, `single_note_plan.slides[${index}].layout_family`),
      render_recipe_id: requireText(slide?.render_recipe_id, `single_note_plan.slides[${index}].render_recipe_id`),
      page_goal: requireText(slide?.page_goal, `single_note_plan.slides[${index}].page_goal`),
      progression_role: requireText(slide?.progression_role, `single_note_plan.slides[${index}].progression_role`),
      core_sentence: requireText(
        safeArray(slide?.page_core_content)[0] || slide?.page_goal,
        `single_note_plan.slides[${index}].core_sentence`,
      ),
      page_core_content: normalizeStringList(slide?.page_core_content, `single_note_plan.slides[${index}].page_core_content`, { min: 2, max: 4 }),
      visual_presentation: {
        layout_family: requireText(slide?.visual_presentation?.layout_family || slide?.layout_family, `single_note_plan.slides[${index}].visual_presentation.layout_family`),
        main_visual_action: requireText(slide?.visual_presentation?.main_visual_action, `single_note_plan.slides[${index}].visual_presentation.main_visual_action`),
        action_primitive: requireText(slide?.visual_presentation?.action_primitive, `single_note_plan.slides[${index}].visual_presentation.action_primitive`),
        anchor_tracks: normalizeStringList(slide?.visual_presentation?.anchor_tracks, `single_note_plan.slides[${index}].visual_presentation.anchor_tracks`, { min: 2, max: 4 }),
        anti_template_note: requireText(slide?.visual_presentation?.anti_template_note, `single_note_plan.slides[${index}].visual_presentation.anti_template_note`),
      },
      source_language: requireText(slide?.source_language, `single_note_plan.slides[${index}].source_language`),
      evidence_and_sources: sources.map((source, sourceIndex) => ({
        source_id: `SRC-${index + 1}-${sourceIndex + 1}`,
        public_label: source,
      })),
      speaker_notes: requireText(slide?.speaker_notes, `single_note_plan.slides[${index}].speaker_notes`),
      transition: requireText(slide?.transition, `single_note_plan.slides[${index}].transition`),
      transition_sentence: requireText(slide?.transition, `single_note_plan.slides[${index}].transition`),
      creative_sources: {
        page_core_content: creativeSourceStamp({
          route: 'single_note_plan',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'page_core_content',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
          generationRuntime,
          adapter,
        }),
        visual_presentation: creativeSourceStamp({
          route: 'single_note_plan',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'visual_presentation',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
          generationRuntime,
          adapter,
        }),
        render_recipe_id: creativeSourceStamp({
          route: 'single_note_plan',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'render_recipe_id',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
          generationRuntime,
          adapter,
        }),
      },
      creative_authorship: {
        page_core_content: creativeSourceStamp({
          route: 'single_note_plan',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'page_core_content',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
          generationRuntime,
          adapter,
        }),
        visual_presentation: creativeSourceStamp({
          route: 'single_note_plan',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'visual_presentation',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
          generationRuntime,
          adapter,
        }),
      },
    };
  }

  async function generateSingleNotePlanDraft(
    workspaceRoot,
    contract,
    researchArtifact,
    storylineArtifact,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'single_note_plan',
      promptRelativePath: promptRoute(contract, 'single_note_plan'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research: researchArtifact }),
        research: researchArtifact?.research || null,
        storyline: storylineArtifact?.storyline || null,
      },
      outputContract: singleNotePlanOutputContract(),
    });
    const titleOptions = normalizeStringList(data?.title_options, 'single_note_plan.title_options', { min: 3, max: 5 });
    const sources = sourceLabels(contract).slice(0, 3);
    const slides = requireObjectArray(data?.slides, 'single_note_plan.slides', { min: 1 })
      .map((slide, index) => normalizePlanSlide(slide, index, sources, generationRuntime, adapter));
    return {
      authoredPlan: {
        title_options: titleOptions,
        slides,
      },
      generationRuntime,
    };
  }

  async function buildSingleNotePlan(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const { authoredPlan, generationRuntime } = await generateSingleNotePlanDraft(
      workspaceRoot,
      contract,
      research,
      storyline,
      adapter,
    );
    return {
      ...attachCommon('single_note_plan', contract, generationRuntime, adapter),
      creative_execution: creativeExecution('single_note_plan', generationRuntime, adapter),
      single_note_plan: {
        mode: isSeries(contract) ? 'series' : 'single',
        title_options: authoredPlan.title_options,
        planning_doc_markdown: ['# 01_单篇策划', '', `- 目标：${contract.goal}`, `- 封面钩子：${authoredPlan.title_options[0] || contract.title}`].join('\n'),
        slides: authoredPlan.slides,
        source_truth_material_ids: sourceMaterialIds(contract),
      },
    };
  }

  async function generateVisualDirectionDraft(
    workspaceRoot,
    contract,
    researchArtifact,
    storylineArtifact,
    planArtifact,
    mode,
    baselineDeliverableId,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'visual_direction',
      promptRelativePath: promptRoute(contract, 'visual_direction'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research: researchArtifact }),
        mode,
        baseline_deliverable_id: safeText(baselineDeliverableId) || null,
        storyline: storylineArtifact?.storyline || null,
        plan: {
          slides: summarizePlanSlides(planArtifact),
        },
      },
      outputContract: visualDirectionOutputContract(),
    });
    return {
      authoredVisualDirection: {
        director_statement: requireText(data?.director_statement, 'visual_direction.director_statement'),
        visual_motif: requireText(data?.visual_motif, 'visual_direction.visual_motif'),
        material_rules: {
          paper_base: requireText(data?.material_rules?.paper_base, 'visual_direction.material_rules.paper_base'),
          main_accent: requireText(data?.material_rules?.main_accent, 'visual_direction.material_rules.main_accent'),
          warning_accent: requireText(data?.material_rules?.warning_accent, 'visual_direction.material_rules.warning_accent'),
        },
        rhythm_curve: requireObjectArray(data?.rhythm_curve, 'visual_direction.rhythm_curve', { min: 1 }),
        peak_pages: normalizeStringList(data?.peak_pages, 'visual_direction.peak_pages', { min: 1 }),
        page_family_ceiling: data?.page_family_ceiling || {},
        anti_template_constraints: normalizeStringList(data?.anti_template_constraints, 'visual_direction.anti_template_constraints', { min: 2, max: 6 }),
        source_language_discipline: requireText(data?.source_language_discipline, 'visual_direction.source_language_discipline'),
        visual_anchor_system: normalizeVisualAnchorSystem(data?.visual_anchor_system),
        signature_exposure_grammar: normalizeSignatureExposureGrammar(data?.signature_exposure_grammar),
        forbidden_regressions: normalizeStringList(data?.forbidden_regressions, 'visual_direction.forbidden_regressions', { min: 2, max: 6 }),
      },
      generationRuntime,
    };
  }

  async function buildVisualDirection(
    workspaceRoot,
    contract,
    deliverablePaths,
    mode,
    baselineDeliverableId,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const { authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(
      workspaceRoot,
      contract,
      research,
      storyline,
      plan,
      mode,
      baselineDeliverableId,
      adapter,
    );
    const slides = safeArray(plan?.single_note_plan?.slides);
    const pageRoleTable = slides.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      page_role: slide.progression_role,
      first_glance: slide.visual_presentation?.main_visual_action || slide.title,
      second_glance: slide.page_goal,
    }));
    return {
      ...attachCommon('visual_direction', contract, generationRuntime, adapter),
      creative_execution: creativeExecution('visual_direction', generationRuntime, adapter),
      mode,
      lifecycle_stage: 'visual_authorship',
      visual_direction: {
        director_statement: authoredVisualDirection.director_statement,
        visual_motif: authoredVisualDirection.visual_motif,
        material_rules: authoredVisualDirection.material_rules,
        rhythm_curve: authoredVisualDirection.rhythm_curve,
        peak_pages: authoredVisualDirection.peak_pages,
        page_family_ceiling: authoredVisualDirection.page_family_ceiling,
        anti_template_constraints: authoredVisualDirection.anti_template_constraints,
        source_language_discipline: authoredVisualDirection.source_language_discipline,
        visual_anchor_system: authoredVisualDirection.visual_anchor_system,
        signature_exposure_grammar: authoredVisualDirection.signature_exposure_grammar,
        source_truth_confidence: sourceConfidence(contract) || safeText(storyline?.storyline?.source_truth_confidence),
        page_role_table: pageRoleTable,
        forbidden_regressions: authoredVisualDirection.forbidden_regressions,
        baseline_deliverable_id: mode === 'optimize_existing' ? baselineDeliverableId : null,
        memory_hook: safeText(storyline?.storyline?.memory_hook),
        creative_sources: {
          director_statement: creativeSourceStamp({
            route: 'visual_direction',
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'director_statement',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          visual_motif: creativeSourceStamp({
            route: 'visual_direction',
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'visual_motif',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          rhythm_curve: creativeSourceStamp({
            route: 'visual_direction',
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'rhythm_curve',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          page_family_ceiling: creativeSourceStamp({
            route: 'visual_direction',
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'page_family_ceiling',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
        creative_authorship: {
          visual_direction: creativeSourceStamp({
            route: 'visual_direction',
            lifecycleStage: 'visual_authorship',
            authoredSurface: 'visual_direction',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
    };
  }

  return {
    buildResearch,
    buildStoryline,
    buildSingleNotePlan,
    buildVisualDirection,
  };
}
