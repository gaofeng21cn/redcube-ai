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
      'Open the RedCube product-entry overview first via the `status` command; if the user requested plan/storyline review, invoke with lifecycle_policy=operator_review_after_plan; otherwise direct invoke runs to terminal export unless explicit stop_after_stage or a runtime review gate stops it.'
    ),
    recommended_step_id: 'open_status',
    steps: [
      {
        step_id: 'open_status',
        title: 'Open RedCube product-entry overview',
        command: `${PRODUCT_STATUS_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_status',
        summary: 'Read the agent-facing product-entry overview for the current workspace; `status` is the product overview command, not a GUI shell.',
        requires: [],
      },
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
        title: 'Inspect current session progress',
        command: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
        summary: 'Inspect the current session progress for the same deliverable.',
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
      summary: 'Repo-verified product-entry overview/intake surface 已 landed；默认 invoke 生成 OPL stage execution plan 并交给 OPL provider 推进；`status` 是当前 product overview 命令，成熟终端用户前台壳仍未 landed。',
      product_entry_command: PRODUCT_STATUS_COMMAND,
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
  };
  const productEntryStart = buildProductEntryStart({
    summary: (
      '先读取 RedCube product-entry overview（`status` 命令）；direct session 默认自动推进到终态，'
      + '需要给 OPL framework 托管时使用 OPL-hosted stage runtime handoff，已有 session 则直接恢复。'
    ),
    recommended_mode_id: 'open_status',
    modes: [
      {
        mode_id: 'open_status',
        title: 'Open RedCube product-entry overview',
        command: `${PRODUCT_STATUS_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_status',
        summary: 'Read the agent-facing product-entry overview for the current workspace; `status` is the product overview command, not a GUI shell.',
        requires: [],
      },
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
        title: 'Resume session',
        command: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
        summary: 'Resume an existing RedCube product-entry session by entry_session_id.',
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
      '当前可以作为 RedCube 的 agent-facing product-entry overview / CLI product-entry 主线使用，'
      + '默认 product-entry 已返回 OPL stage execution plan / RCA authority refs，'
      + '但还不是成熟的最终用户前台或托管 Web 产品。'
    ),
    recommended_start_surface: 'product_status',
    recommended_start_command: PRODUCT_STATUS_COMMAND,
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
