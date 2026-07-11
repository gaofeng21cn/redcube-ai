import path from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

export const repoRoot = process.cwd();

export function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf-8');
}

export function readRepoJson(relativePath) {
  return JSON.parse(readRepoFile(relativePath));
}

export function listWorkspacePackageDirs() {
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

export function listRepoFiles(relativeDir) {
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
