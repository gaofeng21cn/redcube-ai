import type { CliOptionsMap } from './types.js';

export function parseArgs(argv: string[]): CliOptionsMap {
  const options: CliOptionsMap = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      options[toCamel(key)] = true;
      continue;
    }

    options[toCamel(key)] = next;
    i += 1;
  }

  return options;
}

function toCamel(name: string): string {
  return name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
}

export function resolveWorkspaceRoot(options: CliOptionsMap, cwd = process.cwd): string {
  return options.workspaceRoot || options.rootDir || cwd();
}
