// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  DEFAULT_CODEX_GENERATION_TIMEOUT_MS,
  DEFAULT_CODEX_VISUAL_REVIEW_TIMEOUT_MS,
  REDCUBE_CREATIVE_GENERATION_META_BEGIN,
  REDCUBE_CREATIVE_GENERATION_META_END,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  REPO_ROOT,
} from './constants.js';
import { compactStringArray, safeText } from './shared.js';

export function readPromptGuidance(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing prompt pack asset: ${relativePath}`);
  }

  const raw = readFileSync(absolutePath, 'utf-8');
  const runtimeSectionIndex = raw.search(/^##\s+runtime_(seed|artifact)\b/m);
  if (runtimeSectionIndex === -1) {
    return raw.trim();
  }
  return raw.slice(0, runtimeSectionIndex).trim();
}

export function extractMarkedJson(text) {
  const raw = safeText(text);
  if (!raw) return null;

  const start = raw.indexOf(REDCUBE_STAGE_JSON_BEGIN);
  const end = raw.indexOf(REDCUBE_STAGE_JSON_END);
  const candidate = start >= 0 && end > start
    ? raw.slice(start + REDCUBE_STAGE_JSON_BEGIN.length, end).trim()
    : raw;
  const unfenced = candidate.startsWith('```')
    ? candidate.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : candidate;

  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}

export function normalizeLocalFileInspection(value) {
  return (Array.isArray(value) ? value : [])
    .map((entry) => ({
      label: safeText(entry?.label, 'local-file'),
      path: safeText(entry?.path),
      media_type: safeText(entry?.media_type, 'application/octet-stream'),
      purpose: safeText(entry?.purpose),
    }))
    .filter((entry) => entry.path);
}

export function buildPromptFiles(promptRelativePath, localFileInspection = []) {
  return compactStringArray([
    promptRelativePath,
    ...normalizeLocalFileInspection(localFileInspection).map((entry) => entry.path),
  ]);
}

export function buildLocalFileInspectionSection(localFileInspection = []) {
  const entries = normalizeLocalFileInspection(localFileInspection);
  if (entries.length === 0) {
    return '';
  }
  return [
    '## Provided Local Files',
    'Only inspect the local files explicitly listed below.',
    '',
    ...entries.flatMap((entry, index) => {
      const block = [
        `### File ${index + 1}: ${entry.label}`,
        `- path: ${entry.path}`,
      ];
      if (entry.purpose) {
        block.push(`- purpose: ${entry.purpose}`);
      }
      if (entry.media_type.startsWith('image/')) {
        block.push(`![${entry.label}](<${entry.path}>)`);
      }
      block.push('');
      return block;
    }),
  ].join('\n');
}

export function buildGenerationInstructions(family, route, localFileInspection = []) {
  const localFiles = normalizeLocalFileInspection(localFileInspection);
  return [
    'You are the RedCube AI Codex-native creative generation runtime.',
    `Produce the ${family}:${route} artifact as audience-facing creative output.`,
    localFiles.length > 0
      ? 'You may inspect only the provided local files embedded in this prompt. Do not browse external sources or inspect any other files.'
      : 'Do not use tools or browse external sources.',
    'Work only from the provided guidance, context, and output contract.',
    'Treat operator meta instructions as production constraints, not deck/note/poster copy.',
    'Never quote internal workflow notes, cover instructions, hidden review rules, or process directives into audience-facing fields.',
    `Return only the final JSON between ${REDCUBE_STAGE_JSON_BEGIN} and ${REDCUBE_STAGE_JSON_END}.`,
  ].join(' ');
}

export function resolveGenerationTimeoutMs(timeoutMs, localFileInspection = [], options = {}) {
  if (Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0) {
    return Number(timeoutMs);
  }
  if (safeText(options?.route) === 'render_html') {
    return DEFAULT_CODEX_VISUAL_REVIEW_TIMEOUT_MS;
  }
  const hasImageInspection = normalizeLocalFileInspection(localFileInspection)
    .some((entry) => safeText(entry?.media_type).startsWith('image/'));
  return hasImageInspection ? DEFAULT_CODEX_VISUAL_REVIEW_TIMEOUT_MS : DEFAULT_CODEX_GENERATION_TIMEOUT_MS;
}

export function buildGenerationInput({ family, route, promptRelativePath, context, outputContract, localFileInspection = [] }) {
  const guidance = readPromptGuidance(promptRelativePath);
  const localFileSection = buildLocalFileInspectionSection(localFileInspection);
  return [
    '# RedCube Structured Generation',
    '',
    `${REDCUBE_CREATIVE_GENERATION_META_BEGIN}`,
    JSON.stringify({
      kind: 'redcube_stage_json_generation',
      family,
      route,
      prompt_pack_file: promptRelativePath,
      context,
    }, null, 2),
    `${REDCUBE_CREATIVE_GENERATION_META_END}`,
    '',
    '## Prompt Pack Guidance',
    guidance,
    '',
    '## Context',
    '```json',
    JSON.stringify(context, null, 2),
    '```',
    '',
    '## Output Contract',
    '```json',
    JSON.stringify(outputContract, null, 2),
    '```',
    '',
    ...(localFileSection ? [localFileSection, ''] : []),
    '## Output Rule',
    `Return JSON only between ${REDCUBE_STAGE_JSON_BEGIN} and ${REDCUBE_STAGE_JSON_END}.`,
  ].join('\n');
}
