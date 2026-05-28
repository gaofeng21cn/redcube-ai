// @ts-nocheck
import path from 'node:path';

import {
  MODULE_DIR,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  parseCreativeGenerationMeta,
  safeText,
} from './shared.ts';
import {
  buildMockBlueprint,
  buildMockOutline,
  buildMockPptDirectorReview,
  buildMockPptNativeShapePlan,
  buildMockPptRender,
  buildMockPptScreenshotReview,
  buildMockStoryline,
  buildMockVisualDirection,
} from './ppt-builders.ts';
import {
  buildMockXhsDirectorReview,
  buildMockXhsPlan,
  buildMockXhsPublishCopy,
  buildMockXhsRender,
  buildMockXhsScreenshotReview,
  buildMockXhsStoryline,
  buildMockXhsVisualDirection,
} from './xiaohongshu-builders.ts';
import {
  buildMockPosterBlueprint,
  buildMockPosterDirectorReview,
  buildMockPosterRender,
  buildMockPosterScreenshotReview,
  buildMockPosterStoryline,
  buildMockPosterVisualDirection,
} from './poster-builders.ts';

export function buildCreativeRunOutput(meta) {
  const family = safeText(meta?.family, 'ppt_deck');
  const route = safeText(meta?.route);
  if (safeText(process.env.REDCUBE_MOCK_FAIL_ROUTE) === route) {
    throw new Error(`mock forced route failure: ${route}`);
  }
  const mutateRoute = safeText(process.env.REDCUBE_MOCK_MUTATE_ROUTE);
  const mutateKind = safeText(process.env.REDCUBE_MOCK_MUTATE_KIND);
  const maybeMutateOutput = (output) => {
    if (mutateRoute !== route) return output;
    if (mutateKind === 'repair_tiny_native_plan_on_feedback') {
      const hasValidationFeedback = Boolean(meta?.context?.native_shape_plan_validation_feedback?.validator);
      if (!hasValidationFeedback) {
        const pointTextShape = output?.editable_shape_plan?.slides
          ?.flatMap((slide) => slide?.native_shapes || [])
          ?.find((shape) => shape?.role === 'point_text');
        if (pointTextShape?.bounds) {
          pointTextShape.bounds.height_in = 0.34;
        }
      }
      return output;
    }
    if (mutateKind === 'require_validation_retry_contract') {
      const hasValidationFeedback = Boolean(meta?.context?.native_shape_plan_validation_feedback?.validator);
      if (!hasValidationFeedback) {
        const pointTextShape = output?.editable_shape_plan?.slides
          ?.flatMap((slide) => slide?.native_shapes || [])
          ?.find((shape) => shape?.role === 'point_text');
        if (pointTextShape?.bounds) {
          pointTextShape.bounds.height_in = 0.34;
        }
        return output;
      }
      const rawPrompt = safeText(meta?.__raw_prompt);
      if (!rawPrompt.includes('native_shape_plan_validation_feedback_contract')
        || !rawPrompt.includes('exact_shape_fixes')
        || !rawPrompt.includes('required_height_in')
        || !rawPrompt.includes('required_font_size')
        || !rawPrompt.includes('required_text_char_count')
        || !rawPrompt.includes('required_gap_in')
        || !rawPrompt.includes('geometry_repair_instruction')
        || !rawPrompt.includes('global_shape_class_fixes')) {
        throw new Error('mock expected native preflight retry output contract with exact_shape_fixes');
      }
      return output;
    }
    if (mutateKind === 'repair_missing_design_spec_lock') {
      if (route === 'repair_pptx_native') {
        delete output?.editable_shape_plan?.design_spec_lock;
      }
      return output;
    }
    if (mutateKind === 'remove_template_layout_grammar') {
      delete output?.editable_shape_plan?.template_layout_grammar;
      for (const slide of output?.editable_shape_plan?.slides || []) {
        delete slide.template_layout_binding;
        for (const shape of slide?.native_shapes || []) {
          delete shape.layout_zone_id;
        }
      }
      return output;
    }
    if (mutateKind !== 'remove_point_index_text') return output;
    const slides = output?.editable_shape_plan?.slides || [];
    const pointIndexShape = slides
      .flatMap((slide) => slide?.native_shapes || [])
      .find((shape) => shape?.role === 'point_index');
    if (pointIndexShape) {
      delete pointIndexShape.editable_text;
      delete pointIndexShape.text;
      delete pointIndexShape.label;
    }
    return output;
  };
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
    case 'author_image_pages':
    case 'repair_image_pages':
      return {
        image_pages: [],
        render_summary: ['image pages are produced by the runtime image-generation adapter, not the structured mock CLI.'],
      };
    case 'author_pptx_native':
    case 'repair_pptx_native':
      return maybeMutateOutput(buildMockPptNativeShapePlan(meta));
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
  const previousImageGenerationMock = process.env.REDCUBE_IMAGE_GENERATION_MOCK;
  if (previousImageGenerationMock === undefined) {
    process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';
  }
  return {
    command: JSON.stringify([process.execPath, '--experimental-strip-types', path.join(MODULE_DIR, 'mock-codex-cli-bin.ts')]),
    async close() {
      if (previousImageGenerationMock === undefined) {
        delete process.env.REDCUBE_IMAGE_GENERATION_MOCK;
      } else {
        process.env.REDCUBE_IMAGE_GENERATION_MOCK = previousImageGenerationMock;
      }
    },
  };
}

export async function withMockCodexRuntime(testFn) {
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
