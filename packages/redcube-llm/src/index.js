import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadRuntimeConfig } from '@redcube/redcube-config';

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function pickSnippet(rawMaterials, maxLen = 260) {
  return cleanText(rawMaterials).slice(0, maxLen);
}

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROMPTS_DIR = path.resolve(MODULE_DIR, '../../../prompts/node');
const STORYLINE_TEMPLATES_DIRNAME = 'storyline_templates';
const ALIGNED_PROMPTS_DIRNAME = path.join('aligned', '自动小红书');

const DEFAULT_NOTE_DRAFT_SYSTEM_PROMPT = '你是内容规划助手。';
const DEFAULT_STORYLINE_SYSTEM_PROMPT = '你是内容架构师。';
const OPENAI_COMPAT_TIMEOUT_MS = 45000;
const OPENAI_COMPAT_MAX_RETRIES = 2;
const ALIGNED_STORYLINE_PROMPT_FILE = '故事指南/叙事风格与故事线生成器.md';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveRuntimeConfig(runtimeConfig = null) {
  return runtimeConfig || loadRuntimeConfig({ env: process.env });
}

function resolvePromptsDir(runtimeConfig = null) {
  return resolveRuntimeConfig(runtimeConfig).promptsDir || DEFAULT_PROMPTS_DIR;
}

function resolveStorylineTemplatesDir(runtimeConfig = null) {
  return path.join(resolvePromptsDir(runtimeConfig), STORYLINE_TEMPLATES_DIRNAME);
}

function resolveAlignedPromptsDir(runtimeConfig = null) {
  const alignedDir = path.join(resolvePromptsDir(runtimeConfig), ALIGNED_PROMPTS_DIRNAME);
  return existsSync(alignedDir) ? alignedDir : '';
}

function hasAlignedPrompts(runtimeConfig = null) {
  return Boolean(resolveAlignedPromptsDir(runtimeConfig));
}

function readPromptText(fileName, fallbackText, runtimeConfig = null) {
  const promptFile = path.join(resolvePromptsDir(runtimeConfig), fileName);
  if (!existsSync(promptFile)) return fallbackText;

  const content = readFileSync(promptFile, 'utf-8');
  if (!content.trim()) return fallbackText;
  return content;
}

function requirePromptText(fileName, runtimeConfig = null) {
  const promptFile = path.join(resolvePromptsDir(runtimeConfig), fileName);
  if (!existsSync(promptFile)) {
    throw new Error(`缺少提示词文件: ${promptFile}`);
  }
  const content = readFileSync(promptFile, 'utf-8');
  if (!content.trim()) {
    throw new Error(`提示词文件为空: ${promptFile}`);
  }
  return content;
}

function readAlignedPromptText(relativePath, runtimeConfig = null) {
  const alignedRoot = resolveAlignedPromptsDir(runtimeConfig);
  if (!alignedRoot) {
    throw new Error(`缺少 aligned 正式提示词目录: ${path.join(resolvePromptsDir(runtimeConfig), ALIGNED_PROMPTS_DIRNAME)}`);
  }

  const promptFile = path.join(alignedRoot, relativePath);
  if (!existsSync(promptFile)) {
    throw new Error(`缺少 aligned 提示词文件: ${promptFile}`);
  }
  const content = readFileSync(promptFile, 'utf-8');
  if (!content.trim()) {
    throw new Error(`aligned 提示词文件为空: ${promptFile}`);
  }
  return content;
}

function renderTemplate(template, vars) {
  return String(template || '').replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function injectReferenceVars(template, vars) {
  let output = String(template || '');
  for (const [key, value] of Object.entries(vars || {})) {
    const next = value === undefined || value === null ? '' : String(value);
    output = output.replaceAll(`{{${key}}}`, next);
    output = output.replaceAll(`{${key}}`, next);
  }
  return output;
}

function isMedicalTopic(text = '') {
  return /(医|临床|内分泌|甲状腺|垂体|肾上腺|糖尿病|疾病|诊疗|症状|治疗|预后|药物|手术|生命科学|健康)/i.test(String(text || ''));
}

function extractProfileBlock(libraryText, profileId) {
  const regex = new RegExp(`##\\s*profile_id:\\s*${profileId}\\s*\\n([\\s\\S]*?)(?=\\n##\\s*profile_id:|$)`, 'i');
  const match = String(libraryText || '').match(regex);
  return match ? `## profile_id: ${profileId}\n${match[1].trim()}`.trim() : '';
}

function buildProfileFallback(profileId, identity = {}) {
  const profile = identity?.profiles?.[profileId];
  if (!profile) return '';
  return [
    `## profile_id: ${profileId}`,
    `- 署名显示：${profile.signatureDisplay || profile.displayName || profileId}`,
    `- 署名副标：${profile.signatureSubtitle || profile.brandSubtitle || '默认品牌'}`,
  ].join('\n');
}

function resolveFormalPromptContext({ taskTitle = '', projectTitle = '', rawMaterials = '', promptFile = '', runtimeConfig = null }) {
  if (!hasAlignedPrompts(runtimeConfig)) return null;

  const alignedRoot = resolveAlignedPromptsDir(runtimeConfig);
  const runtime = resolveRuntimeConfig(runtimeConfig);
  const identity = runtime.identity || {};
  const routing = identity.routing || {};
  const medical = isMedicalTopic([taskTitle, projectTitle, rawMaterials, promptFile].join('\n'));
  const authorLibrary = readAlignedPromptText('作者档案库.md', runtimeConfig);
  const authorProfileId = medical
    ? (routing.medicalProfileId || identity.defaultProfileId || 'medical_public')
    : (routing.generalProfileId || identity.defaultProfileId || 'general_public');
  const authorProfile = extractProfileBlock(authorLibrary, authorProfileId)
    || buildProfileFallback(authorProfileId, identity)
    || '未命中作者档案';

  const styleGuidePath = medical
    ? path.join(alignedRoot, '风格指南', '医学AI科普内容创作风格指南.md')
    : path.join(alignedRoot, '风格指南', '通用知识科普内容创作风格指南.md');
  const styleGuide = existsSync(styleGuidePath) ? readFileSync(styleGuidePath, 'utf-8') : '';

  let resolvedStoryGuides = '故事指南跳过';
  if (medical && /medical_deep/i.test(String(promptFile || ''))) {
    resolvedStoryGuides = readAlignedPromptText('故事指南/候选/SG__医学_健康_生命科学__默认__深度优先蓝图.md', runtimeConfig);
  }

  return {
    alignedRoot,
    authorProfileId,
    authorProfile,
    styleGuide,
    resolvedStoryGuides,
    styleMode: medical ? '专业版' : '混合',
  };
}

function normalizePromptFileName(fileName) {
  const trimmed = String(fileName || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    throw new Error(`非法 prompt 文件名: ${trimmed}`);
  }
  return trimmed.toLowerCase().endsWith('.md') ? trimmed : `${trimmed}.md`;
}

function extractJsonPayload(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const unfenced = raw.startsWith('```')
    ? raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : raw;

  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}

function maybeThinkingConfig(modelName) {
  const model = String(modelName || '').toLowerCase();
  if (model === 'glm-5' || model.startsWith('glm-5-')) {
    return { type: 'disabled' };
  }
  return undefined;
}

async function fetchOpenAICompatible(url, options) {
  let lastResponse = null;
  let lastError = null;

  for (let attempt = 0; attempt <= OPENAI_COMPAT_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(OPENAI_COMPAT_TIMEOUT_MS),
      });

      if (response.ok) {
        return response;
      }

      lastResponse = response;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === OPENAI_COMPAT_MAX_RETRIES) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === OPENAI_COMPAT_MAX_RETRIES) {
        throw error;
      }
    }

    await sleep(300 * (attempt + 1));
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error('OpenAI-compatible 请求失败');
}

export function listStorylinePromptFiles(runtimeConfig = null) {
  const templatesDir = resolveStorylineTemplatesDir(runtimeConfig);
  if (!existsSync(templatesDir)) {
    if (!hasAlignedPrompts(runtimeConfig)) return [];
    return [
      {
        id: 'general_standard',
        fileName: 'general_standard.md',
        label: 'general_standard.md',
        description: '正式版通用故事线',
      },
      {
        id: 'medical_deep',
        fileName: 'medical_deep.md',
        label: 'medical_deep.md',
        description: '正式版医学深度故事线',
      },
      {
        id: 'medical_traffic',
        fileName: 'medical_traffic.md',
        label: 'medical_traffic.md',
        description: '正式版医学传播故事线',
      },
    ];
  }

  const files = readdirSync(templatesDir)
    .filter((name) => name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  return files.map((fileName) => ({
    id: fileName.replace(/\.md$/i, ''),
    fileName,
    label: fileName,
    description: '通过文件名选择 storyline 提示词',
  }));
}

function resolveStorylineTemplate(promptFile = '', runtimeConfig = null) {
  const files = listStorylinePromptFiles(runtimeConfig);
  if (files.length === 0) {
    throw new Error(`未找到 storyline 提示词目录或文件: ${resolveStorylineTemplatesDir(runtimeConfig)}`);
  }

  const requested = normalizePromptFileName(promptFile);
  const selected = requested ? files.find((item) => item.fileName === requested) : files[0];
  if (!selected) {
    throw new Error(`未找到 storyline 提示词文件: ${requested}`);
  }

  if (!existsSync(resolveStorylineTemplatesDir(runtimeConfig)) && hasAlignedPrompts(runtimeConfig)) {
    return {
      fileName: selected.fileName,
      template: readAlignedPromptText(ALIGNED_STORYLINE_PROMPT_FILE, runtimeConfig),
    };
  }

  const fullPath = path.join(resolveStorylineTemplatesDir(runtimeConfig), selected.fileName);
  const template = readFileSync(fullPath, 'utf-8');
  if (!template.trim()) {
    throw new Error(`storyline 提示词文件为空: ${fullPath}`);
  }

  return {
    fileName: selected.fileName,
    template,
  };
}

function getNoteDraftSystemPrompt(runtimeConfig = null) {
  if (hasAlignedPrompts(runtimeConfig)) {
    return [
      '你是 RedCube AI Node 主线的正式版提示词执行器。',
      '必须优先遵守用户仓库内的正式提示词原文与输出结构。',
      '若系统为结构化落盘而注入 JSON 适配要求，只能把它当作交付封装，不能压缩原提示词约束。',
    ].join('\n');
  }
  return readPromptText('note_draft.system.md', DEFAULT_NOTE_DRAFT_SYSTEM_PROMPT, runtimeConfig).trim();
}

function buildNoteDraftUserPrompt({ taskTitle, rawMaterials, styleGuide, storylineLogic, runtimeConfig = null }) {
  const formalContext = resolveFormalPromptContext({ taskTitle, rawMaterials, runtimeConfig });
  if (formalContext) {
    const planningPrompt = injectReferenceVars(
      readAlignedPromptText('策划提示词/单篇策划.md', runtimeConfig),
      {
        raw_materials: rawMaterials || '无',
        author_profile: formalContext.authorProfile,
        storyline_logic: storylineLogic || '未提供',
        resolved_story_guides: formalContext.resolvedStoryGuides,
        style_mode: formalContext.styleMode,
      },
    );
    const planningGate = readAlignedPromptText('策划提示词/单篇策划质控门禁.md', runtimeConfig);
    const planningTemplate = readAlignedPromptText('defaults/templates/01_单篇策划.md', runtimeConfig);

    return [
      planningPrompt,
      '',
      '## 单篇策划质控门禁（原文参考）',
      planningGate,
      '',
      '## 默认输出模板（原文参考）',
      planningTemplate,
      '',
      '## Node 主线结构化输出适配（系统注入）',
      '请严格按照上面的正式版提示词完成策划，但最终只返回 JSON，不要解释。',
      'JSON结构：{"planningDocMarkdown": string, "titleOptions": string[3], "body": string, "hashtags": string[], "outline": string[], "hookPool": string[], "evidencePool": string[], "actionPool": string[], "interactionPool": string[]}',
      `当前任务标题：${taskTitle}`,
      `运行时风格指南补充：${styleGuide || formalContext.styleGuide || '无'}`,
      `运行时故事线补充：${storylineLogic || '无'}`,
    ].join('\n');
  }

  const template = requirePromptText('note_draft.user.md', runtimeConfig);
  return renderTemplate(template, {
    task_title: taskTitle,
    style_guide: styleGuide || '无',
    storyline_logic: storylineLogic || '无',
    raw_materials: pickSnippet(rawMaterials, 4000),
  });
}

function getStorylineSystemPrompt(runtimeConfig = null) {
  if (hasAlignedPrompts(runtimeConfig)) {
    return [
      '你是 RedCube AI Node 主线的正式版故事线生成器。',
      '必须优先遵守仓库内 aligned 正式版提示词原文，不要擅自压缩结构。',
    ].join('\n');
  }
  return readPromptText('storyline.system.md', DEFAULT_STORYLINE_SYSTEM_PROMPT, runtimeConfig).trim();
}

function buildStorylineUserPrompt({ projectTitle, rawMaterials, storylineTemplate, runtimeConfig = null }) {
  const formalContext = resolveFormalPromptContext({
    projectTitle,
    rawMaterials,
    promptFile: storylineTemplate?.fileName || '',
    runtimeConfig,
  });
  if (formalContext) {
    const storylinePrompt = injectReferenceVars(
      readAlignedPromptText(ALIGNED_STORYLINE_PROMPT_FILE, runtimeConfig),
      {
        raw_materials: rawMaterials || '无',
        author_profile: formalContext.authorProfile,
        style_guide: formalContext.styleGuide || '无',
        resolved_story_guides: formalContext.resolvedStoryGuides,
      },
    );

    return [
      storylinePrompt,
      '',
      '## Node 主线上下文（系统注入）',
      `项目主题：${projectTitle}`,
      `故事线配置：${storylineTemplate?.fileName || 'general_standard.md'}`,
      `人设路由结果：${formalContext.authorProfileId}`,
      `风格模式：${formalContext.styleMode}`,
    ].join('\n');
  }

  return renderTemplate(storylineTemplate.template, {
    project_title: projectTitle,
    raw_materials: pickSnippet(rawMaterials, 4000),
    prompt_file: storylineTemplate.fileName,
  });
}

export async function generateStorylineLogic({
  projectTitle,
  rawMaterials,
  promptFile = '',
  llmConfig = null,
  runtimeConfig = null,
}) {
  const mode = llmConfig?.mode || process.env.REDCUBE_LLM_MODE || 'offline';
  const storylineTemplate = resolveStorylineTemplate(promptFile, runtimeConfig);

  if (mode === 'pi') {
    try {
      return await generateStorylineWithPi({
        projectTitle,
        rawMaterials,
        storylineTemplate,
        runtimeConfig,
      });
    } catch {
      // 回退本地生成
    }
  }

  if (mode === 'openai' && (llmConfig?.apiKey || process.env.OPENAI_API_KEY)) {
    try {
      return await generateStorylineWithOpenAI({
        projectTitle,
        rawMaterials,
        storylineTemplate,
        llmConfig,
        runtimeConfig,
      });
    } catch {
      // 回退本地生成
    }
  }

  return generateStorylineOffline({
    projectTitle,
    rawMaterials,
    promptFile: storylineTemplate.fileName,
  });
}

export async function generateNoteDraft({
  taskTitle,
  rawMaterials,
  styleGuide = '',
  storylineLogic = '',
  llmConfig = null,
  runtimeConfig = null,
}) {
  const mode = llmConfig?.mode || process.env.REDCUBE_LLM_MODE || 'offline';
  if (mode === 'pi') {
    try {
      return await generateWithPiAi({ taskTitle, rawMaterials, styleGuide, storylineLogic, runtimeConfig });
    } catch {
      // 无法加载 pi-ai 或调用失败时，自动回退
    }
  }

  if (mode === 'openai' && (llmConfig?.apiKey || process.env.OPENAI_API_KEY)) {
    try {
      return await generateWithOpenAI({ taskTitle, rawMaterials, styleGuide, storylineLogic, llmConfig, runtimeConfig });
    } catch {
      // 回退到本地规则，不阻断流程
    }
  }

  return generateOffline({ taskTitle, rawMaterials, styleGuide, storylineLogic });
}

async function generateWithPiAi({ taskTitle, rawMaterials, styleGuide, storylineLogic, runtimeConfig = null }) {
  const pi = await import('@mariozechner/pi-ai');

  const provider = process.env.PI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.PI_MODEL_NAME || 'gpt-4o-mini';
  const model = pi.getModel(provider, modelName);

  const systemPrompt = getNoteDraftSystemPrompt(runtimeConfig);
  const userPrompt = buildNoteDraftUserPrompt({ taskTitle, rawMaterials, styleGuide, storylineLogic, runtimeConfig });
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const context = {
    messages: [{ role: 'user', content: combinedPrompt }],
  };
  const response = await pi.complete(model, context);

  const textBlocks = Array.isArray(response?.content)
    ? response.content.filter((block) => block.type === 'text').map((block) => block.text || '')
    : [];
  const jsonText = textBlocks.join('\n').trim();

  if (!jsonText) {
    throw new Error('pi-ai 返回为空');
  }

  const parsed = JSON.parse(jsonText);
  return {
    titleOptions: Array.isArray(parsed.titleOptions) ? parsed.titleOptions.slice(0, 3) : [`${taskTitle}：实用指南`],
    body: String(parsed.body || ''),
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['小红书运营', '知识科普'],
    outline: Array.isArray(parsed.outline) ? parsed.outline : ['核心观点', '关键方法', '行动建议'],
    planningDocMarkdown: String(parsed.planningDocMarkdown || ''),
    hookPool: Array.isArray(parsed.hookPool) ? parsed.hookPool : [],
    evidencePool: Array.isArray(parsed.evidencePool) ? parsed.evidencePool : [],
    actionPool: Array.isArray(parsed.actionPool) ? parsed.actionPool : [],
    interactionPool: Array.isArray(parsed.interactionPool) ? parsed.interactionPool : [],
  };
}

function generateOffline({ taskTitle, rawMaterials, styleGuide }) {
  const snippet = pickSnippet(rawMaterials);
  const styleTag = styleGuide ? '（已融合项目风格）' : '';

  const titleOptions = [
    `${taskTitle}：3分钟看懂核心要点`,
    `${taskTitle}｜实用版指南`,
    `${taskTitle}：避免踩坑的关键清单`,
  ];

  const body = [
    `今天聊聊「${taskTitle}」${styleTag}。`,
    '先讲结论：理解机制、掌握方法、持续执行，是长期有效的关键。',
    `结合素材里的信息，核心提示是：${snippet || '请围绕真实场景拆解步骤并给出可执行建议。'}`,
    '建议你按“识别问题 -> 选择策略 -> 每周复盘”三个步骤推进。',
  ].join('\n\n');

  return {
    titleOptions,
    body,
    hashtags: ['小红书运营', '知识科普', taskTitle.slice(0, 10)],
    outline: [
      '开场：为什么这个问题值得关注',
      '误区：常见认知偏差与风险',
      '方法：三步执行框架',
      '案例：一个可复用的应用场景',
      '总结：一页清单快速复盘',
    ],
    planningDocMarkdown: '',
    hookPool: [],
    evidencePool: [],
    actionPool: [],
    interactionPool: [],
  };
}

async function generateWithOpenAI({ taskTitle, rawMaterials, styleGuide, storylineLogic, llmConfig = null, runtimeConfig = null }) {
  const baseUrl = (llmConfig?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = llmConfig?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const apiKey = llmConfig?.apiKey || process.env.OPENAI_API_KEY;

  const prompt = buildNoteDraftUserPrompt({ taskTitle, rawMaterials, styleGuide, storylineLogic, runtimeConfig });
  const systemPrompt = getNoteDraftSystemPrompt(runtimeConfig);

  const response = await fetchOpenAICompatible(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1400,
      temperature: 0.6,
      ...(maybeThinkingConfig(model) ? { thinking: maybeThinkingConfig(model) } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM 请求失败: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM 返回为空');
  }

  const parsed = extractJsonPayload(content);
  if (!parsed) {
    throw new Error('LLM 返回的 JSON 无法解析');
  }
  return {
    titleOptions: Array.isArray(parsed.titleOptions) ? parsed.titleOptions.slice(0, 3) : [`${taskTitle}：实用指南`],
    body: String(parsed.body || ''),
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['小红书运营', '知识科普'],
    outline: Array.isArray(parsed.outline) ? parsed.outline : ['核心观点', '关键方法', '行动建议'],
    planningDocMarkdown: String(parsed.planningDocMarkdown || ''),
    hookPool: Array.isArray(parsed.hookPool) ? parsed.hookPool : [],
    evidencePool: Array.isArray(parsed.evidencePool) ? parsed.evidencePool : [],
    actionPool: Array.isArray(parsed.actionPool) ? parsed.actionPool : [],
    interactionPool: Array.isArray(parsed.interactionPool) ? parsed.interactionPool : [],
  };
}

function generateStorylineOffline({ projectTitle, rawMaterials, promptFile }) {
  const snippet = pickSnippet(rawMaterials, 480);
  const fileKey = String(promptFile || '').toLowerCase();
  const isMedical = /(medical|医|内分泌|甲状腺|垂体|激素|临床)/.test(fileKey + projectTitle + rawMaterials);
  const isTraffic = /(traffic|流量|viral|hook|传播)/.test(fileKey);

  if (isMedical) {
    const focus = isTraffic ? '以临床冲突和高频误区开场，强调传播钩子' : '以病理生理链条开场，强调临床推理深度';
    return [
      `# ${projectTitle} 叙事逻辑`,
      '',
      `- 采用提示词文件：${promptFile}`,
      `- 叙事目标：${focus}。`,
      '- 主线结构：临床问题 -> 机制解释 -> 诊断路径 -> 处理策略 -> 随访复盘。',
      '- 每篇建议格式：开场病例/冲突 + 三段机制 + 一页流程图 + 关键阈值表。',
      '- 诊疗强调：区分初筛、确诊、鉴别诊断与转诊节点。',
      '- 风险提示：药物不良反应、并发症预警、急症升级触发条件。',
      `- 本轮素材锚点：${snippet || '请从原始文献中提取关键阈值与循证等级。'}`,
    ].join('\n');
  }

  return [
    `# ${projectTitle} 叙事逻辑`,
    '',
    `- 采用提示词文件：${promptFile}`,
    '- 主线结构：背景痛点 -> 关键概念 -> 可执行方法 -> 示例复盘。',
    '- 每篇建议格式：问题定义 + 3步法 + 1页清单。',
    `- 本轮素材锚点：${snippet || '请提炼核心观点并给出行动建议。'}`,
  ].join('\n');
}

async function generateStorylineWithPi({ projectTitle, rawMaterials, storylineTemplate, runtimeConfig = null }) {
  const pi = await import('@mariozechner/pi-ai');
  const provider = process.env.PI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.PI_MODEL_NAME || 'gpt-4o-mini';
  const model = pi.getModel(provider, modelName);

  const systemPrompt = getStorylineSystemPrompt(runtimeConfig);
  const userPrompt = buildStorylineUserPrompt({ projectTitle, rawMaterials, storylineTemplate, runtimeConfig });
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await pi.complete(model, {
    messages: [{ role: 'user', content: combinedPrompt }],
  });
  const textBlocks = Array.isArray(response?.content)
    ? response.content.filter((block) => block.type === 'text').map((block) => block.text || '')
    : [];
  const text = textBlocks.join('\n').trim();
  if (!text) throw new Error('pi-ai storyline 返回为空');
  return text;
}

async function generateStorylineWithOpenAI({ projectTitle, rawMaterials, storylineTemplate, llmConfig = null, runtimeConfig = null }) {
  const baseUrl = (llmConfig?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = llmConfig?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const apiKey = llmConfig?.apiKey || process.env.OPENAI_API_KEY;

  const prompt = buildStorylineUserPrompt({ projectTitle, rawMaterials, storylineTemplate, runtimeConfig });
  const systemPrompt = getStorylineSystemPrompt(runtimeConfig);

  const response = await fetchOpenAICompatible(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1100,
      temperature: 0.4,
      ...(maybeThinkingConfig(model) ? { thinking: maybeThinkingConfig(model) } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`storyline LLM 请求失败: ${response.status} ${errorText.slice(0, 300)}`);
  }
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error('storyline LLM 返回为空');
  return String(content).trim();
}
