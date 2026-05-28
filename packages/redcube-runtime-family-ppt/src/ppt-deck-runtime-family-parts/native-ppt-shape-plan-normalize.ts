import { nativeDeckLayoutRhythmFailures, requireNativeDeckLayoutRhythmPlan } from './native-ppt-deck-rhythm.js';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativePptShapePlanNormalizeDeps {
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptShapePlanNormalizeParts({
  safeArray,
  safeText,
}: NativePptShapePlanNormalizeDeps) {
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
    if (/requires editable_shape_plan\.template_layout_grammar/i.test(message)) {
      return {
        repair_request: [
          `Regenerate editable_shape_plan for ${route} and add the missing top-level template_layout_grammar before materialization.`,
          'The grammar must be AI-authored and must include owner=llm_agent, required=true, materializer_role=execute_selected_archetype_zones_only, helper_template_layout_allowed=false, archetype_catalog, and per-slide template_layout_binding.',
          'Do not ask the Python helper, officecli, or materializer to infer layout templates.',
        ].join(' '),
        previous_attempt: attemptIndex,
        required_shape_fixes: safeArray(previousValidationFeedback?.required_shape_fixes),
        global_shape_class_fixes: safeArray(previousValidationFeedback?.global_shape_class_fixes),
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
            'slides[].template_layout_binding',
          ],
          repair_instruction: 'Add a complete AI-authored template layout grammar and matching per-slide template_layout_binding. Every non-decorative audience-facing shape must receive a layout_zone_id bound to a declared slide zone.',
        }],
        validator: {
          ok: false,
          reason: 'native_shape_plan_template_layout_grammar_missing',
          failures: [{ scope: 'deck', message }],
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
              ...(shape?.missing_kind === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].kind`] : []),
              ...(shape?.missing_text === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].editable_text`] : []),
              ...(shape?.missing_quality_role === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].quality_role`] : []),
              ...(shape?.missing_layout_zone === true ? [`native_shapes[${safeText(shape?.shape_id, '?')}].layout_zone_id`] : []),
            ]),
        ];
        if (!slideId || missingFields.length === 0) return null;
        return {
          scope: 'slide',
          slide_id: slideId,
          reason: 'native_shape_plan_structural_fields_missing',
          missing_fields: missingFields,
          required_fields: [
            'template_layout_binding.selected_archetype',
            'template_layout_binding.archetype_instance_id',
            'template_layout_binding.rhythm_role',
            'template_layout_binding.zones[]',
            'native_shapes[].layout_zone_id',
          ],
          repair_instruction: 'Return a complete AI-authored slide plan. Add template_layout_binding with declared semantic zones, bind every non-decorative audience-facing shape to a zone on the same slide, and keep all shape bounds inside the declared zone. Do not ask the Python helper or officecli to infer this.',
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
    const designSpecLock = plan?.design_spec_lock && typeof plan.design_spec_lock === 'object'
      ? plan.design_spec_lock
      : {};
    const missingDesignSpecLock = !safeText(designSpecLock?.spec_id)
      || !safeText(designSpecLock?.owner)
      || !safeText(designSpecLock?.motif)
      || !Array.isArray(designSpecLock?.layout_archetypes)
      || designSpecLock.layout_archetypes.length < 3;
    if (missingDesignSpecLock) {
      throw new Error(`Native PPT ${route} requires editable_shape_plan.design_spec_lock with spec_id, owner, motif, and layout_archetypes`);
    }
    const deckLayoutRhythmPlan = requireNativeDeckLayoutRhythmPlan({ plan, route, slides, safeArray, safeText });
    const templateLayoutGrammar = plan?.template_layout_grammar && typeof plan.template_layout_grammar === 'object'
      ? plan.template_layout_grammar
      : {};
    const archetypeCatalog = safeArray(templateLayoutGrammar?.archetype_catalog);
    const missingTemplateLayoutGrammar = safeText(templateLayoutGrammar?.owner) !== 'llm_agent'
      || templateLayoutGrammar?.required !== true
      || safeText(templateLayoutGrammar?.materializer_role) !== 'execute_selected_archetype_zones_only'
      || templateLayoutGrammar?.helper_template_layout_allowed !== false
      || archetypeCatalog.length < 3;
    if (missingTemplateLayoutGrammar) {
      throw new Error(`Native PPT ${route} requires editable_shape_plan.template_layout_grammar with llm_agent owner, archetype catalog, and execute-selected-zones materializer boundary`);
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
    const missingTemplateBinding = !safeText(templateBinding?.selected_archetype)
      || (allowedArchetypes.size > 0 && !allowedArchetypes.has(safeText(templateBinding?.selected_archetype)))
      || !safeText(templateBinding?.archetype_instance_id)
      || !safeText(templateBinding?.rhythm_role)
      || Number(templateBinding?.zone_gap_in_min || 0) < 0.32
      || Number(templateBinding?.zone_inset_in_min || 0) < 0.15
      || zones.length < 3
      || zones.some((zone) => invalidTemplateZone(zone));
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
    return (missingShapePlan || missingLayoutIntent || missingTemplateBinding || invalidShapes.length > 0) ? {
      slide_id: slideId,
      missing_native_shapes: missingShapePlan,
      missing_layout_intent: missingLayoutIntent,
      missing_template_layout_binding: missingTemplateBinding,
      missing_shape_quality_roles: missingShapeQualityRoles,
      invalid_shapes: invalidShapes,
    } : null;
  }

  function invalidTemplateZone(zone: JsonRecord): boolean {
    const bounds = zone?.bounds && typeof zone.bounds === 'object' ? zone.bounds : {};
    return !safeText(zone?.zone_id)
      || !safeText(zone?.semantic_role)
      || !safeText(zone?.intended_content)
      || !['left_in', 'top_in', 'width_in', 'height_in'].every((key) => Number.isFinite(Number(bounds?.[key])))
      || Number(bounds?.width_in || 0) <= 0
      || Number(bounds?.height_in || 0) <= 0
      || Number(zone?.safe_inset_in || 0) < 0.15;
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
    const hasBounds = ['left_in', 'top_in', 'width_in', 'height_in']
      .every((key) => Number.isFinite(Number(bounds?.[key])));
    const kind = safeText(shape?.kind || shape?.type);
    const role = safeText(shape?.role);
    const qualityRole = safeText(shape?.quality_role);
    const layoutZoneId = safeText(shape?.layout_zone_id);
    const text = safeText(shape?.editable_text || shape?.text || shape?.label);
    const textShape = ['text_box', 'text'].includes(kind)
      || ['title', 'core_sentence', 'point_text', 'body', 'content', 'point_index'].includes(role);
    const missingText = textShape && !text;
    const missingQualityRole = !qualityRole;
    const needsLayoutZone = !['decorative'].includes(qualityRole)
      && !['page_number', 'page_no', 'footer', 'cover_meta', 'meta'].includes(role);
    const missingLayoutZone = needsLayoutZone && !zoneIds.has(layoutZoneId);
    if (!hasBounds || !kind || missingText || missingQualityRole || missingLayoutZone) {
      return {
        shape_id: shapeId,
        missing_bounds: !hasBounds,
        missing_kind: !kind,
        missing_text: missingText,
        missing_quality_role: missingQualityRole,
        missing_layout_zone: missingLayoutZone,
      };
    }
    return null;
  }

  return {
    normalizeEditableShapePlan,
    structuralFeedbackFromPlanError,
  };
}
