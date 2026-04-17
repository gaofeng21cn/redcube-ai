import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function runReviewWithOverflowingBlock() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-block-content-review-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });

  const inspection = {
    slideId: 'S06',
    title: '第三步：结果必须回到可审计的真相载体',
    layoutFamily: 'multi_zone_compare',
    speakerSeconds: 65,
    primaryPoints: 1,
    wrapper: {
      clientWidth: 1152,
      clientHeight: 648,
      scrollWidth: 1152,
      scrollHeight: 648,
    },
    bodyScroll: false,
    blocks: [
      {
        id: 'contract-card',
        left: 112,
        top: 190,
        width: 172,
        height: 70,
        right: 284,
        bottom: 260,
        area: 12040,
      },
      {
        id: 'primary',
        left: 360,
        top: 180,
        width: 640,
        height: 320,
        right: 1000,
        bottom: 500,
        area: 204800,
      },
    ],
    auditBlocks: [
      {
        id: 'header',
        left: 72,
        top: 46,
        width: 1008,
        height: 58,
        right: 1080,
        bottom: 104,
        area: 58464,
        textNodeCount: 1,
        hasSurfaceFrame: false,
        edgeClearance: { left: 72, top: 46, right: 72, bottom: 544 },
        internalPadding: null,
      },
      {
        id: 'contract-card',
        left: 112,
        top: 190,
        width: 172,
        height: 70,
        right: 284,
        bottom: 260,
        area: 12040,
        textNodeCount: 2,
        hasSurfaceFrame: true,
        edgeClearance: { left: 112, top: 190, right: 868, bottom: 388 },
        internalPadding: { left: 16, top: 14, right: 16, bottom: 12 },
      },
      {
        id: 'primary',
        left: 360,
        top: 180,
        width: 640,
        height: 320,
        right: 1000,
        bottom: 500,
        area: 204800,
        textNodeCount: 0,
        hasSurfaceFrame: true,
        edgeClearance: { left: 360, top: 180, right: 152, bottom: 148 },
        internalPadding: null,
      },
    ],
    titleMeta: {
      titleFontSize: 44,
      titleLineCount: 1,
      titleBlockId: 'header',
    },
  };

  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:1152px;height:648px;overflow:hidden;position:relative;background:#F7F8FC;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="S06" data-title="第三步：结果必须回到可审计的真相载体" data-layout-family="multi_zone_compare" data-speaker-seconds="65" style="position:relative;width:1152px;height:648px;">
        <div data-qa-block="header" style="position:absolute;left:72px;top:46px;width:1008px;">
          <div style="font-size:44px;line-height:1.12;font-weight:780;">第三步：结果必须回到可审计的真相载体</div>
        </div>
        <div data-qa-block="contract-card" style="position:absolute;left:112px;top:190px;width:172px;height:70px;padding:14px 16px 12px 16px;border-radius:20px;background:#fff;border:1px solid rgba(37,99,235,0.10);overflow:visible;">
          <div style="font-size:21px;line-height:1.18;font-weight:730;color:#0F172A;">研究契约</div>
          <div style="margin-top:6px;font-size:15.4px;line-height:1.34;font-weight:600;color:#475569;">这是一段明显会换成两行并且继续溢出卡片底部的正文文本</div>
        </div>
        <div data-qa-block="primary" data-primary-point="true" style="position:absolute;left:360px;top:180px;width:640px;height:320px;border-radius:34px;background:#fff;border:1px solid rgba(37,99,235,0.15);"></div>
      </div>
    </div>
  </div>
  <script>
    const inspection = ${JSON.stringify(inspection)};
    window.redcubeDeckReview = {
      totalSlides: 1,
      showSlide() { return inspection; },
      inspectCurrentSlide() { return inspection; }
    };
  </script>
</body>
</html>`, 'utf-8');

  const result = spawnSync(
    process.env.REDCUBE_TEST_PYTHON || 'python3',
    [
      path.resolve('packages/redcube-runtime/scripts/ppt_deck_review.py'),
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
    { encoding: 'utf-8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function runReviewWithUnframedHeader() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-block-content-review-header-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });

  const inspection = {
    slideId: 'N02',
    title: '为什么很多人一开始就抓错重点',
    layoutFamily: 'myth_compare',
    speakerSeconds: 36,
    primaryPoints: 1,
    wrapper: {
      clientWidth: 448,
      clientHeight: 597,
      scrollWidth: 448,
      scrollHeight: 597,
    },
    bodyScroll: false,
    blocks: [
      {
        id: 'header',
        left: 20,
        top: 22,
        width: 408,
        height: 58.59,
        right: 428,
        bottom: 80.59,
        area: 23904.72,
      },
      {
        id: 'card-1',
        left: 20,
        top: 94.59,
        width: 408,
        height: 72,
        right: 428,
        bottom: 166.59,
        area: 29376,
      },
    ],
    auditBlocks: [],
    titleMeta: {
      titleFontSize: 28,
      titleLineCount: 1,
      titleBlockId: 'header',
    },
  };

  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:448px;height:597px;overflow:hidden;position:relative;background:#FFFBF0;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="N02" data-title="为什么很多人一开始就抓错重点" data-layout-family="myth_compare" data-speaker-seconds="36" style="position:relative;width:448px;height:597px;background:#FFFBF0;overflow:hidden;padding:22px 20px 26px;display:grid;grid-template-rows:auto 1fr auto;gap:14px;">
        <header data-qa-block="header" style="display:grid;gap:8px;">
          <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:800;color:#2563EB;">问题界定</div>
          <h2 style="margin:0;font-size:28px;line-height:1.2;color:#0F172A;">为什么很多人一开始就抓错重点</h2>
        </header>
        <section style="display:grid;gap:12px;align-content:start;">
          <article data-qa-block="card-1" data-primary-point="true" style="padding:12px 14px;border-radius:18px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.1);font-size:18px;line-height:1.5;color:#0F172A;">先把判断顺序讲清，再谈信息补充。</article>
        </section>
        <footer data-qa-block="footer" style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#475569;">
          <div>公开来源</div>
          <div style="font-weight:700;">2 / 6</div>
        </footer>
      </div>
    </div>
  </div>
  <script>
    const inspection = ${JSON.stringify(inspection)};
    window.redcubeDeckReview = {
      totalSlides: 1,
      showSlide() { return inspection; },
      inspectCurrentSlide() { return inspection; }
    };
  </script>
</body>
</html>`, 'utf-8');

  const result = spawnSync(
    process.env.REDCUBE_TEST_PYTHON || 'python3',
    [
      path.resolve('packages/redcube-runtime/scripts/ppt_deck_review.py'),
      '--html',
      htmlFile,
      '--output-dir',
      outputDir,
      '--review-markdown',
      reviewMarkdown,
      '--max-primary-points',
      '4',
      '--frame-width',
      '448',
      '--frame-height',
      '597',
    ],
    { encoding: 'utf-8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('shared screenshot review blocks surfaced block content that spills out of its card', () => {
  const payload = runReviewWithOverflowingBlock();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(Array.isArray(payload.slide_reviews[0].metrics.block_content_failures), true);
  assert.equal(payload.slide_reviews[0].metrics.block_content_failures.length > 0, true);
});

test('shared screenshot review does not treat unframed header groups as block content overflow', () => {
  const payload = runReviewWithUnframedHeader();
  assert.equal(payload.status, 'pass');
  assert.equal(payload.checks.block_content_fit_ok, true);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, true);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), false);
  assert.deepEqual(payload.slide_reviews[0].metrics.block_content_failures, []);
});
