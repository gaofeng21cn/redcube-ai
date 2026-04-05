import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = process.cwd();

function readRepoFile(...segments) {
  return readFileSync(path.join(repoRoot, ...segments), 'utf-8');
}

test('public entry readmes expose bilingual switch and zh-CN mirrors', () => {
  assert.equal(existsSync(path.join(repoRoot, 'README.zh-CN.md')), true);
  assert.equal(existsSync(path.join(repoRoot, 'docs', 'README.zh-CN.md')), true);

  const rootEn = readRepoFile('README.md');
  const rootZh = readRepoFile('README.zh-CN.md');
  const docsEn = readRepoFile('docs', 'README.md');
  const docsZh = readRepoFile('docs', 'README.zh-CN.md');

  assert.match(rootEn, /<a href="\.\/README\.md"><strong>English<\/strong><\/a>\s*\|\s*<a href="\.\/README\.zh-CN\.md">中文<\/a>/);
  assert.match(rootZh, /<a href="\.\/README\.md">English<\/a>\s*\|\s*<a href="\.\/README\.zh-CN\.md"><strong>中文<\/strong><\/a>/);

  assert.match(docsEn, /\*\*English\*\*\s*\|\s*\[中文\]\(\.\/README\.zh-CN\.md\)/);
  assert.match(docsZh, /\[English\]\(\.\/README\.md\)\s*\|\s*\*\*中文\*\*/);
});
