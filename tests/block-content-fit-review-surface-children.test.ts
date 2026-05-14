// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

let cachedPythonCommand = null;
const PPT_DECK_REVIEW_MODULE = 'redcube_ai.native_helpers.ppt_deck.review';

function resolveTestPythonCommand() {
  if (cachedPythonCommand) {
    return cachedPythonCommand;
  }
  const explicitTestPython = String(process.env.REDCUBE_TEST_PYTHON || '').trim();
  cachedPythonCommand = explicitTestPython
    ? { command: explicitTestPython, args: [] }
    : resolveRedCubePythonCommand();
  return cachedPythonCommand;
}

function runReviewForSingleSlideBody(bodyHtml) {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-block-content-review-surface-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:1152px;height:648px;overflow:hidden;position:relative;background:#F7F8FC;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="S04" data-title="同一队列的三条剖面" data-layout-family="ring_cross" data-speaker-seconds="65" style="position:relative;width:1152px;height:648px;overflow:hidden;background:#F7F8FC;">
        ${bodyHtml}
      </div>
    </div>
  </div>
  <script>
    window.redcubeDeckReview = {
      totalSlides: 1,
      showSlide() {},
      inspectCurrentSlide() {
        return {
          slideId: 'S04',
          title: '同一队列的三条剖面',
          layoutFamily: 'ring_cross',
          speakerSeconds: 65,
          primaryPoints: 1,
          wrapper: { clientWidth: 1152, clientHeight: 648, scrollWidth: 1152, scrollHeight: 648 },
          bodyScroll: false,
          blocks: [],
          auditBlocks: [],
          titleMeta: { titleFontSize: 44, titleLineCount: 1, titleBlockId: 'header' }
        };
      }
    };
  </script>
</body>
</html>`, 'utf-8');
  const python = resolveTestPythonCommand();
  const result = spawnSync(
    python.command,
    [
      ...(python.args || []),
      '-m',
      PPT_DECK_REVIEW_MODULE,
      '--html',
      htmlFile,
      '--output-dir',
      outputDir,
      '--review-markdown',
      reviewMarkdown,
      '--max-primary-points',
      '5',
      '--frame-width',
      '1152',
      '--frame-height',
      '648',
    ],
    {
      encoding: 'utf-8',
      env: {
        ...process.env,
        PYTHONPATH: process.env.PYTHONPATH
          ? `${path.resolve('python')}${path.delimiter}${process.env.PYTHONPATH}`
          : path.resolve('python'),
      },
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('shared screenshot review blocks overlapping or overflowing surfaced children inside a qa block', () => {
  const overlapPayload = runReviewForSingleSlideBody(`
    <section data-qa-block="ring-overview" data-primary-point="true" style="position:absolute;left:250px;top:190px;width:652px;height:286px;">
      <div style="position:absolute;left:242px;top:63px;width:168px;height:168px;border-radius:50%;background:#FFFFFF;border:2px solid #BFDBFE;display:flex;align-items:center;justify-content:center;text-align:center;font-size:32px;font-weight:800;">357例队列</div>
      <div style="position:absolute;left:213px;top:212px;width:226px;height:108px;border-radius:8px;background:#FFFFFF;border:1px solid #D7E2F2;padding:16px 18px;box-sizing:border-box;font-size:20px;font-weight:720;">第三篇<br />Knosp结构边界</div>
    </section>
  `);
  assert.equal(overlapPayload.status, 'block');
  assert.equal(overlapPayload.checks.block_content_fit_ok, false);
  assert.equal(overlapPayload.slide_reviews[0].checks.occlusion_free, false);
  assert.equal(
    overlapPayload.slide_reviews[0].metrics.block_content_failures.some((failure) => failure.overflow_reason === 'surface_text_targets_overlap'),
    true,
  );

  const scrollPayload = runReviewForSingleSlideBody(`
    <section data-qa-block="model-rail" data-primary-point="true" style="position:absolute;left:72px;top:188px;width:1008px;height:254px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:28px 30px;box-sizing:border-box;">
      <div style="height:150px;width:299px;border:1px solid #E5E7EB;border-radius:8px;background:#F8FAFC;padding:18px;box-sizing:border-box;overflow:visible;font-size:21px;line-height:1.18;font-weight:720;">
        核心术前模型
        <div style="margin-top:17px;display:flex;flex-wrap:wrap;gap:8px;font-size:15.8px;line-height:1.25;font-weight:650;color:#475569;">
          <span style="white-space:nowrap;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:999px;padding:6px 9px;">年龄/性别</span><span style="white-space:nowrap;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:999px;padding:6px 9px;">视觉症状</span><span style="white-space:nowrap;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:999px;padding:6px 9px;">内分泌状态</span><span style="white-space:nowrap;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:999px;padding:6px 9px;">最大直径</span><span style="white-space:nowrap;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:999px;padding:6px 9px;">Knosp分级</span><span style="white-space:nowrap;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:999px;padding:6px 9px;">侵袭性</span>
        </div>
      </div>
    </section>
  `);
  assert.equal(scrollPayload.status, 'block');
  assert.equal(scrollPayload.checks.block_content_fit_ok, false);
  assert.equal(
    scrollPayload.slide_reviews[0].metrics.block_content_failures.some((failure) => failure.overflow_reason === 'surface_text_scroll_overflow'),
    true,
  );

  const nestedGroupPayload = runReviewForSingleSlideBody(`
    <section data-qa-block="score-components" data-primary-point="true" style="position:absolute;left:70px;top:214px;width:1012px;height:236px;border-radius:8px;background:#FFFFFF;border:1px solid #E2E8F0;padding:24px 30px 22px 30px;box-sizing:border-box;">
      <div style="display:grid;grid-template-columns:1fr 34px 1fr 34px 165px 42px 1fr;gap:8px;align-items:stretch;height:138px;">
        <div style="border-radius:8px;background:#EEF6FF;border:1px solid #BFDBFE;padding:16px;box-sizing:border-box;">术前垂体功能减退</div>
        <div style="display:flex;align-items:center;justify-content:center;">+</div>
        <div style="border-radius:8px;background:#EEF6FF;border:1px solid #BFDBFE;padding:16px;box-sizing:border-box;">3个月内分泌轴负担</div>
        <div style="display:flex;align-items:center;justify-content:center;">+</div>
        <div style="border-radius:8px;background:#F0FDFA;border:1px solid #99F6E4;padding:16px 14px;box-sizing:border-box;min-width:0;">
          <div style="font-size:21px;line-height:1.18;font-weight:720;white-space:nowrap;">3个月 non-GTR负担</div>
          <div style="font-size:16.5px;line-height:1.35;font-weight:600;color:#475569;margin-top:10px;">0或1分</div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;">=</div>
        <div style="border-radius:8px;background:#2563EB;color:#FFFFFF;padding:16px 14px;box-sizing:border-box;">0-5</div>
      </div>
      <div data-qa-block="risk-strata" style="position:absolute;left:30px;right:30px;bottom:22px;height:42px;border-radius:999px;background:#EFF6FF;border:1px solid #DBEAFE;">低风险：0分　中风险：1-2分　高风险：3-5分</div>
    </section>
  `);
  assert.equal(nestedGroupPayload.status, 'block');
  assert.equal(nestedGroupPayload.checks.block_content_fit_ok, false);
  assert.equal(
    nestedGroupPayload.slide_reviews[0].metrics.block_content_failures.some((failure) => (
      failure.block_id === 'score-components'
      && failure.overflow_reason === 'block_text_overflow'
      && failure.overflow_sides.includes('right')
    )),
    true,
  );
});
