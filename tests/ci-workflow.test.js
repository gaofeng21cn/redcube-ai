import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf-8');
}

function readRepoJson(relativePath) {
  return JSON.parse(readRepoFile(relativePath));
}

function listWorkspacePackageDirs() {
  const rootPackage = readRepoJson('package.json');
  const workspaceDirs = [];

  for (const pattern of rootPackage.workspaces ?? []) {
    if (!pattern.endsWith('/*')) {
      continue;
    }

    const baseDir = pattern.slice(0, -2);
    const absoluteBaseDir = path.join(repoRoot, baseDir);

    for (const entry of readdirSync(absoluteBaseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const relativeDir = path.join(baseDir, entry.name);
      if (existsSync(path.join(repoRoot, relativeDir, 'package.json'))) {
        workspaceDirs.push(relativeDir);
      }
    }
  }

  return workspaceDirs.sort();
}

function listRepoFiles(relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  const results = [];

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listRepoFiles(relativePath));
      continue;
    }
    results.push(relativePath);
  }

  return results.sort();
}

test('CI workflow pins reproducible toolchain and keeps hosted CI on the honest quality lane', () => {
  assert.equal(existsSync(path.join(repoRoot, '.nvmrc')), true);
  assert.equal(existsSync(path.join(repoRoot, 'package-lock.json')), true);
  assert.equal(existsSync(path.join(repoRoot, '.github', 'requirements', 'ci-python.txt')), true);

  const workflow = readRepoFile('.github/workflows/ci.yml');
  assert.match(workflow, /uses:\s*actions\/checkout@v6\b/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v6\b/);
  assert.match(workflow, /node-version-file:\s*['"]?\.nvmrc['"]?/);
  assert.match(workflow, /cache:\s*['"]?npm['"]?/);
  assert.match(workflow, /\brun:\s*npm ci\b/);
  assert.match(workflow, /quality:\n[\s\S]*?uses:\s*actions\/setup-python@v6\b[\s\S]*?python-version:\s*['"]3\.12['"][\s\S]*?sudo apt-get update[\s\S]*?fonts-noto-cjk[\s\S]*?python3 -m pip install -r \.github\/requirements\/ci-python\.txt[\s\S]*?python3 -m playwright install --with-deps chromium[\s\S]*?npm run typecheck[\s\S]*?npm run test:fast[\s\S]*?npm run test:family[\s\S]*?npm run test:meta/);
  assert.doesNotMatch(workflow, /\n\s{2}integration:\n/);
  assert.doesNotMatch(workflow, /\n\s{2}render-e2e:\n/);

  const pythonRequirements = readRepoFile('.github/requirements/ci-python.txt');
  assert.match(pythonRequirements, /^playwright==1\.58\.0$/m);
  assert.match(pythonRequirements, /^python-pptx==1\.0\.2$/m);
  assert.match(pythonRequirements, /^Pillow==12\.1\.1$/m);
});

test('repo-local family pin wrapper is the only allowed direct upstream family helper entrypoint', () => {
  const allowedFiles = new Set(['scripts/run-test-group-lib.mjs']);
  const disallowedDirectImports = [];
  const upstreamFamilyHelperImportPattern = /\bfrom\s+['"]opl-gateway-shared\/family-shared-release['"]|\bimport\s*\(\s*['"]opl-gateway-shared\/family-shared-release['"]\s*\)/;
  const sharedOwnerContractPathPattern = /['"]contracts\/family-release\/shared-owner-release\.json['"]/;

  for (const file of [...listRepoFiles('scripts'), ...listRepoFiles('tests')]) {
    if (!/\.(?:js|mjs)$/.test(file) || allowedFiles.has(file)) {
      continue;
    }

    const text = readRepoFile(file);
    if (
      upstreamFamilyHelperImportPattern.test(text)
      || sharedOwnerContractPathPattern.test(text)
    ) {
      disallowedDirectImports.push(file);
    }
  }

  assert.deepEqual(disallowedDirectImports, []);
});

test('package-lock tracks every declared workspace package', () => {
  const lockfile = readRepoJson('package-lock.json');
  const lockPackages = lockfile.packages ?? {};

  for (const relativeDir of listWorkspacePackageDirs()) {
    const manifest = readRepoJson(path.join(relativeDir, 'package.json'));
    assert.equal(
      Object.hasOwn(lockPackages, relativeDir),
      true,
      `package-lock.json 缺少 workspace 条目: ${relativeDir} (${manifest.name})`
    );
    assert.equal(lockPackages[relativeDir].name, manifest.name);
  }
});

test('render shells prefer a deterministic CJK font before platform fallbacks', () => {
  const xiaohongshuShell = readRepoFile('prompts/xiaohongshu/render_shell.html');
  const pptShell = readRepoFile('prompts/ppt_deck/render_shell.html');
  const posterShell = readRepoFile('prompts/poster_onepager/render_shell.html');

  assert.match(
    xiaohongshuShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
  assert.match(
    pptShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
  assert.match(
    posterShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
});

test('ppt render shell protects short Chinese terms from single-character orphan wrapping', () => {
  const pptShell = readRepoFile('prompts/ppt_deck/render_shell.html');

  assert.match(pptShell, /rca-cjk-token/);
  assert.match(pptShell, /protectCjkShortTokens/);
  for (const token of [
    '自动推进',
    '资料同步推进',
    '线索',
    '问题',
    '走向',
    '对齐',
    '阶段产物可审查',
    '证据边界',
    '不越界',
  ]) {
    assert.match(pptShell, new RegExp(token));
  }
});
