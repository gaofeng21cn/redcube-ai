import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { createPptDeckProfilePresetParts } from '../packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core-profile-presets.ts';

const FAMILY_VALIDATORS = [
  {
    label: 'ppt',
    file: 'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core.ts',
    validator: 'validateRenderedSlideContent',
    slideId: 'S01',
  },
  {
    label: 'xiaohongshu',
    file: 'packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime-family-parts/support.ts',
    validator: 'validateRenderedSlideContent',
    slideId: 'P01',
  },
  {
    label: 'poster_onepager',
    file: 'packages/redcube-runtime/src/families/poster-onepager/poster-onepager-runtime-parts/authoring.ts',
    validator: 'validateRenderedPosterHtml',
    slideId: 'P01',
  },
];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) {
    throw new Error(`Missing function ${name}`);
  }
  const rest = source.slice(start + 1);
  const nextMatch = rest.search(/\n\s*(?:(?:export\s+)?function\s+|const authoringParts\b)/);
  const next = nextMatch === -1 ? -1 : start + 1 + nextMatch;
  return source.slice(start, next === -1 ? undefined : next);
}

function loadValidator(file, validatorName) {
  return loadFunction(file, validatorName);
}

function loadFunction(file, functionName) {
  const source = readImplementation(file);
  const functionCode = extractFunction(source, functionName);
  return new Function(`
    function safeText(value, fallback = '') {
      const text = String(value ?? '').replace(/\\uFFFD+/g, '').trim();
      return text || fallback;
    }
    function safeArray(value) {
      return Array.isArray(value) ? value : [];
    }
    function requireText(value, label) {
      const text = safeText(value);
      if (!text) {
        throw new Error(\`Missing \${label} in upstream generation output\`);
      }
      return text;
    }
    ${functionCode}
    return ${functionName};
  `)();
}

function loadPptPageBudget() {
  return createPptDeckProfilePresetParts({
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeText: (value, fallback = '') => {
      const text = String(value ?? '').replace(/\uFFFD+/g, '').trim();
      return text || fallback;
    },
  }).pageBudget;
}

function readImplementation(file) {
  const source = readFileSync(file, 'utf-8');
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? readFileSync(path.join(path.dirname(file), shell[1]), 'utf-8') : source;
}

function listFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}

function buildMinimalSlideHtml(slideId, withStyleTag = false) {
  return [
    `<div data-slide-root="true" data-slide-id="${slideId}">`,
    withStyleTag ? '<style>.leak{color:red;}</style>' : '',
    '<section data-qa-block="hero" data-primary-point="true">核心信息</section>',
    '<section data-qa-block="support">补充信息</section>',
    '</div>',
  ].join('');
}

for (const family of FAMILY_VALIDATORS) {
  test(`${family.label} render_html accepts normal audience-facing markup`, () => {
    const validate = loadValidator(family.file, family.validator);
    const html = buildMinimalSlideHtml(family.slideId, false);
    assert.equal(validate(html, family.slideId), html);
  });

  test(`${family.label} render_html rejects leaked style blocks`, () => {
    const validate = loadValidator(family.file, family.validator);
    assert.throws(
      () => validate(buildMinimalSlideHtml(family.slideId, true), family.slideId),
      /style/i,
    );
  });
}

test('ppt render_html rejects audience-visible authoring metadata and source identifiers', () => {
  const validate = loadValidator(
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core.ts',
    'validateRenderedSlideContent',
  );
  const leakedHtml = [
    '<div data-slide-root="true" data-slide-id="S01">',
    '<section data-qa-block="hero" data-primary-point="true">第二篇研究结论</section>',
    '<section data-qa-block="support">speaker_notes: 这一页提醒讲者怎么讲；来源 MAT-003 / SRC-FILE-2。</section>',
    '</div>',
  ].join('');

  assert.throws(
    () => validate(leakedHtml, 'S01'),
    /authoring metadata/i,
  );
});

test('ppt render_html rejects internal paper IDs and talk-track meta-language', () => {
  const validate = loadValidator(
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core.ts',
    'validateRenderedSlideContent',
  );
  const leakedHtml = [
    '<div data-slide-root="true" data-slide-id="S01">',
    '<section data-qa-block="hero" data-primary-point="true">Paper 003 · 发表表达边界</section>',
    '<section data-qa-block="support">建议表达：本页强调评分可解释性；来源口径：Paper 003 稿件。</section>',
    '</div>',
  ].join('');

  assert.throws(
    () => validate(leakedHtml, 'S01'),
    /authoring metadata/i,
  );
});

test('prompt render artifacts are not tracked as source templates', () => {
  const promptHtmlFiles = listFiles('prompts').filter((file) => file.endsWith('.html'));
  const generatedArtifacts = promptHtmlFiles
    .filter((file) => file.includes(`${path.sep}render-artifacts${path.sep}`))
    .sort();
  const sourceTemplates = promptHtmlFiles
    .filter((file) => file.includes(`${path.sep}render-templates${path.sep}`))
    .sort();
  assert.deepEqual(generatedArtifacts, []);
  assert.deepEqual(sourceTemplates, []);
});

test('ppt authoring page budget keeps source page ranges as AI planning signals', () => {
  const pageBudget = loadPptPageBudget();
  const contract = {
    goal: '制作科室内部汇报，幻灯片不超过30页。',
    shared_source_truth: {
      extracted_materials: {
        materials: [
          {
            content_text: '页数：不超过 30 页，建议 16-22 页。',
          },
        ],
      },
    },
  };

  const budget = pageBudget('lecture_peer', contract);
  assert.equal(budget.contract_id, 'ppt_deck_ai_first_page_constraints_v1');
  assert.deepEqual(budget.hard_constraints, { max_slides: 30 });
  assert.equal(budget.min_slides, undefined);
  assert.equal(budget.max_slides, undefined);
  assert.equal(
    budget.planning_signals.some((signal) => signal.kind === 'suggested_range'
      && signal.min_slides === 16
      && signal.max_slides === 22
      && signal.binding === 'suggestion_only'),
    true,
  );
});

test('ppt authoring page budget consumes machine delivery_request constraints', () => {
  const pageBudget = loadPptPageBudget();
  const contract = {
    goal: '测试样片需要验证 RCA native PPTX 完整闭环。',
    delivery_request: {
      constraints: {
        expected_slide_count: 1,
        max_slides: 1,
      },
    },
  };

  const budget = pageBudget('lecture_peer', contract);
  assert.deepEqual(budget.hard_constraints, {
    exact_slides: 1,
    max_slides: 1,
  });
});

test('ppt authoring page budget treats source slide plans as suggestions only', () => {
  const pageBudget = loadPptPageBudget();
  const slidePlan = [
    '1. 封面：NF-PitNET 三篇论文科室内部进展汇报',
    '2. 本次同步的范围',
    '3. 共同数据基础',
    '4. 三篇论文一览',
    '5. 第一篇：研究问题与论文主线',
    '6. 第一篇：队列、终点和事件数',
    '7. 第一篇：模型策略和评价指标',
    '8. 第一篇：主要模型表现',
    '9. 第一篇：风险三分位结果',
    '10. 第二篇：研究问题与术后 3 个月 landmark',
    '11. 第二篇：队列、终点和事件数',
    '12. 第二篇：评分构成',
    '13. 第二篇：风险梯度',
    '14. 第二篇：模型比较',
    '15. 第三篇：研究问题与侵袭表型主线',
    '16. 第三篇：队列、终点和事件数',
    '17. 第三篇：Knosp 与侵袭性结构',
    '18. 第三篇：高 Knosp 伴随负担',
    '19. 第三篇：Knosp 之外模型增量',
    '20. 三篇论文的投稿口径总表',
    '21. 结束页',
  ].join('\n');
  const contract = {
    goal: '制作科室内部汇报，幻灯片不超过30页。',
    shared_source_truth: {
      source_brief: {
        brief_text: `建议逐页结构如下：\n${slidePlan}`,
      },
    },
  };

  const peerBudget = pageBudget('lecture_peer', contract);
  assert.deepEqual(peerBudget.hard_constraints, { max_slides: 30 });
  assert.equal(peerBudget.min_slides, undefined);
  assert.equal(peerBudget.max_slides, undefined);
  assert.equal(peerBudget.exact_slides, undefined);
  assert.equal(
    peerBudget.planning_signals.some((signal) => signal.kind === 'source_slide_plan_suggestion'
      && signal.total_slides === 21
      && signal.binding === 'suggestion_only'),
    true,
  );
  assert.deepEqual(pageBudget('executive_briefing', contract), peerBudget);
});

test('ppt authoring page budget does not derive hard budgets from per-paper guidance', () => {
  const pageBudget = loadPptPageBudget();
  const contract = {
    goal: '三篇论文科室汇报，不超过30页。每篇至少4页：临床问题与终点、方法或模型策略、关键数字结果、解释与边界。',
    shared_source_truth: {
      source_brief: {
        brief_text: [
          '第一篇：术前 early non-GTR 风险分层。',
          '第二篇：术后 3 个月内分泌负担随访分层。',
          '第三篇：侵袭表型结构与 Knosp 边界。',
        ].join('\n'),
      },
    },
  };

  const budget = pageBudget('lecture_peer', contract);
  assert.deepEqual(budget.hard_constraints, { max_slides: 30 });
  assert.equal(budget.min_slides, undefined);
  assert.equal(budget.max_slides, undefined);
  assert.equal(budget.hard_constraints.min_slides, undefined);
  assert.equal(
    budget.planning_signals.some((signal) => signal.kind === 'per_item_coverage_guidance'
      && signal.per_item_minimum_slides === 4
      && signal.named_item_count === 3
      && signal.binding === 'suggestion_only'),
    true,
  );
});
