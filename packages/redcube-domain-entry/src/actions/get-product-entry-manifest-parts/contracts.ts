import { getDefaultOverlayRegistry } from '@redcube/runtime';

import {
  DELIVERABLE_FACADE_TRUTH_SURFACES,
  PRODUCT_STATUS_COMMAND,
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_SESSION_COMMAND,
  ROUTE_EQUIVALENCE_SHARED_TRUTH_SURFACES,
} from './policy.js';

const overlayRegistry = getDefaultOverlayRegistry();

type RuntimeContractInput = {
  runtime_owner?: unknown;
  session_continuity_root?: unknown;
};

type ManifestOverlayVisualPolicy = Record<string, unknown> & {
  default_visual_route?: string;
  default_visual_policy?: string;
  image_page_authoring_lane?: unknown;
  html_authoring_lane?: unknown;
  native_ppt_proof_lane?: unknown;
  html_design_companion?: unknown;
  image_generation?: unknown;
  route_selection_policy?: {
    explicit_selection_required_for?: string[];
    style_reference_dir_input?: string;
  };
};

type ManifestOverlayDescription = Record<string, unknown> & {
  route_sequence?: unknown[];
  visual_authoring_policy?: ManifestOverlayVisualPolicy;
};

function describeManifestOverlay(overlayId: string): ManifestOverlayDescription {
  return (overlayRegistry.getOverlay(overlayId)?.describeOverlay?.() || {}) as ManifestOverlayDescription;
}

export const OPL_FRAMEWORK_PROVIDER_RUNTIME_CONTRACT = Object.freeze({
  contract_ref: 'contracts/opl-framework/runtime-manager-contract.json',
  canonical_fail_closed_rules: [
    'domain_supervision_cannot_bypass_runtime',
    'executor_cannot_declare_global_gate_clear',
    'runtime_cannot_invent_domain_publishability_truth',
  ],
});

export function buildRouteEquivalenceContract({
  runtime,
  productEntrySessionCommand,
}: {
  runtime: RuntimeContractInput;
  productEntrySessionCommand: string;
}) {
  return {
    surface_kind: 'route_equivalence_contract',
    owner: 'redcube_ai',
    status: 'repo_tracked',
    summary: 'RCA product-entry overview, direct invoke, same-session continuation, and OPL-hosted stage runtime handoff converge on the same downstream deliverable runtime truth; `status` is the current overview command.',
    public_skill_policy: {
      skill_count: 1,
      skill_ids: ['redcube-ai'],
      canonical_skill_id: 'redcube-ai',
      second_public_skill_allowed: false,
    },
    equivalent_routes: [
      {
        route_id: 'product_status',
        command: PRODUCT_STATUS_COMMAND,
        surface_kind: 'product_status',
        role: 'product_entry_overview_command',
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
        route_id: 'opl_hosted_stage_runtime',
        surface_kind: 'opl_hosted_product_entry',
        role: 'framework_handoff_only',
      },
    ],
    shared_truth_surfaces: ROUTE_EQUIVALENCE_SHARED_TRUTH_SURFACES,
    downstream_runtime_truth: {
      entry_surface_kind: 'domain_entry',
      entry_adapter: 'RedCubeDomainEntry',
      runtime_owner: runtime.runtime_owner,
      session_continuity_root: runtime.session_continuity_root,
      executor_owner: 'configured_by_opl_runtime_provider',
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
  const pptDeckDescription = describeManifestOverlay('ppt_deck');
  const xiaohongshuDescription = describeManifestOverlay('xiaohongshu');
  const xiaohongshuVisualPolicy = xiaohongshuDescription.visual_authoring_policy || {};
  const pptDeckVisualPolicy = pptDeckDescription.visual_authoring_policy || {};
  const pptDefaultVisualRoute = pptDeckVisualPolicy.default_visual_route || 'author_image_pages';
  const xhsDefaultVisualRoute = xiaohongshuVisualPolicy.default_visual_route || 'author_image_pages';
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
      opl_hosted_handoff_surface: 'invokeOplHostedProductEntry',
    },
    family_route_policy: {
      ppt_deck: {
        deliverable_family: 'ppt_deck',
        route_surface: 'buildOplStageExecutionPlan',
        route_fallback_surface: 'runDeliverableRoute',
        protected_stage_sequence: pptDeckDescription.route_sequence || [],
        default_visual_route: pptDefaultVisualRoute,
        default_visual_policy: 'image_first',
        image_page_authoring_lane: pptDeckVisualPolicy.image_page_authoring_lane || null,
        html_authoring_lane: pptDeckVisualPolicy.html_authoring_lane || null,
        native_ppt_proof_lane: pptDeckVisualPolicy.native_ppt_proof_lane || null,
        html_design_companion: pptDeckVisualPolicy.html_design_companion || null,
        selectable_explicit_routes: ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
        route_selection_policy: {
          default_route: pptDefaultVisualRoute,
          default_route_family: 'image_pages',
          html_routes: ['render_html', 'fix_html'],
          native_routes: ['author_pptx_native', 'repair_pptx_native'],
          explicit_selection_required_for: ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
          style_reference_dir_input: 'delivery_request.style_reference_dir',
        },
        provider_diagnostics: {
          surface_kind: 'image_provider_diagnostics',
          required_for_default_route: true,
          blocked_reason_field: 'blocked_reason',
        },
        route_gate_policy: 'fail_closed_against_overlay_stage_sequence',
        default_run_mode: 'auto_to_terminal',
        stop_policy: 'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
        export_route: 'export_pptx',
        review_routes: ['visual_director_review', 'screenshot_review'],
        bypass_policy: 'forbid_generic_presentation_or_native_pptx_bypass_unless_user_explicitly_selects_html_or_native_route',
      },
      xiaohongshu: {
        deliverable_family: 'xiaohongshu',
        route_surface: 'runDeliverableRoute',
        route_fallback_surface: 'buildOplStageExecutionPlan',
        protected_stage_sequence: xiaohongshuDescription.route_sequence || [],
        default_visual_route: xhsDefaultVisualRoute,
        default_visual_policy: xiaohongshuVisualPolicy.default_visual_policy || 'image_first',
        image_generation: xiaohongshuVisualPolicy.image_generation || null,
        html_design_companion: xiaohongshuVisualPolicy.html_design_companion || null,
        selectable_explicit_routes: xiaohongshuVisualPolicy.route_selection_policy?.explicit_selection_required_for || ['render_html', 'fix_html'],
        route_selection_policy: {
          default_route: xhsDefaultVisualRoute,
          default_route_family: 'image_pages',
          html_routes: ['render_html', 'fix_html'],
          explicit_selection_required_for: xiaohongshuVisualPolicy.route_selection_policy?.explicit_selection_required_for || ['render_html', 'fix_html'],
          style_reference_dir_input: xiaohongshuVisualPolicy.route_selection_policy?.style_reference_dir_input || 'delivery_request.style_reference_dir',
        },
        route_gate_policy: 'fail_closed_against_overlay_stage_sequence',
        default_run_mode: 'auto_to_terminal',
        stop_policy: 'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
        export_route: 'export_bundle',
        review_routes: ['visual_director_review', 'screenshot_review'],
        bypass_policy: 'forbid_generic_html_or_converter_bypass_unless_user_explicitly_selects_html_route',
      },
    },
  };
}
