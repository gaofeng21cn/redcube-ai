// @ts-nocheck
import { createPptDeckAuthoringNormalizers } from './authoring-normalizers.js';
import {
  detailedOutlineOutputContract,
  directorReviewOutputContract,
  renderHtmlOutputContract,
  renderHtmlSummaryOutputContract,
  screenshotReviewSlideBatchOutputContract,
  screenshotReviewSummaryOutputContract,
  slideBlueprintOutputContract,
  storylineOutputContract,
  visualDirectionOutputContract,
} from './authoring-output-contracts.js';
import { createPptDeckAuthoringSourceHelpers } from './authoring-source-helpers.js';

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

  const sourceHelpers = createPptDeckAuthoringSourceHelpers({
    PPT_PAGE_LIBRARY,
    audienceFacingMaterials,
    deckPreset,
    normalizeStringList,
    pageBudget,
    requireText,
    resolveSpeakerIdentity,
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
  });
  const {
    assertManuscriptEvidenceDensity,
    assertPageConstraints,
    buildAuthoringContext,
    normalizeManuscriptEvidenceTable,
  } = sourceHelpers;

  const normalizers = createPptDeckAuthoringNormalizers({
    ALLOWED_RECIPE_IDS,
    DEFAULT_TYPOGRAPHY_PLAN,
    assertManuscriptEvidenceDensity,
    assertPageConstraints,
    normalizeStringList,
    requireText,
    safeArray,
    safeText,
    sharedSourceLabels,
  });
  const {
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
  } = normalizers;

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
        claim_spine_lock: normalizeClaimSpineLock(data?.claim_spine_lock, 'storyline.claim_spine_lock'),
        manuscript_evidence_table: normalizeManuscriptEvidenceTable(
          data?.manuscript_evidence_table,
          contract,
          'storyline.manuscript_evidence_table',
        ),
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
        claim_spine_lock: safeArray(storylineArtifact?.storyline?.claim_spine_lock),
        manuscript_evidence_table: safeArray(storylineArtifact?.storyline?.manuscript_evidence_table),
      },
      manuscript_evidence_table: safeArray(storylineArtifact?.storyline?.manuscript_evidence_table),
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
    const authoredOutline = normalizeOutlineDraft(data, contract);
    const claimSpineLock = preserveClaimSpineLock(
      data?.claim_spine_lock,
      storylineArtifact?.storyline?.claim_spine_lock,
      'detailed_outline.claim_spine_lock',
    );
    assertClaimSpineSlideMapping(claimSpineLock, authoredOutline.slides, 'detailed_outline.claim_spine_lock');
    return {
      authoredOutline: {
        ...authoredOutline,
        claim_spine_lock: claimSpineLock,
        manuscript_evidence_table: normalizeManuscriptEvidenceTable(
          storylineArtifact?.storyline?.manuscript_evidence_table,
          contract,
          'storyline.manuscript_evidence_table',
        ),
      },
      generationRuntime,
    };
  }

  function canonicalClaimSpineForOutline(storylineArtifact, outlineArtifact) {
    const claimSpineLock = preserveClaimSpineLock(
      outlineArtifact?.detailed_outline?.claim_spine_lock,
      storylineArtifact?.storyline?.claim_spine_lock,
      'detailed_outline.claim_spine_lock',
    );
    assertClaimSpineSlideMapping(
      claimSpineLock,
      outlineArtifact?.detailed_outline?.slides,
      'detailed_outline.claim_spine_lock',
    );
    return claimSpineLock;
  }

  async function generateBlueprintDraft(contract, storylineArtifact, outlineArtifact, adapter) {
    const canonicalClaimSpineLock = canonicalClaimSpineForOutline(storylineArtifact, outlineArtifact);
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'slide_blueprint',
      promptRelativePath: PROMPT_PACK.slide_blueprint,
      context: {
        ...buildAuthoringContext(contract),
        manuscript_evidence_table: safeArray(outlineArtifact?.detailed_outline?.manuscript_evidence_table),
        outline: {
          chapter_structure: safeArray(outlineArtifact?.detailed_outline?.chapter_structure),
          claim_spine_lock: canonicalClaimSpineLock,
          slides: summarizeOutlineSlides(outlineArtifact),
        },
      },
      outputContract: slideBlueprintOutputContract(),
    });
    const authoredBlueprint = normalizeBlueprintDraft(data, contract);
    const claimSpineLock = preserveClaimSpineLock(
      data?.claim_spine_lock,
      canonicalClaimSpineLock,
      'slide_blueprint.claim_spine_lock',
    );
    assertClaimSpineSlideMapping(claimSpineLock, authoredBlueprint.slides, 'slide_blueprint.claim_spine_lock');
    return {
      authoredBlueprint: {
        ...authoredBlueprint,
        claim_spine_lock: claimSpineLock,
      },
      generationRuntime,
    };
  }

  async function generateVisualDirectionDraft(
    contract,
    storylineArtifact,
    outlineArtifact,
    blueprintArtifact,
    mode,
    baselineDeliverableId,
    adapter,
  ) {
    const canonicalClaimSpineLock = canonicalClaimSpineForOutline(storylineArtifact, outlineArtifact);
    const claimSpineLock = preserveClaimSpineLock(
      blueprintArtifact?.slide_blueprint?.claim_spine_lock,
      canonicalClaimSpineLock,
      'slide_blueprint.claim_spine_lock',
    );
    assertClaimSpineSlideMapping(
      claimSpineLock,
      blueprintArtifact?.slide_blueprint?.slides,
      'slide_blueprint.claim_spine_lock',
    );
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
          claim_spine_lock: claimSpineLock,
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
        claim_spine_lock: safeArray(authoredStoryline.claim_spine_lock),
        source_truth_input_mode: sharedSourceInputMode(contract) || 'seed_only',
        source_truth_confidence: sharedSourceConfidence(contract) || 'low',
        source_truth_material_ids: sharedSourceMaterialIds(contract),
        source_sufficiency_judgement: sharedSourceSufficiencyStatus(contract),
        deep_research_state: sharedSourceDeepResearchState(contract),
        fact_library_summary: sharedFactLibrarySummary(contract),
        manuscript_evidence_table: safeArray(authoredStoryline.manuscript_evidence_table),
        creative_sources: {
          core_metaphor: runtimeCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM, generationRuntime, adapter),
          narrative_arc: runtimeCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM, generationRuntime, adapter),
          claim_spine_lock: runtimeCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM, generationRuntime, adapter),
          manuscript_evidence_table: runtimeCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM, generationRuntime, adapter),
        },
      },
    };
  }

  return {
    assertClaimSpineArtifactContinuity,
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
