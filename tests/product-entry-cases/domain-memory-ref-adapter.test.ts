// @ts-nocheck
import {
  assert,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { assertPathValues, list } from './surface-fixture-assertions.ts';

const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';
const CONTROLLED_MEMORY_APPLY_PROOF_STATE = 'controlled_apply_proof_landed_memory_body_external';

const FORBIDDEN_MEMORY_APPLY_KEYS = [
  'memory_content_body',
  'slide_or_page_content',
  'visual_truth',
  'visual_verdict',
  'export_verdict',
  'review_verdict',
  'review_export_verdict',
  'artifact_blob',
  'canonical_artifact_blob',
];

function assertForbiddenKeysAbsent(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(
      FORBIDDEN_MEMORY_APPLY_KEYS.includes(key),
      false,
      `${path}.${key} must stay out of controlled memory apply proof`,
    );
    assertForbiddenKeysAbsent(child, `${path}.${key}`);
  }
}

function assertStandardFamilyDomainMemoryRef(descriptor) {
  assertPathValues(descriptor, {
    surface_kind: 'family_domain_memory_ref',
    version: 'family-domain-memory-ref.v1',
    memory_ref_id: 'rca_visual_pattern_memory',
    target_domain_id: 'redcube_ai',
    owner: 'redcube_ai',
    memory_family: 'visual_pattern_memory',
    stage_applicability: list('source_intake communication_strategy visual_direction artifact_creation review_and_revision package_and_handoff'),
    memory_pack_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator', role: 'domain_owned_memory_pack_descriptor', label: 'RCA visual pattern memory descriptor locator' },
    retrieval_contract_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/memory_locator', role: 'locator_only_retrieval_contract', label: 'RCA visual pattern memory locator' },
    writeback_contract_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/writeback_proposal_generator', role: 'domain_owned_writeback_proposal_contract', label: 'RCA visual pattern memory writeback proposal generator' },
    receipt_contract_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/writeback_receipt_contract', role: 'locator_only_writeback_receipt_contract', label: 'RCA visual pattern memory writeback receipt refs' },
    recall_projection_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/operator_receipt_projection', role: 'operator_recall_receipt_projection', label: 'RCA visual pattern memory operator receipt projection' },
    migration_plan_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/migration_plan', role: 'domain_owned_migration_plan', label: 'RCA visual pattern memory migration plan' },
    seed_corpus_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/seed_fixture_locator', role: 'domain_owned_seed_locator', label: 'RCA visual pattern memory seed fixture locator' },
    writeback_receipt_locator_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/writeback_receipt_locator', role: 'domain_owned_writeback_receipt_locator', label: 'RCA visual pattern memory writeback receipt locator' },
    'freshness.source': 'product_entry_manifest_build',
    'freshness.descriptor_locator_ref': '/domain_memory_descriptor_locator',
    'migration_readiness.status': DOMAIN_MEMORY_ADOPTION_STATE,
    'migration_readiness.migration_state': DOMAIN_MEMORY_ADOPTION_STATE,
    'migration_readiness.descriptor_proof_contract_state': 'landed',
    'migration_readiness.runtime_writeback_state': 'pending',
    'migration_readiness.memory_body_migration': 'domain_owned_runtime_apply_required',
    'migration_readiness.opl_apply_allowed': false,
    status: DOMAIN_MEMORY_ADOPTION_STATE,
    'authority_boundary.opl_role': 'locator_projection_owner',
    'authority_boundary.domain_memory_owner': 'redcube_ai',
    'authority_boundary.forbidden_opl_authority': list('memory_store_owner domain_truth_owner visual_route_owner accept_reject_owner quality_verdict_owner review_export_verdict_owner artifact_authority'),
    'authority_boundary.can_write_domain_truth': false,
    'authority_boundary.can_authorize_quality_verdict': false,
    'authority_boundary.can_write_artifacts': false,
    'authority_boundary.can_choose_visual_route': false,
    'authority_boundary.can_accept_or_reject_memory_writeback': false,
    'authority_boundary.can_issue_review_or_export_verdict': false,
  });
}

test('product-entry manifest exposes OPL standard domain_memory_descriptor for RCA visual pattern memory', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    assertStandardFamilyDomainMemoryRef(manifest.domain_memory_descriptor);
    assert.deepEqual(manifest.skill_catalog.skills[0].domain_projection.domain_memory_descriptor_ref, {
      ref_kind: 'json_pointer',
      ref: '/domain_memory_descriptor',
      label: 'RCA OPL family domain memory ref',
    });
    assert.equal(
      manifest.domain_memory_descriptor.memory_pack_ref.ref,
      '/domain_memory_descriptor_locator',
    );
  });
});

test('product-entry manifest exposes controlled consumed-memory and writeback receipt proof refs', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });
    const attempt = manifest.controlled_visual_stage_attempt;

    assertPathValues(attempt, {
      proof_model: 'consumed_memory_writeback_receipt_descriptor_domain_action_adapter_quality_ref_equivalence_only',
      status: DOMAIN_MEMORY_ADOPTION_STATE,
      proof_contract_state: 'landed',
      runtime_writeback_state: 'pending',
      provider_controlled_proof_id: 'rca.opl_hosted.controlled_visual_stage_attempt_memory_proof.v1',
      provider_controlled_proof_model: 'opl_hosted_attempt_consumes_memory_refs_and_returns_locator_only_receipts',
      'memory_consumption_contract.required_fields': list('memory_ref memory_family stage_scope deliverable_family provenance_refs content_ref'),
      'memory_consumption_contract.repository_boundary.repo_tracks_memory_content_body': false,
      'writeback_proof_contract.proposal_ref': 'rca-memory-proposal:visual-pattern:<proposal-id>',
      'writeback_proof_contract.status': DOMAIN_MEMORY_ADOPTION_STATE,
      'writeback_proof_contract.receipt_ref': 'rca-memory-receipt:visual-pattern:<receipt-id>',
      'writeback_proof_contract.memory_locator_ref': 'rca-memory:visual-pattern:<memory-id>',
      'writeback_proof_contract.repository_boundary.repo_tracks_proposal_instance': false,
      'writeback_proof_contract.repository_boundary.repo_tracks_receipt_instance': false,
      'writeback_proof_contract.repository_boundary.repo_tracks_memory_entry': false,
      'writeback_proof_contract.repository_boundary.repo_tracks_visual_or_export_artifacts': false,
      'opl_hosted_attempt.consumed_memory_refs': ['rca-memory:visual-pattern:<memory-id>'],
      'opl_hosted_attempt.writeback_receipt_ref': 'rca-memory-receipt:visual-pattern:<receipt-id>',
      'opl_hosted_attempt.operator_receipt_projection_ref': '/domain_memory_descriptor_locator/operator_receipt_projection',
      'equivalence_proof.direct_and_opl_share_consumed_memory_refs': true,
      'equivalence_proof.opl_writes_memory_content': false,
      'equivalence_proof.opl_writes_receipt_instance': false,
      'projection_only_result.memory_content_body': null,
      'projection_only_result.status': DOMAIN_MEMORY_ADOPTION_STATE,
      'projection_only_result.runtime_writeback_state': 'pending',
      'projection_only_result.receipt_instance': null,
      'projection_only_result.writeback_refs': {
        proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
        receipt_ref: 'rca-memory-receipt:visual-pattern:<receipt-id>',
        memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
        operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
      },
      'opl_policy_proof.opl_consumes_memory_refs': true,
      'opl_policy_proof.opl_consumes_writeback_receipt_refs': true,
      'opl_policy_proof.opl_holds_memory_content': false,
      'opl_policy_proof.opl_holds_receipt_instance': false,
    });
    for (const field of list('memory_content_body slide_or_page_content visual_verdict export_verdict review_verdict canonical_artifact_blob')) {
      assert.equal(attempt.memory_consumption_contract.forbidden_fields.includes(field), true, field);
    }
  });
});

test('controlled visual-stage memory apply proof carries refs, proposals, and receipt projections only', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });
    const applyProof = manifest.controlled_memory_apply_proof;

    assertPathValues(applyProof, {
      surface_kind: 'controlled_visual_stage_domain_memory_apply_proof',
      proof_id: 'rca.visual_pattern_memory.controlled_apply_proof.v1',
      status: CONTROLLED_MEMORY_APPLY_PROOF_STATE,
      owner: 'redcube_ai',
      controlled_stage_attempt_ref: '/controlled_visual_stage_attempt',
      stage_kinds: ['review_and_revision', 'package_and_handoff'],
      'consumed_visual_pattern_memory_refs.0': {
        memory_ref: 'rca-memory:visual-pattern:<memory-id>',
        memory_family: 'visual_pattern_memory',
        stage_scope: 'review_overlay',
        deliverable_family: 'ppt_deck',
        provenance_refs: ['/domain_memory_descriptor_locator', '/controlled_visual_stage_attempt'],
        content_ref: 'rca-memory-content-ref:visual-pattern:<memory-id>',
      },
      writeback_proposal_projection: {
        proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
        proposal_contract_ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
        seed_fixture_ref: 'rca-memory-seed:visual-pattern:<seed-id>',
        source_review_ref: 'workspace-runtime-ref:review:<run-id>',
        stage_scope: 'review_overlay',
        deliverable_family: 'ppt_deck',
        candidate_memory_ref: 'rca-memory:visual-pattern:<memory-id>',
        provenance_refs: ['/review_state', '/publication_projection', '/artifact_locator_contract'],
        recommended_decision: 'accepted_or_rejected_by_rca_only',
      },
      'forbidden_write_audit.writes_visual_truth': false,
      'forbidden_write_audit.writes_review_verdict': false,
      'forbidden_write_audit.writes_export_verdict': false,
      'forbidden_write_audit.writes_artifact_blob': false,
      'forbidden_write_audit.writes_memory_content_body_to_repo': false,
      'forbidden_write_audit.writes_receipt_instance_to_repo': false,
      'repository_boundary.repo_tracks_apply_proof_projection': true,
      'repository_boundary.repo_tracks_consumed_memory_refs': true,
      'repository_boundary.repo_tracks_writeback_proposal_projection': true,
      'repository_boundary.repo_tracks_accept_reject_receipt_projection': true,
      'repository_boundary.repo_tracks_memory_content_body': false,
      'repository_boundary.repo_tracks_receipt_instances': false,
      'repository_boundary.repo_tracks_visual_truth': false,
      'repository_boundary.repo_tracks_review_export_verdict': false,
      'repository_boundary.repo_tracks_artifact_blobs': false,
    });
    assert.deepEqual(applyProof.consumed_visual_pattern_memory_refs.map((entry) => entry.memory_ref), ['rca-memory:visual-pattern:<memory-id>']);
    assert.deepEqual(applyProof.accept_reject_receipt_projection.receipt_cases.map((entry) => entry.writeback_status), ['accepted', 'rejected']);
    for (const receiptCase of applyProof.accept_reject_receipt_projection.receipt_cases) {
      assert.equal(receiptCase.receipt_ref.startsWith('rca-memory-receipt:visual-pattern:'), true);
      assert.equal(receiptCase.operator_receipt_projection_ref, '/domain_memory_descriptor_locator/operator_receipt_projection');
      assert.equal(receiptCase.owner, 'redcube_ai');
    }
    assertForbiddenKeysAbsent(applyProof);

    assertPathValues(manifest, {
      'controlled_visual_stage_attempt.controlled_memory_apply_proof_ref': {
        ref_kind: 'json_pointer',
        ref: '/controlled_memory_apply_proof',
        role: 'controlled_memory_apply_proof',
        label: 'RCA controlled visual-stage memory apply proof',
      },
      'visual_pattern_memory_writeback.apply_proof_ref': '/controlled_memory_apply_proof',
    });
  });
});

test('controlled visual-stage memory apply proof exposes runtime accepted/rejected receipt instances by ref only', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareProductEntryWorkspace(),
    });
    const runtimeReceipts = manifest.controlled_memory_apply_proof.runtime_receipt_instances;

    assertPathValues(runtimeReceipts, {
      surface_kind: 'visual_pattern_memory_runtime_receipt_instances',
      owner: 'redcube_ai',
      repo_tracks_receipt_instances: false,
      repo_tracks_memory_content_body: false,
    });
    assert.deepEqual(runtimeReceipts.instances.map((receipt) => receipt.writeback_status), ['accepted', 'rejected']);
    for (const receipt of runtimeReceipts.instances) {
      assert.equal(receipt.receipt_ref.startsWith('rca-memory-receipt:visual-pattern:'), true);
      assert.equal(receipt.runtime_locator_ref.startsWith('workspace-runtime-ref:memory-receipt:'), true);
      assert.equal(receipt.operator_receipt_projection_ref, '/domain_memory_descriptor_locator/operator_receipt_projection');
      assert.equal(receipt.owner, 'redcube_ai');
      assert.equal(receipt.memory_content_body_ref.startsWith('rca-memory-content-ref:visual-pattern:'), true);
      assert.equal(receipt.memory_content_body, undefined);
      assert.equal(receipt.review_verdict, undefined);
      assert.equal(receipt.canonical_artifact_blob, undefined);
    }
    assertForbiddenKeysAbsent(runtimeReceipts);
  });
});
