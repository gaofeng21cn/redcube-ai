// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function read(relativePath) {
  return readFileSync(path.resolve(relativePath), 'utf-8');
}

test('active prompt packs expose schema guidance instead of fixed default story templates', () => {
  const promptChecks = [
    {
      file: 'prompts/ppt_deck/detailed_outline.md',
      forbidden: [
        /"profile_variants"\s*:/,
        /"slide_range":\s*"07-08"/,
        /"title":\s*"问题重构"/,
        /"title":\s*"实践收束"/,
      ],
    },
    {
      file: 'prompts/ppt_deck/visual_direction.md',
      forbidden: [
        /"slide_id":\s*"S08"/,
        /"S04"/,
        /"multi_zone_compare":\s*2/,
      ],
    },
    {
      file: 'prompts/xiaohongshu/visual_direction.md',
      forbidden: [
        /"slide_id"\s*:\s*"N06"/,
        /"N04"/,
        /"cover_note":\s*1/,
        /"action_checklist":\s*1/,
      ],
    },
    {
      file: 'prompts/xiaohongshu/single_note_plan.md',
      forbidden: [
        /先把问题说人话/,
        /为什么很多人一开始就抓错重点/,
        /最后给一个能直接照抄的动作清单/,
      ],
    },
    {
      file: 'prompts/xiaohongshu/publish_copy.md',
      forbidden: [
        /先别急着收藏更多碎片建议/,
        /先把问题讲成人话，再看公开来源能不能支撑，最后才决定动作怎么落/,
      ],
    },
    {
      file: 'prompts/poster_onepager/visual_direction.md',
      forbidden: [
        /"peak_region":\s*"hero_band"/,
        /"hero_band":\s*1/,
        /"evidence_columns":\s*1/,
        /"pathway_strip":\s*1/,
        /"action_footer":\s*1/,
      ],
    },
    {
      file: 'prompts/poster_onepager/poster_blueprint.md',
      forbidden: [
        /先读 headline，再看证据，再执行动作/,
        /把这张图保存下来/,
        /需要时按同一顺序复核/,
      ],
    },
  ];

  for (const check of promptChecks) {
    const text = read(check.file);
    assert.match(text, /AI-first|schema|output/i, check.file);
    for (const pattern of check.forbidden) {
      assert.equal(pattern.test(text), false, `${check.file} still contains fixed template content: ${pattern}`);
    }
  }
});

test('xiaohongshu source context does not programmatically author story framing from source snippets', () => {
  const support = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/support.ts');
  const authoring = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/authoring.ts');

  assert.equal(/function\s+sourceSnippet\b/.test(support), false);
  assert.equal(/deriveAudienceFromSource|deriveTensionFromSource|deriveWhyNowFromSource|deriveMemoryHookFromSource/.test(support), false);
  assert.equal(/audience_seed|tension_seed|why_now_seed|memory_hook_seed/.test(support), false);
  assert.equal(/promptSeed\(contract,\s*'research'/.test(authoring), false);
});

test('ppt prompt seed helper does not merge profile-specific creative variants', () => {
  const helper = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core-helpers.ts');

  assert.equal(/profile_variants/.test(helper), false);
});

test('ppt runtime validators do not impose hidden default slide counts', () => {
  const authoring = [
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/authoring.ts'),
    read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/authoring-source-helpers.ts'),
  ].join('\n');
  const render = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/render.ts');

  assert.equal(/slides\.length\s*<\s*6/.test(authoring), false);
  assert.equal(/slideHtmlList\.length\s*<\s*6/.test(render), false);
  assert.equal(/must contain at least 6 slides/.test(`${authoring}\n${render}`), false);
  assert.match(authoring, /assertPageConstraints/);
  assert.match(authoring, /hard_constraints/);
  assert.equal(authoring.includes("peak_pages: ['S01', 'S04']"), false);
  assert.equal(/multi_zone_compare:\s*2/.test(authoring), false);
});

test('xiaohongshu runtime does not impose hidden carousel length defaults', () => {
  const authoring = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/authoring.ts');
  const render = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/render.ts');
  const support = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/support.ts');

  assert.equal(/single_note_plan\.slides', \{ min: 4, max: 8 \}/.test(authoring), false);
  assert.equal(/visual_direction\.rhythm_curve', \{ min: 4, max: 8 \}/.test(authoring), false);
  assert.equal(/render_html\.slides', \{ min: 4, max: 8 \}/.test(render), false);
  assert.equal(support.includes("rhythm_curve: [{ slide_id: 'N01'"), false);
  assert.equal(/cover_note:\s*1/.test(support), false);
});

test('poster visual direction does not impose a fixed four-region layout', () => {
  const prompt = read('prompts/poster_onepager/visual_direction.md');
  const authoring = read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/authoring.ts');
  const render = read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/core.ts');

  assert.equal(/peak_region:\s*'hero_band'/.test(authoring), false);
  assert.equal(/hero_band:\s*1/.test(authoring), false);
  assert.equal(/safeText\(visualArtifact\?\.visual_direction\?\.peak_region,\s*'hero_band'\)/.test(render), false);
  assert.match(prompt, /current poster_blueprint\.panels/);
});
