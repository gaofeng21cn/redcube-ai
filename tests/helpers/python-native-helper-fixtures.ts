// @ts-nocheck
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MOCK_PYTHON = fileURLToPath(new URL('./mock-redcube-python-with-playwright.ts', import.meta.url));

export function testPythonCommandEnv() {
  return JSON.stringify([process.execPath, '--experimental-strip-types', MOCK_PYTHON]);
}

export function nativeHelperFixture(workspaceRoot, helperId, packageModule) {
  const pythonRoot = path.join(workspaceRoot, 'python-package-root');
  mkdirSync(pythonRoot, { recursive: true });
  return {
    helperId,
    packageModule,
    pythonRoot,
    catalogFile: path.join(workspaceRoot, 'python-native-helper-catalog.json'),
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
