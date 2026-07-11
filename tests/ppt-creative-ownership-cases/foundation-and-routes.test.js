import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(file, 'utf-8');
}

test('ppt creative route no longer depends on retired code-authored pack output', () => {
  const familyIndex = read('packages/redcube-runtime/src/families/ppt/index.ts');
  const runtime = [
    read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime.ts'),
    read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/authoring.ts'),
    read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/render.ts'),
  ].join('\n');

  assert.equal(existsSync('packages/redcube-pack-ppt'), false);
  assert.doesNotMatch(familyIndex, /@redcube\/pack-ppt|buildPptDetailedOutline|compilePptRenderSlides/);
  assert.doesNotMatch(runtime, /@redcube\/pack-ppt|compileRenderSlides/);
});

test('ppt prompts preserve AI-authored runtime artifacts and review/export gate sequence', () => {
  const storyline = read('prompts/ppt_deck/storyline.md');
  const render = read('prompts/ppt_deck/render_html.md');
  const director = read('prompts/ppt_deck/director_review.md');
  const screenshot = read('prompts/ppt_deck/screenshot_review.md');

  assert.match(storyline, /runtime_artifact/);
  assert.match(render, /runtime_artifact/);
  assert.match(director, /director|导演|visual/i);
  assert.match(screenshot, /screenshot|截图|review/i);
});
