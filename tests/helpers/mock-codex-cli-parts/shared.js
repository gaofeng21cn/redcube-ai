import path from 'node:path';
import {
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  REDCUBE_CREATIVE_GENERATION_META_BEGIN,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  REDCUBE_CREATIVE_GENERATION_META_END,
} from '../../../packages/redcube-codex-cli-client/src/index.js';

export const MODULE_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export {
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
};

export function parseCreativeGenerationMeta(input) {
  const text = String(input || '');
  const start = text.indexOf(REDCUBE_CREATIVE_GENERATION_META_BEGIN);
  const end = text.indexOf(REDCUBE_CREATIVE_GENERATION_META_END);
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  const jsonText = text
    .slice(start + REDCUBE_CREATIVE_GENERATION_META_BEGIN.length, end)
    .trim();
  return JSON.parse(jsonText);
}

export function safeText(value) {
  return String(value || '').trim();
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(Number(ms) || 0, 0));
}

export function recordParallelOverlap({ lockDir, overlapFile, batchIndex, prefix }) {
  if (!lockDir || !overlapFile || !batchIndex) {
    throw new Error(`mock ${prefix} parallel variant requires lock dir, overlap file, and batch metadata`);
  }
  mkdirSync(lockDir, { recursive: true });
  const markerFile = path.join(lockDir, `${prefix}-${batchIndex}-${process.pid}.lock`);
  writeFileSync(markerFile, `${process.pid}`, 'utf-8');
  try {
    sleepMs(150);
    const activeMarkers = readdirSync(lockDir).filter((entry) => entry.endsWith('.lock'));
    if (activeMarkers.length > 1) {
      writeFileSync(overlapFile, activeMarkers.join('\n'), 'utf-8');
    }
    sleepMs(150);
  } finally {
    rmSync(markerFile, { force: true });
  }
}

export function readySources(meta) {
  const sources = safeArray(meta?.context?.ready_sources).map((item) => safeText(item)).filter(Boolean);
  const padded = sources.length > 0 ? [...sources] : [];
  for (const fallback of ['公开指南', '系统综述', '教学案例']) {
    if (padded.length >= 3) break;
    padded.push(fallback);
  }
  return padded;
}

export function topicFocus(meta) {
  const title = safeText(meta?.context?.title) || '当前主题';
  return title
    .replace(/\s+(deck|baseline|优化版|科普|知识海报|讲课 deck)$/gi, '')
    .trim() || title;
}
