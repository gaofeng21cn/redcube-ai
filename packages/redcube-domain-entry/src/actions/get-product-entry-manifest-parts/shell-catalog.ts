// @ts-nocheck
import {
  buildSkillCatalog,
} from 'opl-framework-shared/skill-catalog';
import {
  buildOperatorLoopActionCatalog,
  buildProductEntryShellCatalog,
  buildProductEntryShellLinkedSurface,
} from 'opl-framework-shared/product-entry-companions';

import {
  LONG_TASK_STAGE_POLICY,
  OPL_HOSTED_HANDOFF_REF,
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_SESSION_COMMAND,
  PRODUCT_STATUS_COMMAND,
} from './policy.js';

export function buildProductEntryManifestShellCatalog({
  actionMetadata,
  familyActionCatalogRef = {
    ref_kind: 'json_pointer',
    ref: '/family_action_catalog',
    label: 'RedCube family action catalog',
  },
  familySchedulerReplacement,
  nativePptOperatorUx,
  oplGenericPrimitiveConsumption,
  oplRuntimeManagerRegistration,
  oplStabilityReadModelConsumption,
  oplSubstrateAdapterExport,
  pptRoutePolicy,
  pptRouteSelection,
  privatizedFunctionalModuleAudit,
  productEntrySessionCommand,
  domainActionAdapterForbiddenWrites,
  domainActionAdapterGuardedActionIds,
  runtimeContinuityEnvelope,
  visualPackCompilerHandoff,
  workspaceRoot,
}) {
  const skillCommandContracts = actionMetadata.skill_commands.map((contract) => {
    const result = {
      action_id: contract.action_id,
      command_contract_id: contract.command_contract_id,
      command: contract.command,
      shell_key: contract.shell_key,
      target_surface_kind: contract.surface_kind,
      required_fields: contract.required_fields,
      effect: contract.effect,
      summary: contract.summary,
    };
    if (contract.public_skill_policy) {
      result.public_skill_policy = contract.public_skill_policy;
    }
    return result;
  });
  const skillActivationHints = {
    plugin_name: 'redcube-ai',
    skill_semantics: 'single_domain_app_skill',
    canonical_entry_semantics: 'agent_facing_product_entry_overview',
    generated_interface_owner: 'one-person-lab',
    domain_handler_owner: 'redcube_ai',
    repo_local_redcube_cli_role: 'domain_handler_target_or_direct_domain_entry_only',
    repo_local_redcube_mcp_role: 'domain_handler_target_or_direct_protocol_adapter_only',
    entry_shell_key: 'status',
    entry_command: PRODUCT_STATUS_COMMAND,
    supporting_shell_keys: ['direct', 'session'],
    shell_commands: {
      status: {
        command: PRODUCT_STATUS_COMMAND,
        target_surface_kind: 'product_status',
      },
      direct: {
        command: PRODUCT_INVOKE_COMMAND,
        target_surface_kind: 'product_entry',
      },
      session: {
        command: PRODUCT_SESSION_COMMAND,
        target_surface_kind: 'product_entry_session',
      },
      native_ppt_proof: {
        command: nativePptOperatorUx.proof_runner.helper_command,
        target_surface_kind: 'native_ppt_product_entry_proof',
        role: 'controlled_operator_helper',
      },
      image_ppt_proof: {
        command: nativePptOperatorUx.image_proof_runner.helper_command,
        target_surface_kind: 'image_ppt_product_entry_proof',
        role: 'controlled_operator_helper',
      },
    },
  };
  const skillCatalog = buildSkillCatalog({
    summary: 'RedCube AI is exposed as one domain app skill; the `status` command is the agent-facing product-entry overview command, while direct invoke and session continuity stay internal product-entry contracts for OPL and operator tooling.',
    skills: [
      {
        skill_id: 'redcube-ai',
        title: 'RedCube AI',
        owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        distribution_mode: 'opl_generated_descriptor_with_repo_local_handler_targets',
        surface_kind: 'product_status',
        description: 'Operate the RedCube AI domain app through the agent-facing product-entry overview while using the `status` product overview command and the same direct/session contracts underneath.',
        command: PRODUCT_STATUS_COMMAND,
        readiness: 'landed',
        tags: ['domain-app', 'product-entry', 'visual-deliverables'],
        domain_projection: {
          skill_activation: skillActivationHints,
          runtime_continuity: runtimeContinuityEnvelope,
          opl_runtime_manager_registration: oplRuntimeManagerRegistration,
          long_task_stage_policy: LONG_TASK_STAGE_POLICY,
          family_action_catalog_ref: familyActionCatalogRef,
          domain_memory_descriptor_locator_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator', label: 'RCA visual pattern memory descriptor locator' },
          domain_memory_descriptor_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor', label: 'RCA OPL family domain memory ref' },
        },
      },
    ],
    supported_commands: actionMetadata.skill_commands.map((contract) => contract.command),
    command_contracts: skillCommandContracts,
  });

  const productEntryShell = buildProductEntryShellCatalog({
    status: {
      command: PRODUCT_STATUS_COMMAND,
      command_template: `${PRODUCT_STATUS_COMMAND} --workspace-root ${workspaceRoot}`,
      surface_kind: 'product_status',
      purpose: (
        '当前 agent-facing product-entry overview/intake shell；`status` 是当前 product overview 命令，'
        + '用于暴露 direct / session 入口，并把 OPL-hosted stage runtime handoff 保持在 framework-side handoff contract。'
      ),
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'domain_status_projection_target',
        canonical_entry_semantics: 'agent_facing_product_entry_overview',
        command_key: 'status',
        claims_gui_shell: false,
        ppt_deck_default_visual_route: pptRoutePolicy.default_visual_route,
        ppt_deck_default_visual_policy: pptRoutePolicy.default_visual_policy,
        route_selection_policy: pptRoutePolicy.route_selection_policy,
        style_reference_dir_input: pptRouteSelection.style_reference_dir_input,
        provider_diagnostics: nativePptOperatorUx.image_provider_diagnostics,
      },
    },
    direct: {
      command: PRODUCT_INVOKE_COMMAND,
      command_template: (
        `${PRODUCT_INVOKE_COMMAND} --workspace-root ${workspaceRoot} `
        + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
        + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
      ),
      surface_kind: 'product_entry',
      purpose: '直接进入当前 deliverable loop 的 primary operator surface。',
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'direct_domain_entry_target',
      },
    },
    opl_hosted: {
      command: OPL_HOSTED_HANDOFF_REF,
      action_ref: OPL_HOSTED_HANDOFF_REF,
      surface_kind: 'opl_hosted_product_entry',
      purpose: '通过 OPL framework hosted stage runtime handoff 进入同一 downstream product entry。',
    },
    session: {
      command: PRODUCT_SESSION_COMMAND,
      command_template: productEntrySessionCommand,
      surface_kind: 'product_entry_session',
      purpose: '在已有 entry_session_id 下继续同一交付并检查当前 session 进度。',
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'entry_session_domain_snapshot_refs_adapter',
      },
    },
    domain_action_adapter: {
      command: 'redcube product domain_action_adapter',
      command_template: `redcube product domain_action_adapter export --workspace-root ${workspaceRoot} --format json`,
      dispatch_command_template: 'redcube product domain_action_adapter dispatch --task <task.json> --format json',
      surface_kind: 'domain_action_adapter_adapter',
      purpose: 'RCA product domain_action_adapter adapter for the configured OPL family runtime provider; dispatch exposes only RCA receipt/verdict/ref authority actions, while runtime watch, generic supervise and product-entry continuation stay with OPL status/workbench/runtime read model and runner/session shell.',
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'domain_domain_action_adapter_target',
        runtime_owner: 'configured_family_runtime_provider',
        provider_transport_owner: 'opl_family_runtime_provider',
        control_plane_owner: 'opl',
        domain_truth_owner: 'redcube_ai',
        allowed_actions: domainActionAdapterGuardedActionIds,
        forbidden_writes: domainActionAdapterForbiddenWrites,
        family_scheduler_replacement: familySchedulerReplacement,
        opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
        opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
        privatized_functional_module_audit: privatizedFunctionalModuleAudit,
        opl_substrate_adapter_export: oplSubstrateAdapterExport,
        visual_pack_compiler_handoff: visualPackCompilerHandoff,
        workspace_receipt_inventory_projection_ref: '/workspace_receipt_inventory_projection',
        visual_transition_evaluator_ref: '/visual_transition_evaluator',
      },
    },
    native_ppt_proof: {
      command: nativePptOperatorUx.proof_runner.helper_command,
      command_template: nativePptOperatorUx.proof_runner.command_template,
      surface_kind: 'native_ppt_product_entry_proof',
      purpose: '受控 operator helper；仅在显式选择 native PPT proof lane 时调用 repo-owned route runner，不注册第二公开 skill。',
      extra_payload: {
        selectable_status: nativePptOperatorUx.status,
        blocked_reason: nativePptOperatorUx.blocked_reason,
        allowed_routes: nativePptOperatorUx.proof_runner.allowed_routes,
      },
    },
    image_ppt_proof: {
      command: nativePptOperatorUx.image_proof_runner.helper_command,
      command_template: nativePptOperatorUx.image_proof_runner.command_template,
      surface_kind: 'image_ppt_product_entry_proof',
      purpose: '受控 operator helper；映射 ppt_deck 默认 image-first proof route，不注册第二公开 skill。',
      extra_payload: {
        default_visual_route: pptRoutePolicy.default_visual_route,
        default_visual_policy: pptRoutePolicy.default_visual_policy,
        style_reference_dir_input: pptRouteSelection.style_reference_dir_input,
        provider_diagnostics: nativePptOperatorUx.image_provider_diagnostics,
        image_first_proof_readiness: nativePptOperatorUx.image_first_proof_readiness,
        style_reference_summary: nativePptOperatorUx.style_reference_summary,
        cache_status: nativePptOperatorUx.cache_status,
        artifact_inventory: nativePptOperatorUx.artifact_inventory,
        allowed_routes: nativePptOperatorUx.image_proof_runner.allowed_routes,
      },
    },
  });
  const entryStatusSurface = buildProductEntryShellLinkedSurface({
    shell_key: 'status',
    shell_surface: productEntryShell.status,
    summary: productEntryShell.status.purpose,
  });
  const operatorLoopSurface = buildProductEntryShellLinkedSurface({
    shell_key: 'direct',
    shell_surface: productEntryShell.direct,
    summary: (
      '当前 operator loop 仍 anchored on direct product entry；'
      + '拿到 entry_session_id 后继续通过 session surface 追踪同一交付。'
    ),
    extra_payload: {
      continuation_shell_key: 'session',
      continuation_command: productEntryShell.session.command,
    },
  });
  const operatorLoopActions = buildOperatorLoopActionCatalog({
    start_deliverable: {
      command: productEntryShell.direct.command,
      surface_kind: productEntryShell.direct.surface_kind,
      summary: productEntryShell.direct.purpose,
      requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    },
    continue_session: {
      command: productEntryShell.session.command,
      surface_kind: productEntryShell.session.surface_kind,
      summary: productEntryShell.session.purpose,
      requires: ['entry_session_id'],
    },
    opl_hosted_handoff: {
      command: productEntryShell.opl_hosted.command,
      action_ref: productEntryShell.opl_hosted.action_ref,
      surface_kind: productEntryShell.opl_hosted.surface_kind,
      summary: productEntryShell.opl_hosted.purpose,
      requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    },
    run_native_ppt_proof: {
      command: productEntryShell.native_ppt_proof.command,
      surface_kind: productEntryShell.native_ppt_proof.surface_kind,
      summary: productEntryShell.native_ppt_proof.purpose,
      requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
    },
    run_image_ppt_proof: {
      command: productEntryShell.image_ppt_proof.command,
      surface_kind: productEntryShell.image_ppt_proof.surface_kind,
      summary: productEntryShell.image_ppt_proof.purpose,
      requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
    },
  });

  return {
    entryStatusSurface,
    operatorLoopActions,
    operatorLoopSurface,
    productEntryShell,
    skillCatalog,
    skillCommandContracts,
  };
}
