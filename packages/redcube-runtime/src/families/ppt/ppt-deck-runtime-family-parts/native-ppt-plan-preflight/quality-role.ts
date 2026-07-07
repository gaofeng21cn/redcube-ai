import type { JsonRecord } from './shared.js';

export const ALLOWED_QUALITY_ROLES = ['content', 'decorative', 'auxiliary', 'structural'];

interface NativePptPreflightQualityDeps {
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptPreflightQualityParts({ safeText }: NativePptPreflightQualityDeps) {
  function nativePreflightRequiredQualityRole(failure: JsonRecord): string {
    if (safeText(failure?.reason) !== 'ai_first_quality_role_missing_or_invalid') return '';
    const explicit = safeText(failure?.required_quality_role).toLowerCase();
    if (ALLOWED_QUALITY_ROLES.includes(explicit)) return explicit;
    const role = safeText(failure?.role).toLowerCase();
    const kind = safeText(failure?.kind).toLowerCase();
    if (['page_number', 'page_no', 'page', 'footer', 'meta', 'cover_meta', 'speaker_identity', 'source_note', 'date', 'caption'].includes(role)) {
      return 'auxiliary';
    }
    if (['title', 'subtitle', 'core_sentence', 'lead', 'intro', 'thesis', 'body', 'body_sentence', 'point_text', 'route_label', 'gate_card', 'panel_title', 'takeaway', 'evidence_item', 'metric'].includes(role)) {
      return 'content';
    }
    if (
      ['line', 'connector', 'oval', 'circle'].includes(kind)
      || /axis|band|bridge|connector|flow|gate|hub|ladder|map|metric|rail|stack|table|timeline|track/.test(role)
    ) {
      return 'structural';
    }
    return 'decorative';
  }

  function nativePreflightRequiredHeight(failure: JsonRecord): number | null {
    const suggested = Number(failure?.suggested_height_in || 0);
    const minimum = Number(failure?.minimum_height_in || 0);
    const base = Number.isFinite(suggested) && suggested > 0
      ? suggested
      : Number.isFinite(minimum) && minimum > 0 ? minimum : 0;
    if (base <= 0) return null;
    const role = safeText(failure?.role);
    const fontSize = Number(failure?.font_size || 0);
    const roleFloor = role === 'title'
      ? 1.65
      : fontSize >= 20 && ['core_sentence', 'lead', 'intro', 'thesis', 'takeaway'].includes(role)
        ? 1.25
        : fontSize >= 18 ? 0.96 : 0;
    return Number((Math.max(base + 0.25, roleFloor)).toFixed(3));
  }

  function nativePreflightRequiredFontSize(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (reason === 'ai_first_body_text_too_small') return 18;
    if (reason === 'ai_first_point_index_too_small') return 16;
    return null;
  }

  function nativePreflightRequiredTextCharCount(failure: JsonRecord): number | null {
    return safeText(failure?.reason) === 'ai_first_content_depth_too_low' ? 12 : null;
  }

  function nativePreflightRequiredWidth(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (reason !== 'ai_first_route_label_unbalanced_wrap') return null;
    const minimum = Number(failure?.minimum_width_in || 0);
    return Number.isFinite(minimum) && minimum > 0 ? minimum : 4.2;
  }

  function nativePreflightRequiredZoneInset(failure: JsonRecord): number | null {
    if (safeText(failure?.reason) !== 'ai_first_shape_outside_template_layout_zone') return null;
    return 0.02;
  }

  function nativePreflightRequiredConnectorThickness(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (reason === 'ai_first_connector_thickness_too_small' || reason === 'ai_first_connector_bounds_not_numeric') {
      const minimum = Number(failure?.minimum_thickness_in || 0);
      return Number.isFinite(minimum) && minimum > 0 ? minimum : 0.03;
    }
    return null;
  }

  function nativePreflightRequiredInset(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (!['ai_first_text_panel_safe_area_violation', 'ai_first_text_card_internal_padding_too_small'].includes(reason)) return null;
    const requiredInset = Number(failure?.required_inset_in || 0);
    return Number.isFinite(requiredInset) && requiredInset > 0 ? requiredInset : 0.15;
  }

  function nativePreflightGeometryRepairInstruction(failure: JsonRecord): string {
    const reason = safeText(failure?.reason);
    if (reason === 'ai_first_text_box_overlap') {
      const otherShapeId = safeText(failure?.other_shape_id, '<other-shape-id>');
      return `Move or resize this text box and/or ${otherShapeId} so their visible text rectangles do not overlap; keep at least 0.12in clearance on one axis and preserve reading order.`;
    }
    if (reason === 'ai_first_structural_text_collision') {
      const otherShapeId = safeText(failure?.other_shape_id, '<connector-or-rail-shape-id>');
      return `Reroute ${otherShapeId} around this text box or move this text box away from the connector/rail; keep at least 0.12in clearance between structural lines and readable text.`;
    }
    if (reason === 'ai_first_text_panel_safe_area_violation') {
      const panelShapeId = safeText(failure?.panel_shape_id, '<panel-shape-id>');
      return `Move or resize this text box so it sits fully inside ${panelShapeId} panel_safe_bounds when provided, otherwise with at least 0.15in inset on all sides. Use required_delta_in to correct the left/top/right/bottom padding bleed; a text box centered in a panel still fails if any edge bleeds into the panel padding.`;
    }
    if (reason === 'ai_first_text_card_internal_padding_too_small') {
      return 'This filled text card owns its visible card background, so it must carry internal text padding directly. Set margin to at least required_inset_in, enlarge the card, or split it into a background panel plus a separate inset text box.';
    }
    if (reason === 'ai_first_shape_outside_template_layout_zone') {
      const layoutZoneId = safeText(failure?.layout_zone_id, '<layout-zone-id>');
      return `Move or resize this shape so its full bounds fit inside the declared ${layoutZoneId} zone_safe_bounds when provided, otherwise zone_bounds. Use required_delta_in to correct the left/top/right/bottom overflow. If the current zone is too small for readable text, enlarge or redesign that zone and keep the shape bound to the same semantic role; do not leave a planned-zone shape floating outside its zone.`;
    }
    if (reason === 'ai_first_route_label_unbalanced_wrap') {
      return 'Short route or gate labels must read as a balanced one-line label. Widen the label box to required_width_in or shorten the text; do not keep a narrow wrapped label.';
    }
    if (reason === 'ai_first_connector_thickness_too_small' || reason === 'ai_first_connector_bounds_not_numeric') {
      return 'For line/connector shapes, keep both bounds.width_in and bounds.height_in positive; use a thin dimension of at least 0.03in so Office can materialize it.';
    }
    if (reason === 'ai_first_quality_role_missing_or_invalid') {
      const requiredQualityRole = nativePreflightRequiredQualityRole(failure);
      return `Set this same shape's quality_role to ${requiredQualityRole || 'one of content, structural, decorative, auxiliary'}; do not use primary, secondary, body, title, visual, or role-like labels as quality_role values.`;
    }
    if (reason === 'ai_first_shape_bounds_invalid') {
      return 'Move and resize the shape inside the 16x9 canvas with positive width_in and height_in; keep the full shape within slide bounds.';
    }
    return '';
  }

  return {
    nativePreflightGeometryRepairInstruction,
    nativePreflightRequiredConnectorThickness,
    nativePreflightRequiredFontSize,
    nativePreflightRequiredHeight,
    nativePreflightRequiredInset,
    nativePreflightRequiredQualityRole,
    nativePreflightRequiredTextCharCount,
    nativePreflightRequiredWidth,
    nativePreflightRequiredZoneInset,
  };
}
