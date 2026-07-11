import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MOCK_PYTHON = fileURLToPath(new URL('./mock-redcube-python-with-playwright.js', import.meta.url));

export function testPythonCommandEnv() {
  return JSON.stringify([process.execPath, '--experimental-strip-types', MOCK_PYTHON]);
}

export function nativeHelperFixture(workspaceRoot, helperId, packageModule) {
  const pythonRoot = path.join(workspaceRoot, 'python-package-root');
  mkdirSync(pythonRoot, { recursive: true });
  const catalogFile = path.join(workspaceRoot, 'python-native-helper-catalog.json');
  const catalog = existsSync(catalogFile)
    ? JSON.parse(readFileSync(catalogFile, 'utf8'))
    : {
        contract_id: 'python-native-helper-catalog-fixture',
        package: { source_root: 'python-package-root' },
        helpers: [],
      };
  catalog.helpers = [
    ...catalog.helpers.filter((helper) => helper.helper_id !== helperId),
    { helper_id: helperId, package_module: packageModule },
  ];
  writeFileSync(catalogFile, `${JSON.stringify({
    ...catalog,
  })}\n`, 'utf8');
  return {
    helperId,
    catalogFile,
  };
}

export function pptReviewHelperFixture(workspaceRoot) {
  return nativeHelperFixture(workspaceRoot, 'ppt_deck_review', 'redcube_ai.native_helpers.ppt_deck.review');
}

export function pptExportHelperFixture(workspaceRoot) {
  return nativeHelperFixture(workspaceRoot, 'ppt_deck_export', 'redcube_ai.native_helpers.ppt_deck.export');
}

export function pptNativeHelperFixture(workspaceRoot) {
  return nativeHelperFixture(workspaceRoot, 'ppt_deck_native', 'redcube_ai.native_helpers.ppt_deck.native');
}
