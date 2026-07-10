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

const PROFESSIONAL_SPECIALIST_SKILL_FILES = Object.freeze({
  story_architect: {
    title: 'Story Architect',
    path: 'agent/professional_skills/rca-ppt-story-architect/SKILL.md',
  },
  visual_director: {
    title: 'Visual Director',
    path: 'agent/professional_skills/rca-ppt-visual-director/SKILL.md',
  },
  template_profiler: {
    title: 'Template Profiler',
    path: 'agent/professional_skills/rca-template-profiler/SKILL.md',
  },
  page_author: {
    title: 'Page Author',
    path: 'agent/professional_skills/rca-ppt-page-author/SKILL.md',
  },
  native_ppt_designer: {
    title: 'Native PPT Designer',
    path: 'agent/professional_skills/rca-native-ppt-designer/SKILL.md',
  },
  reviewer: {
    title: 'Reviewer',
    path: 'agent/professional_skills/rca-ppt-reviewer/SKILL.md',
  },
  visual_memory_curator: {
    title: 'Visual Memory Curator',
    path: 'agent/professional_skills/rca-visual-memory-curator/SKILL.md',
  },
});

const PROFESSIONAL_SPECIALIST_SKILLS_BY_ROUTE = Object.freeze({
  'ppt_deck:storyline': ['story_architect'],
  'ppt_deck:detailed_outline': ['story_architect'],
  'ppt_deck:slide_blueprint': ['story_architect'],
  'ppt_deck:visual_direction': ['visual_director', 'template_profiler'],
  'ppt_deck:author_image_pages': ['page_author', 'visual_director'],
  'ppt_deck:render_html': ['page_author', 'visual_director'],
  'ppt_deck:author_pptx_native': ['native_ppt_designer', 'template_profiler'],
  'ppt_deck:repair_pptx_native': ['native_ppt_designer', 'template_profiler', 'reviewer'],
  'ppt_deck:director_review': ['reviewer'],
  'ppt_deck:visual_director_review': ['reviewer'],
  'ppt_deck:screenshot_review': ['reviewer'],
  'ppt_deck:repair_image_pages': ['reviewer'],
  'ppt_deck:fix_html': ['reviewer'],
  'ppt_deck:export_pptx': ['reviewer', 'visual_memory_curator'],
});

function readPromptGuidance(relativePath) {
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

function routeKeyFor(family, route) {
  return `${safeText(family)}:${safeText(route)}`;
}

function readProfessionalSkillGuidance(skill, routeKey) {
  const relativePath = safeText(skill?.path);
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing RCA professional specialist skill guidance for ${routeKey}: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf-8').trim();
}

function buildProfessionalSkillGuidanceSection(family, route) {
  const routeKey = routeKeyFor(family, route);
  const skillIds = Array.from(new Set((PROFESSIONAL_SPECIALIST_SKILLS_BY_ROUTE[routeKey] || [])
    .map((skillId) => safeText(skillId))
    .filter(Boolean)));
  if (skillIds.length === 0) {
    return '';
  }

  return [
    '## RCA Professional Specialist Skill Guidance',
    'Use only the repo-local declared specialist guidance below. Do not browse or inspect other files for skill guidance.',
    '',
    ...skillIds.flatMap((skillId) => {
      const skill = PROFESSIONAL_SPECIALIST_SKILL_FILES[skillId];
      if (!skill) {
        throw new Error(`Missing RCA professional specialist skill mapping for ${routeKey}: ${skillId}`);
      }
      return [
        `### ${skill.title}`,
        `Source: ${skill.path}`,
        readProfessionalSkillGuidance(skill, routeKey),
        '',
      ];
    }),
  ].join('\n').trim();
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

function normalizeLocalFileInspection(value) {
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

function buildLocalFileInspectionSection(localFileInspection = []) {
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
  const envDefaultTimeoutMs = Number(process.env.REDCUBE_CODEX_GENERATION_TIMEOUT_MS);
  const defaultGenerationTimeoutMs = Number.isFinite(envDefaultTimeoutMs) && envDefaultTimeoutMs > 0
    ? envDefaultTimeoutMs
    : DEFAULT_CODEX_GENERATION_TIMEOUT_MS;
  const envVisualTimeoutMs = Number(process.env.REDCUBE_CODEX_VISUAL_REVIEW_TIMEOUT_MS);
  const defaultVisualTimeoutMs = Number.isFinite(envVisualTimeoutMs) && envVisualTimeoutMs > 0
    ? envVisualTimeoutMs
    : DEFAULT_CODEX_VISUAL_REVIEW_TIMEOUT_MS;
  if (safeText(options?.route) === 'render_html') {
    return defaultVisualTimeoutMs;
  }
  const hasImageInspection = normalizeLocalFileInspection(localFileInspection)
    .some((entry) => safeText(entry?.media_type).startsWith('image/'));
  return hasImageInspection ? defaultVisualTimeoutMs : defaultGenerationTimeoutMs;
}

export function buildGenerationInput({ family, route, promptRelativePath, context, outputContract, localFileInspection = [] }) {
  const guidance = readPromptGuidance(promptRelativePath);
  const professionalSkillSection = buildProfessionalSkillGuidanceSection(family, route);
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
    ...(professionalSkillSection ? [professionalSkillSection, ''] : []),
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
