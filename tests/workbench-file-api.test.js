import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { handleApiRequest } from '../apps/redcube-web/src/api.js';

function write(file, content = '') {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

test('GetWorkbenchFile returns text file contents', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-file-'));
  const filePath = path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', '01_单篇策划.md');
  write(filePath, '# 单篇策划');

  const result = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetWorkbenchFile',
    query: {
      workspaceRoot: rootDir,
      filePath,
    },
    body: {},
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.kind, 'text');
  assert.equal(result.payload.content, '# 单篇策划');
});

test('SaveWorkbenchFile writes updated text content inside workspace root', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-file-'));
  const filePath = path.join(rootDir, 'input', '主题A', 'source_material.md');
  write(filePath, '# 旧材料');

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveWorkbenchFile',
    query: {},
    body: {
      workspaceRoot: rootDir,
      filePath,
      content: '# 新材料',
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(readFileSync(filePath, 'utf-8'), '# 新材料');
});

test('UploadWorkbenchFile creates a new file from base64 content under topic input dir', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-file-'));
  const dirPath = path.join(rootDir, 'input', '主题A');
  mkdirSync(dirPath, { recursive: true });

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/UploadWorkbenchFile',
    query: {},
    body: {
      workspaceRoot: rootDir,
      dirPath,
      fileName: 'upload.txt',
      base64Content: Buffer.from('上传后的内容', 'utf-8').toString('base64'),
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(readFileSync(path.join(dirPath, 'upload.txt'), 'utf-8'), '上传后的内容');
});
