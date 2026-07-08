// @ts-nocheck
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ACTIVE_ROOTS = [
  'agent',
  'apps',
  'packages',
  'contracts',
  'plugins',
  'scripts',
  'tests',
  'tools',
  'python',
];
export const TEXT_EXTENSIONS = new Set([
  '.md',
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.py',
  '.sh',
  '.yaml',
  '.yml',
]);
export function listTextFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('__closeout-audit-test')) return [];
      if (entry.name === 'dist' || entry.name === 'build' || entry.name === 'node_modules') return [];
      return listTextFiles(file);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

export function normalizePath(value) {
  return value.split(path.sep).join('/');
}

export function activeShellScripts() {
  return ACTIVE_ROOTS.flatMap((root) => {
    const rootPath = path.resolve(root);
    if (!existsSync(rootPath)) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })
    .filter((file) => path.extname(file) === '.sh')
    .map(normalizePath)
    .sort();
}

export function sourceRefPath(sourceRef) {
  return String(sourceRef).split('#')[0];
}

export function sourceRefCoversFile(sourceRef, file) {
  const sourcePath = sourceRefPath(sourceRef);
  if (sourcePath.endsWith('/')) {
    return file.startsWith(sourcePath);
  }
  return file === sourcePath || file.startsWith(`${sourcePath}/`);
}

export function assertRepoRefResolves(sourceRef, label) {
  const [sourcePath, anchor] = String(sourceRef).split('#');
  assert.equal(
    sourcePath !== '' && sourcePath === normalizePath(sourcePath) && !path.isAbsolute(sourcePath)
      && !sourcePath.startsWith('../') && !sourcePath.includes('/../') && !/^[a-z][a-z0-9+.-]*:/i.test(sourcePath),
    true,
    `${label}: ${sourceRef}`,
  );
  const fullPath = path.resolve(sourcePath);
  assert.equal(existsSync(fullPath), true, `${label}: ${sourceRef}`);
  if (!anchor) return;
  const text = readFileSync(fullPath, 'utf-8');
  assert.equal(text.includes(anchor), true, `${label}: ${sourceRef}`);
}
