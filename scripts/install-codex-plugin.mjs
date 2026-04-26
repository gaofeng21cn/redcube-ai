import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PLUGIN_NAME = 'rca';
const MARKETPLACE_NAME = 'rca-local';
const MARKETPLACE_DISPLAY_NAME = 'RedCube AI Local';
const LEGACY_MARKETPLACE_DISPLAY_NAMES = ['RCA Local'];
const PLUGIN_CATEGORY = 'Creative';
const LEGACY_PLUGIN_NAMES = ['redcube-ai'];

function resolveDefaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function usage() {
  process.stdout.write('Usage: node scripts/install-codex-plugin.mjs [--repo-root /abs/path/to/repo] [--home /abs/path/to/home]\n');
}

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {
    repoRoot: resolveDefaultRepoRoot(),
    home: os.homedir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo-root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--repo-root requires a value');
      }
      parsed.repoRoot = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === '--home') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--home requires a value');
      }
      parsed.home = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    throw new Error(`unknown argument: ${arg}`);
  }

  return parsed;
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function ensureExpectedSymlink({ linkPath, targetPath }) {
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) {
      throw new Error(`Refusing to replace existing non-symlink path: ${linkPath}`);
    }
    if (fs.realpathSync(linkPath) !== fs.realpathSync(targetPath)) {
      throw new Error(`Refusing to replace existing symlink with different target: ${linkPath}`);
    }
    return;
  }
  fs.symlinkSync(targetPath, linkPath);
}

function removeLegacySymlink(targetPath) {
  let stat;
  try {
    stat = fs.lstatSync(targetPath);
  } catch {
    return;
  }
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(targetPath);
  }
}

function repoMarketplacePath(repoRoot) {
  return path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');
}

function upsertMarketplace(marketplacePath) {
  const payload = loadJson(marketplacePath);
  const existingPlugins = Array.isArray(payload.plugins) ? payload.plugins.filter((item) => item && typeof item === 'object') : [];
  const pluginEntry = {
    name: PLUGIN_NAME,
    source: {
      source: 'local',
      path: `./plugins/${PLUGIN_NAME}`,
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: PLUGIN_CATEGORY,
  };

  let replaced = false;
  const plugins = existingPlugins.map((item) => {
    if (LEGACY_PLUGIN_NAMES.includes(item.name)) {
      return null;
    }
    if (item.name === PLUGIN_NAME) {
      replaced = true;
      return pluginEntry;
    }
    return item;
  }).filter(Boolean);
  if (!replaced) {
    plugins.push(pluginEntry);
  }

  const interfaceConfig = payload.interface && typeof payload.interface === 'object' && !Array.isArray(payload.interface)
    ? payload.interface
    : {};
  if (!interfaceConfig.displayName || LEGACY_MARKETPLACE_DISPLAY_NAMES.includes(interfaceConfig.displayName)) {
    interfaceConfig.displayName = MARKETPLACE_DISPLAY_NAME;
  }

  writeJson(marketplacePath, {
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name : MARKETPLACE_NAME,
    interface: interfaceConfig,
    plugins,
  });
}

function installCodexPlugin({ repoRoot, home }) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const resolvedHome = path.resolve(home);
  const repoPluginRoot = path.join(resolvedRepoRoot, 'plugins', PLUGIN_NAME);
  const repoSkillRoot = path.join(repoPluginRoot, 'skills', PLUGIN_NAME);

  if (!fs.existsSync(repoPluginRoot) || !fs.statSync(repoPluginRoot).isDirectory()) {
    throw new Error(`Plugin root not found: ${repoPluginRoot}`);
  }
  if (!fs.existsSync(repoSkillRoot) || !fs.statSync(repoSkillRoot).isDirectory()) {
    throw new Error(`Plugin skill root not found: ${repoSkillRoot}`);
  }

  const userPluginRoot = path.join(resolvedHome, 'plugins', PLUGIN_NAME);
  const userSkillRoot = path.join(resolvedHome, '.agents', 'skills', PLUGIN_NAME);
  const marketplacePath = repoMarketplacePath(resolvedRepoRoot);

  for (const legacyName of LEGACY_PLUGIN_NAMES) {
    removeLegacySymlink(path.join(resolvedHome, 'plugins', legacyName));
    removeLegacySymlink(path.join(resolvedHome, '.agents', 'skills', legacyName));
  }

  removeLegacySymlink(userPluginRoot);
  removeLegacySymlink(userSkillRoot);

  upsertMarketplace(marketplacePath);

  return {
    ok: true,
    plugin_name: PLUGIN_NAME,
    repo_root: resolvedRepoRoot,
    home: resolvedHome,
    plugin_root: repoPluginRoot,
    skill_root: repoSkillRoot,
    marketplace_path: marketplacePath,
  };
}

try {
  const args = parseArgs();
  const result = installCodexPlugin(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`redcube-ai codex installer error: ${message}\n`);
  process.exit(1);
}
