// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

function readGovernanceReviewStateSurface() {
  return [
    read('packages/redcube-governance/src/review-state.ts'),
    read('packages/redcube-governance/src/review-state-parts/mutations.ts'),
    read('packages/redcube-governance/src/review-state-parts/projection.ts'),
  ].join('\n');
}

function readCliSource() {
  return [
    read('apps/redcube-cli/src/cli.ts'),
    read('apps/redcube-cli/src/cli-parts/dispatch.ts'),
    read('apps/redcube-cli/src/cli-parts/help.ts'),
    read('apps/redcube-cli/src/cli-parts/output.ts'),
  ].join('\n');
}

test('harness audit: runtime/kernel no longer owns family render branches and core capability planes are package-scoped', () => {
  const runtimeIndex = readImplementation('packages/redcube-runtime/src/index.ts');
  const runtimePackageJson = JSON.parse(read('packages/redcube-runtime/package.json'));
  const executors = readImplementation('packages/redcube-runtime/src/executors.ts');
  const runtimeFamilyRegistryPackageJson = JSON.parse(read('packages/redcube-runtime-family-registry/package.json'));

  assert.equal(runtimeIndex.includes("@redcube/governance"), true);
  assert.equal(runtimeIndex.includes("@redcube/reference-os"), true);
  assert.equal(runtimePackageJson.dependencies['@redcube/governance'], '0.1.0');
  assert.equal(runtimePackageJson.dependencies['@redcube/reference-os'], '0.1.0');
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/pack-runtime']), false);
  assert.equal(runtimePackageJson.dependencies['@redcube/runtime-family-registry'], '0.1.0');
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/runtime-family-ppt']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/runtime-family-xiaohongshu']), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/ppt-deck.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/ppt-deck-runtime.ts')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/xiaohongshu.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/xiaohongshu-runtime.ts')), false);
  assert.equal(executors.includes("@redcube/runtime-family-registry"), true);
  assert.equal(executors.includes("@redcube/runtime-family-ppt"), false);
  assert.equal(executors.includes("@redcube/runtime-family-xiaohongshu"), false);
  assert.equal(executors.includes('./ppt-deck-runtime.ts'), false);
  assert.equal(executors.includes('./xiaohongshu-runtime.ts'), false);
  assert.deepEqual(
    runtimeFamilyRegistryPackageJson.redcube.defaultRuntimeFamilyModules.map((entry) => entry.overlayId),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
});

test('harness audit: source truth remains canonical through the current source intake path', () => {
  const intakeAction = readImplementation('packages/redcube-domain-entry/src/actions/intake-source.ts');
  const sharedSourceTruth = readImplementation('packages/redcube-runtime/src/shared-source-truth.ts');

  assert.equal(intakeAction.includes("surface_kind: 'source_intake'"), true);
  assert.equal(sharedSourceTruth.includes('source_index'), true);
  assert.equal(sharedSourceTruth.includes('extracted_materials'), true);
  assert.equal(sharedSourceTruth.includes('source_audit'), true);
  assert.equal(sharedSourceTruth.includes('source_brief'), true);
});

test('harness audit: publish governance is single-owner and family runtimes no longer author publish truth', () => {
  const governanceReviewState = readGovernanceReviewStateSurface();
  const pptRuntime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.ts');
  const xhsRuntime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts');

  assert.equal(governanceReviewState.includes('approve_publish'), true);
  assert.equal(governanceReviewState.includes('promote_publish'), true);
  assert.equal(governanceReviewState.includes('promote_baseline'), true);
  assert.equal(governanceReviewState.includes('review_state.publish_state'), true);
  assert.equal(pptRuntime.includes('approval_state:'), false);
  assert.equal(pptRuntime.includes('publish_state:'), false);
  assert.equal(xhsRuntime.includes('approval_state:'), false);
  assert.equal(xhsRuntime.includes('publish_state:'), false);
  assert.equal(xhsRuntime.includes('publication_state_file'), false);
});

test('harness audit: reference quality is a formal operating surface, not only test fixtures', () => {
  const referenceOsIndex = read('packages/redcube-reference-os/src/index.ts');
  const runtimeIndex = readImplementation('packages/redcube-runtime/src/index.ts');
  const referenceSamples = readImplementation('packages/redcube-reference-os/src/reference-samples.ts');
  const relativeQuality = readImplementation('packages/redcube-reference-os/src/relative-quality.ts');

  assert.equal(referenceOsIndex.includes('listReferenceSamples'), true);
  assert.equal(referenceOsIndex.includes('buildReferenceQualityReport'), true);
  assert.equal(referenceOsIndex.includes('buildReferencePromotionReport'), true);
  assert.equal(referenceOsIndex.includes('buildReferenceReplacementReport'), true);
  assert.equal(runtimeIndex.includes('buildReferenceQualityReport'), true);
  assert.equal(runtimeIndex.includes('buildReferencePromotionReport'), true);
  assert.equal(runtimeIndex.includes('buildReferenceReplacementReport'), true);
  assert.equal(referenceSamples.includes("surface_kind: 'reference_sample_catalog'"), true);
  assert.equal(relativeQuality.includes("surface_kind: 'reference_quality_report'"), true);
  assert.equal(relativeQuality.includes("surface_kind: 'reference_promotion_report'"), true);
  assert.equal(relativeQuality.includes("surface_kind: 'reference_replacement_report'"), true);
});

test('harness audit: product/domain surface is stable across success and failure paths', () => {
  const cli = readCliSource();
  const mcp = read('apps/redcube-mcp/src/server.ts');
  const getDeliverable = readImplementation('packages/redcube-domain-entry/src/actions/get-deliverable.ts');
  const runRoute = [
    readImplementation('packages/redcube-domain-entry/src/actions/run-deliverable-route.ts'),
    readImplementation('packages/redcube-domain-entry/src/actions/run-deliverable-route-parts/domain-entry-response.ts'),
  ].join('\n');
  const doctor = readImplementation('packages/redcube-domain-entry/src/actions/doctor-workspace.ts');
  const listTopics = readImplementation('packages/redcube-domain-entry/src/actions/list-topics.ts');
  const domainEntryIndex = readImplementation('packages/redcube-domain-entry/src/index.ts');

  assert.equal(cli.includes("error_kind: 'cli_usage_error'"), true);
  assert.equal(cli.includes("recommended_action: 'read_help'"), true);
  assert.equal(cli.includes('review get --workspace-root'), true);
  assert.equal(cli.includes('review projection --workspace-root'), true);
  assert.equal(cli.includes('review watch --workspace-root'), false);
  assert.equal(cli.includes('runtimeWatch default wrapper 由 OPL status/workbench/read-model caller 持有'), true);
  assert.equal(mcp.includes("error_kind: 'domain_tool_error'"), true);
  assert.equal(mcp.includes("recommended_action: 'inspect_tool_request'"), true);
  assert.equal(getDeliverable.includes("surface_kind: 'deliverable_record'"), true);
  assert.equal(runRoute.includes("surface_kind: typedBlocker ? 'typed_blocker' : 'route_run'"), true);
  assert.equal(runRoute.includes("error_kind: result.ok ? null"), true);
  assert.equal(runRoute.includes(": 'route_failure'"), true);
  assert.equal(doctor.includes("surface_kind: 'workspace_doctor'"), true);
  assert.equal(listTopics.includes("surface_kind: 'topic_catalog'"), true);
  assert.equal(domainEntryIndex.includes('getDefaultOverlayCatalog'), true);
  assert.equal(domainEntryIndex.includes("recommended_action: 'create_deliverable'"), true);
});

test('harness audit: extension proof shows onboarding is registry-driven instead of trunk hardcoded', () => {
  const overlayRegistryPackage = JSON.parse(read('packages/redcube-overlay-registry/package.json'));
  const createDeliverable = read('packages/redcube-domain-entry/src/actions/create-deliverable.ts');
  const auditDeliverable = read('packages/redcube-domain-entry/src/actions/audit-deliverable.ts');

  assert.deepEqual(
    overlayRegistryPackage.redcube.defaultOverlayModules.map((item) => item.overlayId),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
  assert.deepEqual(
    [
      readImplementation('packages/redcube-overlay-ppt/src/profiles.ts').includes("pack_id: 'ppt_deck_mainline_v1'"),
      readImplementation('packages/redcube-overlay-xiaohongshu/src/contracts.ts').includes("pack_id: 'xiaohongshu_mainline_v1'"),
      readImplementation('packages/redcube-overlay-poster-onepager/src/contracts.ts').includes("pack_id: 'poster_onepager_mainline_v1'"),
    ],
    [true, true, true],
  );
  assert.equal(createDeliverable.includes('@redcube/overlay-ppt'), false);
  assert.equal(createDeliverable.includes('@redcube/overlay-xiaohongshu'), false);
  assert.equal(auditDeliverable.includes('@redcube/overlay-ppt'), false);
  assert.equal(auditDeliverable.includes('@redcube/overlay-xiaohongshu'), false);
});
