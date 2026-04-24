import path from 'node:path';

import {
  MODULE_DIR,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  parseCreativeGenerationMeta,
  safeText,
} from './shared.js';
import {
  buildMockBlueprint,
  buildMockOutline,
  buildMockPptDirectorReview,
  buildMockPptRender,
  buildMockPptScreenshotReview,
  buildMockStoryline,
  buildMockVisualDirection,
} from './ppt-builders.js';
import {
  buildMockXhsDirectorReview,
  buildMockXhsPlan,
  buildMockXhsPublishCopy,
  buildMockXhsRender,
  buildMockXhsScreenshotReview,
  buildMockXhsStoryline,
  buildMockXhsVisualDirection,
} from './xiaohongshu-builders.js';
import {
  buildMockPosterBlueprint,
  buildMockPosterDirectorReview,
  buildMockPosterRender,
  buildMockPosterScreenshotReview,
  buildMockPosterStoryline,
  buildMockPosterVisualDirection,
} from './poster-builders.js';

export function buildCreativeRunOutput(meta) {
  const family = safeText(meta?.family, 'ppt_deck');
  const route = safeText(meta?.route);
  if (family === 'xiaohongshu') {
    switch (route) {
      case 'storyline':
        return buildMockXhsStoryline(meta);
      case 'single_note_plan':
        return buildMockXhsPlan(meta);
      case 'visual_direction':
        return buildMockXhsVisualDirection(meta);
      case 'render_html':
      case 'fix_html':
        return buildMockXhsRender(meta);
      case 'visual_director_review':
        return buildMockXhsDirectorReview(meta);
      case 'screenshot_review':
        return buildMockXhsScreenshotReview(meta);
      case 'publish_copy':
        return buildMockXhsPublishCopy(meta);
      default:
        throw new Error(`unsupported xiaohongshu creative generation route: ${route}`);
    }
  }
  if (family === 'poster_onepager') {
    switch (route) {
      case 'storyline':
        return buildMockPosterStoryline(meta);
      case 'poster_blueprint':
        return buildMockPosterBlueprint(meta);
      case 'visual_direction':
        return buildMockPosterVisualDirection(meta);
      case 'render_html':
        return buildMockPosterRender(meta);
      case 'visual_director_review':
        return buildMockPosterDirectorReview(meta);
      case 'screenshot_review':
        return buildMockPosterScreenshotReview(meta);
      default:
        throw new Error(`unsupported poster_onepager creative generation route: ${route}`);
    }
  }
  switch (route) {
    case 'storyline':
      return buildMockStoryline(meta);
    case 'detailed_outline':
      return buildMockOutline(meta);
    case 'slide_blueprint':
      return buildMockBlueprint(meta);
    case 'visual_direction':
      return buildMockVisualDirection(meta);
    case 'render_html':
    case 'fix_html':
      return buildMockPptRender(meta);
    case 'visual_director_review':
      return buildMockPptDirectorReview(meta);
    case 'screenshot_review':
      return buildMockPptScreenshotReview(meta);
    default:
      throw new Error(`unsupported creative generation route: ${route}`);
  }
}

export function buildMockCreativeOutput(meta) {
  return buildCreativeRunOutput(meta);
}

export function formatCreativeRunOutput(output) {
  return [
    REDCUBE_STAGE_JSON_BEGIN,
    JSON.stringify(output, null, 2),
    REDCUBE_STAGE_JSON_END,
  ].join('\n');
}

export function withEnv(overrides) {
  const backup = {};
  for (const [key, value] of Object.entries(overrides)) {
    backup[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }
  return () => {
    for (const [key, value] of Object.entries(backup)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

export function buildMockCodexLastMessage(prompt) {
  const text = String(prompt || '');
  if (/Reply with READY only\./i.test(text)) {
    return 'READY';
  }

  const creativeMeta = parseCreativeGenerationMeta(text);
  if (!creativeMeta) {
    throw new Error('mock codex cli received unsupported prompt');
  }
  creativeMeta.__raw_prompt = text;
  return formatCreativeRunOutput(buildCreativeRunOutput(creativeMeta));
}

export async function startMockCodexCli() {
  return {
    command: JSON.stringify(['node', path.join(MODULE_DIR, 'mock-codex-cli-bin.mjs')]),
    async close() {},
  };
}

export async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}
