export const DEFAULT_HERMES_GATEWAY_COMMAND = 'hermes gateway run -q --replace';
export const LIVE_UPSTREAM_GROUP_NAMES = new Set(['integration', 'e2e', 'full']);
export { resolveRedCubePythonCommand } from '@redcube/runtime-protocol';

export function readHermesGatewayLaunchConfig(env = process.env) {
  const overrideCommand = env.REDCUBE_HERMES_GATEWAY_COMMAND?.trim();
  if (overrideCommand) {
    return {
      command: overrideCommand,
      usesShell: true,
    };
  }

  return {
    command: DEFAULT_HERMES_GATEWAY_COMMAND,
    usesShell: false,
  };
}

export function buildNodeTestArgs({ groupName, forwardedArgs = [] }) {
  const args = ['--test'];
  if (LIVE_UPSTREAM_GROUP_NAMES.has(groupName)) {
    // Live upstream verification must serialize test files to respect the
    // current Hermes-Agent concurrent-run ceiling instead of fanning out runs.
    args.push('--test-concurrency=1');
  }
  return [...args, ...forwardedArgs];
}
