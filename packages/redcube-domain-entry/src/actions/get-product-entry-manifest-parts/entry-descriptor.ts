import {
  OPL_HOSTED_HANDOFF_REF,
  PRODUCT_INVOKE_COMMAND,
} from './policy.js';

type ProductEntryDescriptorInput = {
  humanGateIds: string[];
  nativePptOperatorUx: {
    image_proof_runner: {
      command_template: string;
    };
    proof_runner: {
      command_template: string;
    };
  };
  productEntrySessionCommand: string;
};

export function buildRedCubeProductEntryDescriptor({
  humanGateIds,
  nativePptOperatorUx,
  productEntrySessionCommand,
}: ProductEntryDescriptorInput) {
  const sessionLocatorField = 'entry_session_contract.entry_session_id';
  const checkpointLocatorField = 'entry_session_contract.opl_generated_session_surface.domain_projection.domain_snapshot_ref';
  return {
    direct: {
      command: PRODUCT_INVOKE_COMMAND,
      surface_kind: 'product_entry',
      required_fields: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    },
    session: {
      command: productEntrySessionCommand,
      surface_kind: 'product_entry_session',
      required_fields: ['entry_session_id'],
      session_locator_field: sessionLocatorField,
      checkpoint_locator_field: checkpointLocatorField,
    },
    opl_hosted: {
      action_ref: OPL_HOSTED_HANDOFF_REF,
      surface_kind: 'opl_hosted_product_entry',
      required_fields: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    },
    progress: {
      surface_kind: 'product_entry_session',
      command: productEntrySessionCommand,
      step_id: 'inspect_current_progress',
    },
    resume: {
      command: productEntrySessionCommand,
      surface_kind: 'product_entry_session',
      required_fields: ['entry_session_id'],
      session_locator_field: sessionLocatorField,
      checkpoint_locator_field: checkpointLocatorField,
    },
    operator: {
      command: PRODUCT_INVOKE_COMMAND,
      recommended_step_id: 'continue_current_loop',
    },
    proof_actions: [
      {
        action_id: 'default_image_ppt_proof',
        command: nativePptOperatorUx.image_proof_runner.command_template,
        surface_kind: 'image_ppt_product_entry_proof',
        required_fields: ['entry_session_id', 'topic_id', 'deliverable_id'],
      },
      {
        action_id: 'optional_native_ppt_proof',
        command: nativePptOperatorUx.proof_runner.command_template,
        surface_kind: 'native_ppt_product_entry_proof',
        required_fields: ['entry_session_id', 'topic_id', 'deliverable_id'],
      },
    ],
    readiness: {
      verdict: 'service_surface_ready_not_end_user_shell',
      usable_now: true,
      good_to_use_now: false,
      fully_automatic: false,
      blocking_gaps: [
        'mature_end_user_shell_is_not_an_rca_owned_surface',
        'production_evidence_tail_remains_open',
      ],
      evidence_refs: [
        '/product_entry_preflight',
        '/temporal_stage_run_consumption_policy',
        '/operator_evidence_readiness_projection',
      ],
    },
    human_gate_ids: humanGateIds,
    next_focus_refs: [
      '/opl_generated_interface_consumption',
      '/temporal_stage_run_consumption_policy',
    ],
  };
}
