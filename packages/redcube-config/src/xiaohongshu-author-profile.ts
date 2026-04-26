import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { loadRuntimeConfig } from './index.js';
import type {
  RedcubeIdentityConfig,
  RedcubeIdentityProfile,
  RedcubeRuntimeConfig,
  RedcubeWorkspaceAuthorProfile,
  RedcubeWorkspaceAuthorProfileRequest,
  RedcubeWorkspaceAuthorTemplateRequest,
  RedcubeWorkspaceAuthorTemplateResult,
} from './types.js';

const DEFAULT_PROFILE_ID = 'redcube_author';
const DEFAULT_SIGNATURE_DISPLAY = 'RedCube AI';
const DEFAULT_SIGNATURE_SUBTITLE = '请改成你的署名与品牌';

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

function writeText(filePath: string, value: string): void {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, value, 'utf-8');
}

function isMedicalTopic(text = ''): boolean {
  return /(医|临床|内分泌|甲状腺|垂体|肾上腺|糖尿病|疾病|诊疗|症状|治疗|预后|药物|手术|生命科学|健康)/i.test(String(text || ''));
}

function extractProfileBlock(libraryText: string, profileId: string): string {
  const regex = new RegExp(`##\\s*profile_id:\\s*${profileId}\\s*\\n([\\s\\S]*?)(?=\\n##\\s*profile_id:|$)`, 'i');
  const match = String(libraryText || '').match(regex);
  return match ? match[1]?.trim() ?? '' : '';
}

function parseProfileBlock(profileId: string, blockText = ''): RedcubeWorkspaceAuthorProfile | null {
  const block = safeText(blockText);
  if (!block) return null;

  const readField = (label: string, fallback = ''): string => safeText(
    block.match(new RegExp(`-\\s*${label}：([^\\n]+)`))?.[1],
    fallback,
  );
  return {
    profile_id: profileId,
    account_name: readField('账号名'),
    signature_display: readField('署名显示', DEFAULT_SIGNATURE_DISPLAY),
    signature_subtitle: readField('署名副标', DEFAULT_SIGNATURE_SUBTITLE),
    content_strategy: readField('内容策略'),
    style_traits: readField('文风特征'),
    narrative_focus: readField('叙事重点'),
    title_preference: readField('标题偏好'),
    taboo: readField('禁忌'),
    origin: 'author_library',
    config_scope: 'repo_default',
    author_library_file: null,
    branding_rules: [],
  };
}

function buildProfileFallback(
  profileId: string,
  identity: Partial<RedcubeIdentityConfig> = {},
): RedcubeWorkspaceAuthorProfile {
  const profiles = identity.profiles ?? {};
  const profile: RedcubeIdentityProfile = profiles[profileId] || {};
  return {
    profile_id: profileId || DEFAULT_PROFILE_ID,
    account_name: safeText(profile.displayName || profile.signatureDisplay || DEFAULT_SIGNATURE_DISPLAY),
    signature_display: safeText(profile.signatureDisplay || profile.displayName, DEFAULT_SIGNATURE_DISPLAY),
    signature_subtitle: safeText(profile.signatureSubtitle || profile.brandSubtitle, DEFAULT_SIGNATURE_SUBTITLE),
    content_strategy: '',
    style_traits: '',
    narrative_focus: '',
    title_preference: '',
    taboo: '',
    origin: 'identity_fallback',
    config_scope: 'repo_default',
    author_library_file: null,
    branding_rules: [],
  };
}

function libraryFileFromRuntime(runtimeConfig: RedcubeRuntimeConfig): string {
  return path.join(runtimeConfig.promptsDir, 'aligned', '自动小红书', '作者档案库.md');
}

function inferConfigScope(
  workspaceRoot: string,
  runtimeConfig: RedcubeRuntimeConfig,
): RedcubeWorkspaceAuthorProfile['config_scope'] {
  const promptsDir = path.resolve(runtimeConfig.promptsDir);
  const workspacePromptRoot = path.join(path.resolve(workspaceRoot), '.redcube', 'prompts');
  if (promptsDir.startsWith(workspacePromptRoot)) {
    return 'workspace';
  }
  if (promptsDir.startsWith(path.resolve(runtimeConfig.configDirs?.userDir || ''))) {
    return 'user';
  }
  if (promptsDir.startsWith(path.resolve(runtimeConfig.configDirs?.localDir || ''))) {
    return 'repo_local';
  }
  return 'repo_default';
}

export function ensureWorkspaceXiaohongshuAuthorTemplate({
  workspaceRoot,
}: RedcubeWorkspaceAuthorTemplateRequest): RedcubeWorkspaceAuthorTemplateResult {
  const normalizedWorkspaceRoot = path.resolve(safeText(workspaceRoot));
  const configDir = path.join(normalizedWorkspaceRoot, '.redcube');
  const promptsDir = path.join(configDir, 'prompts');
  const alignedDir = path.join(promptsDir, 'aligned', '自动小红书');
  const runtimeFile = path.join(configDir, 'runtime.json');
  const identityFile = path.join(configDir, 'identity.json');
  const readmeFile = path.join(configDir, 'README.md');
  const authorLibraryFile = path.join(alignedDir, '作者档案库.md');

  if (!existsSync(runtimeFile)) {
    writeJson(runtimeFile, {
      promptsDir: './prompts',
    });
  }

  if (!existsSync(identityFile)) {
    writeJson(identityFile, {
      defaultProfileId: DEFAULT_PROFILE_ID,
      routing: {
        medicalProfileId: DEFAULT_PROFILE_ID,
        generalProfileId: DEFAULT_PROFILE_ID,
      },
      profiles: {
        [DEFAULT_PROFILE_ID]: {
          signatureDisplay: DEFAULT_SIGNATURE_DISPLAY,
          signatureSubtitle: DEFAULT_SIGNATURE_SUBTITLE,
        },
      },
    });
  }

  if (!existsSync(readmeFile)) {
    writeText(readmeFile, [
      '# workspace 级作者配置模板',
      '',
      '这里存放当前 workspace 自己的作者身份、品牌和小红书提示词私有层。',
      '建议优先修改以下文件：',
      '- `identity.json`：默认作者、路由和署名显示',
      '- `prompts/aligned/自动小红书/作者档案库.md`：作者风格、人设和叙事要求',
      '',
      '这套模板默认使用通用 `RedCube AI` 作者占位，后续按当前 workspace 的真实作者改写即可。',
    ].join('\n'));
  }

  if (!existsSync(authorLibraryFile)) {
    writeText(authorLibraryFile, [
      '# 作者档案库（workspace 级模板）',
      '',
      '> 当前模板由 RedCube AI 在 workspace bootstrap 时自动生成。',
      '> 请把这里改成当前工作区真正要使用的作者署名、品牌副标和叙事风格。',
      '',
      `## profile_id: ${DEFAULT_PROFILE_ID}`,
      '',
      `- 账号名：${DEFAULT_SIGNATURE_DISPLAY}`,
      `- 署名显示：${DEFAULT_SIGNATURE_DISPLAY}`,
      `- 署名副标：${DEFAULT_SIGNATURE_SUBTITLE}`,
      '- 适用主题：通用知识内容',
      '- 默认触发关键词：知识笔记, 方法论, 复盘, 科普',
      '- 内容策略：结构清楚、信息密度适中、强调可执行性',
      '- 文风特征：清楚、可信、克制、适合长期复用',
      '- 叙事重点：问题 -> 关键洞察 -> 方法拆解 -> 行动建议',
      '- 标题偏好：一句话讲清收益与边界',
      '- 禁忌：内部工作流台词、空泛鸡汤、无来源结论',
    ].join('\n'));
  }

  return {
    config_dir: configDir,
    runtime_file: runtimeFile,
    identity_file: identityFile,
    readme_file: readmeFile,
    author_library_file: authorLibraryFile,
  };
}

export function resolveWorkspaceXiaohongshuAuthorProfile({
  workspaceRoot,
  taskTitle = '',
  projectTitle = '',
  rawMaterials = '',
  promptFile = '',
  configCwd = process.cwd(),
  env = process.env,
}: RedcubeWorkspaceAuthorProfileRequest): RedcubeWorkspaceAuthorProfile {
  const runtimeConfig = loadRuntimeConfig({
    cwd: configCwd,
    explicit: {
      workspaceRoot,
    },
    env,
  });

  const identity = runtimeConfig.identity || {};
  const routing = identity.routing || {};
  const medical = isMedicalTopic([taskTitle, projectTitle, rawMaterials, promptFile].join('\n'));
  const profileId = medical
    ? safeText(routing.medicalProfileId, safeText(identity.defaultProfileId, DEFAULT_PROFILE_ID))
    : safeText(routing.generalProfileId, safeText(identity.defaultProfileId, DEFAULT_PROFILE_ID));

  const authorLibraryFile = libraryFileFromRuntime(runtimeConfig);
  const authorLibrary = existsSync(authorLibraryFile) ? readFileSync(authorLibraryFile, 'utf-8') : '';
  const authorProfile = parseProfileBlock(profileId, extractProfileBlock(authorLibrary, profileId))
    || buildProfileFallback(profileId, identity);

  return {
    ...authorProfile,
    config_scope: inferConfigScope(workspaceRoot, runtimeConfig),
    author_library_file: existsSync(authorLibraryFile) ? authorLibraryFile : null,
    branding_rules: [
      '封面或结尾至少一处显式露出署名显示。',
      '署名副标适合做角标、页脚或收藏标签，不要写成后台配置说明。',
      '发布文案与交付包需要保留同一套署名字段，保证图文和文案一致。',
    ],
  };
}

export type {
  RedcubeWorkspaceAuthorProfile,
  RedcubeWorkspaceAuthorProfileRequest,
  RedcubeWorkspaceAuthorTemplateRequest,
  RedcubeWorkspaceAuthorTemplateResult,
} from './types.js';
