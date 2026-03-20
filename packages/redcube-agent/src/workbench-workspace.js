import path from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';

const TOPIC_STAGE_FILES = {
  taskBrief: '00_任务说明.md',
  materials: '01_素材清单.md',
  facts: '02_素材解析与事实基线.md',
  storyline: '03_叙事风格与故事线.md',
  seriesPlan: '04_系列笔记目录.md',
  publishingRhythm: '05_全系列发布节奏建议.md',
  indexMap: '06_目录索引与路径映射.md',
  delivery: '99_交付总览.md',
};

const NOTE_STAGE_FILES = {
  planning: '01_单篇策划.md',
  infographicOutline: '02_信息图大纲.md',
  visualDirection: '02A_视觉导演稿.md',
  htmlGeneration: '03_HTML生成说明.md',
  publishCopy: '04_发布文案.md',
  visualReview: '05_视觉质控复核.md',
};

function safeEntries(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

function asFileMeta(fullPath) {
  return {
    path: fullPath,
    fileName: path.basename(fullPath),
    name: path.basename(fullPath),
  };
}

function classifyInputFile(relativePath) {
  const normalized = String(relativePath || '').replaceAll('\\', '/').toLowerCase();
  const fileName = path.basename(normalized);

  if (normalized.startsWith('templates/')) return 'template';
  if (fileName === 'agent_preset.md' || /(preset|persona|人设|角色|system)/.test(fileName)) return 'persona_rule';
  if (/(style|tone|voice|风格)/.test(fileName)) return 'style';
  if (/(source_material|素材|材料|参考|资料|文献|lecture|讲课|fact|research)/.test(normalized)) return 'reference_material';
  if (/^(00_|brief|启动任务|任务说明)/.test(fileName) || /(任务说明|启动任务|brief)/.test(fileName)) return 'task_brief';
  return 'other';
}

function readStageFiles(dir, mapping) {
  const stageFiles = {};

  for (const [key, fileName] of Object.entries(mapping)) {
    const fullPath = path.join(dir, fileName);
    stageFiles[key] = existsSync(fullPath) ? asFileMeta(fullPath) : null;
  }

  return stageFiles;
}

function readInputFiles(inputDir, baseDir = inputDir) {
  const files = [];

  for (const entry of safeEntries(inputDir)) {
    const fullPath = path.join(inputDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readInputFiles(fullPath, baseDir));
      continue;
    }

    files.push({
      ...asFileMeta(fullPath),
      relativePath: path.relative(baseDir, fullPath),
      dirPath: path.dirname(fullPath),
      category: classifyInputFile(path.relative(baseDir, fullPath)),
    });
  }

  return files;
}

function readNoteArtifacts(noteDir) {
  const files = safeEntries(noteDir);
  const htmlEntry = files.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'));
  const publishCopyEntry = files.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'));
  const imageDirEntry = files.find((entry) => {
    if (!entry.isDirectory()) return false;
    const fullPath = path.join(noteDir, entry.name);
    return safeEntries(fullPath).some(
      (child) => child.isFile() && child.name.toLowerCase().endsWith('.png'),
    );
  });

  const imageDir = imageDirEntry ? path.join(noteDir, imageDirEntry.name) : '';
  const slides = imageDir
    ? safeEntries(imageDir)
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
      .map((entry) => asFileMeta(path.join(imageDir, entry.name)))
    : [];

  return {
    html: htmlEntry ? asFileMeta(path.join(noteDir, htmlEntry.name)) : null,
    publishCopy: publishCopyEntry ? asFileMeta(path.join(noteDir, publishCopyEntry.name)) : null,
    slideDir: imageDirEntry ? asFileMeta(imageDir) : null,
    slides,
  };
}

function readNote(noteDir, topicSlug) {
  return {
    topicSlug,
    slug: path.basename(noteDir),
    name: path.basename(noteDir),
    dir: noteDir,
    stageFiles: readStageFiles(noteDir, NOTE_STAGE_FILES),
    artifacts: readNoteArtifacts(noteDir),
  };
}

function readTopic(topicSlug, workspaceRoot) {
  const inputDir = path.join(workspaceRoot, 'input', topicSlug);
  const outputDir = path.join(workspaceRoot, 'output', topicSlug);
  const noteEntries = safeEntries(outputDir)
    .filter((entry) => entry.isDirectory() && /^Note_/i.test(entry.name))
    .map((entry) => readNote(path.join(outputDir, entry.name), topicSlug));

  return {
    slug: topicSlug,
    name: topicSlug,
    inputDir: existsSync(inputDir) ? inputDir : null,
    inputFiles: existsSync(inputDir) ? readInputFiles(inputDir) : [],
    outputDir: existsSync(outputDir) ? outputDir : null,
    inputPreset: existsSync(path.join(inputDir, 'AGENT_PRESET.md'))
      ? asFileMeta(path.join(inputDir, 'AGENT_PRESET.md'))
      : null,
    inputTemplatesDir: existsSync(path.join(inputDir, 'templates'))
      ? asFileMeta(path.join(inputDir, 'templates'))
      : null,
    stageFiles: existsSync(outputDir) ? readStageFiles(outputDir, TOPIC_STAGE_FILES) : {},
    notes: noteEntries,
  };
}

export function listWorkbenchTopics(workspaceRoot) {
  const inputDir = path.join(workspaceRoot, 'input');
  const outputDir = path.join(workspaceRoot, 'output');

  const topicNames = new Set();

  for (const entry of safeEntries(inputDir)) {
    if (entry.isDirectory() && entry.name !== 'archives') {
      topicNames.add(entry.name);
    }
  }

  for (const entry of safeEntries(outputDir)) {
    if (entry.isDirectory()) {
      topicNames.add(entry.name);
    }
  }

  const topics = Array.from(topicNames)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    .map((topicSlug) => readTopic(topicSlug, workspaceRoot));

  return {
    ok: existsSync(workspaceRoot) && statSync(workspaceRoot).isDirectory(),
    workspaceRoot,
    topics,
  };
}
