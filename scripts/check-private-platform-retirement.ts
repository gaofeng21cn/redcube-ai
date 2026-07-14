import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs as parseNodeArgs } from 'node:util';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const RETIRED_SOURCE_ROOTS = Object.freeze([
  'apps/redcube-cli',
  'packages/redcube-domain-entry',
  'packages/redcube-governance',
  'packages/redcube-overlay-core',
  'packages/redcube-runtime',
  'packages/redcube-runtime-protocol',
]);
const ACTIVE_MACHINE_SURFACES = Object.freeze([
  'package.json',
  'tsconfig.json',
  'contracts/opl_agent_package_manifest.json',
  'contracts/opl_domain_manifest_registration.json',
  'contracts/standard_agent_interface.json',
]);
const RETIRED_RUNTIME_TOKENS = Object.freeze([
  '@redcube/domain-entry',
  '@redcube/governance',
  '@redcube/overlay-core',
  '@redcube/runtime',
  '@redcube/runtime-protocol',
  'apps/redcube-cli',
  'redcube domain-handler dispatch',
]);

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.resolve(REPO_ROOT, relativePath), 'utf8')) as Record<string, unknown>;
}

function nestedObject(value: unknown, key: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const nested = (value as Record<string, unknown>)[key];
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : {};
}

export function buildPrivatePlatformSourceGuardReadback() {
  const failures: Array<Record<string, unknown>> = [];
  const presentRetiredRoots = RETIRED_SOURCE_ROOTS.filter((relativePath) =>
    existsSync(path.resolve(REPO_ROOT, relativePath)));
  for (const relativePath of presentRetiredRoots) {
    failures.push({ check_id: 'retired_private_source_absent', source_ref: relativePath });
  }

  const tokenViolations: Array<{ source_ref: string; token: string }> = [];
  for (const sourceRef of ACTIVE_MACHINE_SURFACES) {
    const text = readFileSync(path.resolve(REPO_ROOT, sourceRef), 'utf8');
    for (const token of RETIRED_RUNTIME_TOKENS) {
      if (text.includes(token)) tokenViolations.push({ source_ref: sourceRef, token });
    }
  }
  for (const violation of tokenViolations) {
    failures.push({ check_id: 'retired_private_runtime_token_absent', ...violation });
  }

  const interfaceContract = readJson('contracts/standard_agent_interface.json');
  const standardInterface = nestedObject(interfaceContract, 'standard_agent_interface');
  const workspaceBinding = nestedObject(standardInterface, 'workspace_binding');
  const runtime = nestedObject(standardInterface, 'runtime');
  for (const field of ['entry_command_template', 'manifest_command_template']) {
    if (field in workspaceBinding) {
      failures.push({ check_id: 'hosted_runtime_owns_command_templates', field });
    }
  }
  if ('dispatch_command' in runtime) {
    failures.push({ check_id: 'hosted_runtime_owns_dispatch_command', field: 'dispatch_command' });
  }

  const audit = readJson('contracts/functional_privatization_audit.json');
  const forbiddenFlags = nestedObject(audit, 'forbidden_generic_owner_flags');
  for (const [key, value] of Object.entries(forbiddenFlags)) {
    if (value !== false) failures.push({ check_id: 'forbidden_generic_owner_flag', key, value });
  }

  return {
    surface_kind: 'rca_private_platform_source_guard_summary',
    schema_version: 3,
    target_domain_id: 'redcube-ai',
    state: failures.length === 0 ? 'passed_repo_source_guard_only' : 'failed',
    failed_checks: failures,
    guard_summary: {
      retired_source_root_count: RETIRED_SOURCE_ROOTS.length,
      present_retired_source_root_count: presentRetiredRoots.length,
      retired_runtime_token_violation_count: tokenViolations.length,
      hosted_runtime_command_template_count: [
        workspaceBinding.entry_command_template,
        workspaceBinding.manifest_command_template,
        runtime.dispatch_command,
      ].filter((value) => value !== undefined).length,
      retained_domain_surface_roots: [
        'agent/',
        'contracts/',
        'python/redcube_ai/native_helpers/',
        'plugins/redcube-ai/',
      ],
    },
    authority_boundary: {
      readback_can_write_visual_truth: false,
      readback_can_write_artifact_blob: false,
      readback_can_write_memory_body: false,
      readback_can_issue_review_or_export_verdict: false,
      readback_can_sign_owner_receipt: false,
      readback_can_authorize_physical_delete: false,
      readback_can_claim_domain_ready: false,
      readback_can_claim_production_ready: false,
    },
  };
}

function parseArgs(argv: string[]) {
  const parsed = parseNodeArgs({
    args: argv,
    allowPositionals: false,
    options: { format: { type: 'string', default: 'text' } },
  });
  if (!['json', 'text'].includes(parsed.values.format ?? '')) {
    throw new Error('--format must be json or text');
  }
  return { format: parsed.values.format };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { format } = parseArgs(process.argv.slice(2));
    const payload = buildPrivatePlatformSourceGuardReadback();
    process.stdout.write(format === 'json'
      ? `${JSON.stringify(payload, null, 2)}\n`
      : `${payload.surface_kind}: ${payload.state} (${payload.failed_checks.length} failed checks)\n`);
    process.exitCode = payload.state === 'passed_repo_source_guard_only' ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
