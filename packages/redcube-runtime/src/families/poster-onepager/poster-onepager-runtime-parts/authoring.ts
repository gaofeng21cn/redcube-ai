// @ts-nocheck
import { createPosterOnepagerAuthoringAssemblyHelpers } from './authoring-assembly-helpers.js';

export function createPosterOnepagerAuthoringParts(deps) {
  const {
    BANNED_RENDER_TOKENS,
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    MIN_REVIEW_PRIMARY_POINTS,
    MIN_REVIEW_QA_BLOCKS,
    attachCommon,
    creativeExecution,
    creativeSourceStamp,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeStringList,
    operatorMaterials,
    promptRoute,
    readStageArtifact,
    requireObjectArray,
    requireText,
    safeArray,
    safeText,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
  } = deps;

  const {
    buildAuthoringContext,
    buildHtml,
    directorReviewOutputContract,
    hydrateRenderedSlideRootMetadata,
    loadRenderedPosterSlideHtmlMap,
    normalizeInlineText,
    normalizePanel,
    posterBlueprintOutputContract,
    renderHtmlOutputContract,
    screenshotReviewOutputContract,
    stripHtml,
    storylineOutputContract,
    summarizePanels,
    validateRenderedReviewAnchors,
    visualDirectionOutputContract,
  } = createPosterOnepagerAuthoringAssemblyHelpers({
    MIN_REVIEW_PRIMARY_POINTS,
    MIN_REVIEW_QA_BLOCKS,
    normalizeStringList,
    operatorMaterials,
    requireText,
    safeArray,
    safeText,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
  });

  function validateRenderedPosterHtml(content, slideId) {
    const html = requireText(content, `render_html.slides[${slideId}].content_html`);
    if (!/data-slide-root=(["'])true\1/.test(html)) {
      throw new Error(`poster render_html slide missing data-slide-root=true: ${slideId}`);
    }
    if (!new RegExp(`data-slide-id=(["'])${slideId}\\1`).test(html)) {
      throw new Error(`poster render_html slide missing matching data-slide-id: ${slideId}`);
    }
    if (/<script\b/i.test(html)) {
      throw new Error(`poster render_html slide contains forbidden script tag: ${slideId}`);
    }
    if (/<style\b/i.test(html)) {
      throw new Error(`poster render_html slide contains forbidden style tag: ${slideId}`);
    }
    return html;
  }

    async function generateStorylineDraft(contract, adapter = CODEX_DEFAULT_ADAPTER) {
      const { data, generationRuntime } = await generateStructuredArtifact({
        adapter,
        family: 'poster_onepager',
        route: 'storyline',
        promptRelativePath: promptRoute(contract, 'storyline'),
        context: buildAuthoringContext(contract),
        outputContract: storylineOutputContract(),
      });
      return {
        authoredStoryline: {
          headline: requireText(data?.headline, 'storyline.headline'),
          subheadline: requireText(data?.subheadline, 'storyline.subheadline'),
          audience_judgement: requireText(data?.audience_judgement, 'storyline.audience_judgement'),
          why_now: requireText(data?.why_now, 'storyline.why_now'),
          proof_promise: requireText(data?.proof_promise, 'storyline.proof_promise'),
          call_to_action: requireText(data?.call_to_action, 'storyline.call_to_action'),
        },
        generationRuntime,
      };
    }
    
    async function buildStoryline(contract, adapter = CODEX_DEFAULT_ADAPTER) {
      const { authoredStoryline, generationRuntime } = await generateStorylineDraft(contract, adapter);
      return {
        ...attachCommon('storyline', contract, generationRuntime, adapter),
        creative_execution: creativeExecution(
          lifecycleStageForRoute(contract, 'storyline') || 'story_architecture',
          generationRuntime,
          adapter,
        ),
        storyline: {
          ...authoredStoryline,
          source_truth_material_ids: sourceMaterialIds(contract),
          creative_sources: {
            headline: creativeSourceStamp({
              route: 'storyline',
              lifecycleStage: 'story_architecture',
              authoredSurface: 'headline',
              materializedFrom: CREATIVE_MATERIALIZED_FROM,
              generationRuntime,
              adapter,
            }),
            proof_promise: creativeSourceStamp({
              route: 'storyline',
              lifecycleStage: 'story_architecture',
              authoredSurface: 'proof_promise',
              materializedFrom: CREATIVE_MATERIALIZED_FROM,
              generationRuntime,
              adapter,
            }),
          },
        },
      };
    }
    
    function buildPosterBlueprintContext(contract, storylineArtifact) {
      return {
        ...buildAuthoringContext(contract),
        storyline: {
          headline: safeText(storylineArtifact?.storyline?.headline),
          subheadline: safeText(storylineArtifact?.storyline?.subheadline),
          audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
          why_now: safeText(storylineArtifact?.storyline?.why_now),
          proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
          call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
        },
      };
    }
    
    async function generatePosterBlueprintDraft(
      contract,
      deliverablePaths,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
      const { data, generationRuntime } = await generateStructuredArtifact({
        adapter,
        family: 'poster_onepager',
        route: 'poster_blueprint',
        promptRelativePath: promptRoute(contract, 'poster_blueprint'),
        context: buildPosterBlueprintContext(contract, storylineArtifact),
        outputContract: posterBlueprintOutputContract(),
      });
      return {
        storylineArtifact,
        authoredBlueprint: {
          render_recipe_id: requireText(data?.render_recipe_id, 'poster_blueprint.render_recipe_id'),
          headline: requireText(data?.headline, 'poster_blueprint.headline'),
          subheadline: requireText(data?.subheadline, 'poster_blueprint.subheadline'),
          anchor_tracks: normalizeStringList(data?.anchor_tracks, 'poster_blueprint.anchor_tracks', { min: 3, max: 6 }),
          panels: requireObjectArray(data?.panels, 'poster_blueprint.panels', { min: 4, max: 6 }).map(normalizePanel),
        },
        generationRuntime,
      };
    }
    
    async function buildPosterBlueprintArtifact(
      contract,
      deliverablePaths,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const { storylineArtifact, authoredBlueprint, generationRuntime } = await generatePosterBlueprintDraft(
        contract,
        deliverablePaths,
        adapter,
      );
      const sources = sourceLabels(contract);
      const layoutFamily = safeText(
        authoredBlueprint.panels[1]?.region || authoredBlueprint.panels[0]?.region,
        'evidence_columns',
      );
      const majorBlueprintText = creativeSourceStamp({
        route: 'poster_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const recipeDecision = creativeSourceStamp({
        route: 'poster_blueprint',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'render_recipe_id',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      return {
        ...attachCommon('poster_blueprint', contract, generationRuntime, adapter),
        creative_execution: creativeExecution(
          lifecycleStageForRoute(contract, 'poster_blueprint') || 'story_architecture',
          generationRuntime,
          adapter,
        ),
        lifecycle_stage: lifecycleStageForRoute(contract, 'poster_blueprint') || 'story_architecture',
        poster_blueprint: {
          headline: authoredBlueprint.headline,
          subheadline: authoredBlueprint.subheadline,
          render_recipe_id: authoredBlueprint.render_recipe_id,
          slides: [
            {
              slide_id: 'P01',
              slide_no: 1,
              title: authoredBlueprint.headline,
              layout_family: layoutFamily,
              render_recipe_id: authoredBlueprint.render_recipe_id,
              page_goal: safeText(contract.goal),
              headline: authoredBlueprint.headline,
              subheadline: authoredBlueprint.subheadline,
              audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
              why_now: safeText(storylineArtifact?.storyline?.why_now),
              proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
              call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
              panels: authoredBlueprint.panels,
              evidence_and_sources: sources.slice(0, 2).map((source, sourceIndex) => ({
                source_id: `SRC-${sourceIndex + 1}`,
                public_label: source,
              })),
              visual_presentation: {
                layout_family: layoutFamily,
                anchor_tracks: authoredBlueprint.anchor_tracks,
                canvas: CANVAS,
              },
              creative_sources: {
                major_blueprint_text: majorBlueprintText,
                render_recipe_id: recipeDecision,
              },
              creative_authorship: {
                major_blueprint_text: majorBlueprintText,
                render_recipe_id: recipeDecision,
              },
            },
          ],
          quality_guards: {
            require_visual_direction_before_html: true,
            forbid_template_route_tokens: BANNED_RENDER_TOKENS,
            canvas: CANVAS,
          },
        },
      };
    }
    
    function buildVisualDirectionContext(contract, storylineArtifact, blueprintArtifact) {
      return {
        ...buildAuthoringContext(contract),
        storyline: {
          headline: safeText(storylineArtifact?.storyline?.headline),
          subheadline: safeText(storylineArtifact?.storyline?.subheadline),
          audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
          why_now: safeText(storylineArtifact?.storyline?.why_now),
          proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
          call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
        },
        blueprint: {
          headline: safeText(blueprintArtifact?.poster_blueprint?.headline),
          subheadline: safeText(blueprintArtifact?.poster_blueprint?.subheadline),
          render_recipe_id: safeText(blueprintArtifact?.poster_blueprint?.render_recipe_id),
          slides: safeArray(blueprintArtifact?.poster_blueprint?.slides).map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
            render_recipe_id: slide.render_recipe_id,
            anchor_tracks: safeArray(slide?.visual_presentation?.anchor_tracks),
            panels: summarizePanels(slide),
          })),
        },
      };
    }
    
    async function generateVisualDirectionDraft(
      contract,
      deliverablePaths,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
      const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
      const { data, generationRuntime } = await generateStructuredArtifact({
        adapter,
        family: 'poster_onepager',
        route: 'visual_direction',
        promptRelativePath: promptRoute(contract, 'visual_direction'),
        context: buildVisualDirectionContext(contract, storylineArtifact, blueprintArtifact),
        outputContract: visualDirectionOutputContract(),
      });
      return {
        blueprintArtifact,
        authoredVisualDirection: {
          visual_manifest: requireText(data?.visual_manifest, 'visual_direction.visual_manifest'),
          poster_motif: requireText(data?.poster_motif, 'visual_direction.poster_motif'),
          peak_region: requireText(data?.peak_region, 'visual_direction.peak_region'),
          panel_emphasis: data?.panel_emphasis && typeof data.panel_emphasis === 'object'
            ? data.panel_emphasis
            : (() => {
                throw new Error('Missing visual_direction.panel_emphasis in upstream poster generation output');
              })(),
          page_family_ceiling: data?.page_family_ceiling && typeof data.page_family_ceiling === 'object'
            ? data.page_family_ceiling
            : (() => {
                throw new Error('Missing visual_direction.page_family_ceiling in upstream poster generation output');
              })(),
          anti_template_constraints: normalizeStringList(
            data?.anti_template_constraints,
            'visual_direction.anti_template_constraints',
            { min: 2, max: 6 },
          ),
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
          palette: data?.palette && typeof data.palette === 'object'
            ? data.palette
            : (() => {
                throw new Error('Missing visual_direction.palette in upstream poster generation output');
              })(),
        },
        generationRuntime,
      };
    }
    
    async function buildPosterVisualDirectionArtifact(
      contract,
      deliverablePaths,
      mode,
      baselineDeliverableId,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const { blueprintArtifact, authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(
        contract,
        deliverablePaths,
        adapter,
      );
      const visualManifest = creativeSourceStamp({
        route: 'visual_direction',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'visual_manifest',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const posterMotif = creativeSourceStamp({
        route: 'visual_direction',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'poster_motif',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const pageFamilyCeiling = creativeSourceStamp({
        route: 'visual_direction',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'page_family_ceiling',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      return {
        ...attachCommon('visual_direction', contract, generationRuntime, adapter),
        creative_execution: creativeExecution(
          lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
          generationRuntime,
          adapter,
        ),
        lifecycle_stage: lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
        mode,
        visual_direction: {
          ...authoredVisualDirection,
          baseline_deliverable_id: mode === 'optimize_existing' ? safeText(baselineDeliverableId) || null : null,
          creative_sources: {
            visual_manifest: visualManifest,
            poster_motif: posterMotif,
            page_family_ceiling: pageFamilyCeiling,
          },
          creative_authorship: {
            visual_manifest: visualManifest,
            poster_motif: posterMotif,
            page_family_ceiling: pageFamilyCeiling,
          },
          blueprint_slide_count: safeArray(blueprintArtifact?.poster_blueprint?.slides).length,
        },
      };
    }

  return {
    buildAuthoringContext,
    buildPosterBlueprintArtifact,
    buildPosterVisualDirectionArtifact,
    buildStoryline,
    buildHtml,
    directorReviewOutputContract,
    loadRenderedPosterSlideHtmlMap,
    normalizeInlineText,
    renderHtmlOutputContract,
    screenshotReviewOutputContract,
    stripHtml,
    summarizePanels,
    hydrateRenderedSlideRootMetadata,
    validateRenderedPosterHtml,
    validateRenderedReviewAnchors,
  };
}
