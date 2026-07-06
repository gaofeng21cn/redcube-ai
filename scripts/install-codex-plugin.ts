#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs as parseNodeArgs } from 'node:util';

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
  let parsed;
  try {
    parsed = parseNodeArgs({
      args: argv,
      allowPositionals: false,
      options: {
        'repo-root': { type: 'string' },
        home: { type: 'string' },
        'skip-tools': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
  const values = parsed.values;
  if (values.help) {
      usage();
  }
  const home = values.home ?? process.env.HOME ?? '';
  if (!home) {
    fail('HOME is required when --home is not provided');
  }
  return {
    repoRoot: path.resolve(values['repo-root'] ?? DEFAULT_REPO_ROOT),
    home: path.resolve(home),
    skipTools: values['skip-tools'] === true,
  };
}

function resolveTrackedPluginRoot(repoRoot: string): string {
  return path.join(repoRoot, 'plugins', 'redcube-ai');
}

function resolveTrackedSkillRoot(pluginRoot: string): string {
  return path.join(pluginRoot, 'skills', 'redcube-ai');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const pluginRoot = resolveTrackedPluginRoot(args.repoRoot);
  const skillRoot = resolveTrackedSkillRoot(pluginRoot);
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
    fail(`missing RedCube AI skill entry: ${skillEntryPath}`);
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
