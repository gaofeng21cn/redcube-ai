import { createHash } from 'node:crypto';
import { safeArray, safeText } from '../../shared.js';

function pointText(item, fallback) {
  return safeText(item?.text || item, fallback);
}

function contentCharCount(text) {
  return [...String(text || '')]
    .filter((char) => !/\s/.test(char) && !['，', '。', '、', ',', '.', ':', '：', ';', '；'].includes(char))
    .length;
}

function qualityPointText(text, index) {
  const normalized = String(text || '').trim();
  if (contentCharCount(normalized) >= 12) return normalized;
  const seed = normalized || `第${index + 1}项`;
  return `${seed}，说明本页证据如何支撑交付判断`;
}

function slidePoints(slide) {
  const points = safeArray(slide?.page_core_content)
    .map((item, index) => pointText(item, `Point ${index + 1} carries concrete audience content`))
    .filter(Boolean);
  return (points.length > 0 ? points : [
    safeText(slide?.core_sentence, 'Concrete audience point for native PPT validation'),
    'Editable slide materialization keeps geometry explicit',
    'Review gates receive shape manifest evidence',
  ]).slice(0, 4).map((text, index) => qualityPointText(text, index));
}

function layoutIntentForSlide(slide, index, slotCount) {
  const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
  const intents = {
    cover_signal: {
      rhetorical_role: 'cover',
      primary_grid: 'hero_callout_with_signal_hub',
      visual_weight: 'left_hero_right_signal_hub',
      negative_space_strategy: 'right side and lower-right breathing area frame the opening claim',
      non_text_visual: 'signal hub with vertical connector rail',
    },
    multi_zone_compare: {
      rhetorical_role: 'comparison',
      primary_grid: `${slotCount}_zone_comparison_with_bridge_rail`,
      visual_weight: slotCount === 2 ? 'left_right_balanced_bridge' : 'distributed_columns_bridge',
      negative_space_strategy: 'wide connector gutter keeps comparison claims separated',
      non_text_visual: 'bridge connector rail linking comparison zones',
    },
    timeline_band: {
      rhetorical_role: 'timeline',
      primary_grid: 'horizontal_timeline_rail_with_milestone_nodes',
      visual_weight: 'bottom_band',
      negative_space_strategy: 'open upper narrative band above the rail',
      non_text_visual: 'timeline rail with milestone nodes',
    },
    judgement_ladder: {
      rhetorical_role: 'gate',
      primary_grid: 'vertical_gate_ladder',
      visual_weight: 'right_heavy',
      negative_space_strategy: 'left evidence column kept open for scanability',
      non_text_visual: 'gate ladder spine connecting judgement steps',
    },
    ring_cross: {
      rhetorical_role: 'system_map',
      primary_grid: 'radial_hub_and_axes',
      visual_weight: 'centered_radial',
      negative_space_strategy: 'corners stay open around the system axis',
      non_text_visual: 'center hub with radial axis connectors',
    },
    summary_peak: {
      rhetorical_role: 'synthesis',
      primary_grid: 'hero_takeaway_plus_closure_band',
      visual_weight: 'top_heavy',
      negative_space_strategy: 'large lower-right quiet zone after the final judgement',
      non_text_visual: 'takeaway band with closure rail',
    },
  };
  const intent = intents[layoutFamily] || intents.multi_zone_compare;
  return {
    ...intent,
    composition_signature: [
      layoutFamily,
      intent.primary_grid,
      intent.visual_weight,
      `slots_${slotCount}`,
      `page_${index + 1}`,
    ].join('__'),
    forbidden_template_reuse_checked: true,
  };
}

function stableCompositionSignature(nativeShapes) {
  const signatureRoles = new Set([
    'title',
    'core_sentence',
    'compare_panel',
    'signal_panel',
    'timeline_panel',
    'judgement_step',
    'axis_panel',
    'takeaway_panel',
    'structured_note_panel',
    'chart',
    'table',
    'metric_grid',
  ]);
  const payload = nativeShapes
    .filter((shape) => signatureRoles.has(safeText(shape?.role)))
    .map((shape) => {
      const bounds = shape?.bounds || {};
      return {
        role: safeText(shape?.role),
        kind: safeText(shape?.kind),
        x: Math.round((Number(bounds.left_in || 0) * 72) / 36),
        y: Math.round((Number(bounds.top_in || 0) * 72) / 36),
        w: Math.round((Number(bounds.width_in || 0) * 72) / 36),
        h: Math.round((Number(bounds.height_in || 0) * 72) / 36),
      };
    })
    .sort((left, right) => (
      left.role.localeCompare(right.role)
      || left.y - right.y
      || left.x - right.x
      || left.w - right.w
      || left.h - right.h
    ));
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
  const roleSummary = [...new Set(payload.map((item) => item.role))]
    .sort()
    .map((role) => `${role}:${payload.filter((item) => item.role === role).length}`)
    .join('-') || 'empty';
  return `native-composition:${digest}:${roleSummary}`;
}

export {
  layoutIntentForSlide,
  pointText,
  slidePoints,
  stableCompositionSignature,
};
