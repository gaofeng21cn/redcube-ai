// @ts-nocheck
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const STAGE_LABELS = Object.freeze({
  research: '资料补齐',
  storyline: '主线故事',
  detailed_outline: '详细大纲',
  single_note_plan: '单篇结构',
  slide_blueprint: '页面蓝图',
  poster_blueprint: '海报蓝图',
  visual_direction: '视觉方向',
  render_html: '版面生成',
  visual_director_review: '导演复核',
  screenshot_review: '截图质检',
  publish_copy: '发布文案',
  export_bundle: '交付打包',
  export_pptx: '最终导出',
});

export const STAGE_RETRY_LIMIT = 1;

export function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function uniqueList(items) {
  return [...new Set(safeArray(items).map((item) => safeText(item)).filter(Boolean))];
}

export function stageLabel(stageId) {
  return STAGE_LABELS[stageId] || stageId;
}

export function formatClock(iso) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function readJsonIfExists(file) {
  if (!existsSync(file)) {
    return null;
  }
  return readJson(file);
}

export function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}
