import {
  exportDomainActionAdapter,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import {
  assertManifestSubstrateAdapterExport,
  assertDomainActionAdapterSubstrateAdapterExport,
} from './substrate-adapter-export-assertions.js';

test('RCA exports only opaque OPL substrate adapter indexes and keeps domain authority', async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const domain_action_adapter = await exportDomainActionAdapter({ workspace_root: workspaceRoot });

    assertManifestSubstrateAdapterExport(manifest);
    assertDomainActionAdapterSubstrateAdapterExport(domain_action_adapter);
  });
});
