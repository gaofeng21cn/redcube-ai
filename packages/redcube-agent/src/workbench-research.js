import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { safeFilename } from '../../redcube-tools/src/index.js';

const FETCH_TIMEOUT_MS = 20_000;
const RESEARCH_ROUNDS = 3;
const QUERIES_PER_ROUND = 4;
const MAX_RESULTS_PER_QUERY = 6;
const MAX_SOURCES = 12;
const TARGET_SOURCE_COUNT = 8;
const TARGET_TOTAL_CHARS = 9_000;
const MIN_SOURCE_CHARS = 140;
const MATERIAL_SUFFICIENT_CHARS = 1_200;

const EXPLICIT_RESEARCH_PATTERN =
  /(联网搜集资料|联网研究|联网搜索|上网搜索|网上搜索|自行搜索|自行查找|补充资料|补充材料|补齐资料|补齐材料|查资料|查最新|最新进展|deep\s*research|research)/i;

function safeEntries(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((entry) => !entry.name.startsWith('.'));
}

function collectTopicInputFiles(dir, baseDir = dir) {
  const files = [];

  for (const entry of safeEntries(dir)) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTopicInputFiles(fullPath, baseDir));
      continue;
    }

    files.push({
      fullPath,
      relativePath: path.relative(baseDir, fullPath).replaceAll('\\', '/'),
      content: readFileSync(fullPath, 'utf-8'),
    });
  }

  return files;
}

function isPresetOrTemplate(relativePath = '') {
  const normalized = String(relativePath || '').toLowerCase();
  return normalized === 'agent_preset.md' || normalized.startsWith('templates/');
}

function isBriefFile(relativePath = '') {
  const normalized = String(relativePath || '').toLowerCase();
  const fileName = path.basename(normalized);
  return /^(00_|brief)/.test(fileName) || /(启动任务|任务说明)/.test(fileName);
}

function isResearchFile(relativePath = '') {
  const normalized = String(relativePath || '').replaceAll('\\', '/').toLowerCase();
  return normalized.startsWith('research/') || normalized.includes('/research/');
}

function decodeXmlEntities(text) {
  return String(text || '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function stripMarkdownNoise(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/^\s*[-*]\s+/gm, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_`>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTaskDescription(briefText = '') {
  const match = String(briefText || '').match(/##\s*任务说明\s*\n([\s\S]*)$/);
  const section = match ? match[1] : String(briefText || '');
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => !/^允许联网搜集资料/.test(line));

  return lines.join(' ').trim();
}

function summarizeMaterialStats(files) {
  const materialFiles = files.filter((file) => !isPresetOrTemplate(file.relativePath) && !isBriefFile(file.relativePath));
  const localMaterials = materialFiles.filter((file) => !isResearchFile(file.relativePath));
  const availableText = materialFiles.map((file) => file.content).join('\n\n').trim();
  const localText = localMaterials.map((file) => file.content).join('\n\n').trim();
  const headings = (availableText.match(/^#{1,3}\s+/gm) || []).length;

  return {
    fileCount: materialFiles.length,
    charCount: stripMarkdownNoise(availableText).length,
    localFileCount: localMaterials.length,
    localCharCount: stripMarkdownNoise(localText).length,
    headingCount: headings,
    text: availableText,
    localText,
  };
}

function inspectResearchNeed({ workspaceRoot, topic }) {
  const topicInputDir = path.join(workspaceRoot, 'input', topic);
  const files = existsSync(topicInputDir) ? collectTopicInputFiles(topicInputDir) : [];
  const briefFile = files.find((file) => isBriefFile(file.relativePath));
  const briefText = briefFile?.content || '';
  const taskDescription = extractTaskDescription(briefText);
  const materialStats = summarizeMaterialStats(files);
  const webResearchEnabled = /允许联网搜集资料\s*[:：]\s*是/.test(briefText);
  const explicitRequest = EXPLICIT_RESEARCH_PATTERN.test(`${topic}\n${taskDescription}\n${materialStats.text}`);
  const materialInsufficient =
    materialStats.fileCount === 0
    || materialStats.charCount < MATERIAL_SUFFICIENT_CHARS
    || materialStats.headingCount < 2;
  const shouldRun = (webResearchEnabled || explicitRequest) && (materialInsufficient || explicitRequest);

  return {
    topicInputDir,
    briefText,
    taskDescription,
    files,
    materialStats,
    webResearchEnabled,
    explicitRequest,
    materialInsufficient,
    shouldRun,
  };
}

function compactText(text, maxLength = 120) {
  return stripMarkdownNoise(text)
    .replace(/\b(请|联网|研究|补充|材料|资料|形成完整|自动|最新)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function buildResearchSubject(topic, taskDescription, materialText) {
  const subject = compactText([taskDescription, topic, materialText.slice(0, 180)].filter(Boolean).join(' '), 140);
  return subject || String(topic || '').trim() || '主题研究';
}

function buildRoundQueryBatches(subject) {
  const asciiFriendly = /[A-Za-z]{2,}/.test(subject) || /(AI|agent|RAG|LLM|workflow)/i.test(subject);
  const englishSubject = asciiFriendly ? subject : '';

  return [
    [
      `${subject} 最新 进展`,
      `${subject} 实践 案例`,
      `${subject} 核心 方法`,
      `${subject} 权威 指南`,
    ],
    [
      `${subject} 风险 误区`,
      `${subject} 数据 报告`,
      `${subject} 落地 架构`,
      englishSubject ? `${englishSubject} enterprise case study` : `${subject} 国际 实践`,
    ],
    [
      `${subject} 评估 指标`,
      `${subject} 治理 权限`,
      `${subject} benchmark source traceability`,
      `${subject} 2026 trend`,
    ],
  ].map((batch) => batch.map((query) => query.replace(/\s+/g, ' ').trim()).filter(Boolean));
}

async function fetchText(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'RedCube-AI-Workbench/1.0',
      Accept: 'text/plain, text/html, application/xml, application/rss+xml, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

function parseBingRss(xml, query) {
  const items = [];
  const matches = String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of matches) {
    const itemXml = match[1];
    const title = decodeXmlEntities(itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
    const link = decodeXmlEntities(itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '').trim();
    const description = decodeXmlEntities(itemXml.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '').trim();
    const publishedAt = decodeXmlEntities(itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '').trim();

    if (!title || !link) continue;
    items.push({ query, title, link, description, publishedAt });
    if (items.length >= MAX_RESULTS_PER_QUERY) break;
  }

  return items;
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
      parsed.port = '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function buildReaderUrl(sourceUrl) {
  return `https://r.jina.ai/http://${sourceUrl}`;
}

function trimFetchedText(text) {
  return String(text || '')
    .replace(/^Title:\s.*$/m, '')
    .replace(/^URL Source:\s.*$/m, '')
    .replace(/^Published Time:\s.*$/m, '')
    .replace(/^Warning:\s.*$/gm, '')
    .replace(/^Markdown Content:\s*/m, '')
    .trim();
}

async function searchBingRss(query) {
  const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
  const xml = await fetchText(url);
  return parseBingRss(xml, query);
}

async function fetchSourceMarkdown(sourceUrl) {
  try {
    const byReader = await fetchText(buildReaderUrl(sourceUrl));
    return trimFetchedText(byReader);
  } catch {
    const direct = await fetchText(sourceUrl);
    return trimFetchedText(direct);
  }
}

function buildResearchBriefMarkdown({ topic, inspection, subject, queryBatches }) {
  const reasons = [];
  if (inspection.webResearchEnabled) reasons.push('任务明确允许联网搜集资料');
  if (inspection.explicitRequest) reasons.push('任务说明显式要求联网研究/补充资料');
  if (inspection.materialInsufficient) reasons.push(`当前可用材料不足（${inspection.materialStats.fileCount} 个材料文件，约 ${inspection.materialStats.charCount} 字）`);

  return [
    `# ${topic} 自动研究任务`,
    '',
    '## 触发原因',
    ...reasons.map((reason) => `- ${reason}`),
    '',
    '## 研究主题',
    subject,
    '',
    '## 本地任务说明',
    inspection.taskDescription || '未提供明确任务说明。',
    '',
    '## 查询计划',
    ...queryBatches.flatMap((queries, index) => [
      `### 第 ${index + 1} 轮`,
      ...queries.map((query) => `- ${query}`),
      '',
    ]),
  ].join('\n');
}

function clipExcerpt(text, maxLength = 520) {
  return stripMarkdownNoise(text).slice(0, maxLength);
}

function buildClipMarkdown({ source, round, content }) {
  return [
    `# ${source.title}`,
    '',
    `- round: ${round}`,
    `- query: ${source.query}`,
    `- url: ${source.link}`,
    source.publishedAt ? `- published_at: ${source.publishedAt}` : '',
    '',
    source.description ? `> ${source.description}` : '',
    '',
    content.trim(),
    '',
  ].filter(Boolean).join('\n');
}

function buildResearchReportMarkdown({ topic, subject, inspection, clips, roundSummaries, sufficient }) {
  const findings = clips.slice(0, 10).map((clip, index) => [
    `## 发现 ${index + 1}: ${clip.title}`,
    '',
    `- query: ${clip.query}`,
    `- source: ${clip.link}`,
    clip.publishedAt ? `- published_at: ${clip.publishedAt}` : '',
    '',
    clip.excerpt,
    '',
  ].join('\n'));

  return [
    `# ${topic} 自动研究报告`,
    '',
    `- 研究主题：${subject}`,
    `- 是否达到目标材料量：${sufficient ? '是' : '否'}`,
    `- 当前可用材料字数（研究前）：${inspection.materialStats.charCount}`,
    `- 原始本地材料字数：${inspection.materialStats.localCharCount}`,
    `- 收集来源数：${clips.length}`,
    `- 总抽取字数：${clips.reduce((sum, clip) => sum + clip.contentLength, 0)}`,
    '',
    '## 研究结论',
    sufficient
      ? '已形成可直接进入后续故事线与笔记生成的研究材料包。'
      : '已补充到一轮以上研究材料，但仍建议人工复核是否覆盖到你最关心的角度。',
    '',
    '## 轮次摘要',
    ...roundSummaries.map((round) => `- 第 ${round.round} 轮：${round.queries.length} 个 query，命中 ${round.searchResults} 条结果，新增 ${round.newSources} 个来源，新增 ${round.totalChars} 字`),
    '',
    ...findings,
  ].join('\n');
}

function isResearchSufficient(clips) {
  const totalChars = clips.reduce((sum, clip) => sum + clip.contentLength, 0);
  return clips.length >= TARGET_SOURCE_COUNT || totalChars >= TARGET_TOTAL_CHARS;
}

export async function runWorkbenchResearch(config = {}) {
  const workspaceRoot = String(config.workspaceRoot || '').trim();
  const topic = String(config.topic || '').trim();

  if (!workspaceRoot) {
    return { ok: false, triggered: false, error: 'workspaceRoot 不能为空' };
  }
  if (!topic) {
    return { ok: false, triggered: false, error: 'topic 不能为空' };
  }

  const inspection = inspectResearchNeed({ workspaceRoot, topic });
  if (!inspection.shouldRun) {
    return {
      ok: true,
      triggered: false,
      topic,
      reason: inspection.webResearchEnabled || inspection.explicitRequest
        ? '本地材料已足够，跳过联网研究'
        : '未开启联网研究且任务说明未显式要求联网补料',
      webResearchEnabled: inspection.webResearchEnabled,
      explicitRequest: inspection.explicitRequest,
      materialInsufficient: inspection.materialInsufficient,
      materialStats: inspection.materialStats,
    };
  }

  const researchDir = path.join(inspection.topicInputDir, 'research');
  const clipsDir = path.join(researchDir, 'clips');
  mkdirSync(clipsDir, { recursive: true });

  const subject = buildResearchSubject(topic, inspection.taskDescription, inspection.materialStats.text);
  const queryBatches = buildRoundQueryBatches(subject)
    .slice(0, RESEARCH_ROUNDS)
    .map((queries) => queries.slice(0, QUERIES_PER_ROUND));
  const briefFile = path.join(researchDir, 'research_brief.md');
  const reportFile = path.join(researchDir, 'research_report.md');
  const sourcesFile = path.join(researchDir, 'sources.json');

  writeFileSync(briefFile, buildResearchBriefMarkdown({ topic, inspection, subject, queryBatches }), 'utf-8');

  const clips = [];
  const seenUrls = new Set();
  const roundSummaries = [];
  const sourceRecords = [];

  for (const [roundIndex, queries] of queryBatches.entries()) {
    const summary = {
      round: roundIndex + 1,
      queries,
      searchResults: 0,
      newSources: 0,
      totalChars: 0,
    };

    for (const query of queries) {
      let items = [];
      try {
        items = await searchBingRss(query);
      } catch {
        items = [];
      }
      summary.searchResults += items.length;

      for (const item of items) {
        if (clips.length >= MAX_SOURCES) break;

        const normalizedUrl = normalizeUrl(item.link);
        if (!normalizedUrl || seenUrls.has(normalizedUrl)) continue;
        seenUrls.add(normalizedUrl);

        let content = '';
        try {
          content = await fetchSourceMarkdown(item.link);
        } catch {
          continue;
        }
        if (stripMarkdownNoise(content).length < MIN_SOURCE_CHARS) continue;

        const fileStem = safeFilename(`${String(clips.length + 1).padStart(2, '0')}_${item.title}`).slice(0, 80);
        const clipFile = path.join(clipsDir, `${fileStem}.md`);
        writeFileSync(clipFile, buildClipMarkdown({ source: item, round: roundIndex + 1, content }), 'utf-8');

        const record = {
          ...item,
          round: roundIndex + 1,
          normalizedUrl,
          clipFile,
          contentLength: stripMarkdownNoise(content).length,
          excerpt: clipExcerpt(content),
        };

        sourceRecords.push(record);
        clips.push(record);
        summary.newSources += 1;
        summary.totalChars += record.contentLength;

        if (isResearchSufficient(clips) || clips.length >= MAX_SOURCES) {
          break;
        }
      }

      if (isResearchSufficient(clips) || clips.length >= MAX_SOURCES) {
        break;
      }
    }

    roundSummaries.push(summary);

    if (isResearchSufficient(clips) || clips.length >= MAX_SOURCES) {
      break;
    }
  }

  const sufficient = isResearchSufficient(clips);
  writeFileSync(
    sourcesFile,
    JSON.stringify(
      {
        topic,
        subject,
        generatedAt: new Date().toISOString(),
        sufficient,
        rounds: roundSummaries,
        sources: sourceRecords.map((record) => ({
          title: record.title,
          link: record.link,
          description: record.description,
          publishedAt: record.publishedAt,
          query: record.query,
          round: record.round,
          clipFile: record.clipFile,
          contentLength: record.contentLength,
        })),
      },
      null,
      2,
    ),
    'utf-8',
  );
  writeFileSync(
    reportFile,
    buildResearchReportMarkdown({
      topic,
      subject,
      inspection,
      clips,
      roundSummaries,
      sufficient,
    }),
    'utf-8',
  );

  if (clips.length === 0) {
    return {
      ok: false,
      triggered: true,
      topic,
      researchDir,
      briefFile,
      reportFile,
      sourcesFile,
      error: '联网研究已触发，但未能获取有效来源内容',
    };
  }

  return {
    ok: true,
    triggered: true,
    topic,
    researchDir,
    briefFile,
    reportFile,
    sourcesFile,
    sufficient,
    sourceCount: clips.length,
    totalChars: clips.reduce((sum, clip) => sum + clip.contentLength, 0),
    rounds: roundSummaries,
  };
}
