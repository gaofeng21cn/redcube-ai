// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  generateImageViaCodexNativeImagegen,
  generateStructuredArtifactViaCodexCli,
  probeCodexCli,
  readCodexCliContract,
} from '../packages/redcube-runtime/dist/executors/index.js';
import { buildGenerationInput } from '../packages/redcube-runtime/dist/executors/index-parts/prompt-guidance.js';

const ONE_PIXEL_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082',
  'hex',
);

function codexImagegenStdout(usage = { prompt_tokens: 19, completion_tokens: 3, total_tokens: 22 }) {
  return [
    JSON.stringify({ type: 'item.completed', item: { type: 'image_generation_call', id: 'ig_mock' } }),
    JSON.stringify({ event: 'run.completed', run_id: 'mock-run', usage }),
  ].join('\n');
}

function codexGeneratedImagesStdout({ generatedDir, generatedFile, outputFile, threadId = '019e6462-8396-7062-bdcb-461ddc160d19' }) {
  return [
    JSON.stringify({ type: 'thread.started', thread_id: threadId }),
    JSON.stringify({ type: 'turn.started' }),
    JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: `/bin/zsh -lc "rtk find ${generatedDir} -type f -name '*.png' -maxdepth 1 2>/dev/null | tail -1"`,
        aggregated_output: generatedFile,
        exit_code: 0,
        status: 'completed',
      },
    }),
    JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: `/bin/zsh -lc 'rtk cp ${generatedDir}/*.png ${outputFile} && rtk file ${outputFile}'`,
        aggregated_output: `${outputFile}: PNG image data, 1 x 1, 8-bit/color RGBA, non-interlaced`,
        exit_code: 0,
        status: 'completed',
      },
    }),
    JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'agent_message',
        text: JSON.stringify({ ok: true, image_file: outputFile, mode: 'codex_native_imagegen' }),
      },
    }),
    JSON.stringify({ type: 'turn.completed', usage: { prompt_tokens: 19, completion_tokens: 3, total_tokens: 22 } }),
  ].join('\n');
}

function mockCodexContract(env = {}) {
  return readCodexCliContract({
    REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
    ...env,
  });
}

function writeCodexLastMessage(args, payload) {
  const outputFlagIndex = args.indexOf('--output-last-message');
  writeFileSync(
    args[outputFlagIndex + 1],
    typeof payload === 'string' ? payload : JSON.stringify(payload),
    'utf-8',
  );
}

function generateMockImage({
  family = 'ppt_deck',
  route = 'author_image_pages',
  slideId = 'S01',
  prompt = '生成一张 16:9 中文 PPT 页面。',
  outputFile,
  toolOptions = { type: 'image_generation', size: '1536x864' },
  contractEnv = {},
  spawnSyncImpl,
}) {
  return generateImageViaCodexNativeImagegen({
    family,
    route,
    slideId,
    prompt,
    outputFile,
    toolOptions,
    contract: mockCodexContract(contractEnv),
    spawnSyncImpl,
  });
}

function withTemporaryProfessionalSkillFile(relativePath, content, callback) {
  const absolutePath = path.resolve(relativePath);
  const parentDir = path.dirname(absolutePath);
  const fileExisted = existsSync(absolutePath);
  const dirExisted = existsSync(parentDir);

  if (!fileExisted) {
    mkdirSync(parentDir, { recursive: true });
    writeFileSync(absolutePath, content, 'utf-8');
  }

  const cleanup = () => {
    if (!fileExisted) {
      rmSync(absolutePath, { force: true });
    }
    if (!dirExisted) {
      rmSync(parentDir, { recursive: true, force: true });
    }
  };

  try {
    const result = callback();
    if (result && typeof result.then === 'function') {
      return result.finally(cleanup);
    }
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

test('readCodexCliContract falls back to local Codex defaults', () => {
  const homeRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-home-'));
  const contract = readCodexCliContract({ HOME: homeRoot });

  try {
    assert.deepEqual(contract.command, ['codex']);
    assert.equal(contract.sandbox, 'workspace-write');
    assert.equal(contract.model, null);
    assert.equal(contract.reasoning_effort, null);
    assert.equal(contract.model_selection, 'inherit_local_codex_default');
    assert.equal(contract.reasoning_selection, 'inherit_local_codex_default');
  } finally {
    rmSync(homeRoot, { recursive: true, force: true });
  }
});

test('readCodexCliContract prefers the OPL-managed canonical Codex shim when present', () => {
  const homeRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-canonical-home-'));
  const canonicalBin = path.join(homeRoot, 'bin', 'codex-canonical');
  mkdirSync(path.dirname(canonicalBin), { recursive: true });
  writeFileSync(canonicalBin, '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });

  try {
    const contract = readCodexCliContract({ HOME: homeRoot });
    assert.deepEqual(contract.command, [canonicalBin]);
  } finally {
    rmSync(homeRoot, { recursive: true, force: true });
  }
});

test('readCodexCliContract accepts JSON-array command and explicit model controls', () => {
  const contract = readCodexCliContract({
    REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
    REDCUBE_CODEX_SANDBOX: 'danger-full-access',
    REDCUBE_CODEX_MODEL: 'gpt-5.4',
    REDCUBE_CODEX_REASONING_EFFORT: 'xhigh',
  });

  assert.deepEqual(contract.command, ['node', '/tmp/mock-codex.mjs']);
  assert.equal(contract.sandbox, 'danger-full-access');
  assert.equal(contract.model, 'gpt-5.4');
  assert.equal(contract.reasoning_effort, 'xhigh');
  assert.equal(contract.model_selection, 'gpt-5.4');
  assert.equal(contract.reasoning_selection, 'xhigh');
});

test('probeCodexCli proves the local exec surface with a mock spawn implementation', async () => {
  const result = await probeCodexCli({
    contract: readCodexCliContract({
      REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
      REDCUBE_CODEX_MODEL: 'gpt-5.4',
      REDCUBE_CODEX_REASONING_EFFORT: 'xhigh',
    }),
    spawnSyncImpl(command, args) {
      const outputFlagIndex = args.indexOf('--output-last-message');
      writeFileSync(args[outputFlagIndex + 1], 'READY\n', 'utf-8');
      return {
        status: 0,
        stdout: [
          JSON.stringify({ event: 'run.started', run_id: 'mock-run' }),
          JSON.stringify({ event: 'run.completed', run_id: 'mock-run', usage: { total_tokens: 0 } }),
        ].join('\n'),
        stderr: '',
        error: null,
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.runtime_owner, 'codex_cli');
  assert.equal(result.contract.model_selection, 'gpt-5.4');
  assert.equal(result.contract.reasoning_selection, 'xhigh');
  assert.equal(result.steps.exec_surface.ok, true);
  assert.equal(result.steps.exec_surface.terminal_event, 'run.completed');
});

test('buildGenerationInput includes declared RCA professional specialist guidance for mapped ppt routes', () => {
  withTemporaryProfessionalSkillFile(
    'agent/professional_skills/rca-ppt-story-architect/SKILL.md',
    '# Story Architect\n\nKeep storyline, outline, and slide blueprint decisions professionally structured.',
    () => {
      const input = buildGenerationInput({
        family: 'ppt_deck',
        route: 'storyline',
        promptRelativePath: 'prompts/ppt_deck/storyline.md',
        context: { goal: 'professional deck' },
        outputContract: { type: 'object' },
      });

      assert.match(input, /## RCA Professional Specialist Skill Guidance/);
      assert.match(input, /### Story Architect/);
      assert.match(input, /agent\/professional_skills\/rca-ppt-story-architect\/SKILL\.md/);
      assert.match(input, /Build a claim spine before slide count|Keep storyline, outline, and slide blueprint decisions professionally structured\./);
      assert.doesNotMatch(input, /agent\/professional_skills\/rca-ppt-visual-director\/SKILL\.md/);
    },
  );
});

test('buildGenerationInput does not require professional specialist guidance for unrelated routes', () => {
  const input = buildGenerationInput({
    family: 'poster_onepager',
    route: 'storyline',
    promptRelativePath: 'prompts/poster_onepager/storyline.md',
    context: { goal: 'poster' },
    outputContract: { type: 'object' },
  });

  assert.doesNotMatch(input, /## RCA Professional Specialist Skill Guidance/);
});

test('buildGenerationInput injects review and non-blocking memory guidance into ppt export', () => {
  const input = buildGenerationInput({
    family: 'ppt_deck',
    route: 'export_pptx',
    promptRelativePath: 'prompts/ppt_deck/export_pptx.md',
    context: { goal: 'export reviewed native deck' },
    outputContract: { type: 'object' },
  });

  assert.match(input, /### Reviewer/);
  assert.match(input, /agent\/professional_skills\/rca-ppt-reviewer\/SKILL\.md/);
  assert.match(input, /### Visual Memory Curator/);
  assert.match(input, /agent\/professional_skills\/rca-visual-memory-curator\/SKILL\.md/);
  assert.doesNotMatch(input, /### Native PPT Designer/);
});

test('buildGenerationInput fail-closes mapped ppt routes when declared specialist guidance is missing', () => {
  const nativeDesigner = path.resolve('agent/professional_skills/rca-native-ppt-designer/SKILL.md');
  const templateProfiler = path.resolve('agent/professional_skills/rca-template-profiler/SKILL.md');
  const allDeclaredFilesExist = existsSync(nativeDesigner) && existsSync(templateProfiler);

  if (allDeclaredFilesExist) {
    const input = buildGenerationInput({
      family: 'ppt_deck',
      route: 'author_pptx_native',
      promptRelativePath: 'prompts/ppt_deck/author_pptx_native.md',
      context: { goal: 'editable pptx' },
      outputContract: { type: 'object' },
    });
    assert.match(input, /### Native PPT Designer/);
    assert.match(input, /### Template Profiler/);
    return;
  }

  assert.throws(
    () => buildGenerationInput({
      family: 'ppt_deck',
      route: 'author_pptx_native',
      promptRelativePath: 'prompts/ppt_deck/author_pptx_native.md',
      context: { goal: 'editable pptx' },
      outputContract: { type: 'object' },
    }),
    /Missing RCA professional specialist skill guidance for ppt_deck:author_pptx_native/,
  );
});

test('generateStructuredArtifactViaCodexCli records deterministic prompt telemetry without faking provider tokens', async () => {
  const result = await withTemporaryProfessionalSkillFile(
    'agent/professional_skills/rca-ppt-story-architect/SKILL.md',
    '# Story Architect\n\nKeep storyline, outline, and slide blueprint decisions professionally structured.',
    () => generateStructuredArtifactViaCodexCli({
      family: 'ppt_deck',
      route: 'storyline',
      promptRelativePath: 'prompts/ppt_deck/storyline.md',
      context: {
        target_slide_ids: ['S05'],
        revision_context: {
          operator_revision_brief: {
            target_slide_ids: ['S07'],
          },
        },
        slides: [
          { slide_id: 'S01', title: '开场' },
        ],
      },
      outputContract: {
        type: 'object',
        required: ['headline'],
      },
      contract: readCodexCliContract({
        REDCUBE_CODEX_COMMAND: '["node","/tmp/mock-codex.mjs"]',
        REDCUBE_CODEX_MODEL: 'gpt-5.4',
      }),
      spawnSyncImpl(_command, args) {
        const outputFlagIndex = args.indexOf('--output-last-message');
        writeFileSync(
          args[outputFlagIndex + 1],
          [
            REDCUBE_STAGE_JSON_BEGIN,
            JSON.stringify({ headline: 'AI-first storyline' }),
            REDCUBE_STAGE_JSON_END,
          ].join('\n'),
          'utf-8',
        );
        return {
          status: 0,
          stdout: JSON.stringify({
            event: 'run.completed',
            run_id: 'mock-run',
            usage: {
              prompt_tokens: 11,
              completion_tokens: 2,
              total_tokens: 13,
            },
          }),
          stderr: '',
          error: null,
        };
      },
    }),
  );

  assert.equal(result.data.headline, 'AI-first storyline');
  assert.equal(result.generationRuntime.prompt_pack_file, 'prompts/ppt_deck/storyline.md');
  assert.equal(result.generationRuntime.prompt_tokens, 11);
  assert.equal(result.generationRuntime.completion_tokens, 2);
  assert.equal(result.generationRuntime.total_tokens, 13);
  assert.equal(Number.isInteger(result.generationRuntime.prompt_bytes), true);
  assert.equal(result.generationRuntime.prompt_bytes > 0, true);
  assert.equal(Number.isInteger(result.generationRuntime.context_bytes), true);
  assert.equal(result.generationRuntime.context_bytes > 0, true);
  assert.deepEqual(result.generationRuntime.prompt_files, ['prompts/ppt_deck/storyline.md']);
  assert.deepEqual(result.generationRuntime.slide_scope.target_slide_ids, ['S05', 'S07']);
  assert.deepEqual(result.generationRuntime.slide_scope.slide_ids, ['S01', 'S05', 'S07']);
  assert.equal(Number.isInteger(result.generationRuntime.estimated_prompt_tokens), true);
  assert.equal(result.generationRuntime.estimated_prompt_tokens > 0, true);
});

test('generateImageViaCodexNativeImagegen delegates raster output to Codex native imagegen without provider tokens', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-'));
  const outputFile = path.join(workspaceRoot, 'N01.png');
  const result = await generateMockImage({
    family: 'xiaohongshu',
    route: 'author_image_pages',
    slideId: 'N01',
    prompt: '生成一张 3:4 中文医学科普小红书封面。',
    outputFile,
    toolOptions: { type: 'image_generation', size: '1086x1448' },
    contractEnv: { REDCUBE_CODEX_MODEL: 'gpt-5.4' },
    spawnSyncImpl(_command, args, options) {
      assert.equal(args.includes('--enable'), true);
      assert.equal(args.includes('image_generation'), true);
      assert.equal(options.cwd, workspaceRoot);
      assert.match(String(options.input), /Codex 原生 imagegen|built-in|内置 imagegen|image_generation/);
      assert.match(String(options.input), /不要使用.*OPENAI_API_KEY|不要使用.*REDCUBE_IMAGE_GENERATION_TOKEN/s);
      writeFileSync(outputFile, ONE_PIXEL_PNG);
      writeCodexLastMessage(args, { ok: true, image_file: outputFile, mode: 'codex_native_imagegen' });
      return {
        status: 0,
        stdout: codexImagegenStdout(),
        stderr: '',
        error: null,
      };
    },
  });

  try {
    assert.equal(result.imageFile, outputFile);
    assert.equal(result.dimensions.width, 1);
    assert.equal(result.dimensions.height, 1);
    assert.equal(result.generationRuntime.task_surface, 'codex_native_imagegen_skill');
    assert.equal(result.generationRuntime.provider_token_source, 'codex_executor_native_tool');
    assert.equal(result.generationRuntime.explicit_provider_token_required, false);
    assert.equal(result.generationRuntime.token_persisted, false);
    assert.equal(result.generationRuntime.cwd, workspaceRoot);
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test('generateImageViaCodexNativeImagegen defaults Codex cwd to the artifact output directory', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-cwd-'));
  const outputDir = path.join(workspaceRoot, 'artifacts', 'image_pages', 'author_image_pages');
  const outputFile = path.join(outputDir, 'S01.png');

  const result = await generateMockImage({
    outputFile,
    spawnSyncImpl(_command, args, options) {
      assert.equal(options.cwd, outputDir);
      writeFileSync(outputFile, ONE_PIXEL_PNG);
      writeCodexLastMessage(args, { ok: true, image_file: outputFile, mode: 'codex_native_imagegen' });
      return {
        status: 0,
        stdout: codexImagegenStdout(),
        stderr: '',
        error: null,
      };
    },
  });

  try {
    assert.equal(result.imageFile, outputFile);
    assert.equal(result.generationRuntime.cwd, outputDir);
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test('generateImageViaCodexNativeImagegen materializes Codex generated image when sandbox blocks target write', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-sandbox-'));
  const generatedRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-generated-images-'));
  const generatedFile = path.join(generatedRoot, 'ig_mock.png');
  const outputFile = path.join(workspaceRoot, 'artifacts', 'N01.png');
  writeFileSync(generatedFile, ONE_PIXEL_PNG);

  const result = await generateMockImage({
    slideId: 'N01',
    outputFile,
    spawnSyncImpl(_command, args) {
      writeCodexLastMessage(args, {
        ok: false,
        image_file: generatedFile,
        mode: 'codex_native_imagegen',
        error: 'sandbox_denied_target_write',
      });
      return {
        status: 0,
        stdout: codexImagegenStdout(),
        stderr: '',
        error: null,
      };
    },
  });

  try {
    assert.equal(result.imageFile, outputFile);
    assert.equal(existsSync(outputFile), true);
    assert.deepEqual(readFileSync(outputFile), ONE_PIXEL_PNG);
    assert.equal(result.dimensions.width, 1);
    assert.equal(result.generationRuntime.codex_generated_image_file, generatedFile);
    assert.equal(result.generationRuntime.materialized_from_codex_generated_image, true);
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true });
    rmSync(generatedRoot, { recursive: true, force: true });
  }
});

test('generateImageViaCodexNativeImagegen accepts generated_image_file from Codex native imagegen result', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-generated-field-'));
  const generatedRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-generated-images-'));
  const generatedFile = path.join(generatedRoot, 'ig_mock.png');
  const outputFile = path.join(workspaceRoot, 'artifacts', 'S01.png');
  writeFileSync(generatedFile, ONE_PIXEL_PNG);

  const result = await generateMockImage({
    outputFile,
    spawnSyncImpl(_command, args) {
      writeCodexLastMessage(args, {
        ok: false,
        image_file: outputFile,
        generated_image_file: generatedFile,
        mode: 'codex_native_imagegen',
        error: 'native imagegen succeeded, but sandbox denied writing to the requested output_file outside writable roots',
      });
      return {
        status: 0,
        stdout: codexImagegenStdout(),
        stderr: '',
        error: null,
      };
    },
  });

  try {
    assert.equal(result.imageFile, outputFile);
    assert.equal(existsSync(outputFile), true);
    assert.deepEqual(readFileSync(outputFile), ONE_PIXEL_PNG);
    assert.equal(result.generationRuntime.codex_generated_image_file, generatedFile);
    assert.equal(result.generationRuntime.materialized_from_codex_generated_image, true);
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true });
    rmSync(generatedRoot, { recursive: true, force: true });
  }
});

test('generateImageViaCodexNativeImagegen accepts sandbox-denied image_file when it is the generated PNG', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-copy-denied-'));
  const generatedRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-generated-images-'));
  const generatedFile = path.join(generatedRoot, 'ig_mock.png');
  const outputFile = path.join(workspaceRoot, 'artifacts', 'S01.png');
  writeFileSync(generatedFile, ONE_PIXEL_PNG);

  const result = await generateMockImage({
    outputFile,
    spawnSyncImpl(_command, args) {
      writeCodexLastMessage(args, {
        ok: false,
        image_file: generatedFile,
        mode: 'codex_native_imagegen',
        error: 'sandbox_denied_copy_to_output_file',
      });
      return {
        status: 0,
        stdout: codexImagegenStdout(),
        stderr: '',
        error: null,
      };
    },
  });

  try {
    assert.equal(result.imageFile, outputFile);
    assert.equal(existsSync(outputFile), true);
    assert.deepEqual(readFileSync(outputFile), ONE_PIXEL_PNG);
    assert.equal(result.generationRuntime.codex_generated_image_file, generatedFile);
    assert.equal(result.generationRuntime.materialized_from_codex_generated_image, true);
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true });
    rmSync(generatedRoot, { recursive: true, force: true });
  }
});

test('generateImageViaCodexNativeImagegen accepts current Codex generated_images materialization provenance', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-events-'));
  const threadId = '019e6462-8396-7062-bdcb-461ddc160d19';
  const generatedDir = path.join(workspaceRoot, '.codex', 'generated_images', threadId);
  const generatedFile = path.join(generatedDir, 'ig_0f22c17f7ae304ab016a159a4ff2208198a67ca05eae7f83b7.png');
  const outputFile = path.join(workspaceRoot, 'artifacts', 'S01.png');
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(generatedFile, ONE_PIXEL_PNG);

  const result = await generateMockImage({
    outputFile,
    spawnSyncImpl(_command, args) {
      mkdirSync(path.dirname(outputFile), { recursive: true });
      writeFileSync(outputFile, ONE_PIXEL_PNG);
      writeCodexLastMessage(args, { ok: true, image_file: outputFile, mode: 'codex_native_imagegen' });
      return {
        status: 0,
        stdout: codexGeneratedImagesStdout({ generatedDir, generatedFile, outputFile, threadId }),
        stderr: '',
        error: null,
      };
    },
  });

  try {
    assert.equal(result.imageFile, outputFile);
    assert.equal(result.generationRuntime.codex_generated_image_file, generatedFile);
    assert.equal(result.generationRuntime.materialized_from_codex_generated_image, true);
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test('generateImageViaCodexNativeImagegen rejects command-rendered PNGs that only claim native imagegen', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-command-render-'));
  const outputFile = path.join(workspaceRoot, 'S01.png');

  await assert.rejects(
    generateMockImage({
      outputFile,
      spawnSyncImpl(_command, args) {
        writeFileSync(outputFile, ONE_PIXEL_PNG);
        writeCodexLastMessage(args, { ok: true, image_file: outputFile, mode: 'codex_native_imagegen' });
        return {
          status: 0,
          stdout: JSON.stringify({
            type: 'item.completed',
            item: {
              type: 'command_execution',
              command: `/bin/zsh -lc 'magick -size 1536x864 xc:white ${outputFile}'`,
              exit_code: 0,
              status: 'completed',
            },
          }),
          stderr: '',
          error: null,
        };
      },
    }),
    /native image_generation\/generated_images provenance/,
  );

  rmSync(workspaceRoot, { recursive: true, force: true });
});

test('generateImageViaCodexNativeImagegen rejects generated_images probes without a copy to the target', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-probe-only-'));
  const threadId = '019e6462-8396-7062-bdcb-461ddc160d19';
  const generatedDir = path.join(workspaceRoot, '.codex', 'generated_images', threadId);
  const generatedFile = path.join(generatedDir, 'ig_probe_only.png');
  const outputFile = path.join(workspaceRoot, 'S01.png');
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(generatedFile, ONE_PIXEL_PNG);

  await assert.rejects(
    generateMockImage({
      outputFile,
      spawnSyncImpl(_command, args) {
        writeFileSync(outputFile, ONE_PIXEL_PNG);
        writeCodexLastMessage(args, { ok: true, image_file: outputFile, mode: 'codex_native_imagegen' });
        return {
          status: 0,
          stdout: [
            JSON.stringify({ type: 'thread.started', thread_id: threadId }),
            JSON.stringify({
              type: 'item.completed',
              item: {
                type: 'command_execution',
                command: `/bin/zsh -lc "rtk find ${generatedDir} -type f -name '*.png' -maxdepth 1"`,
                aggregated_output: generatedFile,
                exit_code: 0,
                status: 'completed',
              },
            }),
            JSON.stringify({
              type: 'item.completed',
              item: {
                type: 'command_execution',
                command: `/bin/zsh -lc 'python3 - <<PY\nfrom pathlib import Path\nPath("${outputFile}").write_bytes(b"fake")\nPY'`,
                exit_code: 0,
                status: 'completed',
              },
            }),
          ].join('\n'),
          stderr: '',
          error: null,
        };
      },
    }),
    /native image_generation\/generated_images provenance/,
  );

  rmSync(workspaceRoot, { recursive: true, force: true });
});

test('generateImageViaCodexNativeImagegen rejects PNGs created without native imagegen provenance', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-imagegen-no-tool-'));
  const outputFile = path.join(workspaceRoot, 'S01.png');

  await assert.rejects(
    generateMockImage({
      outputFile,
      spawnSyncImpl(_command, args) {
        writeFileSync(outputFile, ONE_PIXEL_PNG);
        writeCodexLastMessage(args, { ok: true, image_file: outputFile, mode: 'codex_native_imagegen' });
        return {
          status: 0,
          stdout: JSON.stringify({ type: 'item.completed', item: { type: 'command_execution' } }),
          stderr: '',
          error: null,
        };
      },
    }),
    /native image_generation\/generated_images provenance/,
  );

  rmSync(workspaceRoot, { recursive: true, force: true });
});

test('runtime Codex executor keeps async codex exec attached while preserving timeout cleanup', () => {
  const source = readFileSync(
    new URL('../packages/redcube-runtime/src/executors/index-parts/command-process.ts', import.meta.url),
    'utf-8',
  );

  assert.match(source, /detached:\s*process\.platform\s*!==\s*'win32'/);
  assert.match(source, /process\.kill\(-pid,\s*'SIGKILL'\)/);
  assert.match(source, /child\.kill\('SIGKILL'\)/);
});
