import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';

import type {
  RedcubeIdentityProfile,
  RedcubePrivateProfileOptions,
  RedcubePrivateProfileResult,
} from './types.js';

type ProfileLibrary = Record<string, Pick<RedcubeIdentityProfile, 'signatureDisplay' | 'signatureSubtitle'>>;

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

function ensureFile(filePath: string, label: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`缺少${label}: ${filePath}`);
  }
}

function parseProfileLibrary(libraryText = ''): ProfileLibrary {
  const profiles: ProfileLibrary = {};
  const regex = /##\s*profile_id:\s*([^\n]+)\n([\s\S]*?)(?=\n##\s*profile_id:|$)/g;

  for (const match of String(libraryText).matchAll(regex)) {
    const profileId = String(match[1] || '').trim();
    const block = String(match[2] || '');
    if (!profileId) continue;

    const signatureDisplay = (block.match(/-\s*署名显示：([^\n]+)/)?.[1] || '').trim();
    const signatureSubtitle = (block.match(/-\s*署名副标：([^\n]+)/)?.[1] || '').trim();

    profiles[profileId] = {
      signatureDisplay: signatureDisplay || profileId,
      signatureSubtitle: signatureSubtitle || '默认品牌',
    };
  }

  return profiles;
}

function inferRouting(
  routeText = '',
  profileIds: string[] = [],
): { medicalProfileId: string; generalProfileId: string; defaultProfileId: string } {
  const medicalProfileId = String(
    routeText.match(/医学域[\s\S]*?默认选择：`([^`]+)`/)?.[1]
    || profileIds.find((id) => /dr|medical|医/i.test(id))
    || profileIds[0]
    || 'medical_public',
  ).trim();

  const generalProfileId = String(
    routeText.match(/否则[\s\S]*?默认选择：`([^`]+)`/)?.[1]
    || profileIds.find((id) => id !== medicalProfileId && /travel|general|anthropologist|通用/i.test(id))
    || profileIds.find((id) => id !== medicalProfileId)
    || medicalProfileId
    || 'general_public',
  ).trim();

  return {
    medicalProfileId,
    generalProfileId,
    defaultProfileId: generalProfileId || medicalProfileId || profileIds[0] || 'general_public',
  };
}

function normalizeBundlePayloadDir(basePath: string): string {
  const manifestAtRoot = path.join(basePath, 'manifest.json');
  if (existsSync(manifestAtRoot)) return basePath;

  const nested = path.join(basePath, 'redcube-private-profile');
  if (existsSync(path.join(nested, 'manifest.json'))) return nested;

  throw new Error(`未找到合法 bundle 内容: ${basePath}`);
}

function ensureInstallTarget(configHome: string, force: boolean): void {
  const runtimeFile = path.join(configHome, 'runtime.json');
  const identityFile = path.join(configHome, 'identity.json');
  const promptsDir = path.join(configHome, 'prompts');

  if (force) {
    rmSync(runtimeFile, { force: true });
    rmSync(identityFile, { force: true });
    rmSync(promptsDir, { recursive: true, force: true });
    return;
  }

  if (existsSync(runtimeFile) || existsSync(identityFile) || existsSync(promptsDir)) {
    throw new Error(`目标配置目录已存在私有资产，请使用 --force 覆盖: ${configHome}`);
  }
}

export function resolveConfigHome(options: RedcubePrivateProfileOptions = {}): string {
  const explicit = String(options.configHome || '').trim();
  if (explicit) return path.resolve(explicit);

  const env = options.env || process.env;
  const envHome = String(env.REDCUBE_CONFIG_HOME || '').trim();
  if (envHome) return path.resolve(envHome);

  const homeDir = path.resolve(options.homeDir || os.homedir());
  return path.join(homeDir, '.config', 'redcube');
}

export function bootstrapPrivateProfile(
  options: RedcubePrivateProfileOptions = {},
): RedcubePrivateProfileResult {
  const sourceSystemDir = path.resolve(String(options.sourceSystemDir || '').trim());
  if (!sourceSystemDir || sourceSystemDir === path.resolve('.')) {
    throw new Error('bootstrap 需要 --source-dir');
  }

  const authorLibraryFile = path.join(sourceSystemDir, '作者档案库.md');
  const routingRuleFile = path.join(sourceSystemDir, '人设自动路由规则.md');
  const presetFile = path.join(sourceSystemDir, 'defaults', 'AGENT_PRESET.default.md');
  ensureFile(authorLibraryFile, '作者档案库');
  ensureFile(routingRuleFile, '人设自动路由规则');
  ensureFile(presetFile, '默认 AGENT_PRESET');

  const configHome = resolveConfigHome(options);
  ensureInstallTarget(configHome, options.force === true);

  const promptsDir = path.join(configHome, 'prompts');
  const targetAlignedDir = path.join(promptsDir, 'aligned', '自动小红书');
  mkdirSync(path.dirname(targetAlignedDir), { recursive: true });
  cpSync(sourceSystemDir, targetAlignedDir, { recursive: true });

  const profiles = parseProfileLibrary(readFileSync(authorLibraryFile, 'utf-8'));
  const routing = inferRouting(readFileSync(routingRuleFile, 'utf-8'), Object.keys(profiles));

  const identity = {
    defaultProfileId: routing.defaultProfileId,
    routing: {
      medicalProfileId: routing.medicalProfileId,
      generalProfileId: routing.generalProfileId,
    },
    profiles,
  };

  writeJson(path.join(configHome, 'identity.json'), identity);
  writeJson(path.join(configHome, 'runtime.json'), {
    promptsDir: './prompts',
  });

  return {
    ok: true,
    configHome,
    promptsDir,
    sourceSystemDir,
    profiles: Object.keys(profiles),
  };
}

export function exportPrivateProfile(
  options: RedcubePrivateProfileOptions = {},
): RedcubePrivateProfileResult {
  const configHome = resolveConfigHome(options);
  const bundleFile = path.resolve(String(options.bundleFile || '').trim());
  if (!bundleFile) {
    throw new Error('export 需要 --bundle');
  }

  ensureFile(path.join(configHome, 'identity.json'), '私有 identity');
  ensureFile(path.join(configHome, 'prompts', 'aligned', '自动小红书', '作者档案库.md'), '私有 prompts');

  if (existsSync(bundleFile) && options.force !== true) {
    throw new Error(`bundle 已存在，请使用 --force 覆盖: ${bundleFile}`);
  }

  const stageRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-private-profile-export-'));
  const payloadDir = path.join(stageRoot, 'redcube-private-profile');

  try {
    mkdirSync(payloadDir, { recursive: true });
    writeJson(path.join(payloadDir, 'manifest.json'), {
      format: 'redcube-private-profile',
      version: 1,
      createdAt: new Date().toISOString(),
    });
    writeJson(path.join(payloadDir, 'runtime.json'), {
      promptsDir: './prompts',
    });
    writeJson(path.join(payloadDir, 'identity.json'), readJson(path.join(configHome, 'identity.json')));
    cpSync(path.join(configHome, 'prompts'), path.join(payloadDir, 'prompts'), { recursive: true });

    mkdirSync(path.dirname(bundleFile), { recursive: true });
    if (bundleFile.endsWith('.tgz') || bundleFile.endsWith('.tar.gz')) {
      execFileSync('tar', ['-czf', bundleFile, '-C', stageRoot, 'redcube-private-profile']);
    } else {
      cpSync(payloadDir, bundleFile, { recursive: true });
    }

    return {
      ok: true,
      configHome,
      bundleFile,
    };
  } finally {
    rmSync(stageRoot, { recursive: true, force: true });
  }
}

export function installPrivateProfile(
  options: RedcubePrivateProfileOptions = {},
): RedcubePrivateProfileResult {
  const bundleFile = path.resolve(String(options.bundleFile || '').trim());
  if (!bundleFile) {
    throw new Error('install 需要 --bundle');
  }
  if (!existsSync(bundleFile)) {
    throw new Error(`bundle 不存在: ${bundleFile}`);
  }

  const configHome = resolveConfigHome(options);
  ensureInstallTarget(configHome, options.force === true);

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-private-profile-install-'));
  try {
    const payloadDir = statSync(bundleFile).isDirectory()
      ? normalizeBundlePayloadDir(bundleFile)
      : (() => {
        execFileSync('tar', ['-xzf', bundleFile, '-C', tempDir]);
        return normalizeBundlePayloadDir(tempDir);
      })();

    ensureFile(path.join(payloadDir, 'manifest.json'), 'bundle manifest');
    ensureFile(path.join(payloadDir, 'runtime.json'), 'bundle runtime');
    ensureFile(path.join(payloadDir, 'identity.json'), 'bundle identity');
    ensureFile(path.join(payloadDir, 'prompts', 'aligned', '自动小红书', '作者档案库.md'), 'bundle prompts');

    mkdirSync(configHome, { recursive: true });
    cpSync(path.join(payloadDir, 'runtime.json'), path.join(configHome, 'runtime.json'));
    cpSync(path.join(payloadDir, 'identity.json'), path.join(configHome, 'identity.json'));
    cpSync(path.join(payloadDir, 'prompts'), path.join(configHome, 'prompts'), { recursive: true });

    return {
      ok: true,
      configHome,
      bundleFile,
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

export type {
  RedcubePrivateProfileOptions,
  RedcubePrivateProfileResult,
} from './types.js';
