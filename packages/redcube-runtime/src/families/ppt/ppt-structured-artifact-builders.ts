// @ts-nocheck
import { pptSafeText as safeText } from './ppt-deck-runtime-family-parts/core-helpers.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function creativeOwner(generationRuntime = null) {
  const owner = safeText(generationRuntime?.creative_owner, 'codex_cli');
  return owner === 'codex_cli' ? 'codex_cli' : owner;
}

function primarySurface(generationRuntime = null) {
  return safeText(generationRuntime?.primary_surface, 'codex_cli_runtime');
}

function creativeExecution(lifecycleStage, generationRuntime = null) {
  return {
    owner: creativeOwner(generationRuntime),
    primary_surface: primarySurface(generationRuntime),
    lifecycle_stage: lifecycleStage,
    ownership_model: 'director_first',
    ...(generationRuntime
      ? {
          generation_runtime: generationRuntime,
        }
      : {}),
  };
}

function creativeSourceStamp({
  route,
  lifecycleStage,
  authoredSurface,
  materializedFrom,
  generationRuntime = null,
}) {
  return {
    owner: creativeOwner(generationRuntime),
    primary_surface: primarySurface(generationRuntime),
    stage_owner: primarySurface(generationRuntime),
    ownership_model: 'director_first',
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function deckPreset(profileId) {
  switch (profileId) {
    case 'lecture_student':
      return { speaker_seconds: 55 };
    case 'lecture_peer':
      return { speaker_seconds: 65 };
    case 'executive_briefing':
      return { speaker_seconds: 45 };
    default:
      return { speaker_seconds: 60 };
  }
}

function sourceReferences(slide) {
  return safeArray(slide.public_sources).map((source, sourceIndex) => ({
    source_id: `SRC-${slide.slide_no}-${sourceIndex + 1}`,
    public_label: source,
  }));
}

function normalizeBlueprintSlide(slide, contract, canvas, materializedFrom, generationRuntime = null) {
  const preset = deckPreset(contract.profile_id);
  const pageCoreContent = safeArray(slide.page_core_content).map((item) => ({
    label: safeText(item?.label),
    text: safeText(item?.text ?? item),
  })).filter((item) => item.text);
  const visualAnchorTracks = safeArray(slide.visual_anchor_tracks).filter(Boolean);
  const majorBlueprintText = creativeSourceStamp({
    route: 'slide_blueprint',
    lifecycleStage: 'story_architecture',
    authoredSurface: 'major_blueprint_text',
    materializedFrom,
    generationRuntime,
  });

  return {
    slide_id: slide.slide_id,
    slide_no: slide.slide_no,
    page_type: slide.page_type,
    title: slide.title,
    page_goal: slide.page_goal,
    core_sentence: slide.core_sentence,
    render_recipe_id: slide.render_recipe_id,
    page_core_content: pageCoreContent, evidence_points: safeArray(slide.evidence_points).map((item) => safeText(item)).filter(Boolean),
    visual_presentation: {
      layout_family: slide.layout_family,
      anchor_tracks: visualAnchorTracks,
      canvas,
    },
    evidence_and_sources: sourceReferences(slide),
    speaker_notes: slide.speaker_notes,
    speaker_seconds: Number.isFinite(Number(slide.speaker_seconds))
      ? Number(slide.speaker_seconds)
      : preset.speaker_seconds,
    transition_sentence: slide.transition_sentence,
    creative_sources: {
      page_core_content: majorBlueprintText, evidence_points: majorBlueprintText,
      speaker_notes: majorBlueprintText,
      transition_sentence: majorBlueprintText,
    },
    creative_authorship: {
      page_core_content: majorBlueprintText, evidence_points: majorBlueprintText,
      speaker_notes: majorBlueprintText,
      transition_sentence: majorBlueprintText,
    },
  };
}

export function buildPptDetailedOutlineArtifact({
  contract,
  attachCommon,
  authoredOutline,
  generationRuntime,
  lifecycleStage = 'story_architecture',
  materializedFrom,
}) {
  const majorTextStamp = (authoredSurface) => creativeSourceStamp({
    route: 'detailed_outline',
    lifecycleStage,
    authoredSurface,
    materializedFrom,
    generationRuntime,
  });

  return {
    ...attachCommon('detailed_outline', contract, generationRuntime),
    creative_execution: creativeExecution(lifecycleStage, generationRuntime),
    lifecycle_stage: lifecycleStage,
    detailed_outline: {
      chapter_structure: safeArray(authoredOutline?.chapter_structure),
      claim_spine_lock: safeArray(authoredOutline?.claim_spine_lock),
      page_budget: { total_slides: safeArray(authoredOutline?.slides).length },
      manuscript_evidence_table: safeArray(authoredOutline?.manuscript_evidence_table).map((row) => ({ manuscript_label: safeText(row?.manuscript_label), research_question: safeText(row?.research_question), primary_endpoint: safeText(row?.primary_endpoint), method_or_model: safeText(row?.method_or_model), key_numeric_results: safeArray(row?.key_numeric_results).map((item) => safeText(item)).filter(Boolean), main_conclusion: safeText(row?.main_conclusion), boundary: safeText(row?.boundary) })).filter((row) => row.manuscript_label && row.key_numeric_results.length > 0),
      slides: safeArray(authoredOutline?.slides).map((slide) => ({
        slide_id: slide.slide_id,
        slide_no: String(slide.slide_no).padStart(2, '0'),
        chapter_id: slide.chapter_id,
        page_type: slide.page_type,
        layout_family: slide.layout_family,
        title: slide.title,
        page_goal: slide.page_goal,
        page_objective: slide.page_objective,
        core_sentence: slide.core_sentence,
        evidence_points: safeArray(slide.evidence_points),
        public_sources: safeArray(slide.public_sources),
        page_core_content: safeArray(slide.page_core_content).map((item) => safeText(item?.text ?? item)),
        visual_anchor_tracks: safeArray(slide.visual_anchor_tracks),
        speaker_notes: slide.speaker_notes,
        transition_sentence: slide.transition_sentence,
        render_recipe_id: slide.render_recipe_id,
        creative_sources: {
          major_text: majorTextStamp('outline_major_text'),
        },
        creative_authorship: {
          major_text: majorTextStamp('outline_major_text'),
        },
      })),
    },
  };
}

export function buildPptSlideBlueprintArtifact({
  contract,
  attachCommon,
  authoredBlueprint,
  generationRuntime,
  lifecycleStage = 'story_architecture',
  materializedFrom,
  canvas,
  bannedRenderTokens,
}) {
  return {
    ...attachCommon('slide_blueprint', contract, generationRuntime),
    creative_execution: creativeExecution(lifecycleStage, generationRuntime),
    lifecycle_stage: lifecycleStage,
    slide_blueprint: {
      chapter_goal: safeText(authoredBlueprint?.chapter_goal),
      claim_spine_lock: safeArray(authoredBlueprint?.claim_spine_lock),
      slides: safeArray(authoredBlueprint?.slides).map((slide) => normalizeBlueprintSlide(
        slide,
        contract,
        canvas,
        materializedFrom,
        generationRuntime,
      )),
      quality_guards: {
        require_visual_direction_before_html: true,
        forbid_template_route_tokens: safeArray(bannedRenderTokens),
        canvas,
      },
      profile_checks: [],
    },
  };
}

export function buildPptVisualDirectionArtifact({
  contract,
  attachCommon,
  blueprintArtifact,
  authoredVisualDirection,
  generationRuntime,
  lifecycleStage = 'visual_authorship',
  materializedFrom,
  mode,
  baselineDeliverableId,
  sharedSourceConfidence,
}) {
  const slides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
  const visualDirectionStamp = (authoredSurface) => creativeSourceStamp({
    route: 'visual_direction',
    lifecycleStage,
    authoredSurface,
    materializedFrom,
    generationRuntime,
  });

  return {
    ...attachCommon('visual_direction', contract, generationRuntime),
    creative_execution: creativeExecution(lifecycleStage, generationRuntime),
    lifecycle_stage: lifecycleStage,
    visual_direction: {
      claim_spine_lock: safeArray(blueprintArtifact?.slide_blueprint?.claim_spine_lock),
      visual_manifest: safeText(authoredVisualDirection?.visual_manifest),
      what_it_is: safeArray(authoredVisualDirection?.what_it_is),
      what_it_is_not: safeArray(authoredVisualDirection?.what_it_is_not),
      palette: authoredVisualDirection?.palette || {},
      typography_plan: authoredVisualDirection?.typography_plan || {},
      continuity_constraints: safeArray(authoredVisualDirection?.continuity_constraints),
      rhythm_curve: safeArray(authoredVisualDirection?.rhythm_curve),
      peak_pages: safeArray(authoredVisualDirection?.peak_pages),
      page_family_ceiling: authoredVisualDirection?.page_family_ceiling || {},
      forbidden_regressions: safeArray(authoredVisualDirection?.forbidden_regressions),
      page_role_table: slides.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        page_role: safeText(slide?.visual_presentation?.layout_family),
        first_glance: safeText(slide?.visual_presentation?.anchor_tracks?.[0]),
        second_glance: safeText(
          slide?.visual_presentation?.anchor_tracks?.[1],
          slide?.visual_presentation?.anchor_tracks?.[0],
        ),
      })),
      final_instruction_to_html_generator: safeArray(authoredVisualDirection?.final_instruction_to_html_generator),
      source_truth_confidence: safeText(sharedSourceConfidence, 'low'),
      baseline_deliverable_id: mode === 'optimize_existing'
        ? safeText(baselineDeliverableId) || null
        : null,
      mode,
      creative_sources: {
        visual_manifest: visualDirectionStamp('visual_direction_major_expression'),
        rhythm_curve: visualDirectionStamp('visual_direction_major_expression'),
        page_family_ceiling: visualDirectionStamp('visual_direction_major_expression'),
      },
      creative_authorship: {
        visual_direction: visualDirectionStamp('visual_direction_major_expression'),
      },
    },
  };
}
