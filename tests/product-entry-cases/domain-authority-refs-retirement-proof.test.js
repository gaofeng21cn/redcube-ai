import {
  assert,
  exportDomainHandler,
  fileURLToPath,
  getProductEntryManifest,
  getProductStatus,
  path,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { existsSync } from 'node:fs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function readManifest() {
  return getProductEntryManifest({
    workspace_root: await prepareProductEntryWorkspace(),
  });
}

function resolveProductEntryLocator(manifest, locator) {
  const prefix = 'opl_generated:product_entry_manifest#';
  assert.equal(locator.startsWith(prefix), true, locator);
  return locator
    .slice(prefix.length)
    .split('/')
    .filter(Boolean)
    .reduce((value, segment) => value?.[segment.replaceAll('~1', '/').replaceAll('~0', '~')], manifest);
}

function resolvePointer(value, pointer) {
  return pointer
    .split('/')
    .filter(Boolean)
    .reduce((current, segment) => current?.[segment.replaceAll('~1', '/').replaceAll('~0', '~')], value);
}

function resolveCurrentOwnerLocator(manifest, locator) {
  const productEntryPrefix = 'opl_generated:product_entry_manifest#';
  if (locator.startsWith(productEntryPrefix)) {
    return resolvePointer(manifest, locator.slice(productEntryPrefix.length));
  }
  const [relativePath, pointer = ''] = locator.split('#', 2);
  assert.equal(relativePath.startsWith('contracts/'), true, locator);
  return resolvePointer(readJson(path.join(repoRoot, relativePath)), pointer);
}

function collectCurrentOwnerLocators(value, locators = []) {
  if (typeof value === 'string') {
    if (value.startsWith('opl_generated:product_entry_manifest#')
      || (value.startsWith('contracts/') && !/[ <>]/.test(value))) {
      locators.push(value);
    }
    return locators;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectCurrentOwnerLocators(entry, locators));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectCurrentOwnerLocators(entry, locators));
  }
  return locators;
}

test('product-entry is a thin domain-authority refs adapter', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await readManifest();

    assert.equal(manifest.manifest_kind, 'rca_domain_authority_refs_projection');
    assert.equal(manifest.domain_authority_refs.surface_kind, 'rca_domain_authority_refs');
    assert.equal(manifest.domain_authority_refs.owner, 'redcube_ai');
    assert.equal(manifest.authority_boundary.generic_product_shell_owner, 'one-person-lab');
    assert.equal(manifest.authority_boundary.agent_lab_owner, 'one-person-lab');
    assert.equal(manifest.authority_boundary.production_workorder_owner, 'one-person-lab');

    for (const removedSurface of [
      'operator_evidence_readiness_projection',
      'production_evidence_scaleout_refs',
      'production_evidence_tail_workorder',
      'opl_expected_receipt_monitor_freshness_handoff',
      'rca_efficiency_handoff_projection',
      'goal_workflow_agent_lab_suite',
      'ppt_three_route_agent_lab_suite',
      'workspace_receipt_inventory_projection',
      'opl_ledger_artifact_registration',
    ]) {
      assert.equal(Object.hasOwn(manifest, removedSurface), false, removedSurface);
    }
    assert.equal(existsSync('packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts'), false);
  });
});

test('product-entry returns only domain evidence, blocker, receipt, and artifact locator refs', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await readManifest();

    assert.deepEqual(Object.keys(manifest.domain_evidence_refs).sort(), [
      'live_stage_run_progress_evidence_ref',
      'no_regression_evidence_ref',
      'production_acceptance_ref',
    ]);
    assert.deepEqual(Object.keys(manifest.typed_blocker_refs).sort(), [
      'human_gate_refs_ref',
      'typed_blocker_refs_ref',
    ]);
    assert.deepEqual(Object.keys(manifest.receipt_refs).sort(), [
      'domain_action_receipt_refs_ref',
      'no_regression_receipt_ref',
      'owner_receipt_contract_ref',
    ]);
    assert.deepEqual(Object.keys(manifest.artifact_locator_refs).sort(), [
      'artifact_locator_contract_ref',
      'stage_folder_locator_contract_ref',
    ]);
    assert.equal(manifest.authority_boundary.opl_can_create_owner_receipt, false);
    assert.equal(manifest.authority_boundary.opl_can_create_typed_blocker, false);
    assert.equal(manifest.authority_boundary.projection_can_claim_domain_ready, false);
  });
});

test('product status remains a refs-only domain projection without runtime telemetry or lifecycle body', async () => {
  await withMockCodexRuntimeState(async () => {
    const status = await getProductStatus({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    assert.deepEqual(Object.keys(status).sort(), [
      'artifact_locator_refs',
      'authority_boundary',
      'consumer',
      'domain_evidence_refs',
      'ok',
      'owner',
      'receipt_refs',
      'surface_kind',
      'target_domain_id',
      'typed_blocker_refs',
    ]);
    for (const genericField of [
      'status',
      'current_stage',
      'resumable',
      'telemetry',
      'cost_summary',
      'lifecycle_stage_summary',
      'governance_surface',
    ]) {
      assert.equal(Object.hasOwn(status, genericField), false, genericField);
    }
  });
});

test('product-entry consumes the declarative stage manifest and never a tracked stage plane', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await readManifest();

    assert.equal(existsSync('contracts/stage_control_plane.json'), false);
    assert.equal(manifest.declarative_stage_manifest_ref, 'agent/stages/manifest.json');
    assert.deepEqual(manifest.family_stage_control_plane_ref, {
      ref_kind: 'generated_surface',
      ref: 'opl-generated:family_stage_control_plane',
      source_ref: 'agent/stages/manifest.json',
    });
    assert.equal(Object.hasOwn(manifest, 'family_stage_control_plane'), false);
  });
});

test('domain-handler export is an exact refs-only authority target without generic shells', async () => {
  await withMockCodexRuntimeState(async () => {
    const exportSurface = await exportDomainHandler({
      workspace_root: await prepareProductEntryWorkspace(),
    });

    assert.deepEqual(Object.keys(exportSurface).sort(), [
      'action_handler_refs',
      'adapter_id',
      'artifact_locator_refs',
      'authority_boundary',
      'compatibility_alias_allowed',
      'declarative_stage_manifest_ref',
      'domain_authority_refs',
      'domain_evidence_refs',
      'domain_id',
      'family_action_catalog_ref',
      'family_stage_control_plane_ref',
      'handler_id',
      'handler_role',
      'ok',
      'receipt_refs',
      'repo_local_legacy_product_domain_action_adapter_command_available',
      'surface_kind',
      'typed_blocker_refs',
      'version',
      'workspace_locator',
      'wrapped_projection_surface_kind',
    ].sort());
    for (const retiredSurface of [
      'runtime_framework',
      'mapped_surfaces',
      'guarded_actions',
      'blocked_actions',
      'source_manifest_refs',
      'runtime_residue_retirement',
      'summary',
      'command',
      'dispatch_command',
    ]) {
      assert.equal(Object.hasOwn(exportSurface, retiredSurface), false, retiredSurface);
    }
    assert.equal(Object.hasOwn(exportSurface.action_handler_refs, 'export_command'), false);
    assert.equal(Object.hasOwn(exportSurface.action_handler_refs, 'dispatch_command'), false);
    assert.equal(exportSurface.authority_boundary.projection_can_claim_domain_ready, false);
    const manifest = await readManifest();
    for (const [name, locator] of Object.entries(exportSurface.domain_authority_refs)) {
      assert.notEqual(resolveProductEntryLocator(manifest, locator), undefined, `${name}: ${locator}`);
    }
    assert.ok(JSON.stringify(exportSurface).length < 20_000);
  });
});

test('active acceptance contracts resolve current RCA and generated authority locators', async () => {
  await withMockCodexRuntimeState(async () => {
    const manifest = await readManifest();
    const readContract = (relativePath) => readJson(path.join(repoRoot, relativePath));
    const contracts = [
      'contracts/production_acceptance/rca-goal-workflow-agent-lab-suite.json',
      'contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json',
      'contracts/production_acceptance/rca-efficiency-handoff-projection.json',
      'contracts/production_acceptance/rca-production-acceptance.json',
      'contracts/production_acceptance/rca-workspace-receipt-scaleout-evidence-20260528.json',
    ].map(readContract);
    const locators = contracts.flatMap((contract) => collectCurrentOwnerLocators(contract));

    assert.equal(locators.length > 200, true);
    for (const locator of locators) {
      assert.notEqual(resolveCurrentOwnerLocator(manifest, locator), undefined, locator);
    }
    assert.equal(locators.some((locator) => locator.startsWith('redcube domain-handler export#/')), false);
  });
});
