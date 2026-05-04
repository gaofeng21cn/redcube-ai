// @ts-nocheck
export const NATIVE_PPT_PROOF_COMMAND = 'redcube native-ppt proof';
export const IMAGE_PPT_PROOF_COMMAND = 'redcube image-ppt proof';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function checkStatus(checks, checkId) {
  return safeText(checks.find((check) => check.check_id === checkId)?.status, 'unknown');
}

export function buildNativePptOperatorUx({
  workspaceRoot,
  productEntryPreflight,
  pptPolicy,
}) {
  const proofLane = pptPolicy?.native_ppt_proof_lane || {};
  const imageLane = pptPolicy?.image_page_authoring_lane || {};
  const htmlLane = pptPolicy?.html_authoring_lane || {};
  const runnableRoutes = Array.isArray(proofLane.runnable_routes)
    ? proofLane.runnable_routes
    : ['author_pptx_native', 'repair_pptx_native'];
  const preservedGates = Array.isArray(proofLane.preserved_gates)
    ? proofLane.preserved_gates
    : ['visual_director_review', 'screenshot_review', 'export_pptx'];
  const blockingReasons = [];
  if (proofLane.production_selectable !== true) {
    blockingReasons.push('native_ppt_proof_lane_not_production_selectable');
  }
  if (proofLane.default_enabled === true) {
    blockingReasons.push('native_ppt_proof_lane_must_remain_opt_in');
  }
  if (productEntryPreflight?.ready_to_try_now !== true) {
    blockingReasons.push('product_entry_preflight_blocked');
  }

  return {
    surface_kind: 'native_ppt_operator_ux',
    owner: 'redcube_ai',
    status: blockingReasons.length === 0 ? 'selectable_optional' : 'blocked',
    summary: 'Native PPT proof lane is an operator-selectable proof route for ppt_deck; it stays opt-in and preserves the review/export gates.',
    route_selection: {
      deliverable_family: 'ppt_deck',
      default_visual_route: safeText(pptPolicy?.default_visual_route, 'author_image_pages'),
      default_visual_policy: safeText(pptPolicy?.default_visual_policy, 'image_first'),
      image_first_default: imageLane?.default_enabled === true,
      image_routes: Array.isArray(imageLane.runnable_routes)
        ? imageLane.runnable_routes
        : ['author_image_pages', 'repair_image_pages'],
      html_routes: Array.isArray(htmlLane.runnable_routes)
        ? htmlLane.runnable_routes
        : ['render_html', 'fix_html'],
      native_routes: runnableRoutes,
      explicit_selection_required_for: Array.isArray(pptPolicy?.selectable_explicit_routes)
        ? pptPolicy.selectable_explicit_routes
        : ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native'],
      style_reference_dir_input: safeText(
        pptPolicy?.route_selection_policy?.style_reference_dir_input || imageLane.style_reference_dir_input,
        'delivery_request.style_reference_dir',
      ),
      selectable_when: [
        'deliverable_family=ppt_deck',
        'operator_explicitly_selects_native_ppt_proof',
        'native_ppt_dependencies_pass',
        'source_ready_or_existing_deliverable_contract_present',
      ],
      default_enabled: proofLane.default_enabled === true,
      production_selectable: proofLane.production_selectable === true,
      runnable_routes: runnableRoutes,
      replaces_routes: Array.isArray(proofLane.replaces_routes) ? proofLane.replaces_routes : [],
      preserved_gates: preservedGates,
      review_input_surface: safeText(proofLane.review_input_surface, 'rendered_pptx_screenshots'),
    },
    dependency_diagnostics: {
      surface_kind: 'native_ppt_dependency_diagnostics',
      diagnostic_only: true,
      checks: [
        {
          check_id: 'product_entry_preflight',
          status: productEntryPreflight?.ready_to_try_now === true ? 'pass' : 'fail',
          blocking: true,
          command: `redcube product preflight --workspace-root ${workspaceRoot}`,
          blocked_reason: productEntryPreflight?.ready_to_try_now === true
            ? null
            : 'product_entry_preflight_not_ready',
        },
        {
          check_id: 'workspace_contract_present',
          status: checkStatus(productEntryPreflight?.checks || [], 'workspace_contract_present'),
          blocking: true,
          command: `redcube workspace doctor --workspace-root ${workspaceRoot}`,
          blocked_reason: checkStatus(productEntryPreflight?.checks || [], 'workspace_contract_present') === 'pass'
            ? null
            : 'workspace_contract_missing',
        },
        {
          check_id: 'libreoffice_headless',
          status: 'required_by_runner',
          blocking: true,
          command: `${NATIVE_PPT_PROOF_COMMAND} --workspace-root ${workspaceRoot} --topic-id <topic-id> --deliverable-id <deliverable-id> --route author_pptx_native`,
          blocked_reason: 'soffice_headless_missing_or_unusable',
        },
        {
          check_id: 'poppler_pdftoppm',
          status: 'required_by_runner',
          blocking: true,
          command: `${NATIVE_PPT_PROOF_COMMAND} --workspace-root ${workspaceRoot} --topic-id <topic-id> --deliverable-id <deliverable-id> --route author_pptx_native`,
          blocked_reason: 'pdftoppm_missing_or_unusable',
        },
      ],
      native_helper_doctor_role: 'diagnostic_only',
      review_export_gates_execute_via_product_entry: true,
    },
    image_provider_diagnostics: {
      surface_kind: 'image_provider_diagnostics',
      diagnostic_only: true,
      default_route: safeText(pptPolicy?.default_visual_route, 'author_image_pages'),
      provider_status: 'runtime_checked',
      style_reference_dir_input: safeText(
        pptPolicy?.route_selection_policy?.style_reference_dir_input || imageLane.style_reference_dir_input,
        'delivery_request.style_reference_dir',
      ),
      blocked_reason: productEntryPreflight?.ready_to_try_now === true
        ? null
        : 'product_entry_preflight_blocked',
    },
    image_proof_runner: {
      surface_kind: 'image_ppt_proof_runner_command',
      helper_command: IMAGE_PPT_PROOF_COMMAND,
      command_template: (
        `${IMAGE_PPT_PROOF_COMMAND} --workspace-root ${workspaceRoot} `
        + '--entry-session-id <entry-session-id> --topic-id <topic-id> '
        + '--deliverable-id <deliverable-id> --route author_image_pages '
        + '--style-reference-dir <style-reference-dir>'
      ),
      repo_owned_runner: true,
      downstream_gateway_action: 'runDeliverableRoute',
      delegates_to: 'runDeliverableRoute',
      public_skill_policy: 'do_not_register_as_second_public_skill',
      allowed_routes: Array.isArray(imageLane.runnable_routes)
        ? imageLane.runnable_routes
        : ['author_image_pages', 'repair_image_pages'],
      required_review_export_gates: preservedGates,
    },
    proof_runner: {
      surface_kind: 'native_ppt_proof_runner_command',
      helper_command: NATIVE_PPT_PROOF_COMMAND,
      command_template: (
        `${NATIVE_PPT_PROOF_COMMAND} --workspace-root ${workspaceRoot} `
        + '--entry-session-id <entry-session-id> --topic-id <topic-id> '
        + '--deliverable-id <deliverable-id> --route author_pptx_native'
      ),
      repo_owned_runner: true,
      downstream_gateway_action: 'runNativePptProductEntryProof',
      delegates_to: 'runDeliverableRoute',
      public_skill_policy: 'do_not_register_as_second_public_skill',
      allowed_routes: runnableRoutes,
      required_review_export_gates: preservedGates,
    },
    blocked_reason: blockingReasons.length > 0 ? blockingReasons.join(',') : null,
  };
}
