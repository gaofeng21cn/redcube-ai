import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const HELPERS = ['safeText', 'requireText'];

const FAMILY_VALIDATORS = [
  {
    label: 'ppt',
    file: 'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js',
    validator: 'validateRenderedSlideContent',
    slideId: 'S01',
  },
  {
    label: 'xiaohongshu',
    file: 'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js',
    validator: 'validateRenderedSlideContent',
    slideId: 'P01',
  },
  {
    label: 'poster_onepager',
    file: 'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime.js',
    validator: 'validateRenderedPosterHtml',
    slideId: 'P01',
  },
];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) {
    throw new Error(`Missing function ${name}`);
  }
  const next = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

function loadValidator(file, validatorName) {
  const source = readFileSync(file, 'utf-8');
  const functionCode = [...HELPERS, validatorName]
    .map((name) => extractFunction(source, name))
    .join('\n\n');
  return new Function(`
    ${functionCode}
    return ${validatorName};
  `)();
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
