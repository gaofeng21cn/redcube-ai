// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');

export const DEFAULT_LIMIT = 1000;
export const BASELINE_ENTRIES = {};
const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.py', '.sh', '.bash', '.zsh', '.rs', '.go']);
const IGNORED_PARTS = new Set(['node_modules', 'dist', 'build', 'coverage', '.venv', '__pycache__']);
const IGNORED_SUFFIXES = ['.min.js'];

export function evaluateLineBudget({
  baselineEntries = BASELINE_ENTRIES,
  exists,
  limit = DEFAULT_LIMIT,
  readFile,
  trackedFiles,
}) {
  const baseline = new Map(Object.entries(baselineEntries));
  const oversize = [];
  const failures = [];
  const lineCounts = new Map();

  for (const relativePath of trackedFiles) {
    if (!isCodeFile(relativePath)) {
      continue;
    }
    if (!exists(relativePath)) {
      continue;
    }
    const lineCount = countLines(readFile(relativePath));
    lineCounts.set(relativePath, lineCount);
    if (lineCount <= limit) {
      continue;
    }
    oversize.push([relativePath, lineCount]);
    const allowed = baseline.get(relativePath);
    if (allowed === undefined) {
      failures.push(`${relativePath}: ${lineCount} lines exceeds ${limit} line budget; split into focused modules or add an explicit reviewed baseline`);
    } else if (lineCount > allowed) {
      failures.push(`${relativePath}: ${lineCount} lines exceeds locked baseline ${allowed}; split before growing this file`);
    }
  }

  oversize.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  for (const relativePath of baseline.keys()) {
    if (!exists(relativePath)) {
      failures.push(`${relativePath}: stale line-budget baseline entry; remove it after deleting or renaming the file`);
      continue;
    }
    if (!lineCounts.has(relativePath)) {
      failures.push(`${relativePath}: stale line-budget baseline entry; file is no longer tracked as a counted code file`);
      continue;
    }
    const lineCount = lineCounts.get(relativePath);
    if (lineCount <= limit) {
      failures.push(`${relativePath}: stale line-budget baseline entry; file is now ${lineCount} lines within the ${limit} line budget; remove the baseline entry`);
    }
  }

  return { failures, oversize };
}

function main() {
  process.chdir(repoRoot);

  const mode = process.argv.includes('--list') ? 'list' : 'check';
  const strict = isStrictLineBudgetMode({
    argv: process.argv,
    env: process.env,
  });

  const trackedFiles = spawnSync('git', ['ls-files'], { encoding: 'utf8' });
  if (trackedFiles.status !== 0) {
    process.stderr.write(trackedFiles.stderr || 'line budget: git ls-files failed\n');
    process.exit(trackedFiles.status ?? 1);
  }

  const result = evaluateLineBudget({
    exists: (relativePath) => fs.existsSync(path.join(repoRoot, relativePath)),
    readFile: (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    trackedFiles: trackedFiles.stdout.split('\n').filter(Boolean),
  });

  if (mode === 'list') {
    for (const [relativePath, lineCount] of result.oversize) {
      process.stdout.write(`${String(lineCount).padStart(6, ' ')} ${relativePath}\n`);
    }
    process.exit(0);
  }

  if (result.failures.length > 0) {
    process.stderr.write(`line budget ${strict ? 'strict check failed' : 'advisory report'} (${result.failures.length} issue${result.failures.length === 1 ? '' : 's'}):\n`);
    process.stderr.write(result.failures.map((failure) => `- ${failure}`).join('\n'));
    process.stderr.write('\n');
    if (!strict) {
      process.stderr.write('line budget advisory only; continuing. Use --strict or OPL_LINE_BUDGET_STRICT=1 for hard enforcement.\n');
    }
    process.exit(lineBudgetExitCode({
      failures: result.failures,
      strict,
    }));
  }
}

function isCodeFile(relativePath) {
  const parts = relativePath.split('/');
  if (parts.some((part) => IGNORED_PARTS.has(part))) {
    return false;
  }
  if (IGNORED_SUFFIXES.some((suffix) => relativePath.endsWith(suffix))) {
    return false;
  }
  return CODE_EXTENSIONS.has(path.extname(relativePath));
}

export function countLines(content) {
  if (content.length === 0) {
    return 0;
  }
  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
}

export function isStrictLineBudgetMode({ argv = [], env = {} } = {}) {
  return argv.includes('--strict') || env.OPL_LINE_BUDGET_STRICT === '1';
}

export function lineBudgetExitCode({ failures, strict }) {
  return failures.length > 0 && strict ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main();
}
