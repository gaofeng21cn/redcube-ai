import { createHash } from 'node:crypto';
import { generateImageViaCodexNativeImagegen } from '../../../../executors/codex-caller.js';
import { solidPngFixture } from '../../../../testing/solid-png-fixture.js';

type JsonRecord = Record<string, any>;
type ImagePageRoute = 'author_image_pages' | 'repair_image_pages';

interface ImageGenerationDeps {
  CANVAS: { width: number; height: number; ratio?: string };
  DEFAULT_IMAGE_MODEL: string;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createImagePageGenerationParts({
  CANVAS,
  DEFAULT_IMAGE_MODEL,
  safeArray,
  safeText,
}: ImageGenerationDeps) {
  function stableJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value as JsonRecord).sort().map((key) => (
        `${JSON.stringify(key)}:${stableJson((value as JsonRecord)[key])}`
      )).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function sha256(value: string | Buffer): string {
    return createHash('sha256').update(value).digest('hex');
  }

  function pngDimensions(buffer: Buffer): { width: number; height: number } {
    if (buffer.length >= 24 && buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }
    return { width: CANVAS.width, height: CANVAS.height };
  }

  function normalizeImageBase64(response: JsonRecord): string {
    const output = safeArray(response?.output);
    for (const item of output) {
      if (safeText(item?.type) === 'image_generation_call') {
        const result = safeText(item?.result);
        if (result) return result.replace(/^data:image\/png;base64,/, '');
      }
      for (const content of safeArray(item?.content)) {
        const image = safeText(content?.image_base64 || content?.b64_json);
        if (image) return image.replace(/^data:image\/png;base64,/, '');
      }
    }
    return safeText(response?.image_base64 || response?.b64_json || response?.data?.[0]?.b64_json)
      .replace(/^data:image\/png;base64,/, '');
  }

  function responseImageCall(response: JsonRecord): JsonRecord {
    return safeArray(response?.output).find((item) => safeText(item?.type) === 'image_generation_call') || {};
  }

  async function callImageGeneration({
    config,
    prompt,
    toolOptions,
    route,
    slideId,
    imageFile,
  }: {
    config: JsonRecord;
    prompt: string;
    toolOptions: JsonRecord;
    route: ImagePageRoute;
    slideId: string;
    imageFile: string;
  }): Promise<JsonRecord> {
    if (process.env.REDCUBE_IMAGE_GENERATION_MOCK === '1') {
      const mockBytes = solidPngFixture(1536, 864, `${route}:${slideId}:${prompt}`);
      const mockRunId = `resp_mock_${sha256(`${route}:${slideId}:${prompt}`).slice(0, 16)}`;
      return {
        id: mockRunId,
        codex_native_imagegen_runtime: {
          owner: 'mock_codex_native_imagegen_test_double',
          run_id: mockRunId,
          session_id: `mock-thread-${sha256(`${route}:${slideId}`).slice(0, 16)}`,
          test_double: true,
        },
        output: [{
          type: 'image_generation_call',
          id: `ig_mock_${sha256(`${slideId}:${prompt}`).slice(0, 16)}`,
          revised_prompt: prompt,
          result: mockBytes.toString('base64'),
        }],
      };
    }
    const result = await generateImageViaCodexNativeImagegen({
      family: 'ppt_deck',
      route,
      slideId,
      prompt,
      outputFile: imageFile,
      toolOptions,
    });
    return {
      id: safeText(result?.generationRuntime?.run_id, `codex_imagegen_${sha256(`${route}:${slideId}:${prompt}`).slice(0, 16)}`),
      codex_native_imagegen_runtime: result.generationRuntime,
      output: [{
        type: 'image_generation_call',
        id: `codex_imagegen_${sha256(`${slideId}:${prompt}`).slice(0, 16)}`,
        revised_prompt: prompt,
        result: result.imageBytes.toString('base64'),
      }],
    };
  }

  return {
    callImageGeneration,
    normalizeImageBase64,
    pngDimensions,
    responseImageCall,
    sha256,
    stableJson,
  };
}
