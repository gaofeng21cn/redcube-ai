import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf-8');
}

test('CI workflow pins reproducible toolchain and visual review dependencies', () => {
  assert.equal(existsSync(path.join(repoRoot, '.nvmrc')), true);
  assert.equal(existsSync(path.join(repoRoot, 'package-lock.json')), true);
  assert.equal(existsSync(path.join(repoRoot, '.github', 'requirements', 'ci-python.txt')), true);

  const workflow = readRepoFile('.github/workflows/ci.yml');
  assert.match(workflow, /uses:\s*actions\/checkout@v6\b/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v6\b/);
  assert.match(workflow, /node-version-file:\s*['"]?\.nvmrc['"]?/);
  assert.match(workflow, /cache:\s*['"]?npm['"]?/);
  assert.match(workflow, /\brun:\s*npm ci\b/);
  assert.match(workflow, /uses:\s*actions\/setup-python@v6\b/);
  assert.match(workflow, /python-version:\s*['"]3\.12['"]/);
  assert.match(workflow, /sudo apt-get update/);
  assert.match(workflow, /fonts-noto-cjk/);
  assert.match(workflow, /python3 -m pip install -r \.github\/requirements\/ci-python\.txt/);
  assert.match(workflow, /python3 -m playwright install --with-deps chromium/);

  const pythonRequirements = readRepoFile('.github/requirements/ci-python.txt');
  assert.match(pythonRequirements, /^playwright==1\.58\.0$/m);
  assert.match(pythonRequirements, /^python-pptx==1\.0\.2$/m);
  assert.match(pythonRequirements, /^Pillow==12\.1\.1$/m);
});

test('render shells prefer a deterministic CJK font before platform fallbacks', () => {
  const xiaohongshuShell = readRepoFile('prompts/xiaohongshu/render_shell.html');
  const pptShell = readRepoFile('prompts/ppt_deck/render_shell.html');

  assert.match(
    xiaohongshuShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
  assert.match(
    pptShell,
    /font-family:\s*'Noto Sans CJK SC',\s*'Noto Sans SC',\s*-apple-system,\s*BlinkMacSystemFont,\s*'PingFang SC',\s*'Microsoft YaHei',\s*sans-serif;/
  );
});
