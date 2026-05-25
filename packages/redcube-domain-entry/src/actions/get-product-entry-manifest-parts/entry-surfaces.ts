// @ts-nocheck
import {
  buildProductEntryStart,
  buildProductEntryOverview,
  buildProductEntryQuickstart,
  buildProductEntryReadiness,
  buildProductEntryResumeSurface,
} from 'opl-framework-shared/product-entry-companions';

import {
  OPL_HOSTED_HANDOFF_REF,
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_SESSION_COMMAND,
  PRODUCT_STATUS_COMMAND,
} from './policy.js';

export function buildProductEntryManifestEntrySurfaces({
  familyOrchestration,
  humanGateIds,
  nativePptOperatorUx,
  productEntrySessionCommand,
  workspaceRoot,
}) {
  const productEntryQuickstart = buildProductEntryQuickstart({
    summary: (
      'Start from the RCA direct product-entry domain handler target; OPL-generated status/session shells can inspect overview and progress, but RCA no longer publishes those repo-local default wrappers.'
    ),
    recommended_step_id: 'continue_current_loop',
    steps: [
      {
        step_id: 'continue_current_loop',
        title: 'Continue current deliverable loop',
        command: (
          `${PRODUCT_INVOKE_COMMAND} --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
          + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'product_entry',
        summary: 'Run the current deliverable loop; use lifecycle_policy=operator_review_after_plan for review-first deck tasks, otherwise it runs to terminal export unless explicit stop_after_stage or a runtime review gate stops it.',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      {
        step_id: 'inspect_current_progress',
        title: 'Inspect current session progress through OPL generated session shell',
        command: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
        summary: 'OPL generated session shell consumes RCA entry-session refs; this is not a repo-local RCA default CLI/MCP wrapper.',
        requires: ['entry_session_id'],
      },
      {
        step_id: 'default_image_ppt_proof',
        title: 'Run default image-first PPT proof',
        command: nativePptOperatorUx.image_proof_runner.command_template,
        surface_kind: 'image_ppt_product_entry_proof',
        summary: 'Default ppt_deck visual route uses image-first page authoring; style_reference_dir is accepted through delivery_request.style_reference_dir and provider diagnostics expose blocked_reason.',
        requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
      },
      {
        step_id: 'optional_native_ppt_proof',
        title: 'Run optional native PPT proof',
        command: nativePptOperatorUx.proof_runner.command_template,
        surface_kind: 'native_ppt_product_entry_proof',
        summary: 'Use only when the operator explicitly selects the native PPT proof lane; this helper delegates to the repo-owned route runner and preserves review/export gates.',
        requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
      },
    ],
    resume_contract: familyOrchestration.resume_contract,
    human_gate_ids: humanGateIds,
  });
  const productEntryOverview = {
    ...buildProductEntryOverview({
      summary: 'RCA exposes the direct product-entry domain handler target; OPL owns generated product-entry overview/status/session wrappers and consumes RCA refs.',
      product_entry_command: PRODUCT_INVOKE_COMMAND,
      recommended_command: PRODUCT_INVOKE_COMMAND,
      operator_loop_command: PRODUCT_INVOKE_COMMAND,
      progress_surface: {
        surface_kind: 'product_entry_session',
        command: productEntrySessionCommand,
        step_id: 'inspect_current_progress',
      },
      resume_surface: buildProductEntryResumeSurface(
        productEntrySessionCommand,
        familyOrchestration.resume_contract,
      ),
      recommended_step_id: productEntryQuickstart.recommended_step_id,
      next_focus: [
        '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
        '继续用 OPL generated/hosted caller 消费 RCA domain handler，并把 production live-soak 证据验证到真实长跑。',
      ],
      remaining_gaps_count: 2,
      human_gate_ids: humanGateIds,
    }),
    entry_status_command: PRODUCT_STATUS_COMMAND,
    entry_status_owner: 'one-person-lab',
    repo_local_entry_status_command_available: false,
  };
  const productEntryStart = buildProductEntryStart({
    summary: (
      'RCA repo-local public caller 只保留 direct invoke domain handler target；'
      + 'overview/status、session 和 hosted runtime handoff 由 OPL generated/hosted caller 承担。'
    ),
    recommended_mode_id: 'start_direct_session',
    modes: [
      {
        mode_id: 'start_direct_session',
        title: 'Start direct session',
        command: (
          `${PRODUCT_INVOKE_COMMAND} --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
          + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'product_entry',
        summary: 'Start or continue a direct RedCube product-entry session; set lifecycle_policy=operator_review_after_plan for review-first planning, or omit stop_after_stage for autonomous terminal export.',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      {
        mode_id: 'opl_hosted_handoff',
        title: 'OPL-hosted stage runtime handoff',
        command: OPL_HOSTED_HANDOFF_REF,
        action_ref: OPL_HOSTED_HANDOFF_REF,
        surface_kind: 'opl_hosted_product_entry',
        summary: 'Reserved for OPL framework callers while preserving the same downstream product entry contract.',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      {
        mode_id: 'resume_session',
        title: 'Resume session through OPL generated shell',
        command: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
        summary: 'OPL generated session shell targets RCA session refs; repo-local RCA CLI/MCP no longer exposes the default session wrapper.',
        requires: ['entry_session_id'],
      },
    ],
    resume_surface: buildProductEntryResumeSurface(
      productEntrySessionCommand,
      familyOrchestration.resume_contract,
    ),
    human_gate_ids: humanGateIds,
  });
  const productEntryReadiness = buildProductEntryReadiness({
    verdict: 'service_surface_ready_not_end_user_shell',
    usable_now: true,
    good_to_use_now: false,
    fully_automatic: false,
    summary: (
      '当前可以作为 RedCube 的 direct product-entry domain handler target 使用；'
      + '默认 product-entry 已返回 OPL stage execution plan / RCA authority refs，generated overview/session/workbench shell 归 OPL。'
    ),
    recommended_start_surface: 'product_entry',
    recommended_start_command: PRODUCT_INVOKE_COMMAND,
    recommended_loop_surface: 'product_entry',
    recommended_loop_command: PRODUCT_INVOKE_COMMAND,
    blocking_gaps: [
      '成熟的最终用户前台壳仍未 landed。',
      'production evidence tail 仍需 Temporal long soak、真实 memory/lifecycle receipt scaleout 与跨 family no-regression evidence。',
    ],
  });
  return {
    productEntryOverview,
    productEntryQuickstart,
    productEntryReadiness,
    productEntryStart,
  };
}
