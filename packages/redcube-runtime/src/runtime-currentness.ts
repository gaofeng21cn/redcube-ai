import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type JsonRecord = Record<string, any>;

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
let cachedReceipt: JsonRecord | null = null;

function readJson(file: string): JsonRecord {
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
  } catch {
    return {};
  }
}

function commandVersion(command: string, envOverride: string): string | null {
  const overridden = String(process.env[envOverride] || '').trim();
  if (overridden) return overridden;
  const binary = String(command || '').trim();
  if (!binary) return null;
  const result = spawnSync(binary, ['--version'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    timeout: 5000,
  });
  if (result.status !== 0) return null;
  return String(result.stdout || result.stderr || '').trim() || null;
}

function sourceRevision(): string | null {
  const overridden = String(
    process.env.REDCUBE_SOURCE_REVISION || process.env.GIT_COMMIT || '',
  ).trim();
  if (overridden) return overridden;
  const result = spawnSync('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD'], {
    encoding: 'utf-8',
    timeout: 5000,
  });
  return result.status === 0 ? String(result.stdout || '').trim() || null : null;
}

function codexBinary(): string {
  const configured = String(process.env.REDCUBE_CODEX_COMMAND || '').trim();
  if (!configured) return 'codex';
  if (!configured.startsWith('[')) return configured;
  try {
    const parsed = JSON.parse(configured);
    return Array.isArray(parsed) ? String(parsed[0] || 'codex') : 'codex';
  } catch {
    return 'codex';
  }
}

export function runtimeCurrentnessReceipt(): JsonRecord {
  if (cachedReceipt) return cachedReceipt;
  const rootPackage = readJson(`${REPO_ROOT}/package.json`);
  const pluginManifest = readJson(`${REPO_ROOT}/plugins/redcube-ai/.codex-plugin/plugin.json`);
  const receipt = {
    surface_kind: 'rca_runtime_currentness_receipt',
    schema_version: 1,
    source_revision: sourceRevision(),
    rca_version: String(rootPackage.version || '').trim() || null,
    plugin_version: String(pluginManifest.version || '').trim() || null,
    codex_version: commandVersion(codexBinary(), 'REDCUBE_CODEX_VERSION'),
    officecli_version: commandVersion(
      String(process.env.REDCUBE_OFFICECLI_COMMAND || 'officecli'),
      'REDCUBE_OFFICECLI_VERSION',
    ),
  };
  cachedReceipt = {
    ...receipt,
    status: Object.entries(receipt)
      .filter(([key]) => !['surface_kind', 'schema_version'].includes(key))
      .every(([, value]) => Boolean(value))
      ? 'complete'
      : 'partial_non_blocking',
    blocks_stage_transition: false,
  };
  return cachedReceipt;
}
