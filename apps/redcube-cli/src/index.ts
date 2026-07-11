export { executeCli, getCliDomainActions, main, runCli } from './cli-parts/dispatch.js';
export { buildCommandHelp, buildHelp } from './cli-parts/help.js';
export { parseArgs, resolveWorkspaceRoot } from './cli-parts/options.js';

export type {
  CliDependencies,
  CliDomainActions,
  CliHelpSurface,
  CliOptions,
  CliRunResult,
  CliRunSurface,
} from './types.js';
