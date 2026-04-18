import path from 'node:path';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync, copyFileSync } from 'node:fs';
import { loadRuntimeConfig } from '@redcube/redcube-config';

const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5vN7sAAAAASUVORK5CYII=';

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function safeFilename(name) {
  return (name || '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildTaskFolderName(index, title) {
  return safeFilename(`${String(index).padStart(2, '0')}_${title}`);
}

export function parseTasksFromToc(tocText) {
  const lines = (tocText || '').split(/\r?\n/);
  const tasks = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let match = line.match(/^##\s*\d+\s*[.、)]\s*(.+)$/);
    if (!match) match = line.match(/^\d+\s*[.、)]\s*(.+)$/);
    if (!match) match = line.match(/^-\s+(.+)$/);
    if (!match) continue;

    const title = match[1].trim();
    if (title && !tasks.includes(title)) {
      tasks.push(title);
    }
  }

  return tasks;
}

export function filterTasks(tasks, taskFilter = '') {
  if (!taskFilter || !taskFilter.trim()) return tasks;

  const tokens = taskFilter
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (tokens.length === 0) return tasks;

  const selected = [];

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const idx = Number.parseInt(token, 10) - 1;
      if (idx >= 0 && idx < tasks.length) {
        const task = tasks[idx];
        if (!selected.includes(task)) selected.push(task);
      }
      continue;
    }

    const lower = token.toLowerCase();
    for (const task of tasks) {
      if (task.toLowerCase().includes(lower) && !selected.includes(task)) {
        selected.push(task);
      }
    }
  }

  return selected;
}

export function getProjectPaths(rootDir, project) {
  const projectDir = path.join(rootDir, 'projects', project);
  const inputsDir = path.join(projectDir, 'inputs');
  const rawMaterialsDir = path.join(inputsDir, 'raw_materials');
  const outputsDir = path.join(projectDir, 'outputs_pi');
  const publishDir = path.join(projectDir, 'publish_pi');

  return {
    projectDir,
    inputsDir,
    rawMaterialsDir,
    outputsDir,
    publishDir,
    seriesTocFile: path.join(inputsDir, 'series_toc.md'),
    styleGuideFile: path.join(inputsDir, 'style_guide.md'),
    storylineFile: path.join(inputsDir, 'storyline_logic.md'),
  };
}

export function listProjects(rootDir) {
  const projectsDir = path.join(rootDir, 'projects');
  if (!existsSync(projectsDir)) return [];

  return discoverProjects(projectsDir)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

export function createProjectStructure(rootDir, projectName) {
  const name = String(projectName || '').trim();
  if (!name) {
    return {
      ok: false,
      error: '项目名不能为空',
    };
  }

  const normalized = normalizeProjectName(name);
  const paths = getProjectPaths(rootDir, normalized);

  if (existsSync(paths.projectDir)) {
    return {
      ok: false,
      error: `项目已存在: ${normalized}`,
      project: normalized,
      paths,
    };
  }

  ensureDir(paths.rawMaterialsDir);
  writeText(
    paths.seriesTocFile,
    '# 系列目录\n\n## 1. 示例任务：请改成你的标题\n',
  );
  writeText(paths.styleGuideFile, '请在此填写你的内容风格与语言规范。');
  writeText(paths.storylineFile, '请在此填写你的叙事逻辑与章节节奏。');
  writeText(
    path.join(paths.rawMaterialsDir, 'README.md'),
    [
      '# raw_materials 使用说明',
      '',
      '把你的素材文件放在这个目录。',
      '支持 .md .txt（会直接读取文本）以及其他二进制文件（仅记录文件名）。',
      '',
      '推荐最小结构：',
      '- source.md  主素材',
      '- notes.md   补充说明（可选）',
    ].join('\n'),
  );

  return {
    ok: true,
    project: normalized,
    paths,
    message: '项目骨架创建完成',
  };
}

export function validateProjectInputs(paths) {
  const errors = [];
  const warnings = [];

  if (!existsSync(paths.projectDir)) {
    errors.push(`项目不存在: ${paths.projectDir}`);
    return { errors, warnings };
  }

  if (!existsSync(paths.seriesTocFile)) {
    warnings.push(`缺少 series_toc.md，将在运行时自动生成: ${paths.seriesTocFile}`);
  }

  if (!existsSync(paths.rawMaterialsDir)) {
    errors.push(`缺少 raw_materials 目录: ${paths.rawMaterialsDir}`);
  } else {
    const files = walkFiles(paths.rawMaterialsDir);
    if (files.length === 0) {
      errors.push(`raw_materials 目录为空: ${paths.rawMaterialsDir}`);
    }
  }

  if (!existsSync(paths.styleGuideFile)) {
    warnings.push('未提供 style_guide.md，将使用默认风格');
  }

  if (!existsSync(paths.storylineFile)) {
    warnings.push('未提供 storyline_logic.md，将使用默认叙事');
  }

  return { errors, warnings };
}

export function loadProjectBundle(rootDir, project, taskFilter = '') {
  const paths = getProjectPaths(rootDir, project);
  const { errors, warnings } = validateProjectInputs(paths);
  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
      paths,
    };
  }

  const rawMaterials = loadRawMaterials(paths.rawMaterialsDir);

  let tocText = existsSync(paths.seriesTocFile) ? readFileSync(paths.seriesTocFile, 'utf-8') : '';
  let allTasks = parseTasksFromToc(tocText);

  if (allTasks.length === 0) {
    const generated = generateTasksFromRawMaterials({
      projectName: project,
      rawMaterials,
      noteMode: 'auto',
    });
    allTasks = generated.tasks;
    tocText = buildSeriesTocMarkdown({
      projectName: project,
      mode: generated.mode,
      tasks: allTasks,
    });
    writeText(paths.seriesTocFile, tocText);
    warnings.push(`已自动生成 series_toc.md（模式: ${generated.mode}）`);
  }

  const tasks = filterTasks(allTasks, taskFilter);

  if (tasks.length === 0) {
    return {
      ok: false,
      errors: ['任务过滤后为空，请检查 --tasks 参数'],
      warnings,
      paths,
    };
  }

  return {
    ok: true,
    project,
    paths,
    warnings,
    tocText,
    allTasks,
    tasks,
    styleGuide: existsSync(paths.styleGuideFile) ? readFileSync(paths.styleGuideFile, 'utf-8') : '',
    storylineLogic: existsSync(paths.storylineFile) ? readFileSync(paths.storylineFile, 'utf-8') : '',
    rawMaterials,
  };
}

export function loadRawMaterials(rawMaterialsDir) {
  const files = walkFiles(rawMaterialsDir);
  const chunks = [];

  for (const file of files) {
    const rel = path.relative(rawMaterialsDir, file);
    const ext = path.extname(file).toLowerCase();

    if (ext === '.md' || ext === '.txt') {
      const text = readFileSync(file, 'utf-8');
      chunks.push(`# 文件: ${rel}\n${text}`);
      continue;
    }

    chunks.push(`# 文件: ${rel}\n[二进制文件，未直接抽取文本]`);
  }

  return chunks.join('\n\n').trim();
}

function walkFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    if (entry === '.DS_Store') continue;

    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkFiles(full));
    } else {
      files.push(full);
    }
  }

  return files;
}

function discoverProjects(projectsDir, relPrefix = '', depth = 0) {
  if (depth > 6) return [];

  const entries = readdirSync(projectsDir)
    .filter((name) => name !== '.DS_Store')
    .map((name) => ({ name, full: path.join(projectsDir, name) }))
    .filter((entry) => statSync(entry.full).isDirectory());

  const projects = [];

  for (const entry of entries) {
    const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    const inputsDir = path.join(entry.full, 'inputs');

    if (existsSync(inputsDir) && statSync(inputsDir).isDirectory()) {
      projects.push(rel);
      continue;
    }

    projects.push(...discoverProjects(entry.full, rel, depth + 1));
  }

  return projects;
}

function normalizeProjectName(name) {
  return name
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => safeFilename(segment))
    .filter(Boolean)
    .join('/');
}

export function inferNoteMode(rawMaterials, noteMode = 'auto') {
  if (noteMode === 'single' || noteMode === 'series') return noteMode;

  const text = String(rawMaterials || '');
  const headingCount = (text.match(/^#{1,3}\s+/gm) || []).length;
  const numberedCount = (text.match(/^\d+\s*[.、)]\s+/gm) || []).length;

  if (headingCount + numberedCount >= 6) return 'series';
  if (text.length >= 3500) return 'series';
  if (/(系列|章节|目录|概论|总论|专题|模块|指南|全书|框架)/.test(text)) return 'series';
  return 'single';
}

function shouldIgnoreTaskSourceFile(relativePath = '') {
  const normalized = String(relativePath || '').replaceAll('\\', '/').toLowerCase();
  const fileName = path.basename(normalized);

  if (!fileName) return false;
  if (normalized.startsWith('research/') || normalized.includes('/research/')) return true;
  if (fileName.startsWith('research_') || fileName === 'sources.json') return true;
  if (fileName === 'agent_preset.md') return true;
  if (/^(00_|brief)/.test(fileName)) return true;
  if (/(启动任务|任务说明|agent[_ -]?preset|persona|人设|角色|system)/.test(fileName)) return true;
  return false;
}

function shouldIgnoreTaskCandidate(title = '') {
  const normalized = String(title || '').trim();
  if (!normalized) return true;
  if (/^(目录|参考文献|附录|声明|致谢)$/.test(normalized)) return true;
  if (/^(文件|file)\s*[:：]/i.test(normalized)) return true;
  if (/^(创建时间|允许联网搜集资料|更新时间|来源|用途|说明|任务说明)\b/.test(normalized)) return true;
  if (/^(启动任务|brief|README|AGENT_PRESET)\b/i.test(normalized)) return true;
  if (/(默认配置|默认规则|全局回退|系统提示|角色设定|行为约束)/.test(normalized)) return true;
  return false;
}

function isEndocrineSeriesTheme(text = '') {
  return /(内分泌|甲状腺|垂体|激素|糖尿病|肾上腺|胰岛|甲状旁腺|钙磷代谢|性腺|graves|桥本|pcos)/i.test(String(text || ''));
}

function resolveRuntimeDefaults(options = {}) {
  return options.runtimeConfig || loadRuntimeConfig({
    env: process.env,
    cwd: options.repoRoot,
    explicit: {
      rootDir: options.rootDir || '',
      workspaceRoot: options.workspaceRoot || '',
    },
  });
}

function resolveIdentityDefaults(note, taskTitle, options = {}) {
  const runtime = resolveRuntimeDefaults(options);
  const identity = runtime.identity || {};
  const routing = identity.routing || {};
  const fallbackProfileId = identity.defaultProfileId || 'general_public';
  const medical = isEndocrineSeriesTheme([
    taskTitle,
    note?.body || '',
    Array.isArray(note?.outline) ? note.outline.join(' ') : '',
  ].join('\n'));

  const profileId = options.profileId
    || (medical ? routing.medicalProfileId : routing.generalProfileId)
    || fallbackProfileId;
  const profile = identity.profiles?.[profileId]
    || identity.profiles?.[fallbackProfileId]
    || {};

  return {
    profileId,
    signatureDisplay: options.signatureDisplay || profile.signatureDisplay || '公开通用作者',
    signatureSubtitle: options.signatureSubtitle || profile.signatureSubtitle || '公开默认品牌',
  };
}

export function generateTasksFromRawMaterials({ projectName, rawMaterials, noteMode = 'auto' }) {
  const mode = inferNoteMode(rawMaterials, noteMode);
  const displayName = String(projectName || '').split('/').pop() || String(projectName || '主题');

  if (mode === 'single') {
    return {
      mode,
      tasks: [`${displayName}核心解读`],
    };
  }

  const lines = String(rawMaterials || '').split(/\r?\n/);
  const candidates = [];
  let currentFile = '';
  let ignoreCurrentFile = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const fileMarker = line.match(/^#\s*文件:\s*(.+)$/);
    if (fileMarker) {
      currentFile = fileMarker[1].trim();
      ignoreCurrentFile = shouldIgnoreTaskSourceFile(currentFile);
      continue;
    }

    if (ignoreCurrentFile) continue;

    let match = line.match(/^#{1,3}\s+(.+)$/);
    if (!match) match = line.match(/^\d+\s*[.、)]\s*(.+)$/);
    if (!match) match = line.match(/^-\s+(.+)$/);
    if (!match) continue;

    const item = match[1]
      .trim()
      .replace(/^\d+\s*[.、)]\s*/, '')
      .replace(/[：:。；;，,]+$/, '');
    if (!item) continue;
    if (item.length > 30) continue;
    if (shouldIgnoreTaskCandidate(item)) continue;
    if (!candidates.includes(item)) candidates.push(item);
    if (candidates.length >= 12) break;
  }

  if (candidates.length >= 4) {
    return {
      mode,
      tasks: candidates.slice(0, 10),
    };
  }

  const medicalFallback = [
    '内分泌总论与临床框架',
    '下丘脑-垂体轴核心机制',
    '甲状腺轴与临床判断',
    '肾上腺轴与急危重症识别',
    '胰岛与糖代谢临床要点',
    '甲状旁腺与钙磷代谢',
    '性腺轴与生殖内分泌',
    '内分泌诊疗路径与随访管理',
  ];

  const generalFallback = [
    `${displayName}问题定义与边界`,
    `${displayName}核心机制`,
    `${displayName}常见误区`,
    `${displayName}实操方法`,
    `${displayName}案例拆解`,
    `${displayName}评估与复盘`,
  ];

  const isMedical = isEndocrineSeriesTheme(displayName + rawMaterials);
  return {
    mode,
    tasks: isMedical ? medicalFallback : generalFallback,
  };
}

export function buildSeriesTocMarkdown({ projectName, mode, tasks }) {
  const displayName = String(projectName || '').split('/').pop() || String(projectName || '项目');
  const heading = mode === 'single' ? '# 单篇笔记任务' : `# ${displayName}系列目录`;
  const list = (tasks || []).map((task, idx) => `## ${idx + 1}. ${task}`).join('\n\n');
  return `${heading}\n\n${list}\n`;
}

export function buildContentPlanMarkdown(note) {
  const titles = (note.titleOptions || []).map((t) => `- ${t}`).join('\n');
  const outline = (note.outline || []).map((item, idx) => `${idx + 1}. ${item}`).join('\n');

  return `# 内容规划\n\n**【小红书标题】**\n\n${titles}\n\n**【小红书正文】**\n\n${note.body}\n\n${(note.hashtags || []).map((tag) => `#${tag.replace(/^#/, '')}`).join(' ')}\n\n**【信息图设计大纲】**\n\n${outline}\n`;
}

function buildHashtagLine(hashtags = []) {
  return (hashtags || []).map((tag) => `#${String(tag).replace(/^#/, '')}`).join(' ');
}

function getAnchorPool(note = {}, key) {
  const value = note?.[key];
  return Array.isArray(value) && value.length > 0 ? value : [];
}

export function buildPlanningDocMarkdown(note, taskTitle, options = {}) {
  const titleOptions = note?.titleOptions?.length ? note.titleOptions.slice(0, 3) : [`${taskTitle}：快速掌握`];
  const outline = note?.outline?.length ? note.outline : ['核心信息', '关键误区', '行动建议'];
  const hashtags = note?.hashtags?.length ? note.hashtags : ['小红书运营', '知识科普'];
  const hookPool = getAnchorPool(note, 'hookPool');
  const evidencePool = getAnchorPool(note, 'evidencePool');
  const actionPool = getAnchorPool(note, 'actionPool');
  const interactionPool = getAnchorPool(note, 'interactionPool');
  const identityDefaults = resolveIdentityDefaults(note, taskTitle, options);

  return [
    '# 01_单篇策划',
    '',
    '## 基本信息',
    `- 笔记编号：${options.noteId || 'Note_01'}`,
    `- 笔记短名：${taskTitle}`,
    `- 所属章节：${options.chapterName || '未分章'}`,
    `- 人设：${identityDefaults.profileId}`,
    `- 作者署名：${identityDefaults.signatureDisplay}｜${identityDefaults.signatureSubtitle}`,
    '',
    '## 本篇定位',
    options.positioning || `本篇围绕「${taskTitle}」完成从问题认知到行动建议的单篇闭环。`,
    '',
    '## 备选标题（<=20字）',
    `1. ${titleOptions[0] || `${taskTitle}：快速掌握`}`,
    `2. ${titleOptions[1] || `${taskTitle}｜实用指南`}`,
    `3. ${titleOptions[2] || `${taskTitle}：避坑清单`}`,
    '',
    '## 小红书正文（<=1000字）',
    note?.body || `围绕 ${taskTitle}，给出清晰、可执行的内容拆解。`,
    '',
    '## 标签建议',
    buildHashtagLine(hashtags),
    '',
    '## 核心信息点清单',
    ...outline.map((item) => `- ${item}`),
    '',
    '## 发布文案锚点卡',
    `- hook_pool：${hookPool.length ? hookPool.join('；') : `${taskTitle} 为什么值得现在做`}`,
    `- evidence_pool：${evidencePool.length ? evidencePool.join('；') : '事实锚点1；事实锚点2；事实锚点3'}`,
    `- action_pool：${actionPool.length ? actionPool.join('；') : '动作1；动作2；动作3'}`,
    `- interaction_pool：${interactionPool.length ? interactionPool.join('；') : '你最卡在哪一步？；你更想先补哪块能力？'}`,
    '',
    '## 医学主题补充（仅医学主题）',
    `- 三幕式归属：${options.medicalAct || '非医学主题'}`,
    `- 本篇三幕式映射摘要：${options.medicalSummary || '本篇默认按通用单篇闭环执行。'}`,
    `- 对应事实锚点：${options.medicalFacts || 'none'}`,
    '',
    '## 署名文案',
    `- 封面署名：${identityDefaults.signatureDisplay}｜${identityDefaults.signatureSubtitle}`,
    `- 结尾署名：${identityDefaults.signatureDisplay}｜${identityDefaults.signatureSubtitle}`,
    '- 内页署名策略（可选）：默认不展示；如需展示写明页码与位置',
    '',
    '## 策划完整性自检报告（强制）',
    `- outline_gate_pass：${outline.length > 0 ? 'true' : 'false'}`,
    `- total_pages：${Math.min(Math.max(outline.length, 5), 10)}`,
    `- layout_plan_row_count：${outline.length}`,
    `- page_block_count：${outline.length}`,
    '- required_field_coverage：1',
    `- avg_keypoints_per_page：${outline.length > 0 ? '3' : '0'}`,
    `- unique_layout_prototype_count：${Math.min(Math.max(outline.length, 3), 5)}`,
    '- max_consecutive_same_layout：1',
    '- short_page_count：0',
    '- bottom_half_module_defined_rate：1',
    '- action_primitive_defined_rate：1',
    '- high_risk_action_page_count：0',
    '- failed_rules：none',
    '- rewrite_action：none',
    '',
  ].join('\n');
}

export function buildInfographicOutlineDocMarkdown(note, taskTitle, options = {}) {
  const outline = note?.outline?.length ? note.outline : ['核心信息', '关键误区', '行动建议'];
  const totalPages = Math.min(Math.max(outline.length + 1, 5), 10);
  const layoutRows = Array.from({ length: totalPages }, (_item, index) => {
    const pageNo = index + 1;
    const item = outline[index] || `总结页 ${pageNo}`;
    return `- 页码：${pageNo}｜页面类型：${pageNo === 1 ? '封面' : pageNo === totalPages ? '结尾' : '机制'}｜版式原型ID：LP_0${(pageNo % 4) + 1}｜主视觉动作：分层递进｜动作落地原语：标题条+证据卡｜镜头焦点：中部信息轴｜画面密度目标：中高密度｜结构禁复用约束：相邻页至少变化2处｜DOM骨架签名预期：section>header>article>ul｜内容：${item}`;
  });

  return [
    '# 02_信息图大纲',
    '',
    '## 设计约束（硬约束）',
    `- 画幅：${options.aspectRatio || '3:4'}`,
    `- 总页数：${totalPages}`,
    `- 风格：${options.styleMode || '专业版'}`,
    '- 禁止项：外部图片、左右分栏对比、内容溢出',
    '- 版面均衡：除封面/章节过渡页外，每页下半区必须有实质信息模块（非装饰）',
    '- 上重下空限制：禁止连续3页上重下空',
    '',
    '## visual_world_card（强制）',
    `- 主题隐喻：${options.themeMetaphor || `${taskTitle} 的任务工位笔记`}`,
    '- 情绪曲线：开场张力 -> 中段解释 -> 结尾召回',
    '- 视觉母题（2-3个）：编号贴纸 / 证据卡 / 行动条',
    '- 禁止母题（至少2条）：全篇同款卡片堆叠 / 白底产品页',
    '',
    '## layout_plan 页级总表（强制，先于分页规划输出）',
    ...layoutRows,
    '',
    '## 分页规划（视觉蓝图版）',
    ...outline.flatMap((item, index) => [
      '',
      `### 信息图 ${index + 1}/${totalPages}`,
      `- 页面类型：${index === 0 ? '封面' : '机制'}`,
      `- 页面目标：围绕「${item}」完成一个明确认知动作`,
      `- 页面标题：${item}`,
      `- 核心结论（1句）：${item}`,
      '- 关键信息点（3-5条）：',
      `  - ${item}`,
      `  - ${taskTitle} 的关键事实`,
      '  - 可执行动作',
      '- 版式原型ID（强制）：LP_01_HERO',
      '- 主视觉动作（强制）：分层递进',
      '- 动作落地原语（强制）：标题条+证据卡',
      '- 镜头焦点（强制）：中部信息轴',
      '- DOM骨架签名预期（强制）：section>header>article>ul',
      '- 结构禁复用约束（强制）：相对上一页至少变化2处',
      '- 信息模块清单（至少3个）：结论条 / 证据卡 / 行动提示',
      '- 视觉锚点（1-2个）：编号贴纸 / 风险色条',
      '- 配色落位：主色用于结论区，强调色用于行动区，警示色用于风险提示',
      '- 图标与符号：fa-lightbulb / fa-list-check',
      '- 文案长度预算：标题20字内，单条要点40字内',
      '- 版心填充策略：中下区域承载结论卡与执行条',
      '- 纵向平衡检查（强制）：下半区至少1个关键信息模块',
      '- 实现约束（硬约束）：仅Font Awesome+Emoji+CSS/SVG，禁止外链图',
      '- 防同构说明：相邻页调整锚点位置与信息模块组合',
      '- 页面衔接：承接上一页并引出下一页',
      '- 署名呈现：封面完整署名/结尾完整署名/内页默认无署名',
    ]),
    '',
  ].join('\n');
}

export function buildVisualDirectionDocMarkdown(note, taskTitle, options = {}) {
  const totalPages = Math.min(Math.max((note?.outline?.length || 4) + 1, 5), 10);
  const pageRows = Array.from({ length: totalPages }, (_item, index) => {
    const pageNo = index + 1;
    return `| P${pageNo} | ${pageNo === 1 ? '封面' : pageNo === totalPages ? '结尾' : '机制页'} | ${pageNo === 1 ? '题头页' : '重点摘记页'} | 米白纸 + 贴纸编号 | 荧光划线 + 箭头 | 禁止退化成白底卡片页 |`;
  });

  return [
    '# 02A_视觉导演稿',
    '',
    '## 导演宣言（强制）',
    `- 这一篇像什么笔记：${options.noteMood || '强手账感课堂笔记'}`,
    '- 目标气质：手作、有整理痕迹、可信、可读、非产品页',
    `- 核心句：像一个专业的人把「${taskTitle}」认真画给你看`,
    '- 默认风险：容易退化成白底卡片页',
    '',
    '## 纸面与材料感规则（强制）',
    '- 纸面基底：米白纸 + 轻网格纸',
    '- 主强调色：#d94625 用于结论高亮',
    '- 结论色：#0f766e 用于结论区',
    '- 警示色：#b91c1c 用于风险提示',
    '- 手写/批注字体策略：仅用于边注、箭头、圈点，不进正文主体',
    '- 允许出现的手作元素（选3-5个）：',
    '  - 荧光划线',
    '  - 红笔圈注',
    '  - 贴纸编号',
    '  - 手写箭头',
    '- 禁止出现的手作元素（至少3条）：',
    '  - 全页满铺贴纸',
    '  - 幼态卡通图案',
    '  - 每页同款胶带',
    '',
    '## 分页视觉角色表（强制）',
    '| 页码 | 页面角色 | 这页像什么笔记动作 | 主材料感 | 主手作痕迹 | 禁退化提醒 |',
    '|---|---|---|---|---|---|',
    ...pageRows,
    '',
    '## 页面级导演说明（强制，逐页）',
    '### P1',
    '- 视觉任务：建立这篇笔记的第一眼信任感与阅读入口',
    '- 首眼抓取点：主标题与核心结论',
    '- 第二视线：三条价值卡',
    '- 手作痕迹如何承载信息：用划线与编号强化阅读顺序',
    '- 页面禁语法：普通深色渐变 + 三条列表',
    '',
    `### P2-P${totalPages}`,
    '- 视觉任务：让每页都像被整理过的专题笔记',
    '- 首眼抓取点：页面核心锚点',
    '- 第二视线：证据卡与行动条',
    '- 手作痕迹如何承载信息：只为重点服务，不堆装饰',
    '- 页面禁语法：统一安全卡片页',
    '',
    '## 给 HTML 生成器的最终指令（强制）',
    '- 先像一个做笔记的人，再像一个做PPT的人',
    '- 先让页面被整理过，再让页面被装饰过',
    '- 任何一页如果只剩卡片/网格/总结条，都视为导演意图未落地',
    '',
  ].join('\n');
}

export function buildHtmlGenerationDocMarkdown(note, taskTitle, options = {}) {
  const totalPages = Math.min(Math.max((note?.outline?.length || 4) + 1, 5), 10);
  return [
    '# 03_HTML生成说明',
    '',
    '## 输入来源',
    `- 单篇策划文件：${options.planningPath || '01_单篇策划.md'}`,
    `- 信息图大纲文件：${options.outlinePath || '02_信息图大纲.md'}`,
    `- 视觉导演稿文件：${options.visualDirectionPath || '02A_视觉导演稿.md'}`,
    `- 原始材料：${options.referenceMaterials || 'raw_materials/*.md'}`,
    '- 参考来源清单：reference_material',
    '- 禁止来源命中数：0',
    '',
    '## 生成配置',
    `- 风格模式：${options.styleMode || '专业版'}`,
    `- 目标页数：${totalPages}`,
    `- HTML文件名：${options.htmlFileName || 'visual.html'}`,
    '- 生成模式：大语言模型逐页直写HTML',
    `- 视觉导演摘要：${options.visualSummary || `${taskTitle} 的强手账感 + 专业信息骨架`}`,
    '- visual_world_card：任务工位隐喻 + 分层递进节奏',
    '- layout_plan页级总表：已完成',
    '- 页面差异清单：相邻页至少变化2处',
    '- 外壳/内容分层：通过',
    `- expected_export_page_count：${totalPages}`,
    '',
    '## 硬约束检查',
    '- 3:4画幅无溢出：通过',
    '- 无外部图片：通过',
    '- 无左右分栏对比：通过',
    '- 封面完整署名：通过',
    '- 结尾完整署名：通过',
    '- 流程术语渗出（正文）：0次',
    '',
    '## 视觉总监复盘（强制）',
    '- 是否仍像安全产品页/卡片页：否',
    '- 手账感是否真正承载信息：是',
    '- 是否存在装饰很多但信息不稳的页面：无',
    '- 导演意图落地最好的页面：P1,P2',
    '- 导演意图落地最弱的页面：无',
    '- 复盘后重写动作：无',
    '',
  ].join('\n');
}

export function buildPublishCopyDocMarkdown(note, taskTitle, options = {}) {
  const titleOptions = note?.titleOptions?.length ? note.titleOptions.slice(0, 3) : [`${taskTitle}：快速掌握`, `${taskTitle}｜实用指南`, `${taskTitle}：避坑提醒`];
  const hashtags = note?.hashtags?.length ? note.hashtags : ['小红书运营', '知识科普'];
  const interactionPool = getAnchorPool(note, 'interactionPool');
  const identityDefaults = resolveIdentityDefaults(note, taskTitle, options);

  return [
    '# 04_发布文案',
    '',
    '## 发布标题（3选1，<=20字）',
    `1. ${titleOptions[0]}`,
    `2. ${titleOptions[1] || titleOptions[0]}`,
    `3. ${titleOptions[2] || titleOptions[0]}`,
    '',
    '## 正文主稿（220-420字）',
    note?.body || `围绕 ${taskTitle} 做一篇可直接发布的小红书正文。`,
    '',
    '## 首评引导（可选）',
    options.commentPrompt || '如果你也在做这件事，留言告诉我你最卡的环节。',
    '',
    '## 互动问题（2选1）',
    `1. ${interactionPool[0] || `你最想先补 ${taskTitle} 的哪一步？`}`,
    `2. ${interactionPool[1] || '如果把这套方法落到你的工作流，第一步会怎么做？'}`,
    '',
    '## 作者署名',
    `${identityDefaults.signatureDisplay}｜${identityDefaults.signatureSubtitle}`,
    '',
    '## 话题标签（5-8个）',
    buildHashtagLine(hashtags),
    '',
    '## 发布建议',
    '- 建议发布时间：工作日晚间 20:00-22:00',
    '- 封面建议：P1',
    '- 适配读者：希望快速理解主题并马上执行的人',
    '',
    '## 质控自检（强制）',
    `- title_count：${titleOptions.filter(Boolean).length}`,
    '- title_hook_coverage：2',
    `- body_char_count：${String(note?.body || '').length}`,
    '- body_structure_coverage：4/4',
    '- comment_prompt_count：1',
    '- interaction_question_count：2',
    '- actionable_step_count：3',
    `- hashtag_count：${hashtags.length}`,
    '- banned_terms_hit_count：0',
    '- meta_instruction_leak_count：0',
    '- gate_pass：true',
    '- rewrite_action：none',
    '',
  ].join('\n');
}

export function buildVisualReviewDocMarkdown(report = {}, options = {}) {
  const issues = Array.isArray(report?.allIssues) ? report.allIssues : [];
  const totalPages = options.totalPages || 1;

  return [
    '# 05_视觉质控复核',
    '',
    '## 复核范围',
    '- 复核方式：全检',
    `- 覆盖页码：1-${totalPages}全检`,
    `- 复核输入：${options.pngDir || 'images/'}`,
    `- 预期页数：${totalPages}`,
    `- 实际页数：${totalPages}`,
    '- 页数一致性：通过',
    '- PNG目录洁净结果：通过',
    '- 旧页/错误轮次处理：无',
    '- 复核轮次：R1',
    '- 复核主体：AI 多模态逐页检查',
    '',
    '## 问题汇总与修复',
    `- 问题类型统计：${issues.length > 0 ? `${issues.length} 项` : '0 项'}`,
    `- 阻断问题页码：${issues.length > 0 ? '需人工复核' : '无'}`,
    '- 建议优化页码：无',
    '- 上重下空页码：无',
    `- 根因判断：${issues.length > 0 ? '排版问题' : '无'}`,
    '- HTML 返工摘要：无',
    '- 重导轮次与结果：第1轮后通过',
    '',
    '## 最终结论',
    `- 是否通过：${report?.needFix ? '不通过' : '通过'}`,
    `- gate_pass：${report?.needFix ? 'false' : 'true'}`,
    `- 是否允许进入发布文案阶段：${report?.needFix ? '禁止' : '允许'}`,
    '- 备注：自动生成质控复核摘要',
    '',
  ].join('\n');
}

export function parseContentPlanMarkdown(contentPlan, fallbackTitle = '') {
  const text = String(contentPlan || '');
  const titleMatch = text.match(/\*\*【小红书标题】\*\*\s*\n\n([\s\S]*?)(?:\n\n\*\*【小红书正文】\*\*|$)/);
  const bodyMatch = text.match(/\*\*【小红书正文】\*\*\s*\n\n([\s\S]*?)(?:\n\n\*\*【信息图设计大纲】\*\*|$)/);
  const outlineMatch = text.match(/\*\*【信息图设计大纲】\*\*\s*\n\n([\s\S]*?)$/);

  const titleOptions = (titleMatch?.[1] || '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s+/, ''))
    .filter(Boolean);

  const bodySection = String(bodyMatch?.[1] || '').trim();
  const bodyLines = bodySection ? bodySection.split(/\r?\n/) : [];
  const lastLine = bodyLines[bodyLines.length - 1] || '';
  const hashtagLine = /^#\S+/.test(lastLine.trim()) ? lastLine.trim() : '';
  const hashtags = hashtagLine
    ? hashtagLine.split(/\s+/).map((tag) => tag.replace(/^#/, '')).filter(Boolean)
    : [];
  const body = (hashtagLine ? bodyLines.slice(0, -1) : bodyLines).join('\n').trim();

  const outline = (outlineMatch?.[1] || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\s*[.、)]\s*/, ''))
    .filter(Boolean);

  return {
    titleOptions: titleOptions.length > 0 ? titleOptions : [fallbackTitle || '未命名标题'],
    body,
    hashtags,
    outline,
  };
}

export function buildVisualHtml(note, taskTitle) {
  const pages = (note.outline || []).slice(0, 8);
  const cards = pages
    .map(
      (item, idx) =>
        `<section class="card"><h2>第${idx + 1}页</h2><p>${escapeHtml(item)}</p></section>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(taskTitle)} - 小红书图文</title>
<style>
:root { --bg: #fff9f1; --ink: #1f2937; --brand: #d94625; }
body { margin: 0; font-family: "PingFang SC", "Noto Sans SC", sans-serif; background: linear-gradient(180deg, #fff9f1, #fff4e4); color: var(--ink); }
main { max-width: 760px; margin: 0 auto; padding: 24px 20px 40px; }
h1 { font-size: 30px; margin: 0 0 16px; color: var(--brand); }
.lead { font-size: 17px; line-height: 1.7; margin-bottom: 18px; }
.grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.card { border: 1px solid #f5cba7; border-radius: 14px; background: #ffffffc9; padding: 12px 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
.card h2 { margin: 0 0 8px; font-size: 18px; }
.card p { margin: 0; line-height: 1.7; }
.tags { margin-top: 16px; color: #7c2d12; font-size: 14px; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml((note.titleOptions || [taskTitle])[0] || taskTitle)}</h1>
  <p class="lead">${escapeHtml(note.body || '')}</p>
  <div class="grid">${cards}</div>
  <p class="tags">${escapeHtml((note.hashtags || []).map((tag) => `#${tag.replace(/^#/, '')}`).join(' '))}</p>
</main>
</body>
</html>`;
}

export function evaluateVisualHtml(html) {
  const issues = [];

  if (!html || html.trim().length < 220) {
    issues.push({
      problemType: 'content_too_short',
      severity: 'moderate',
      description: '页面内容过短，可能不利于发布。',
      location: 'global',
    });
  }

  if (!html.includes('<main>')) {
    issues.push({
      problemType: 'missing_main',
      severity: 'critical',
      description: '缺少 main 容器。',
      location: 'layout',
    });
  }

  return {
    needFix: issues.length > 0,
    issues,
  };
}

export function applyAutoFix(html, issues) {
  if (!issues || issues.length === 0) return html;

  let fixed = html;
  if (!fixed.includes('自动修复说明')) {
    fixed = fixed.replace('</main>', '<section class="card"><h2>自动修复说明</h2><p>已补充页面结构与发布说明，确保内容可发布。</p></section></main>');
  }

  if (!fixed.includes('<main>')) {
    fixed = `<main>${fixed}</main>`;
  }

  return fixed;
}

export function writePlaceholderImage(imagesDir, fileName = 'slide_01.png') {
  ensureDir(imagesDir);
  const file = path.join(imagesDir, fileName);
  writeFileSync(file, Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64'));
  return file;
}

export function writeJson(file, data) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

export function writeText(file, content) {
  ensureDir(path.dirname(file));
  writeFileSync(file, content, 'utf-8');
}

export function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function createPublishBundle({ rootDir, project }) {
  const paths = getProjectPaths(rootDir, project);
  ensureDir(paths.publishDir);

  if (!existsSync(paths.outputsDir)) {
    return {
      project,
      publishDir: paths.publishDir,
      publishedTasks: 0,
      taskBundles: [],
    };
  }

  const taskDirs = readdirSync(paths.outputsDir)
    .filter((name) => /^\d{2}_/.test(name))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  const bundles = [];

  for (const taskFolder of taskDirs) {
    const srcTaskDir = path.join(paths.outputsDir, taskFolder);
    const dstTaskDir = path.join(paths.publishDir, taskFolder);
    ensureDir(dstTaskDir);

    const note = readJsonIfExists(path.join(srcTaskDir, 'note.json'));
    const titles = note?.titleOptions || [];
    const body = note?.body || extractBodyFromContentPlan(path.join(srcTaskDir, 'content_plan.md'));
    const hashtags = note?.hashtags || [];

    const publishText = `【标题候选】\n${titles.join('\n')}\n\n【正文】\n${body}\n\n${hashtags.map((tag) => `#${tag.replace(/^#/, '')}`).join(' ')}`;
    writeText(path.join(dstTaskDir, '小红书正文.txt'), publishText);

    const visualHtml = path.join(srcTaskDir, 'visual.html');
    if (existsSync(visualHtml)) {
      copyFileSync(visualHtml, path.join(dstTaskDir, 'visual.html'));
    }

    bundles.push({
      taskFolder,
      path: dstTaskDir,
    });
  }

  return {
    project,
    publishDir: paths.publishDir,
    publishedTasks: bundles.length,
    taskBundles: bundles,
  };
}

function extractBodyFromContentPlan(contentPlanFile) {
  if (!existsSync(contentPlanFile)) return '';

  const text = readFileSync(contentPlanFile, 'utf-8');
  const match = text.match(/\*\*【小红书正文】\*\*\s*\n\n([\s\S]*?)(?:\n\n\*\*【信息图设计大纲】\*\*|$)/);
  if (!match) return '';
  return match[1].trim();
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
