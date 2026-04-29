// @ts-nocheck
import { readySources, safeArray, safeText } from '../shared.ts';

function manuscriptLabels(meta) {
  const text = [
    safeText(meta?.context?.delivery_goal),
    safeText(meta?.context?.goal),
    safeText(meta?.context?.title),
    ...safeArray(meta?.context?.source_materials_full_text).map((material) => safeText(material?.content_text)),
  ].filter(Boolean).join('\n');
  const labels = [...new Set([...text.matchAll(/第\s*([一二三四五六七八九十\d]{1,3})\s*篇/g)]
    .map((match) => `第${safeText(match[1])}篇`))];
  return labels.length > 0 ? labels.slice(0, 3) : ['第一篇', '第二篇', '第三篇'];
}

function numericEvidenceSnippets(meta) {
  const text = safeArray(meta?.context?.source_materials_full_text)
    .map((material) => safeText(material?.content_text))
    .filter(Boolean)
    .join('\n');
  const lines = text
    .split(/\n+/)
    .map((line) => safeText(line))
    .filter((line) => /(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?\s*%|\bAUROC\b|\bBrier\b|校准斜率|Knosp|中位|<\s*0\.?\d+)/i.test(line));
  return lines.length > 0
    ? lines.slice(0, 8)
    : ['357例；57/357，16.0%；AUROC 0.800；Brier 0.110'];
}

function buildMockManuscriptEvidenceTable(meta) {
  if (safeText(meta?.context?.content_density_contract?.purpose) !== 'manuscript_submission_sync') {
    return [];
  }
  const labels = manuscriptLabels(meta);
  const snippets = numericEvidenceSnippets(meta);
  return labels.map((label, index) => ({
    manuscript_label: label,
    research_question: `${label}回答一个待投稿论文研究问题`,
    primary_endpoint: `${label}主要终点`,
    method_or_model: `${label}方法或模型主线`,
    key_numeric_results: [
      snippets[index % snippets.length],
      snippets[(index + 1) % snippets.length],
    ],
    main_conclusion: `${label}的结论由数字证据支撑`,
    boundary: `${label}仍需保留单中心和外部验证边界`,
  }));
}

export function buildMockStoryline(meta) {
  const title = safeText(meta?.context?.title) || '未命名课件';
  const audience = safeText(meta?.context?.audience) || '专业听众';
  const speaker = safeText(meta?.context?.speaker) || '正式讲者';
  return {
    speaker,
    audience,
    style: `先讲 ${title} 的问题定义，再讲自动化链路与证据边界，最后讲可复用动作`,
    core_metaphor: `把 ${title} 讲成一条从研究问题到稳定交付的闭环`,
    hook: [`为什么 ${title} 现在值得讲清：自动化能力开始真正影响科研效率与质量`],
    journey: [
      '先界定这套系统想解决的科研断点是什么',
      '再拆自动化主链如何把任务逐步推进到可交付结果',
      '最后收束到哪些模块可复用、哪些边界必须人工把关',
    ],
    resolution: ['听众带走一条可复述的系统主线，而不是一堆内部流程术语'],
    manuscript_evidence_table: buildMockManuscriptEvidenceTable(meta),
  };
}
