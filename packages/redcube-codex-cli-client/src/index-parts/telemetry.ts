// @ts-nocheck
import { buildPromptFiles } from './prompt-guidance.js';
import { compactStringArray } from './shared.js';

export function terminalUsage(events = []) {
  const terminalEvent = events.find(
    (event) => event?.event === 'run.completed' || event?.event === 'run.failed',
  );
  return terminalEvent?.usage || null;
}

export function byteLength(text) {
  return Buffer.byteLength(String(text || ''), 'utf-8');
}

export function usageNumber(usage, ...keys) {
  for (const key of keys) {
    const value = usage?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

export function mergeSlideScope(left = {}, right = {}) {
  return {
    slide_ids: compactStringArray([...(left.slide_ids || []), ...(right.slide_ids || [])]),
    target_slide_ids: compactStringArray([...(left.target_slide_ids || []), ...(right.target_slide_ids || [])]),
    reviewed_slide_ids: compactStringArray([...(left.reviewed_slide_ids || []), ...(right.reviewed_slide_ids || [])]),
    reused_slide_ids: compactStringArray([...(left.reused_slide_ids || []), ...(right.reused_slide_ids || [])]),
  };
}

export function collectSlideScope(value, scope = {
  slide_ids: [],
  target_slide_ids: [],
  reviewed_slide_ids: [],
  reused_slide_ids: [],
}) {
  if (Array.isArray(value)) {
    for (const item of value) collectSlideScope(item, scope);
    return mergeSlideScope(scope);
  }
  if (!value || typeof value !== 'object') {
    return mergeSlideScope(scope);
  }

  for (const [key, item] of Object.entries(value)) {
    if (key === 'slide_id') {
      scope.slide_ids.push(String(item || '').trim());
      continue;
    }
    if (key === 'slide_ids') {
      scope.slide_ids.push(...compactStringArray(item));
      continue;
    }
    if (key === 'target_slide_ids') {
      const ids = compactStringArray(item);
      scope.target_slide_ids.push(...ids);
      scope.slide_ids.push(...ids);
      continue;
    }
    if (key === 'reviewed_slide_ids') {
      const ids = compactStringArray(item);
      scope.reviewed_slide_ids.push(...ids);
      scope.slide_ids.push(...ids);
      continue;
    }
    if (key === 'reused_slide_ids') {
      const ids = compactStringArray(item);
      scope.reused_slide_ids.push(...ids);
      scope.slide_ids.push(...ids);
      continue;
    }
    collectSlideScope(item, scope);
  }

  return mergeSlideScope(scope);
}

export function buildGenerationTelemetry({
  prompt,
  promptRelativePath,
  context,
  localFileInspection,
  usage,
}) {
  const promptBytes = byteLength(prompt);
  const contextText = context === undefined ? '' : JSON.stringify(context, null, 2);
  const slideScope = collectSlideScope(context);
  return {
    prompt_pack_file: promptRelativePath,
    prompt_files: buildPromptFiles(promptRelativePath, localFileInspection),
    prompt_bytes: promptBytes,
    context_bytes: byteLength(contextText),
    prompt_tokens: usageNumber(usage, 'prompt_tokens', 'input_tokens'),
    completion_tokens: usageNumber(usage, 'completion_tokens', 'output_tokens'),
    total_tokens: usageNumber(usage, 'total_tokens'),
    estimated_prompt_tokens: Math.ceil(promptBytes / 4),
    provider_usage: usage || null,
    slide_scope: slideScope,
    target_slide_scope: {
      target_slide_ids: slideScope.target_slide_ids,
    },
  };
}
