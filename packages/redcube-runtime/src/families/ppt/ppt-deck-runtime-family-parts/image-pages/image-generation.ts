import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { generateImageViaCodexNativeImagegen } from '../../../../executors/codex-caller.js';

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

  function crc32(buffer: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function pngChunk(type: string, data: Buffer): Buffer {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  function solidPngBuffer(width: number, height: number, seed: string): Buffer {
    const seedHash = createHash('sha256').update(seed).digest();
    const background = [248, 246, 238];
    const accent = [seedHash[0], seedHash[1], seedHash[2]].map((value) => 80 + (value % 120));
    const contentLeft = Math.floor(width * 0.09);
    const contentRight = Math.floor(width * 0.91);
    const contentTop = Math.floor(height * 0.14);
    const contentBottom = Math.floor(height * 0.84);
    const bytesPerPixel = 4;
    const scanlineLength = 1 + (width * bytesPerPixel);
    const raw = Buffer.alloc(scanlineLength * height);
    for (let y = 0; y < height; y += 1) {
      const rowOffset = y * scanlineLength;
      raw[rowOffset] = 0;
      for (let x = 0; x < width; x += 1) {
        const offset = rowOffset + 1 + (x * bytesPerPixel);
        const inSafeContent = x >= contentLeft && x <= contentRight && y >= contentTop && y <= contentBottom;
        const band = inSafeContent && (((x - contentLeft) + Math.floor((y - contentTop) * 0.8)) % 128) < 6;
        const marker = inSafeContent
          && (((Math.floor((x - contentLeft) / 52) + Math.floor((y - contentTop) / 44)) % 10) === 0);
        raw[offset] = band || marker ? accent[0] : background[0];
        raw[offset + 1] = band || marker ? accent[1] : background[1];
        raw[offset + 2] = band || marker ? accent[2] : background[2];
        raw[offset + 3] = 255;
      }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;
    return Buffer.concat([
      Buffer.from('89504e470d0a1a0a', 'hex'),
      pngChunk('IHDR', ihdr),
      pngChunk('IDAT', deflateSync(raw)),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);
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
      const mockBytes = solidPngBuffer(1536, 864, `${route}:${slideId}:${prompt}`);
      return {
        id: `resp_mock_${sha256(`${route}:${slideId}:${prompt}`).slice(0, 16)}`,
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
