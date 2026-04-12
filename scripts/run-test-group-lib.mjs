export const DEFAULT_HERMES_GATEWAY_COMMAND = 'hermes gateway run -q --replace';

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
