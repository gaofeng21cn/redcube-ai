import { executeCli } from './dispatch.js';
import { buildCliJsonSummary } from './json-summary.js';
import { parseArgs } from './options.js';
import { printJson } from './output.js';
import type { CliDependenciesMap, JsonMap } from './types.js';

function shouldPrintSummary(argv: string[]): boolean {
  const options = parseArgs(argv);
  return options.jsonSummary === true || options.quiet === true;
}

export async function runCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  const result = await executeCli(argv, deps);
  const printer = deps.printJson || printJson;
  printer(shouldPrintSummary(argv) ? buildCliJsonSummary(result) : result);
  return result;
}

export async function main(argv = process.argv.slice(2), deps: CliDependenciesMap = {}): Promise<JsonMap> {
  return runCli(argv, deps);
}
