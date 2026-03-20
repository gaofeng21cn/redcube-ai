import test from 'node:test';
import assert from 'node:assert/strict';

import { generateNoteDraft, generateStorylineLogic } from '../packages/redcube-llm/src/index.js';

test('generateNoteDraft uses explicit openai-compatible runtime config', async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.REDCUBE_LLM_MODE;
  let captured = null;

  process.env.REDCUBE_LLM_MODE = 'offline';
  globalThis.fetch = async (url, options) => {
    captured = {
      url: String(url),
      headers: options?.headers,
      body: JSON.parse(String(options?.body || '{}')),
    };

    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  titleOptions: ['标题A'],
                  body: '正文',
                  hashtags: ['标签'],
                  outline: ['大纲'],
                }),
              },
            },
          ],
        };
      },
    };
  };

  try {
    const result = await generateNoteDraft({
      taskTitle: '测试主题',
      rawMaterials: '测试素材',
      styleGuide: '',
      storylineLogic: '',
      llmConfig: {
        mode: 'openai',
        baseUrl: 'https://example.com/openai/v1',
        apiKey: 'sk-explicit',
        model: 'gml-5',
      },
    });

    assert.equal(captured.url, 'https://example.com/openai/v1/chat/completions');
    assert.equal(captured.headers.Authorization, 'Bearer sk-explicit');
    assert.equal(captured.body.model, 'gml-5');
    assert.equal(result.body, '正文');
  } finally {
    globalThis.fetch = originalFetch;
    process.env.REDCUBE_LLM_MODE = originalMode;
  }
});

test('generateStorylineLogic uses explicit openai-compatible runtime config', async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.REDCUBE_LLM_MODE;
  let captured = null;

  process.env.REDCUBE_LLM_MODE = 'offline';
  globalThis.fetch = async (url, options) => {
    captured = {
      url: String(url),
      headers: options?.headers,
      body: JSON.parse(String(options?.body || '{}')),
    };

    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: '# 测试叙事逻辑\n\n- 主线结构：A -> B',
              },
            },
          ],
        };
      },
    };
  };

  try {
    const result = await generateStorylineLogic({
      projectTitle: '测试项目',
      rawMaterials: '测试素材',
      promptFile: 'medical_deep.md',
      llmConfig: {
        mode: 'openai',
        baseUrl: 'https://example.com/openai/v1',
        apiKey: 'sk-explicit',
        model: 'gml-5',
      },
    });

    assert.equal(captured.url, 'https://example.com/openai/v1/chat/completions');
    assert.equal(captured.headers.Authorization, 'Bearer sk-explicit');
    assert.equal(captured.body.model, 'gml-5');
    assert.match(result, /测试叙事逻辑/);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.REDCUBE_LLM_MODE = originalMode;
  }
});

test('generateNoteDraft retries transient 429 from openai-compatible endpoint', async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.REDCUBE_LLM_MODE;
  let attempts = 0;

  process.env.REDCUBE_LLM_MODE = 'offline';
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return {
        ok: false,
        status: 429,
        async text() {
          return '{"error":{"message":"rate limit"}}';
        },
      };
    }

    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  titleOptions: ['标题A'],
                  body: '正文',
                  hashtags: ['标签'],
                  outline: ['大纲'],
                }),
              },
            },
          ],
        };
      },
    };
  };

  try {
    const result = await generateNoteDraft({
      taskTitle: '测试主题',
      rawMaterials: '测试素材',
      styleGuide: '',
      storylineLogic: '',
      llmConfig: {
        mode: 'openai',
        baseUrl: 'https://example.com/openai/v1',
        apiKey: 'sk-explicit',
        model: 'glm-5',
      },
    });

    assert.equal(attempts, 2);
    assert.equal(result.body, '正文');
  } finally {
    globalThis.fetch = originalFetch;
    process.env.REDCUBE_LLM_MODE = originalMode;
  }
});

test('generateNoteDraft parses fenced json from glm-5 with thinking disabled request', async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.REDCUBE_LLM_MODE;
  let capturedBody = null;

  process.env.REDCUBE_LLM_MODE = 'offline';
  globalThis.fetch = async (_url, options) => {
    capturedBody = JSON.parse(String(options?.body || '{}'));
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: [
                  '```json',
                  JSON.stringify({
                    titleOptions: ['标题A'],
                    body: '正文',
                    hashtags: ['标签'],
                    outline: ['大纲'],
                  }, null, 2),
                  '```',
                ].join('\n'),
              },
            },
          ],
        };
      },
    };
  };

  try {
    const result = await generateNoteDraft({
      taskTitle: '测试主题',
      rawMaterials: '测试素材',
      styleGuide: '',
      storylineLogic: '',
      llmConfig: {
        mode: 'openai',
        baseUrl: 'https://example.com/openai/v1',
        apiKey: 'sk-explicit',
        model: 'glm-5',
      },
    });

    assert.deepEqual(capturedBody.thinking, { type: 'disabled' });
    assert.equal(result.body, '正文');
    assert.deepEqual(result.titleOptions, ['标题A']);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.REDCUBE_LLM_MODE = originalMode;
  }
});
