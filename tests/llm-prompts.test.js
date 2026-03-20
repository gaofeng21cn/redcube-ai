import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function loadFreshLlmModule() {
  const modulePath = path.resolve(process.cwd(), 'packages', 'redcube-llm', 'src', 'index.js');
  const moduleUrl = `${pathToFileURL(modulePath).href}?v=${Date.now()}_${Math.random()}`;
  return import(moduleUrl);
}

function withEnv(overrides) {
  const backup = {};
  for (const [key, value] of Object.entries(overrides)) {
    backup[key] = process.env[key];
    if (value === undefined || value === null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }

  return () => {
    for (const [key, value] of Object.entries(backup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test('generateNoteDraft uses templates from REDCUBE_PROMPTS_DIR', async () => {
  const promptsDir = mkdtempSync(path.join(tmpdir(), 'redcube-prompts-'));
  writeFileSync(
    path.join(promptsDir, 'note_draft.user.md'),
    [
      'CUSTOM_NOTE_TEMPLATE',
      'TITLE={{task_title}}',
      'RAW={{raw_materials}}',
      'STYLE={{style_guide}}',
      'STORY={{storyline_logic}}',
    ].join('\n'),
    'utf-8',
  );
  writeFileSync(path.join(promptsDir, 'note_draft.system.md'), 'CUSTOM_NOTE_SYSTEM', 'utf-8');

  const restoreEnv = withEnv({
    REDCUBE_PROMPTS_DIR: promptsDir,
    REDCUBE_LLM_MODE: 'openai',
    OPENAI_API_KEY: 'test-key',
    OPENAI_BASE_URL: 'https://example.test/v1',
    OPENAI_MODEL: 'fake-model',
  });

  const originalFetch = globalThis.fetch;
  let observedUserPrompt = '';
  let observedSystemPrompt = '';
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    observedSystemPrompt = body.messages?.[0]?.content || '';
    observedUserPrompt = body.messages?.[1]?.content || '';
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  titleOptions: ['A', 'B', 'C'],
                  body: 'BODY',
                  hashtags: ['h1'],
                  outline: ['o1'],
                }),
              },
            },
          ],
        };
      },
    };
  };

  try {
    const { generateNoteDraft } = await loadFreshLlmModule();
    const note = await generateNoteDraft({
      taskTitle: '内分泌总论',
      rawMaterials: '素材A',
      styleGuide: '风格A',
      storylineLogic: '逻辑A',
    });

    assert.equal(note.body, 'BODY');
    assert.match(observedSystemPrompt, /CUSTOM_NOTE_SYSTEM/);
    assert.match(observedUserPrompt, /CUSTOM_NOTE_TEMPLATE/);
    assert.match(observedUserPrompt, /TITLE=内分泌总论/);
    assert.match(observedUserPrompt, /RAW=素材A/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
    rmSync(promptsDir, { recursive: true, force: true });
  }
});

test('listStorylinePromptFiles and storyline generation read external prompt files', async () => {
  const promptsDir = mkdtempSync(path.join(tmpdir(), 'redcube-storyline-prompts-'));
  writeFileSync(path.join(promptsDir, 'note_draft.user.md'), 'IGNORE', 'utf-8');
  writeFileSync(path.join(promptsDir, 'note_draft.system.md'), 'IGNORE', 'utf-8');
  writeFileSync(path.join(promptsDir, 'storyline.system.md'), 'CUSTOM_STORYLINE_SYSTEM', 'utf-8');

  const storylineTemplatesDir = path.join(promptsDir, 'storyline_templates');
  mkdirSync(storylineTemplatesDir, { recursive: true });
  writeFileSync(
    path.join(storylineTemplatesDir, 'medical_deep.md'),
    [
      'CUSTOM_STORYLINE_TEMPLATE_A',
      'PROJECT={{project_title}}',
      'RAW={{raw_materials}}',
    ].join('\n'),
    'utf-8',
  );
  writeFileSync(
    path.join(storylineTemplatesDir, 'medical_traffic.md'),
    [
      'CUSTOM_STORYLINE_TEMPLATE_B',
      'PROJECT={{project_title}}',
      'RAW={{raw_materials}}',
    ].join('\n'),
    'utf-8',
  );

  const restoreEnv = withEnv({
    REDCUBE_PROMPTS_DIR: promptsDir,
    REDCUBE_LLM_MODE: 'openai',
    OPENAI_API_KEY: 'test-key',
    OPENAI_BASE_URL: 'https://example.test/v1',
    OPENAI_MODEL: 'fake-model',
  });

  const originalFetch = globalThis.fetch;
  let observedStorylinePrompt = '';
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    observedStorylinePrompt = body.messages?.[1]?.content || '';
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: '# 自定义叙事逻辑\n\n- 规则A',
              },
            },
          ],
        };
      },
    };
  };

  try {
    const { listStorylinePromptFiles, generateStorylineLogic } = await loadFreshLlmModule();
    const files = listStorylinePromptFiles();
    const names = files.map((item) => item.fileName);
    assert.ok(names.includes('medical_deep.md'));
    assert.ok(names.includes('medical_traffic.md'));

    const output = await generateStorylineLogic({
      projectTitle: '医生看的内分泌概论',
      rawMaterials: '素材B',
      promptFile: 'medical_traffic.md',
    });

    assert.match(output, /自定义叙事逻辑/);
    assert.match(observedStorylinePrompt, /CUSTOM_STORYLINE_TEMPLATE_B/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
    rmSync(promptsDir, { recursive: true, force: true });
  }
});

test('default planning and storyline prompts come from aligned formal prompt set', async () => {
  const restoreEnv = withEnv({
    REDCUBE_PROMPTS_DIR: undefined,
    REDCUBE_LLM_MODE: 'openai',
    OPENAI_API_KEY: 'test-key',
    OPENAI_BASE_URL: 'https://example.test/v1',
    OPENAI_MODEL: 'fake-model',
  });

  const originalFetch = globalThis.fetch;
  const observedPrompts = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    observedPrompts.push({
      system: body.messages?.[0]?.content || '',
      user: body.messages?.[1]?.content || '',
    });
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  titleOptions: ['A', 'B', 'C'],
                  body: 'BODY',
                  hashtags: ['h1'],
                  outline: ['o1'],
                }),
              },
            },
          ],
        };
      },
    };
  };

  try {
    const { generateNoteDraft, generateStorylineLogic } = await loadFreshLlmModule();
    await generateNoteDraft({
      taskTitle: 'AI 智能体企业知识库',
      rawMaterials: '素材A',
      styleGuide: '风格A',
      storylineLogic: '逻辑A',
    });
    await generateStorylineLogic({
      projectTitle: 'AI 智能体企业知识库',
      rawMaterials: '素材B',
      promptFile: 'general_standard.md',
    });

    assert.equal(observedPrompts.length, 2);
    assert.match(observedPrompts[0].user, /任务：策划单篇小红书图文笔记（路由注入版）/);
    assert.match(observedPrompts[0].user, /## 输出格式（严格）/);
    assert.match(observedPrompts[1].user, /任务：生成人设约束下的叙事风格与故事线（先于目录）/);
    assert.match(observedPrompts[1].user, /## 输出格式（严格遵守）/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});

test('generateNoteDraft uses identity routing from runtime config when aligned prompts are externalized', async () => {
  const promptsDir = mkdtempSync(path.join(tmpdir(), 'redcube-aligned-prompts-'));
  const configHome = mkdtempSync(path.join(tmpdir(), 'redcube-config-home-'));
  const alignedRoot = path.join(promptsDir, 'aligned', '自动小红书');
  mkdirSync(path.join(alignedRoot, '策划提示词'), { recursive: true });
  mkdirSync(path.join(alignedRoot, 'defaults', 'templates'), { recursive: true });
  writeFileSync(
    path.join(alignedRoot, '作者档案库.md'),
    [
      '# 作者档案库',
      '',
      '## profile_id: medical_private',
      '',
      '- 署名显示：私有医学作者',
      '- 署名副标：私有医学品牌',
      '',
      '## profile_id: general_private',
      '',
      '- 署名显示：私有通用作者',
      '- 署名副标：私有通用品牌',
    ].join('\n'),
    'utf-8',
  );
  writeFileSync(path.join(alignedRoot, '策划提示词', '单篇策划.md'), 'PROFILE={{author_profile}}\nRAW={{raw_materials}}', 'utf-8');
  writeFileSync(path.join(alignedRoot, '策划提示词', '单篇策划质控门禁.md'), 'GATE', 'utf-8');
  writeFileSync(path.join(alignedRoot, 'defaults', 'templates', '01_单篇策划.md'), 'TEMPLATE', 'utf-8');

  writeFileSync(
    path.join(configHome, 'identity.json'),
    JSON.stringify({
      defaultProfileId: 'general_private',
      routing: {
        medicalProfileId: 'medical_private',
        generalProfileId: 'general_private',
      },
    }, null, 2),
    'utf-8',
  );

  const restoreEnv = withEnv({
    REDCUBE_CONFIG_HOME: configHome,
    REDCUBE_PROMPTS_DIR: promptsDir,
    REDCUBE_LLM_MODE: 'openai',
    OPENAI_API_KEY: 'test-key',
    OPENAI_BASE_URL: 'https://example.test/v1',
    OPENAI_MODEL: 'fake-model',
  });

  const originalFetch = globalThis.fetch;
  let observedUserPrompt = '';
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    observedUserPrompt = body.messages?.[1]?.content || '';
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  titleOptions: ['A', 'B', 'C'],
                  body: 'BODY',
                  hashtags: ['h1'],
                  outline: ['o1'],
                }),
              },
            },
          ],
        };
      },
    };
  };

  try {
    const { generateNoteDraft } = await loadFreshLlmModule();
    await generateNoteDraft({
      taskTitle: '内分泌系统总论',
      rawMaterials: '医学素材',
      styleGuide: '专业',
      storylineLogic: '先建立认知',
    });

    assert.match(observedUserPrompt, /profile_id: medical_private/);
    assert.match(observedUserPrompt, /私有医学作者/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
    rmSync(promptsDir, { recursive: true, force: true });
    rmSync(configHome, { recursive: true, force: true });
  }
});
