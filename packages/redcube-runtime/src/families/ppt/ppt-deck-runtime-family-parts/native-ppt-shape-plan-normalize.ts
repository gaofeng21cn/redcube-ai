import { nativeDeckLayoutRhythmFailures, requireNativeDeckLayoutRhythmPlan } from './native-ppt-deck-rhythm.js';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

const NATIVE_PPT_SAMPLE_ARCHETYPES = new Set([
  'sample_status_proof_board',
  'sample_decision_proof_split',
]);

const REQUIRED_TEMPLATE_REFERENCE_DISCIPLINE_FLAGS = [
  'template_profile_required',
  'semantic_layout_selection_required',
  'placeholder_capacity_required',
  'reference_deck_analysis_required',
  'action_title_required',
];

const REQUIRED_TEMPLATE_REFERENCE_SOURCE_PROJECTS = [
  'ppt-master',
  'PPTAgent',
  'officecli-pptx',
  'presenton',
  'ppt-agent-skills',
];

const REQUIRED_DESIGN_SPEC_DISCIPLINE = [
  'ppt_master_style_spec_lock',
  'template_layout_grammar',
  'template_profile',
  'semantic_layout_selection',
  'reference_deck_analysis',
  'per_page_visual_plan',
  'layout_rhythm',
  'rendered_quality_gate',
];

const REQUIRED_DESIGN_SPEC_QA_GATES = [
  'bounds',
  'font_floor',
  'text_fit',
  'structural_visual',
  'layout_variety',
];

const CANONICAL_BOUNDS_KEYS = ['left_in', 'top_in', 'width_in', 'height_in'];
const FORBIDDEN_BOUNDS_KEYS = ['x', 'y', 'w', 'h', 'left', 'top', 'right', 'bottom', 'width', 'height'];

interface NativePptShapePlanNormalizeDeps {
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptShapePlanNormalizeParts({
  safeArray,
  safeText,
}: NativePptShapePlanNormalizeDeps) {
  function stableDrawingAnimationTargetFailures(slides: JsonRecord[]): JsonRecord[] {
    return slides.flatMap((slide, index) => {
      const shapesById = new Map(
        safeArray(slide?.native_shapes)
          .map((shape) => [safeText(shape?.shape_id), shape] as const)
          .filter(([shapeId]) => Boolean(shapeId)),
      );
      return safeArray(slide?.animation_timeline).flatMap((animation) => {
        const targetShapeId = safeText(animation?.target_shape_id || animation?.target_id);
        const targetShape = shapesById.get(targetShapeId);
        const kind = safeText(targetShape?.kind || targetShape?.type);
        if (
          !targetShape
          || !['chart', 'table', 'metric_grid'].includes(kind)
          || safeText(targetShape?.materialization_intent) !== 'stable_drawingml'
        ) {
          return [];
        }
        return [{
          slide_id: safeText(slide?.slide_id, `slide-${index + 1}`),
          shape_id: targetShapeId,
          kind,
          materialization_intent: 'stable_drawingml',
          reason: 'officecli_animation_parent_excludes_group',
        }];
      });
    });
  }

  function missingDesignSpecLockFields(designSpecLock: JsonRecord, minimumLayoutArchetypes = 3): string[] {
    const missing: string[] = [];
    const palette = designSpecLock?.palette && typeof designSpecLock.palette === 'object' ? designSpecLock.palette : {};
    const typography = designSpecLock?.typography && typeof designSpecLock.typography === 'object'
      ? designSpecLock.typography
      : {};
    const grid = designSpecLock?.grid && typeof designSpecLock.grid === 'object' ? designSpecLock.grid : {};
    const layoutRhythm = designSpecLock?.layout_rhythm && typeof designSpecLock.layout_rhythm === 'object'
      ? designSpecLock.layout_rhythm
      : {};
    const borrowedPrinciples = safeArray(designSpecLock?.borrowed_principles).map((item) => safeText(item)).filter(Boolean);
    const qaGates = safeArray(designSpecLock?.qa_gates).map((item) => safeText(item)).filter(Boolean);
    if (!safeText(designSpecLock?.spec_id)) missing.push('spec_id');
    if (safeText(designSpecLock?.owner) !== 'llm_agent') missing.push('owner=llm_agent');
    if (!safeText(designSpecLock?.motif)) missing.push('motif');
    if (!Array.isArray(designSpecLock?.layout_archetypes) || designSpecLock.layout_archetypes.length < minimumLayoutArchetypes) {
      missing.push(`layout_archetypes>=${minimumLayoutArchetypes}`);
    }
    if (!safeText(palette?.background || palette?.canvas) || !safeText(palette?.ink) || !safeText(palette?.accent)) {
      missing.push('palette.background_or_canvas+ink+accent');
    }
    if (Number(typography?.title_pt_min || typography?.title_min_pt || 0) < 34) {
      missing.push('typography.title_pt_min>=34');
    }
    if (Number(typography?.body_pt_min || typography?.body_min_pt || 0) < 18) {
      missing.push('typography.body_pt_min>=18');
    }
    if (Number(grid?.edge_margin_in_min || 0) < 0.6) missing.push('grid.edge_margin_in_min>=0.6');
    if (Number(grid?.inter_block_gap_in_min || 0) < 0.32) missing.push('grid.inter_block_gap_in_min>=0.32');
    if (Number(layoutRhythm?.repeated_concrete_composition_limit || 0) < 1) {
      missing.push('layout_rhythm.repeated_concrete_composition_limit');
    }
    if (Number(layoutRhythm?.required_distinct_composition_share || 0) < 0.75) {
      missing.push('layout_rhythm.required_distinct_composition_share>=0.75');
    }
    for (const principle of REQUIRED_DESIGN_SPEC_DISCIPLINE) {
      if (!borrowedPrinciples.includes(principle)) missing.push(`borrowed_principles.${principle}`);
    }
    for (const gate of REQUIRED_DESIGN_SPEC_QA_GATES) {
      if (!qaGates.includes(gate)) missing.push(`qa_gates.${gate}`);
    }
    return missing;
  }

  function structuralFeedbackFromPlanError({
    route,
    error,
    attemptIndex,
    attemptArtifactRefs,
    previousValidationFeedback = null,
  }: {
    route: NativePptRoute;
    error: unknown;
    attemptIndex: number;
    attemptArtifactRefs: string[];
    previousValidationFeedback?: JsonRecord | null;
  }): JsonRecord | null {
    const message = error instanceof Error ? error.message : String(error);
    const stableDrawingAnimationMarker = 'does not support stable_drawingml group animation targets: ';
    const stableDrawingAnimationMarkerIndex = message.indexOf(stableDrawingAnimationMarker);
    if (stableDrawingAnimationMarkerIndex >= 0) {
      let failures: JsonRecord[] = [];
      try {
        failures = safeArray(JSON.parse(message.slice(
          stableDrawingAnimationMarkerIndex + stableDrawingAnimationMarker.length,
        )));
      } catch {
        failures = [];
      }
      return {
        repair_request: [
          `Regenerate editable_shape_plan for ${route} and repair unsupported stable_drawingml animation targets before materialization.`,
          'Keep the grouped editable DrawingML object, but remove its animation_timeline entry or target a top-level native shape or native_data_object chart.',
          'Do not retarget the animation to a child inside the group; OfficeCLI animations accept only top-level shape or chart parents.',
        ].join(' '),
        previous_attempt: attemptIndex,
        required_shape_fixes: safeArray(previousValidationFeedback?.required_shape_fixes),
        global_shape_class_fixes: safeArray(previousValidationFeedback?.global_shape_class_fixes),
        passed_structure_preservation_contract: previousValidationFeedback?.passed_structure_preservation_contract || null,
        required_structural_fixes: failures.map((failure) => ({
          scope: 'shape',
          slide_id: safeText(failure?.slide_id),
          shape_id: safeText(failure?.shape_id),
          reason: 'native_shape_plan_stable_drawingml_animation_target_unsupported',
          repair_instruction: 'Remove this shape from animation_timeline or change the visual to a top-level native shape/native_data_object chart when animation is required.',
        })),
        validator: {
          ok: false,
          reason: 'native_shape_plan_stable_drawingml_animation_target_unsupported',
          failures,
        },
        attempt_artifact_refs: [...attemptArtifactRefs],
      };
    }
    const designSpecLockMarker = 'requires editable_shape_plan.design_spec_lock with AI-authored design system, grid, typography, palette, layout rhythm, borrowed design discipline, and QA gates before shape coordinates: ';
    const designSpecLockMarkerIndex = message.indexOf(designSpecLockMarker);
    if (designSpecLockMarkerIndex >= 0) {
      let missingDesignSpecFields: string[] = [];
      try {
        missingDesignSpecFields = safeArray(JSON.parse(message.slice(designSpecLockMarkerIndex + designSpecLockMarker.length)))
          .map((field) => safeText(field))
          .filter(Boolean);
      } catch {
        missingDesignSpecFields = [];
      }
      const missingFields = missingDesignSpecFields.map((field) => `editable_shape_plan.design_spec_lock.${field}`);
      return {
        repair_request: [
          `Regenerate editable_shape_plan for ${route} and repair the AI-authored design_spec_lock before materialization.`,
          'The lock must be complete at editable_shape_plan.design_spec_lock, owned by llm_agent, and include a concrete motif plus palette, typography, grid, layout_rhythm, borrowed_principles, and qa_gates.',
          'Do not ask the Python helper, officecli, materializer, or RCA runtime to infer or fill any design-system field.',
        ].join(' '),
        previous_attempt: attemptIndex,
        required_shape_fixes: safeArray(previousValidationFeedback?.required_shape_fixes),
        global_shape_class_fixes: safeArray(previousValidationFeedback?.global_shape_class_fixes),
        passed_structure_preservation_contract: previousValidationFeedback?.passed_structure_preservation_contract || null,
        required_structural_fixes: [{
          scope: 'deck',
          slide_id: '',
          reason: 'native_shape_plan_design_spec_lock_missing_fields',
          missing_fields: missingFields.length > 0
            ? missingFields
            : ['editable_shape_plan.design_spec_lock'],
          required_fields: [
            'design_spec_lock.spec_id',
            'design_spec_lock.owner=llm_agent',
            'design_spec_lock.motif',
            'design_spec_lock.palette.background_or_canvas+ink+accent',
            'design_spec_lock.typography.title_pt_min>=34',
            'design_spec_lock.typography.body_pt_min>=18',
            'design_spec_lock.grid.edge_margin_in_min>=0.6',
            'design_spec_lock.grid.inter_block_gap_in_min>=0.32',
            'design_spec_lock.layout_rhythm.repeated_concrete_composition_limit',
            'design_spec_lock.layout_rhythm.required_distinct_composition_share>=0.75',
            'design_spec_lock.borrowed_principles',
            'design_spec_lock.qa_gates',
          ],
          repair_instruction: missingDesignSpecFields.length > 0
            ? `Add or repair these AI-authored design_spec_lock fields: ${missingDesignSpecFields.join(', ')}. The motif must be a concrete visual system motif and cannot be a title underline.`
            : 'Add a complete AI-authored design_spec_lock before shape coordinates. The motif must be a concrete visual system motif and cannot be a title underline.',
        }],
        validator: {
          ok: false,
          reason: 'native_shape_plan_design_spec_lock_missing_fields',
          failures: [{ scope: 'deck', message, missing_fields: missingFields }],
        },
        attempt_artifact_refs: [...attemptArtifactRefs],
      };
    }
    const compactSampleCatalogMarker = 'compact sample grammar must contain exactly the two complete sample archetype contracts, not partial component archetypes: ';
    const compactSampleCatalogMarkerIndex = message.indexOf(compactSampleCatalogMarker);
    if (compactSampleCatalogMarkerIndex >= 0) {
      let catalogFailure: JsonRecord = {};
      try {
        const parsed = JSON.parse(message.slice(compactSampleCatalogMarkerIndex + compactSampleCatalogMarker.length));
        catalogFailure = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonRecord : {};
      } catch {
        catalogFailure = {};
      }
      const requiredArchetypeIds = safeArray(catalogFailure?.required_archetype_ids)
        .map((archetypeId) => safeText(archetypeId))
        .filter(Boolean);
      const canonicalRequiredArchetypeIds = requiredArchetypeIds.length > 0
        ? requiredArchetypeIds
        : [...NATIVE_PPT_SAMPLE_ARCHETYPES];
      const actualArchetypeIds = safeArray(catalogFailure?.actual_archetype_ids)
        .map((archetypeId) => safeText(archetypeId))
        .filter(Boolean);
      const invalidCatalogArchetypeIds = actualArchetypeIds
        .filter((archetypeId) => !NATIVE_PPT_SAMPLE_ARCHETYPES.has(archetypeId));
      const forbiddenExamples = safeArray(catalogFailure?.forbidden_examples)
        .map((example) => safeText(example))
        .filter(Boolean);
      const forbiddenCatalogArchetypes = invalidCatalogArchetypeIds.length > 0
        ? invalidCatalogArchetypeIds
        : (forbiddenExamples.length > 0 ? forbiddenExamples : ['sample_proof_band', 'partial_component_archetype']);
      return {
        repair_request: [
          `Regenerate editable_shape_plan for ${route} and repair the compact native sample template_layout_grammar catalog before materialization.`,
          'Preserve the AI-authored grammar and slide binding, but make the compact sample catalog exact.',
          'template_layout_grammar.archetype_catalog must contain exactly the complete sample_status_proof_board and sample_decision_proof_split contracts.',
          'Remove sample_proof_band and any other partial component archetype from archetype_catalog; proof_band is a native_shapes[].role inside the selected complete archetype, not a catalog archetype.',
          'Continue using safe_zone_blueprints.tuple_contract before coordinates, preserve slides[].template_layout_binding, and keep native_shapes[].layout_zone_id bound to declared zones.',
        ].join(' '),
        previous_attempt: attemptIndex,
        required_shape_fixes: safeArray(previousValidationFeedback?.required_shape_fixes),
        global_shape_class_fixes: safeArray(previousValidationFeedback?.global_shape_class_fixes),
        passed_structure_preservation_contract: previousValidationFeedback?.passed_structure_preservation_contract || null,
        required_structural_fixes: [{
          scope: 'deck',
          slide_id: '',
          reason: 'native_shape_plan_compact_sample_catalog_contains_component_archetype',
          missing_fields: [],
          required_fields: [
            `template_layout_grammar.archetype_catalog exactly [${canonicalRequiredArchetypeIds.join(', ')}]`,
            'remove sample_proof_band from template_layout_grammar.archetype_catalog',
            'proof_band is native_shapes[].role inside the selected complete sample archetype',
            'slides[].template_layout_binding.selected_archetype in [sample_status_proof_board, sample_decision_proof_split]',
            'native_shapes[].layout_zone_id bound to selected archetype zones',
            'template_layout_grammar.safe_zone_blueprints.tuple_contract used before shape coordinates',
          ],
          actual_archetype_ids: actualArchetypeIds,
          required_archetype_ids: canonicalRequiredArchetypeIds,
          forbidden_catalog_archetypes: forbiddenCatalogArchetypes,
          repair_instruction: `Repair the existing compact sample grammar in place. archetype_catalog must contain exactly ${canonicalRequiredArchetypeIds.join(' and ')} complete contracts; remove ${forbiddenCatalogArchetypes.join(', ')} from archetype_catalog. Keep proof_band as a native_shapes[].role inside the selected archetype zones, preserve template_layout_binding and layout_zone_id, and keep using safe_zone_blueprints.tuple_contract before shape coordinates.`,
        }],
        validator: {
          ok: false,
          reason: 'native_shape_plan_compact_sample_catalog_contains_component_archetype',
          failures: [{
            scope: 'deck',
            message,
            actual_archetype_ids: actualArchetypeIds,
            required_archetype_ids: canonicalRequiredArchetypeIds,
            forbidden_catalog_archetypes: forbiddenCatalogArchetypes,
          }],
        },
        attempt_artifact_refs: [...attemptArtifactRefs],
      };
    }
    if (/requires editable_shape_plan\.template_layout_grammar/i.test(message)) {
      let grammarFailures: JsonRecord[] = [];
      const grammarFailureMarker = 'execute-selected-zones materializer boundary: ';
      const grammarFailureMarkerIndex = message.indexOf(grammarFailureMarker);
      if (grammarFailureMarkerIndex >= 0) {
        try {
          grammarFailures = safeArray(JSON.parse(message.slice(grammarFailureMarkerIndex + grammarFailureMarker.length)));
        } catch {
          grammarFailures = [];
        }
      }
      const grammarFailureReasons = grammarFailures.map((failure) => safeText(failure?.reason)).filter(Boolean);
      return {
        repair_request: [
          `Regenerate editable_shape_plan for ${route} and repair the top-level template_layout_grammar before materialization.`,
          'Preserve any existing AI-authored grammar fields that are already valid, but complete the failed fields before returning the plan.',
          'The grammar must be AI-authored and must include owner=llm_agent, required=true, materializer_role=execute_selected_archetype_zones_only, helper_template_layout_allowed=false, complete archetype_catalog, and per-slide template_layout_binding.',
          'For compact native samples, keep both sample_status_proof_board and sample_decision_proof_split in archetype_catalog even when the slide selects only one archetype.',
          'Do not ask the Python helper, officecli, or materializer to infer layout templates.',
        ].join(' '),
        previous_attempt: attemptIndex,
        required_shape_fixes: safeArray(previousValidationFeedback?.required_shape_fixes),
        global_shape_class_fixes: safeArray(previousValidationFeedback?.global_shape_class_fixes),
        passed_structure_preservation_contract: previousValidationFeedback?.passed_structure_preservation_contract || null,
        required_structural_fixes: [{
          scope: 'deck',
          slide_id: '',
          reason: 'native_shape_plan_template_layout_grammar_missing',
          missing_fields: ['editable_shape_plan.template_layout_grammar'],
          required_fields: [
            'template_layout_grammar.owner',
            'template_layout_grammar.required',
            'template_layout_grammar.materializer_role',
            'template_layout_grammar.helper_template_layout_allowed',
            'template_layout_grammar.archetype_catalog[]',
            'template_layout_grammar.archetype_catalog includes sample_status_proof_board and sample_decision_proof_split for compact samples',
            'slides[].template_layout_binding',
          ],
          grammar_failures: grammarFailures,
          repair_instruction: grammarFailureReasons.includes('template_layout_grammar.archetype_catalog_count')
            ? 'Repair the existing AI-authored template_layout_grammar instead of dropping it. For compact native samples, archetype_catalog must include complete contracts for both sample_status_proof_board and sample_decision_proof_split, even if the current slide selected only one. Preserve per-slide template_layout_binding and native_shapes[].layout_zone_id values while completing the catalog.'
            : 'Add or repair a complete AI-authored template layout grammar and matching per-slide template_layout_binding. Every non-decorative/non-auxiliary shape must receive a layout_zone_id bound to a declared slide zone.',
        }],
        validator: {
          ok: false,
          reason: 'native_shape_plan_template_layout_grammar_missing',
          failures: [{ scope: 'deck', message, grammar_failures: grammarFailures }],
        },
        attempt_artifact_refs: [...attemptArtifactRefs],
      };
    }
    const marker = 'requires a complete AI-authored editable spatial shape plan: ';
    const markerIndex = message.indexOf(marker);
    if (markerIndex < 0) return null;
    let invalidSlides: JsonRecord[] = [];
    try {
      invalidSlides = JSON.parse(message.slice(markerIndex + marker.length)) as JsonRecord[];
    } catch {
      return null;
    }
    const requiredStructuralFixes = safeArray(invalidSlides)
      .map((slide) => {
        const slideId = safeText(slide?.slide_id);
        const missingFields = [
          ...(slide?.missing_native_shapes === true ? ['native_shapes'] : []),
          ...(slide?.missing_layout_intent === true ? ['layout_intent'] : []),
          ...(slide?.missing_template_layout_binding === true ? ['template_layout_binding'] : []),
          ...(slide?.missing_shape_quality_roles === true ? ['native_shapes[].quality_role'] : []),
          ...safeArray(slide?.invalid_shapes)
            .flatMap((shape) => [
              ...(shape?.missing_bounds === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].bounds`] : []),
              ...(shape?.bounds_schema_error === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].bounds_schema_error`] : []),
              ...(shape?.missing_kind === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].kind`] : []),
              ...(shape?.missing_text === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].editable_text`] : []),
              ...(shape?.missing_quality_role === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].quality_role`] : []),
              ...(shape?.missing_layout_zone === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].layout_zone_id`] : []),
            ]),
        ];
        const invalidBindingFields = safeArray(slide?.invalid_template_binding_fields)
          .map((field) => safeText(field))
          .filter(Boolean);
        const invalidZones = safeArray(slide?.invalid_template_zones);
        if (!slideId || (missingFields.length === 0 && invalidBindingFields.length === 0 && invalidZones.length === 0)) {
          return null;
        }
        const invalidBinding = invalidBindingFields.length > 0 || invalidZones.length > 0;
        return {
          scope: 'slide',
          slide_id: slideId,
          reason: invalidBinding && missingFields.length === 0
            ? 'native_shape_plan_template_layout_binding_invalid'
            : 'native_shape_plan_structural_fields_missing',
          missing_fields: missingFields,
          invalid_template_binding_fields: invalidBindingFields,
          invalid_template_zones: invalidZones,
          invalid_shapes: safeArray(slide?.invalid_shapes),
          required_fields: [
            'template_layout_binding.selected_archetype',
            'template_layout_binding.archetype_instance_id',
            'template_layout_binding.rhythm_role',
            'template_layout_binding.zone_gap_in_min>=0.32',
            'template_layout_binding.zone_inset_in_min>=0.15',
            'template_layout_binding.zones[]',
            'template_layout_binding.zones[].safe_inset_in>=0.15',
            'template_layout_binding.zones[].bounds.left_in',
            'template_layout_binding.zones[].bounds.top_in',
            'template_layout_binding.zones[].bounds.width_in',
            'template_layout_binding.zones[].bounds.height_in',
            'native_shapes[].bounds.left_in',
            'native_shapes[].bounds.top_in',
            'native_shapes[].bounds.width_in',
            'native_shapes[].bounds.height_in',
            'native_shapes[].layout_zone_id',
          ],
          repair_instruction: invalidBinding
            ? 'Repair the existing AI-authored template_layout_binding instead of treating it as absent. Preserve the slide-level binding, selected archetype, declared zones, and shape layout_zone_id values while fixing invalid binding fields and zone constraints such as safe_inset_in >= 0.15. All zone bounds and shape bounds must use canonical keys left_in/top_in/width_in/height_in only; do not use x/y/w/h, left/top/right/bottom, or width/height aliases.'
            : 'Return a complete AI-authored slide plan. Add template_layout_binding with declared semantic zones, bind every non-decorative/non-auxiliary shape to a zone on the same slide, and keep all zone-bound shape bounds inside the declared zone. Structural rails, connectors, proof bands, panels, and audience content cannot float outside the selected template. All zone bounds and shape bounds must use canonical keys left_in/top_in/width_in/height_in only; do not use x/y/w/h, left/top/right/bottom, or width/height aliases. Do not ask the Python helper or officecli to infer this.',
        };
      })
      .filter(Boolean);
    if (requiredStructuralFixes.length === 0) return null;
    return {
      repair_request: [
        `Regenerate editable_shape_plan for ${route} and repair the structural contract violations before materialization.`,
        'The previous JSON was syntactically valid but incomplete as an AI-first design plan.',
        'Do not remove shapes or mark audience text decorative to bypass the contract; add the missing layout grammar/bindings and keep the same audience intent.',
      ].join(' '),
      previous_attempt: attemptIndex,
      required_shape_fixes: safeArray(previousValidationFeedback?.required_shape_fixes),
      global_shape_class_fixes: safeArray(previousValidationFeedback?.global_shape_class_fixes),
      passed_structure_preservation_contract: previousValidationFeedback?.passed_structure_preservation_contract || null,
      required_structural_fixes: requiredStructuralFixes,
      validator: {
        ok: false,
        reason: 'native_shape_plan_structural_contract_failed',
        failures: invalidSlides,
      },
      attempt_artifact_refs: [...attemptArtifactRefs],
    };
  }

  function normalizeEditableShapePlan(data: JsonRecord, route: NativePptRoute) {
    const plan = data?.editable_shape_plan || data?.shape_plan || {};
    const slides = safeArray(plan?.slides);
    if (slides.length === 0) {
      throw new Error(`Native PPT ${route} requires an AI-authored editable_shape_plan.slides array`);
    }
    const unsupportedAnimationTargets = stableDrawingAnimationTargetFailures(slides);
    if (unsupportedAnimationTargets.length > 0) {
      throw new Error(`Native PPT ${route} does not support stable_drawingml group animation targets: ${JSON.stringify(unsupportedAnimationTargets)}`);
    }
    const planAuthoringMode = safeText(plan?.authoring_mode);
    const sampleCompactPlan = planAuthoringMode === 'native_visual_sample_compact';
    const designSpecLock = plan?.design_spec_lock && typeof plan.design_spec_lock === 'object'
      ? plan.design_spec_lock
      : {};
    const missingDesignSpecLock = missingDesignSpecLockFields(
      designSpecLock,
      sampleCompactPlan ? NATIVE_PPT_SAMPLE_ARCHETYPES.size : 3,
    );
    if (missingDesignSpecLock.length > 0) {
      throw new Error(`Native PPT ${route} requires editable_shape_plan.design_spec_lock with AI-authored design system, grid, typography, palette, layout rhythm, borrowed design discipline, and QA gates before shape coordinates: ${JSON.stringify(missingDesignSpecLock)}`);
    }
    const deckLayoutRhythmPlan = requireNativeDeckLayoutRhythmPlan({ plan, route, slides, safeArray, safeText });
    const templateLayoutGrammar = plan?.template_layout_grammar && typeof plan.template_layout_grammar === 'object'
      ? plan.template_layout_grammar
      : {};
    const templateReferenceDisciplineFailures = templateReferenceDisciplineFailuresFor(templateLayoutGrammar);
    const archetypeCatalog = safeArray(templateLayoutGrammar?.archetype_catalog);
    const archetypeCatalogIds = archetypeCatalog.map((entry) => safeText(entry?.archetype_id)).filter(Boolean);
    const sampleOnlyArchetypeCatalog = archetypeCatalogIds.length >= NATIVE_PPT_SAMPLE_ARCHETYPES.size
      && archetypeCatalogIds.every((archetypeId) => NATIVE_PPT_SAMPLE_ARCHETYPES.has(archetypeId))
      && [...NATIVE_PPT_SAMPLE_ARCHETYPES].every((archetypeId) => archetypeCatalogIds.includes(archetypeId));
    const sampleSelectedArchetypeSlides = slides.length === 1
      && slides.every((slide) => NATIVE_PPT_SAMPLE_ARCHETYPES.has(safeText(slide?.template_layout_binding?.selected_archetype)));
    const sampleCompactAuthoring = sampleCompactPlan
      || (sampleOnlyArchetypeCatalog && sampleSelectedArchetypeSlides);
    const minimumArchetypeCount = sampleCompactAuthoring && sampleOnlyArchetypeCatalog
      ? NATIVE_PPT_SAMPLE_ARCHETYPES.size
      : 3;
    const missingTemplateLayoutGrammar = safeText(templateLayoutGrammar?.owner) !== 'llm_agent'
      || templateLayoutGrammar?.required !== true
      || safeText(templateLayoutGrammar?.materializer_role) !== 'execute_selected_archetype_zones_only'
      || templateLayoutGrammar?.helper_template_layout_allowed !== false
      || templateReferenceDisciplineFailures.length > 0
      || archetypeCatalog.length < minimumArchetypeCount;
    if (missingTemplateLayoutGrammar) {
      const grammarFailures = [
        ...(safeText(templateLayoutGrammar?.owner) !== 'llm_agent'
          ? [{ reason: 'template_layout_grammar.owner', actual: safeText(templateLayoutGrammar?.owner) }]
          : []),
        ...(templateLayoutGrammar?.required !== true
          ? [{ reason: 'template_layout_grammar.required', actual: templateLayoutGrammar?.required ?? null }]
          : []),
        ...(safeText(templateLayoutGrammar?.materializer_role) !== 'execute_selected_archetype_zones_only'
          ? [{ reason: 'template_layout_grammar.materializer_role', actual: safeText(templateLayoutGrammar?.materializer_role) }]
          : []),
        ...(templateLayoutGrammar?.helper_template_layout_allowed !== false
          ? [{ reason: 'template_layout_grammar.helper_template_layout_allowed', actual: templateLayoutGrammar?.helper_template_layout_allowed ?? null }]
          : []),
        ...templateReferenceDisciplineFailures,
        ...(archetypeCatalog.length < minimumArchetypeCount
          ? [{
              reason: 'template_layout_grammar.archetype_catalog_count',
              actual: archetypeCatalog.length,
              minimum: minimumArchetypeCount,
              required_archetype_ids: sampleCompactAuthoring
                ? [...NATIVE_PPT_SAMPLE_ARCHETYPES]
                : 'at_least_three_professional_archetypes',
            }]
          : []),
      ];
      throw new Error(`Native PPT ${route} requires editable_shape_plan.template_layout_grammar with llm_agent owner, archetype catalog, and execute-selected-zones materializer boundary: ${JSON.stringify(grammarFailures)}`);
    }
    if (sampleCompactAuthoring && !sampleOnlyArchetypeCatalog) {
      throw new Error(`Native PPT ${route} compact sample grammar must contain exactly the two complete sample archetype contracts, not partial component archetypes: ${JSON.stringify({
        actual_archetype_ids: archetypeCatalogIds,
        required_archetype_ids: [...NATIVE_PPT_SAMPLE_ARCHETYPES],
        forbidden_examples: ['sample_proof_band', 'partial_component_archetype'],
      })}`);
    }
    const allowedArchetypes = new Set(archetypeCatalog.map((entry) => safeText(entry?.archetype_id)).filter(Boolean));
    const incompleteArchetypes = archetypeCatalog
      .map((entry) => {
        const archetypeId = safeText(entry?.archetype_id, '<missing-archetype-id>');
        const contentSchema = entry?.content_schema && typeof entry.content_schema === 'object'
          ? entry.content_schema
          : {};
        const missingFields = [
          ...(!safeText(entry?.use_when) ? ['use_when'] : []),
          ...(!safeText(entry?.layout_description) ? ['layout_description'] : []),
          ...(safeArray(entry?.required_zones).length < 3 ? ['required_zones'] : []),
          ...(safeArray(entry?.prohibited).length < 1 ? ['prohibited'] : []),
          ...(safeArray(contentSchema?.required_shape_roles).length < 1 ? ['content_schema.required_shape_roles'] : []),
          ...(safeArray(contentSchema?.required_shape_role_groups).length < 1 ? ['content_schema.required_shape_role_groups'] : []),
        ];
        return missingFields.length > 0 ? { archetype_id: archetypeId, missing_fields: missingFields } : null;
      })
      .filter(Boolean);
    if (incompleteArchetypes.length > 0) {
      throw new Error(`Native PPT ${route} requires professional template layout archetype contracts before shape coordinates: ${JSON.stringify(incompleteArchetypes)}`);
    }
    const invalidSlides = slides
      .map((slide, index) => invalidSlideShapePlan({
        slide,
        index,
        allowedArchetypes,
      }))
      .filter(Boolean);
    if (invalidSlides.length > 0) {
      throw new Error(`Native PPT ${route} requires a complete AI-authored editable spatial shape plan: ${JSON.stringify(invalidSlides)}`);
    }
    const deckRhythmFailures = nativeDeckLayoutRhythmFailures(slides, { safeText });
    if (deckRhythmFailures.length > 0) {
      throw new Error(`Native PPT ${route} requires deck-level layout rhythm before materialization: ${JSON.stringify(deckRhythmFailures)}`);
    }
    return {
      ...plan,
      ...(data?.test_double_boundary
        ? {
            test_double_boundary: data.test_double_boundary,
          }
        : {}),
      contract_kind: safeText(plan?.contract_kind, 'redcube_ai_first_native_ppt_shape_plan'),
      route: safeText(plan?.route, route),
      deck_layout_rhythm_plan: deckLayoutRhythmPlan,
      slides,
    };
  }

  function templateReferenceDisciplineFailuresFor(templateLayoutGrammar: JsonRecord): JsonRecord[] {
    const referenceDiscipline = templateLayoutGrammar?.reference_discipline
      && typeof templateLayoutGrammar.reference_discipline === 'object'
      ? templateLayoutGrammar.reference_discipline
      : {};
    const sourceProjectKeys = safeArray(referenceDiscipline?.source_projects)
      .map((project) => safeText(project))
      .filter(Boolean)
      .map((project) => project.toLowerCase());
    const failures: JsonRecord[] = REQUIRED_TEMPLATE_REFERENCE_DISCIPLINE_FLAGS
      .filter((field) => referenceDiscipline?.[field] !== true)
      .map((field) => ({
        reason: `template_layout_grammar.reference_discipline.${field}`,
        actual: referenceDiscipline?.[field] ?? null,
      }));
    const missingSourceProjects = REQUIRED_TEMPLATE_REFERENCE_SOURCE_PROJECTS
      .filter((project) => !sourceProjectKeys.includes(project.toLowerCase()));
    if (missingSourceProjects.length > 0) {
      failures.push({
        reason: 'template_layout_grammar.reference_discipline.source_projects',
        missing_source_projects: missingSourceProjects,
        required_source_projects: REQUIRED_TEMPLATE_REFERENCE_SOURCE_PROJECTS,
      });
    }
    return failures;
  }

  function invalidSlideShapePlan({
    slide,
    index,
    allowedArchetypes,
  }: {
    slide: JsonRecord;
    index: number;
    allowedArchetypes: Set<string>;
  }): JsonRecord | null {
    const slideId = safeText(slide?.slide_id, `slide-${index + 1}`);
    const shapes = safeArray(slide?.native_shapes);
    const layoutIntent = slide?.layout_intent && typeof slide.layout_intent === 'object'
      ? slide.layout_intent
      : {};
    const templateBinding = slide?.template_layout_binding && typeof slide.template_layout_binding === 'object'
      ? slide.template_layout_binding
      : {};
    const zones = safeArray(templateBinding?.zones);
    const zoneIds = new Set(zones.map((zone) => safeText(zone?.zone_id)).filter(Boolean));
    const selectedArchetype = safeText(templateBinding?.selected_archetype);
    const missingBindingFields = [
      ...(!selectedArchetype ? ['selected_archetype'] : []),
      ...(!safeText(templateBinding?.archetype_instance_id) ? ['archetype_instance_id'] : []),
      ...(!safeText(templateBinding?.rhythm_role) ? ['rhythm_role'] : []),
      ...(zones.length < 3 ? ['zones'] : []),
    ];
    const invalidBindingFields = [
      ...(selectedArchetype && allowedArchetypes.size > 0 && !allowedArchetypes.has(selectedArchetype)
        ? ['selected_archetype']
        : []),
      ...(Number(templateBinding?.zone_gap_in_min || 0) < 0.32 ? ['zone_gap_in_min'] : []),
      ...(Number(templateBinding?.zone_inset_in_min || 0) < 0.15 ? ['zone_inset_in_min'] : []),
    ];
    const invalidTemplateZones = zones
      .map((zone) => invalidTemplateZone(zone))
      .filter(Boolean);
    const missingTemplateBinding = missingBindingFields.length > 0;
    const invalidTemplateBinding = invalidBindingFields.length > 0 || invalidTemplateZones.length > 0;
    const missingShapePlan = shapes.length === 0;
    const missingLayoutIntent = !safeText(layoutIntent?.composition_signature)
      || !safeText(layoutIntent?.primary_grid)
      || !safeText(layoutIntent?.non_text_visual)
      || layoutIntent?.forbidden_template_reuse_checked !== true;
    const invalidShapes = shapes
      .map((shape, shapeIndex) => invalidShape({
        shape,
        shapeId: safeText(shape?.shape_id, `${slideId}-shape-${shapeIndex + 1}`),
        zoneIds,
      }))
      .filter(Boolean);
    const missingShapeQualityRoles = shapes.some((shape) => !safeText(shape?.quality_role));
    return (missingShapePlan || missingLayoutIntent || missingTemplateBinding || invalidTemplateBinding || invalidShapes.length > 0) ? {
      slide_id: slideId,
      missing_native_shapes: missingShapePlan,
      missing_layout_intent: missingLayoutIntent,
      missing_template_layout_binding: missingTemplateBinding,
      invalid_template_layout_binding: invalidTemplateBinding,
      invalid_template_binding_fields: invalidBindingFields,
      invalid_template_zones: invalidTemplateZones,
      missing_shape_quality_roles: missingShapeQualityRoles,
      invalid_shapes: invalidShapes,
    } : null;
  }

  function invalidTemplateZone(zone: JsonRecord): JsonRecord | null {
    const bounds = zone?.bounds && typeof zone.bounds === 'object' ? zone.bounds : {};
    const boundsKeys = Object.keys(bounds);
    const forbiddenBoundsKeys = boundsKeys.filter((key) => FORBIDDEN_BOUNDS_KEYS.includes(key));
    const missingCanonicalBoundsKeys = CANONICAL_BOUNDS_KEYS
      .filter((key) => !Number.isFinite(Number(bounds?.[key])));
    const invalidFields = [
      ...(!safeText(zone?.zone_id) ? ['zone_id'] : []),
      ...(!safeText(zone?.semantic_role) ? ['semantic_role'] : []),
      ...(!safeText(zone?.intended_content) ? ['intended_content'] : []),
      ...(missingCanonicalBoundsKeys.length > 0
        ? ['bounds']
        : []),
      ...(forbiddenBoundsKeys.length > 0 ? ['bounds_schema_error'] : []),
      ...(Number(bounds?.width_in || 0) <= 0 ? ['bounds.width_in'] : []),
      ...(Number(bounds?.height_in || 0) <= 0 ? ['bounds.height_in'] : []),
      ...(Number(zone?.safe_inset_in || 0) < 0.15 ? ['safe_inset_in'] : []),
    ];
    if (invalidFields.length === 0) return null;
    return {
      zone_id: safeText(zone?.zone_id, '<missing-zone-id>'),
      invalid_fields: invalidFields,
      required_fields: [
        'zone_id',
        'semantic_role',
        'intended_content',
        'bounds.left_in',
        'bounds.top_in',
        'bounds.width_in>0',
        'bounds.height_in>0',
        'safe_inset_in>=0.15',
      ],
      bounds_contract: {
        canonical_keys: CANONICAL_BOUNDS_KEYS,
        forbidden_alias_keys: FORBIDDEN_BOUNDS_KEYS,
        instruction: 'Replace any alias bounds object with { left_in, top_in, width_in, height_in }. Do not use x/y/w/h, left/top/right/bottom, or width/height.',
      },
      actual_bounds_keys: boundsKeys,
      missing_canonical_bounds_keys: missingCanonicalBoundsKeys,
      forbidden_bounds_keys: forbiddenBoundsKeys,
    };
  }

  function invalidShape({
    shape,
    shapeId,
    zoneIds,
  }: {
    shape: JsonRecord;
    shapeId: string;
    zoneIds: Set<string>;
  }): JsonRecord | null {
    const bounds = shape?.bounds && typeof shape.bounds === 'object' ? shape.bounds : {};
    const boundsKeys = Object.keys(bounds);
    const forbiddenBoundsKeys = boundsKeys.filter((key) => FORBIDDEN_BOUNDS_KEYS.includes(key));
    const missingCanonicalBoundsKeys = CANONICAL_BOUNDS_KEYS
      .filter((key) => !Number.isFinite(Number(bounds?.[key])));
    const hasBounds = missingCanonicalBoundsKeys.length === 0 && forbiddenBoundsKeys.length === 0;
    const kind = safeText(shape?.kind || shape?.type);
    const role = safeText(shape?.role);
    const qualityRole = safeText(shape?.quality_role);
    const layoutZoneId = safeText(shape?.layout_zone_id);
    const paragraphText = safeArray(shape?.paragraphs)
      .map((paragraph) => safeText(paragraph?.text || paragraph?.editable_text))
      .filter(Boolean)
      .join('\n');
    const text = safeText(shape?.editable_text || shape?.text || shape?.label || paragraphText);
    const textShape = ['text_box', 'text'].includes(kind)
      || ['title', 'core_sentence', 'point_text', 'body', 'content', 'point_index'].includes(role);
    const missingText = textShape && !text;
    const missingQualityRole = !qualityRole;
    const needsLayoutZone = !['decorative', 'auxiliary'].includes(qualityRole);
    const missingLayoutZone = needsLayoutZone && !zoneIds.has(layoutZoneId);
    if (!hasBounds || !kind || missingText || missingQualityRole || missingLayoutZone) {
      return {
        shape_id: shapeId,
        missing_bounds: !hasBounds,
        missing_kind: !kind,
        missing_text: missingText,
        missing_quality_role: missingQualityRole,
        missing_layout_zone: missingLayoutZone,
        bounds_schema_error: forbiddenBoundsKeys.length > 0,
        actual_bounds_keys: boundsKeys,
        missing_canonical_bounds_keys: missingCanonicalBoundsKeys,
        forbidden_bounds_keys: forbiddenBoundsKeys,
        bounds_contract: {
          canonical_keys: CANONICAL_BOUNDS_KEYS,
          forbidden_alias_keys: FORBIDDEN_BOUNDS_KEYS,
          instruction: 'native_shapes[].bounds must be exactly { left_in, top_in, width_in, height_in }. Do not use x/y/w/h, left/top/right/bottom, or width/height aliases.',
        },
      };
    }
    return null;
  }

  return {
    normalizeEditableShapePlan,
    structuralFeedbackFromPlanError,
  };
}
