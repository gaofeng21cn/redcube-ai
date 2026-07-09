// @ts-nocheck
import {
  PRODUCT_MANIFEST_COMMAND,
  PRODUCT_STATUS_COMMAND,
} from './policy.js';

export function buildFormalEntryPolicy() {
  return {
    default: 'CLI',
    supported_protocols: ['MCP'],
    internal_surface: 'domain_entry_protocol_boundary',
    internal_surface_role: 'service_safe_domain_entry_and_protocol_adapter',
    retired_internal_surface_ids: ['retired_gateway_protocol_boundary_public_entry'],
    retired_internal_surface_policy: {
      surface_kind: 'retired_internal_surface_policy',
      semantic_id_required: true,
      required_id_prefix: 'retired_',
      legacy_raw_surface_ids_forbidden: [
        'managed',
        'runtime',
        'gateway',
        'session',
        'domain_action_adapter',
      ],
      legacy_terms_allowed_only_inside_retired_semantic_ids: true,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      active_caller_allowed: false,
      production_readiness_claim_allowed: false,
    },
    compatibility_alias_allowed: false,
  };
}

export function buildProductEntryStatusSection() {
  return {
    summary: 'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`status` 是当前 product overview 命令，成熟终端用户前台壳仍未 landed。',
    next_focus: [
      '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
      '继续把 OPL-hosted stage runtime handoff 与同一 downstream product-entry contract 对齐。',
    ],
    remaining_gaps_count: 2,
  };
}

export function buildManifestProjectionRefs() {
  return {
    reviewState: {
      surface_kind: 'review_state',
      owner: 'redcube_ai',
      status: 'runtime_projection_ref',
    },
    publicationProjection: {
      surface_kind: 'publication_projection',
      owner: 'redcube_ai',
      status: 'runtime_projection_ref',
    },
  };
}

export function buildSourceProvenanceSection() {
  return {
    surface_kind: 'source_provenance',
    summary: (
      'RCA exposes visual-deliverable source provenance as OPL-indexable body-free refs only; '
      + 'source truth, visual route judgment, artifact authority, review/export verdicts, and memory bodies remain RCA-owned.'
    ),
    source_provenance_ref: {
      surface_kind: 'rca_visual_source_provenance',
      ref: 'docs/source/source_augmentation_executor_contract.md',
    },
    historical_fixture_ref: {
      surface_kind: 'rca_visual_source_fixture_ref',
      ref: 'tests/fixtures/ppt-image-first-benchmark/manifest.json',
    },
    explicit_archive_import_ref: {
      surface_kind: 'rca_explicit_source_intake_ref',
      command: `${PRODUCT_STATUS_COMMAND} --workspace-root <workspace-root>`,
    },
    parity_oracle_ref: {
      surface_kind: 'rca_visual_pack_parity_oracle_ref',
      ref: '/visual_pack_compiler_handoff',
    },
    authority_boundary: [
      'source_refs_do_not_contain_source_body',
      'opl_projection_reads_refs_only',
      'workspace_source_intake_shell_owner_is_one_person_lab',
      'visual_source_truth_owner_is_redcube_ai',
      'review_export_verdict_owner_is_redcube_ai',
      'artifact_authority_owner_is_redcube_ai',
      'no_runtime_workbench_ledger_or_scheduler_authority_transferred',
    ],
    capability_classification: 'source_provenance_only',
    recommended_audit_command: PRODUCT_MANIFEST_COMMAND,
  };
}

export function projectProductEntryPreflight(productEntryPreflight) {
  return {
    surface_kind: productEntryPreflight.surface_kind,
    summary: productEntryPreflight.summary,
    ready_to_try_now: productEntryPreflight.ready_to_try_now,
    recommended_check_command: productEntryPreflight.recommended_check_command,
    recommended_start_command: productEntryPreflight.recommended_start_command,
    blocking_check_ids: productEntryPreflight.blocking_check_ids,
    checks: productEntryPreflight.checks,
    runtime_loop_closure: productEntryPreflight.runtime_loop_closure,
  };
}

export function buildManifestNotes() {
  return [
    'This manifest freezes the current repo-verified RedCube product-entry overview/intake service surface; `status` is the current product overview command.',
    'OPL generated descriptors own CLI/MCP/Skill/product/status/session/workbench metadata; repo-local redcube CLI/MCP are RCA domain handler targets and direct diagnostic entries.',
    'The OPL-hosted handoff stays available as an internal integration contract instead of a first-read user entry shell.',
    'It does not claim that a mature end-user shell, RCA-owned generic runtime, or production visual-stage soak is already landed.',
  ];
}
