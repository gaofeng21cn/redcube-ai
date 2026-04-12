import process from 'node:process';

import {
  probeHermesAgentUpstream,
  readHermesAgentUpstreamConfig,
} from '../packages/redcube-hermes-agent-client/src/index.js';

function printUsage() {
  process.stdout.write([
    '用法: node scripts/probe-upstream-hermes-agent.mjs [--json] [--require-run-surface]',
    '环境变量:',
    '  REDCUBE_HERMES_UPSTREAM_BASE_URL',
    '  REDCUBE_HERMES_UPSTREAM_API_KEY',
    '  REDCUBE_HERMES_UPSTREAM_MODEL',
  ].join('\n'));
}

const args = new Set(process.argv.slice(2));

if (args.has('--help')) {
  printUsage();
  process.exit(0);
}

const outputJson = args.has('--json');
const requireRunSurface = args.has('--require-run-surface');

try {
  const config = readHermesAgentUpstreamConfig();
  const result = await probeHermesAgentUpstream({
    config,
    requireRunSurface,
  });

  if (outputJson) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write([
      `status: ${result.status}`,
      `runtime_owner: ${result.runtime_owner}`,
      `base_url: ${result.config.base_url}`,
      `model_name: ${result.config.model_name}`,
      `health: ${result.steps.health.detail}`,
      `models: ${result.steps.models.detail}`,
      result.steps.run_surface
        ? `run_surface: ${result.steps.run_surface.detail}`
        : 'run_surface: skipped',
    ].join('\n'));
    process.stdout.write('\n');
  }

  process.exit(result.ok ? 0 : 2);
} catch (error) {
  const failure = {
    ok: false,
    status: 'blocked',
    runtime_owner: 'upstream_hermes_agent',
    error_kind: 'upstream_probe_misconfigured',
    blocking_reason: error instanceof Error ? error.message : String(error),
  };
  if (outputJson) {
    process.stdout.write(`${JSON.stringify(failure, null, 2)}\n`);
  } else {
    process.stderr.write(`probe failed: ${failure.blocking_reason}\n`);
  }
  process.exit(2);
}
