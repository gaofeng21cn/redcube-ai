// @ts-nocheck
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
  assert.match(workflow, /quality:\n[\s\S]*?uses:\s*actions\/setup-python@v6\b[\s\S]*?python-version:\s*['"]3\.12['"][\s\S]*?python3 -m pip install -r \.github\/requirements\/ci-python\.txt[\s\S]*?python3 -m playwright install --with-deps chromium[\s\S]*?npm run typecheck[\s\S]*?node --experimental-strip-types scripts\/run-test-group\.ts fast[\s\S]*?node --experimental-strip-types scripts\/run-test-group\.ts family[\s\S]*?node --experimental-strip-types scripts\/run-test-group\.ts meta/);
  assert.doesNotMatch(workflow, /quality:\n[\s\S]*?tools\/native-ppt-proof\/install-deps\.sh[\s\S]*?Run build and typecheck/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:\n\s+- cron:\s*['"]17 19 \* \* \*['"]/);
  assert.match(workflow, /pull_request:\n\s+types:\s+\[opened, synchronize, reopened, labeled\]/);
  assert.match(workflow, /native-ppt-proof:\n[\s\S]*?github\.event_name == 'workflow_dispatch'[\s\S]*?github\.event_name == 'schedule'[\s\S]*?native-ppt-proof[\s\S]*?uses:\s*actions\/cache@v4[\s\S]*?path:\s*~\/\.cache\/pip[\s\S]*?uses:\s*actions\/cache@v4[\s\S]*?path:\s*~\/\.cache\/ms-playwright[\s\S]*?tools\/native-ppt-proof\/run\.sh --output-dir artifacts\/native-ppt-proof[\s\S]*?uses:\s*actions\/upload-artifact@v6[\s\S]*?name:\s*native-ppt-proof[\s\S]*?artifacts\/native-ppt-proof\/artifact-index\.json/);
  assert.doesNotMatch(workflow, /\n\s{2}integration:\n/);
  assert.doesNotMatch(workflow, /\n\s{2}render-e2e:\n/);

  const pythonRequirements = readRepoFile('.github/requirements/ci-python.txt');
  assert.match(pythonRequirements, /^playwright==1\.58\.0$/m);
  assert.match(pythonRequirements, /^python-pptx==1\.0\.2$/m);
  assert.match(pythonRequirements, /^Pillow==12\.1\.1$/m);
});

test('native PPT Linux proof environment is documented without adding a desktop-app fallback', () => {
  const dockerfile = readRepoFile('tools/native-ppt-proof/Dockerfile');
  const docs = readRepoFile('docs/native-ppt-proof-environment.md');
  const workflow = readRepoFile('.github/workflows/ci.yml');
  const installScript = readRepoFile('tools/native-ppt-proof/install-deps.sh');
  const runner = readRepoFile('tools/native-ppt-proof/run.sh');

  for (const source of [dockerfile, docs, installScript]) {
    assert.match(source, /libreoffice/);
    assert.match(source, /poppler-utils|Poppler/);
    assert.match(source, /fonts-noto-cjk/);
  }

  assert.match(runner, /LibreOffice\/Poppler/);
  assert.match(runner, /tools\/native-ppt-proof\/install-deps\.sh/);
  assert.match(workflow, /tools\/native-ppt-proof\/run\.sh --output-dir artifacts\/native-ppt-proof/);
  assert.match(installScript, /brew install --cask libreoffice/);
  assert.match(installScript, /brew install poppler/);
  assert.match(installScript, /apt-get install -y libreoffice poppler-utils fonts-noto-cjk/);
  assert.match(runner, /tools\/native-ppt-proof\/install-deps\.sh/);
  assert.match(runner, /redcube_ai\.native_helpers\.doctor/);
  assert.match(runner, /redcube_ai\.native_helpers\.ppt_deck\.native/);
  assert.match(runner, /native-helper-output\.json/);
  assert.match(runner, /proof-summary\.json/);
  assert.match(runner, /artifact-index\.json/);
  assert.match(runner, /build-artifact-index\.py/);
  assert.match(runner, /suite_id"\)\s*==\s*"data_charts"|suite_id/);
  assert.match(runner, /synthetic preview/);
  assert.match(dockerfile, /COPY \.github\/requirements\/ci-python\.txt/);
  assert.match(dockerfile, /python3 -m pip install .*\/tmp\/redcube-ci-python\.txt/);
  assert.match(docs, /tools\/native-ppt-proof\/install-deps\.sh/);
  assert.match(docs, /tools\/native-ppt-proof\/run\.sh/);
  assert.match(docs, /npm ci/);
  assert.match(docs, /python3? -m redcube_ai\.native_helpers\.doctor/);
  for (const source of [dockerfile, runner]) {
    assert.doesNotMatch(source, new RegExp(['powerpoint', '_applescript'].join(''), 'i'));
    assert.doesNotMatch(source, new RegExp(['osa', 'script'].join(''), 'i'));
  }
  assert.match(docs, /does not replace RedCube product-entry/);
});

test('native PPT proof V2 contract is ready for opt-in CI triggers and cache policy', () => {
  const contract = readRepoJson('tools/native-ppt-proof/ci-contract.json');
  const runner = readRepoFile('tools/native-ppt-proof/run.sh');
  const workflow = readRepoFile('.github/workflows/ci.yml');

  assert.equal(contract.schema_version, 'native_ppt_proof_ci_contract.v2');
  assert.equal(contract.default_quality_lane.runs_true_renderer, false);
  assert.deepEqual(contract.default_quality_lane.required_workflow_events, ['push', 'pull_request']);
  assert.equal(contract.proof_job.required_triggers.manual, 'workflow_dispatch');
  assert.equal(contract.proof_job.required_triggers.nightly.event, 'schedule');
  assert.match(contract.proof_job.required_triggers.nightly.cron, /^\d+ \d+ \* \* \*$/);
  assert.equal(contract.proof_job.required_triggers.pull_request_label.label, 'native-ppt-proof');
  assert.deepEqual(
    contract.proof_job.required_triggers.pull_request_label.types,
    ['labeled', 'synchronize', 'opened', 'reopened'],
  );
  assert.deepEqual(
    contract.proof_job.required_cache_layers.map((layer) => layer.id),
    ['npm', 'pip', 'playwright'],
  );
  assert.equal(contract.proof_job.artifact_index.path, 'artifacts/native-ppt-proof/artifact-index.json');
  assert.equal(contract.proof_job.artifact_index.schema_version, 'native_ppt_proof_artifact_index.v2');
  assert.match(workflow, /github\.event_name == 'schedule'/);
  assert.match(workflow, /contains\(github\.event\.pull_request\.labels\.\*\.name, 'native-ppt-proof'\)/);
  assert.match(workflow, /native-ppt-proof-pip-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('\.github\/requirements\/ci-python\.txt'\) \}\}/);
  assert.match(workflow, /native-ppt-proof-playwright-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('\.github\/requirements\/ci-python\.txt'\) \}\}/);
  assert.match(runner, /artifact-index\.json/);
  assert.match(runner, /build-artifact-index\.py/);
  assert.doesNotMatch(
    workflow,
    /quality:\n[\s\S]*?tools\/native-ppt-proof\/run\.sh[\s\S]*?Run family tests/,
  );
});

test('Sentrux advisory publishes OPL quality details without changing the default quality lane', () => {
  const workflow = readRepoFile('.github/workflows/sentrux-advisory.yml');

  assert.match(workflow, /uses:\s*actions\/checkout@v6\b[\s\S]*?fetch-depth:\s*0\b/);
  assert.match(workflow, /git fetch --no-tags --prune origin main:refs\/remotes\/origin\/main/);
  assert.match(workflow, /\bsentrux gate \./);
  assert.match(workflow, /\bsentrux check \./);
  assert.match(workflow, /uses:\s*gaofeng21cn\/one-person-lab\/\.github\/actions\/quality-details@main\b/);
  assert.match(workflow, /compare-ref:\s*origin\/main\b/);
  assert.match(
    workflow,
    /limit:\s*['"]20['"]/
  );
  assert.match(
    workflow,
    /json-limit:\s*['"]50['"]/
  );
  assert.match(workflow, /uses:\s*actions\/upload-artifact@v6\b/);
  assert.match(workflow, /name:\s*opl-quality-details\b/);
  assert.match(workflow, /path:\s*artifacts\/opl-quality-details\/quality-details\.json\b/);

  const verify = readRepoFile('scripts/verify.sh');
  assert.match(verify, /smoke\|fast\)\n\s+npm run test:line-budget\n\s+npm run test:fast/);
  assert.match(verify, /structure\)\n\s+npm run test:line-budget\n\s+scripts\/run-structural-quality-gate\.sh/);
  assert.doesNotMatch(verify, /quality details|sentrux-advisory|opl-quality-details/);

  const structuralGate = readRepoFile('scripts/run-structural-quality-gate.sh');
  assert.match(structuralGate, /\bsentrux gate \./);
  assert.match(structuralGate, /\bsentrux check \./);
  assert.match(structuralGate, /scripts\/run-opl-quality-details\.sh/);
  assert.match(structuralGate, /exit "\$sentrux_status"/);

  const qualityDetails = readRepoFile('scripts/run-opl-quality-details.sh');
  assert.match(qualityDetails, /compare_ref="\$\{OPL_QUALITY_DETAILS_COMPARE_REF:-origin\/main\}"/);
  assert.match(qualityDetails, /OPL_QUALITY_DETAILS_BIN:-\/Users\/gaofeng\/workspace\/one-person-lab\/bin\/opl/);
  assert.match(qualityDetails, /--compare-ref "\$compare_ref"/);
});

test('repo-local family pin wrapper is the only allowed direct upstream family helper entrypoint', () => {
  const allowedFiles = new Set(['scripts/run-test-group-lib.ts']);
  const disallowedDirectImports = [];
  const upstreamFamilyHelperImportPattern = /\bfrom\s+['"]opl-gateway-shared\/family-shared-release['"]|\bimport\s*\(\s*['"]opl-gateway-shared\/family-shared-release['"]\s*\)/;
  const sharedOwnerContractPathPattern = /['"]contracts\/family-release\/shared-owner-release\.json['"]/;

  for (const file of [...listRepoFiles('scripts'), ...listRepoFiles('tests')]) {
    if (!/\.(?:ts|js|mjs|cjs)$/.test(file) || allowedFiles.has(file)) {
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
