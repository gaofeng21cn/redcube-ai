type JsonRecord = Record<string, any>;

interface NativePptDeckRhythmDeps {
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function requireNativeDeckLayoutRhythmPlan({
  plan,
  route,
  slides,
  safeArray,
  safeText,
}: {
  plan: JsonRecord;
  route: string;
  slides: JsonRecord[];
} & NativePptDeckRhythmDeps): JsonRecord {
  const deckLayoutRhythmPlan = plan?.deck_layout_rhythm_plan && typeof plan.deck_layout_rhythm_plan === 'object'
    ? plan.deck_layout_rhythm_plan
    : {};
  const rhythmSlides = safeArray(deckLayoutRhythmPlan?.slides);
  const missingDeckLayoutRhythmPlan = deckLayoutRhythmPlan?.required !== true
    || safeText(deckLayoutRhythmPlan?.owner) !== 'llm_agent'
    || rhythmSlides.length !== slides.length
    || rhythmSlides.some((slide, index) => !safeText(slide?.slide_id, safeText(slides[index]?.slide_id))
      || !safeText(slide?.rhetorical_role)
      || !safeText(slide?.selected_archetype)
      || !safeText(slide?.primary_grid)
      || !safeText(slide?.composition_signature_budget)
      || !safeText(slide?.proof_object));
  if (missingDeckLayoutRhythmPlan) {
    throw new Error(`Native PPT ${route} requires editable_shape_plan.deck_layout_rhythm_plan.slides[] with llm_agent owner and one rhythm row per slide before shape coordinates; do not use per_slide`);
  }
  return deckLayoutRhythmPlan;
}

export function nativeDeckLayoutRhythmFailures(
  slides: JsonRecord[],
  { safeText }: Pick<NativePptDeckRhythmDeps, 'safeText'>,
): JsonRecord[] {
  if (slides.length < 3) return [];
  const failures: JsonRecord[] = [];
  const rhythmRows = slides.map((slide, index) => {
    const binding = slide?.template_layout_binding && typeof slide.template_layout_binding === 'object'
      ? slide.template_layout_binding
      : {};
    const layoutIntent = slide?.layout_intent && typeof slide.layout_intent === 'object'
      ? slide.layout_intent
      : {};
    return {
      slide_id: safeText(slide?.slide_id, `S${index + 1}`),
      selected_archetype: safeText(binding?.selected_archetype),
      primary_grid: safeText(layoutIntent?.primary_grid),
      composition_signature: safeText(layoutIntent?.composition_signature),
    };
  });

  for (const field of ['selected_archetype', 'primary_grid'] as const) {
    let current: JsonRecord[] = [];
    for (const row of rhythmRows) {
      if (safeText(row[field]) && current.length > 0 && row[field] === current[current.length - 1]?.[field]) {
        current.push(row);
      } else {
        pushRhythmRunFailure({ current, failures, field });
        current = safeText(row[field]) ? [row] : [];
      }
    }
    pushRhythmRunFailure({ current, failures, field });
  }

  const compositionSignatures = rhythmRows.map((row) => row.composition_signature).filter(Boolean);
  const distinctCompositionCount = new Set(compositionSignatures).size;
  const requiredDistinctCompositionCount = Math.ceil(slides.length * 0.75);
  if (compositionSignatures.length === slides.length && distinctCompositionCount < requiredDistinctCompositionCount) {
    failures.push({
      reason: 'native_deck_distinct_composition_share_too_low',
      actual_distinct_composition_count: distinctCompositionCount,
      required_distinct_composition_count: requiredDistinctCompositionCount,
      slide_count: slides.length,
    });
  }

  const distinctArchetypeCount = new Set(rhythmRows.map((row) => row.selected_archetype).filter(Boolean)).size;
  const requiredArchetypeCount = slides.length >= 5 ? 3 : 2;
  if (distinctArchetypeCount < requiredArchetypeCount) {
    failures.push({
      reason: 'native_deck_archetype_variety_too_low',
      actual_distinct_archetype_count: distinctArchetypeCount,
      required_distinct_archetype_count: requiredArchetypeCount,
      slide_count: slides.length,
    });
  }

  return failures;
}

function pushRhythmRunFailure({
  current,
  failures,
  field,
}: {
  current: JsonRecord[];
  failures: JsonRecord[];
  field: 'selected_archetype' | 'primary_grid';
}) {
  if (current.length < 3) return;
  failures.push({
    reason: `native_deck_consecutive_${field}_repetition`,
    field,
    value: current[0]?.[field],
    slide_ids: current.map((item) => item.slide_id),
    maximum_consecutive: 2,
  });
}
