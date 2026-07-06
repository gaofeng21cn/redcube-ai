import { parseArgs as parseNodeArgs } from 'node:util';

import type { CliOptionsMap } from './types.js';

export function parseArgs(argv: string[]): CliOptionsMap {
  const options: CliOptionsMap = {};
  const { tokens } = parseNodeArgs({
    args: argv,
    strict: false,
    allowPositionals: true,
    tokens: true,
  });

  for (const token of tokens || []) {
    if (token.kind !== 'option' || !token.rawName.startsWith('--')) continue;

    const key = token.name;
    const next = argv[token.index + 1];

    options[toCamel(key)] = token.inlineValue
      ? token.value
      : (!next || next.startsWith('--') ? true : next);
  }

  return options;
}

function toCamel(name: string): string {
  return name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
}

export function resolveWorkspaceRoot(options: CliOptionsMap, cwd = process.cwd): string {
  return options.workspaceRoot || options.rootDir || cwd();
}
