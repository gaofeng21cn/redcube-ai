import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const DEFAULT_WARN_LIMIT = 1000;
const DEFAULT_FAIL_LIMIT = 1500;
const CODE_FILE_PATTERN = /\.(?:cjs|cts|js|jsx|mjs|mts|ts|tsx)$/;

function parseLimit(name, fallback) {
  const value = Number(process.env[name] || '');
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function lineCount(file) {
  const text = readFileSync(file, 'utf8');
  if (text.length === 0) return 0;
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function trackedFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

const warnLimit = parseLimit('REDCUBE_LINE_BUDGET_WARN', DEFAULT_WARN_LIMIT);
const failLimit = parseLimit('REDCUBE_LINE_BUDGET_FAIL', DEFAULT_FAIL_LIMIT);
const oversized = [];
const warnings = [];

for (const file of trackedFiles()) {
  if (!CODE_FILE_PATTERN.test(file)) continue;
  if (!existsSync(file) || !statSync(file).isFile()) continue;
  const lines = lineCount(file);
  const entry = { file, lines };
  if (lines > failLimit) oversized.push(entry);
  else if (lines > warnLimit) warnings.push(entry);
}

for (const entry of warnings.sort((a, b) => b.lines - a.lines || a.file.localeCompare(b.file))) {
  console.error(`[line-budget] warn ${entry.lines} ${entry.file}`);
}

if (oversized.length > 0) {
  console.error(`[line-budget] ${oversized.length} tracked code files exceed ${failLimit} lines:`);
  for (const entry of oversized.sort((a, b) => b.lines - a.lines || a.file.localeCompare(b.file))) {
    console.error(`[line-budget] fail ${entry.lines} ${entry.file}`);
  }
  process.exit(1);
}

console.log(`[line-budget] ok: no tracked code file exceeds ${failLimit} lines`);
