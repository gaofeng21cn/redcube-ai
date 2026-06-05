#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

type ParsedArgs = {
  repoRoot: string;
  home: string;
  skipTools: boolean;
};

function fail(message: string): never {
  process.stderr.write(`redcube codex installer error: ${message}\n`);
  process.exit(1);
}

function usage(): never {
  process.stderr.write('Usage: install-codex-plugin.ts [--repo-root /abs/path/to/repo] [--home /abs/path/to/home] [--skip-tools]\n');
  process.exit(0);
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    repoRoot: DEFAULT_REPO_ROOT,
    home: process.env.HOME ?? '',
    skipTools: false,
  };

  for (let index = 0; index < argv.length;) {
    const arg = argv[index];
    if (arg === '--repo-root') {
      const value = argv[index + 1];
      if (!value) fail('--repo-root requires a value');
      parsed.repoRoot = value;
      index += 2;
      continue;
    }
    if (arg === '--home') {
      const value = argv[index + 1];
      if (!value) fail('--home requires a value');
      parsed.home = value;
      index += 2;
      continue;
    }
    if (arg === '--skip-tools') {
      parsed.skipTools = true;
      index += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      usage();
    }
    fail(`unknown argument: ${arg}`);
  }

  if (!parsed.home) {
    fail('HOME is required when --home is not provided');
  }
  return {
    repoRoot: path.resolve(parsed.repoRoot),
    home: path.resolve(parsed.home),
    skipTools: parsed.skipTools,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const pluginRoot = path.join(args.repoRoot, 'plugins', 'rca');
  const skillRoot = path.join(pluginRoot, 'skills', 'rca');
  const devSourceManifestPath = path.join(args.repoRoot, '.codex-plugin', 'plugin.json');
  const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
  const skillEntryPath = path.join(skillRoot, 'SKILL.md');

  if (!fs.existsSync(devSourceManifestPath)) {
    fail(`missing repository-root Codex plugin manifest: ${devSourceManifestPath}`);
  }
  if (!fs.existsSync(pluginManifestPath)) {
    fail(`missing Codex plugin manifest: ${pluginManifestPath}`);
  }
  if (!fs.existsSync(skillEntryPath)) {
    fail(`missing RCA skill entry: ${skillEntryPath}`);
  }

  const marketplacePath = path.join(args.repoRoot, '.agents', 'plugins', 'marketplace.json');
  let repoLocalMarketplaceRemoved = false;
  if (fs.existsSync(marketplacePath)) {
    const stat = fs.lstatSync(marketplacePath);
    if (stat.isDirectory()) {
      fail(`refusing to remove marketplace directory: ${marketplacePath}`);
    }
    fs.unlinkSync(marketplacePath);
    repoLocalMarketplaceRemoved = true;
  }

  if (args.skipTools) {
    process.stderr.write('checked RedCube AI tracked Codex plugin source and retired repo-local marketplace metadata (skip-tools)\n');
  } else {
    process.stderr.write('RedCube AI CLI tools are provided by the repo-local npm launcher; Codex marketplace registration is owned by the OPL wrapper.\n');
  }

  process.stdout.write(`${JSON.stringify({
    repo_root: args.repoRoot,
    home: args.home,
    dev_source_root: args.repoRoot,
    dev_source_manifest: devSourceManifestPath,
    plugin_root: pluginRoot,
    skill_root: skillRoot,
    marketplace_path: marketplacePath,
    repo_local_marketplace_written: 'false',
    repo_local_marketplace_removed: repoLocalMarketplaceRemoved ? 'true' : 'false',
    codex_marketplace_owner: 'opl_owned_wrapper',
  }, null, 2)}\n`);
}

main();
