// @ts-nocheck
import { getDefaultOverlayRegistry } from '@redcube/overlay-registry';

import {
  DELIVERABLE_FACADE_TRUTH_SURFACES,
  PRODUCT_FEDERATE_COMMAND,
  PRODUCT_FRONTDESK_COMMAND,
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_SESSION_COMMAND,
  ROUTE_EQUIVALENCE_SHARED_TRUTH_SURFACES,
} from './policy.js';

const overlayRegistry = getDefaultOverlayRegistry();

export function buildRouteEquivalenceContract({ runtime, productEntrySessionCommand }) {
  return {
    surface_kind: 'route_equivalence_contract',
    owner: 'redcube_ai',
    status: 'repo_tracked',
    summary: 'RCA product-entry overview, direct invoke, same-session continuation, and the internal OPL bridge converge on the same downstream deliverable runtime truth; `frontdesk` remains the compatibility command key for the overview surface.',
    public_skill_policy: {
      skill_count: 1,
      skill_ids: ['redcube-ai'],
      canonical_skill_id: 'redcube-ai',
      second_public_skill_allowed: false,
    },
    equivalent_routes: [
      {
        route_id: 'product_frontdesk',
        command: PRODUCT_FRONTDESK_COMMAND,
        surface_kind: 'product_frontdesk',
        role: 'compat_product_entry_overview_command',
      },
      {
        route_id: 'product_invoke',
        command: PRODUCT_INVOKE_COMMAND,
        surface_kind: 'product_entry',
        role: 'direct_product_invoke',
      },
      {
        route_id: 'session_continuation',
        command: PRODUCT_SESSION_COMMAND,
        command_template: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
        role: 'same_session_continuation',
      },
      {
        route_id: 'internal_opl_bridge',
        command: PRODUCT_FEDERATE_COMMAND,
        surface_kind: 'federated_product_entry',
        role: 'internal_bridge_only',
      },
    ],
    shared_truth_surfaces: ROUTE_EQUIVALENCE_SHARED_TRUTH_SURFACES,
    downstream_runtime_truth: {
      entry_surface_kind: 'domain_entry',
      entry_adapter: 'RedCubeDomainEntry',
      runtime_owner: runtime.runtime_owner,
      session_store_root: runtime.session_store_root,
      executor_owner: 'codex_cli',
    },
    guardrails: [
      'do_not_create_second_public_skill',
      'do_not_create_second_runtime_semantics',
      'do_not_bypass_service_safe_domain_entry',
      'do_not_fork_deliverable_truth_by_route',
    ],
  };
}

export function buildDeliverableFacadeContract() {
  const pptDeckDescription = overlayRegistry.getOverlay('ppt_deck')?.describeOverlay?.() || {};
  const xiaohongshuVisualPolicy = overlayRegistry.getOverlay('xiaohongshu')?.describeOverlay?.().visual_authoring_policy || {};
  const pptDeckVisualPolicy = pptDeckDescription.visual_authoring_policy || {};
  return {
    surface_kind: 'deliverable_facade_contract',
    owner: 'redcube_ai',
    status: 'repo_tracked',
    summary: 'The product-entry facade covers current ppt_deck and xiaohongshu deliverable surfaces through the existing runtime and audit truth.',
    covered_families: ['ppt_deck', 'xiaohongshu'],
    facade_truth_surfaces: DELIVERABLE_FACADE_TRUTH_SURFACES,
    runtime_identity_fields: ['program_id', 'topic_id', 'deliverable_id', 'run_id'],
    public_entry_policy: {
      canonical_skill_id: 'redcube-ai',
      new_public_entry_allowed: false,
      internal_bridge_surface: 'invokeFederatedProductEntry',
    },
    family_route_policy: {
      ppt_deck: {
        deliverable_family: 'ppt_deck',
        route_surface: 'runManagedDeliverable',
        route_fallback_surface: 'runDeliverableRoute',
        protected_stage_sequence: pptDeckDescription.route_sequence || [],
        default_visual_route: 'render_html',
        native_ppt_proof_lane: pptDeckVisualPolicy.native_ppt_proof_lane || null,
        html_design_companion: pptDeckVisualPolicy.html_design_companion || null,
        route_gate_policy: 'fail_closed_against_overlay_stage_sequence',
        default_run_mode: 'auto_to_terminal',
        stop_policy: 'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
        export_route: 'export_pptx',
        review_routes: ['visual_director_review', 'screenshot_review'],
        bypass_policy: 'forbid_generic_presentation_or_native_pptx_bypass_unless_user_explicitly_requests_exploration',
      },
      xiaohongshu: {
        deliverable_family: 'xiaohongshu',
        route_surface: 'runDeliverableRoute',
        route_fallback_surface: 'runManagedDeliverable',
        default_visual_route: 'render_html',
        html_design_companion: xiaohongshuVisualPolicy.html_design_companion || null,
      },
    },
  };
}
