// @ts-nocheck
import {
  exportProductSidecar,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import {
  assertManifestSubstrateAdapterExport,
  assertSidecarSubstrateAdapterExport,
} from './substrate-adapter-export-assertions.ts';

test('RCA exports only opaque OPL substrate adapter indexes and keeps domain authority', async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const sidecar = await exportProductSidecar({ workspace_root: workspaceRoot });

    assertManifestSubstrateAdapterExport(manifest);
    assertSidecarSubstrateAdapterExport(sidecar);
  });
});
