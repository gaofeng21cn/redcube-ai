import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { handleApiRequest } from '../apps/redcube-web/src/api.js';

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

test('web api ListProjects works without binding a network port', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-web-'));
  mkdirSync(path.join(root, 'projects', 'web-project', 'inputs', 'raw_materials'), { recursive: true });

  const result = await handleApiRequest({
    method: 'GET',
    pathname: '/api/ListProjects',
    query: {},
    body: {},
    defaultRootDir: root,
  });

  assert.equal(result.status, 200);
  assert.ok(Array.isArray(result.payload.projects));
  assert.ok(result.payload.projects.includes('web-project'));
});

test('web api CreateProject creates project and appears in list', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-web-'));

  const created = await handleApiRequest({
    method: 'POST',
    pathname: '/api/CreateProject',
    query: {},
    body: {
      project: 'created-from-web',
    },
    defaultRootDir: root,
  });

  assert.equal(created.status, 200);
  assert.equal(created.payload.ok, true);

  const listed = await handleApiRequest({
    method: 'GET',
    pathname: '/api/ListProjects',
    query: {},
    body: {},
    defaultRootDir: root,
  });

  assert.equal(listed.status, 200);
  assert.ok(listed.payload.projects.includes('created-from-web'));
});

test('web api StorylinePromptFiles returns selectable prompt filenames', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-web-'));

  const result = await handleApiRequest({
    method: 'GET',
    pathname: '/api/StorylinePromptFiles',
    query: {},
    body: {},
    defaultRootDir: root,
  });

  assert.equal(result.status, 200);
  const files = result.payload.files.map((item) => item.fileName);
  assert.ok(files.includes('medical_deep.md'));
  assert.ok(files.includes('medical_traffic.md'));
});

test('web api GetRuntimeConfig exposes resolved directories from local runtime config', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-web-'));
  const configuredRootDir = path.join(root, 'runtime-root');
  const configuredWorkspaceRoot = path.join(root, 'runtime-workspace');
  const configuredPromptsDir = path.join(root, 'runtime-prompts');
  writeJson(path.join(root, 'config', 'local', 'runtime.json'), {
    rootDir: configuredRootDir,
    workspaceRoot: configuredWorkspaceRoot,
    promptsDir: configuredPromptsDir,
  });

  const result = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetRuntimeConfig',
    query: {},
    body: {},
    defaultRootDir: root,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.rootDir, configuredRootDir);
  assert.equal(result.payload.workspaceRoot, configuredWorkspaceRoot);
  assert.equal(result.payload.promptsDir, configuredPromptsDir);
});

test('web api GenerateSeriesToc and GenerateStoryline write project inputs', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-web-'));
  const project = 'web-input-project';
  const rawDir = path.join(root, 'projects', project, 'inputs', 'raw_materials');
  mkdirSync(rawDir, { recursive: true });
  writeFileSync(path.join(rawDir, 'source.md'), '内分泌总论\\n\\n# 甲状腺\\n# 垂体\\n# 肾上腺', 'utf-8');

  const toc = await handleApiRequest({
    method: 'POST',
    pathname: '/api/GenerateSeriesToc',
    query: {},
    body: { project, noteMode: 'auto' },
    defaultRootDir: root,
  });
  assert.equal(toc.status, 200);
  assert.equal(toc.payload.ok, true);
  assert.ok(existsSync(path.join(root, 'projects', project, 'inputs', 'series_toc.md')));

  const storyline = await handleApiRequest({
    method: 'POST',
    pathname: '/api/GenerateStoryline',
    query: {},
    body: { project, promptFile: 'medical_deep.md' },
    defaultRootDir: root,
  });
  assert.equal(storyline.status, 200);
  assert.equal(storyline.payload.ok, true);
  assert.equal(storyline.payload.promptFile, 'medical_deep.md');
  const content = readFileSync(path.join(root, 'projects', project, 'inputs', 'storyline_logic.md'), 'utf-8');
  assert.ok(content.includes('叙事逻辑'));
});
