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

function runReviewWithOverflowingChildGroup() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-block-content-review-group-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });

  const inspection = {
    slideId: 'N06',
    title: '复用模块这件事，它切得很干净',
    layoutFamily: 'evidence_strip',
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
        id: 'title',
        left: 30,
        top: 34,
        width: 374,
        height: 82,
        right: 404,
        bottom: 116,
        area: 30668,
      },
      {
        id: 'foundation-card',
        left: 58,
        top: 194,
        width: 320,
        height: 82,
        right: 378,
        bottom: 276,
        area: 26240,
      },
      {
        id: 'mainline-card',
        left: 70,
        top: 304,
        width: 308,
        height: 92,
        right: 378,
        bottom: 396,
        area: 28336,
      },
      {
        id: 'execution-card',
        left: 82,
        top: 418,
        width: 296,
        height: 96,
        right: 378,
        bottom: 514,
        area: 28416,
      },
    ],
    auditBlocks: [],
    titleMeta: {
      titleFontSize: 32,
      titleLineCount: 2,
      titleBlockId: 'title',
    },
  };

  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:448px;height:597px;overflow:hidden;position:relative;background:#F8F4EA;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="N06" data-title="复用模块这件事，它切得很干净" data-layout-family="evidence_strip" data-speaker-seconds="36" style="position:relative;width:448px;height:597px;overflow:hidden;background:#F8F4EA;">
        <div data-qa-block="title" style="position:absolute;left:30px;top:34px;width:374px;">
          <div style="font-size:13px;line-height:1.2;font-weight:800;color:#2563EB;">模块复用决定扩展性</div>
          <div style="margin-top:8px;font-size:32px;line-height:1.18;font-weight:800;color:#132238;">复用模块这件事，<br />它切得很干净</div>
        </div>
        <section data-qa-block="module-stack" data-primary-point="true" style="position:absolute;left:46px;top:170px;width:338px;height:316px;border:2px dashed rgba(37,99,235,0.24);border-radius:28px;background:rgba(255,255,255,0.28);">
          <article data-qa-block="foundation-card" style="position:absolute;left:12px;top:24px;width:320px;height:82px;padding:14px 18px;border-radius:22px;background:#FFFFFF;border:1px solid rgba(18,34,56,0.1);box-shadow:0 10px 22px rgba(15,23,42,0.06);">
            <div style="font-size:18px;line-height:1.2;font-weight:800;color:#132238;">共享工程底座</div>
            <div style="margin-top:8px;font-size:14px;line-height:1.44;color:#475569;">供给通用运行能力，让医学主线持续复用成熟基础设施。</div>
          </article>
          <article data-qa-block="mainline-card" style="position:absolute;left:24px;top:134px;width:308px;height:92px;padding:16px 18px;border-radius:24px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.18);box-shadow:0 12px 24px rgba(37,99,235,0.08);">
            <div style="font-size:18px;line-height:1.2;font-weight:800;color:#1E3A8A;">Med Auto Science</div>
            <div style="margin-top:8px;font-size:14px;line-height:1.44;color:#334155;">把 gateway、controller、overlay、adapter 串成正式控制链。</div>
          </article>
          <article data-qa-block="execution-card" style="position:absolute;left:36px;top:248px;width:296px;height:96px;padding:14px 18px;border-radius:22px;background:#FFFFFF;border:1px solid rgba(18,34,56,0.1);box-shadow:0 10px 22px rgba(15,23,42,0.06);">
            <div style="font-size:18px;line-height:1.2;font-weight:800;color:#132238;">执行面</div>
            <div style="margin-top:8px;font-size:14px;line-height:1.44;color:#475569;">把具体研究任务真正跑透，分层越清楚，长期扩展越轻盈。</div>
          </article>
        </section>
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

function runReviewWithUntaggedTakeawayText() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-block-content-review-untagged-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });

  const inspection = {
    slideId: 'N03',
    title: 'Med Auto Science 先把自己的位置站稳了',
    layoutFamily: 'sequence_stack',
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
        id: 'title',
        left: 30,
        top: 34,
        width: 366,
        height: 92,
        right: 396,
        bottom: 126,
        area: 33672,
      },
      {
        id: 'stack-bottom',
        left: 60,
        top: 430,
        width: 332,
        height: 122,
        right: 392,
        bottom: 552,
        area: 40504,
      },
    ],
    auditBlocks: [],
    titleMeta: {
      titleFontSize: 34,
      titleLineCount: 2,
      titleBlockId: 'title',
    },
  };

  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:448px;height:597px;overflow:hidden;position:relative;background:#F8F4EA;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="N03" data-title="Med Auto Science 先把自己的位置站稳了" data-layout-family="sequence_stack" data-speaker-seconds="36" style="position:relative;width:448px;height:597px;overflow:hidden;background:#F8F4EA;">
        <div data-qa-block="title" data-primary-point="true" style="position:absolute;left:30px;top:34px;width:366px;">
          <div style="font-size:13px;line-height:1.2;font-weight:800;color:#2563EB;">系统定位先站稳</div>
          <div style="margin-top:8px;font-size:34px;line-height:1.2;font-weight:800;">Med Auto Science<br />先把自己的位置站稳了</div>
        </div>
        <div data-qa-block="stack-bottom" style="position:absolute;left:60px;top:430px;width:332px;padding:18px 20px;background:#FFFFFF;border:1px solid rgba(18,34,56,0.1);border-radius:22px;box-shadow:0 10px 22px rgba(15,23,42,0.06);">
          <div style="font-size:17px;line-height:1.2;font-weight:800;color:#132238;">执行面协作层</div>
          <div style="margin-top:10px;font-size:16px;line-height:1.55;color:#475569;">具体研究任务在这里真正展开，分工清楚，整条链更稳也更好协作。</div>
        </div>
        <div style="position:absolute;left:30px;bottom:22px;font-size:14px;line-height:1.2;font-weight:700;color:#64748B;">位置一旦站稳，整条自动科研主线就能稳定前进。</div>
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

function runReviewWithAdjacentReadableBlocksTooClose() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-block-content-review-adjacent-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });

  const inspection = {
    slideId: 'N01',
    title: '医学自动科研真正拉开差距的是主链',
    layoutFamily: 'cover_note',
    speakerSeconds: 42,
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
        id: 'hero_statement',
        left: 31,
        top: 95,
        width: 286,
        height: 180,
        right: 317,
        bottom: 275,
        area: 51480,
      },
      {
        id: 'chain_strip',
        left: 31,
        top: 277,
        width: 288,
        height: 136,
        right: 319,
        bottom: 413,
        area: 39168,
      },
    ],
    auditBlocks: [],
    titleMeta: {
      titleFontSize: 30,
      titleLineCount: 2,
      titleBlockId: 'hero_statement',
    },
  };

  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible">
    <div class="slide-content-wrapper" style="width:448px;height:597px;overflow:hidden;position:relative;background:#F8F4EA;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="N01" data-title="医学自动科研真正拉开差距的是主链" data-layout-family="cover_note" data-speaker-seconds="42" style="position:relative;width:448px;height:597px;overflow:hidden;background:#F8F4EA;">
        <section data-qa-block="hero_statement" data-primary-point="true" style="position:absolute;left:31px;top:95px;width:286px;height:180px;padding:20px 22px;border-radius:28px;background:#FFFFFF;border:1px solid rgba(18,34,56,0.1);box-sizing:border-box;">
          <div style="font-size:30px;line-height:1.2;font-weight:800;color:#132238;">医学自动科研<br />真正拉开差距的是主链</div>
          <div style="margin-top:14px;font-size:16px;line-height:1.48;color:#475569;">把研究真相稳稳钉进正式链路，系统才有资格承接论文级产出。</div>
        </section>
        <section data-qa-block="chain_strip" style="position:absolute;left:31px;top:277px;width:288px;height:136px;padding:18px 20px;border-radius:24px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.18);box-sizing:border-box;">
          <div style="font-size:17px;line-height:1.2;font-weight:800;color:#1E3A8A;">主链先定推进顺序</div>
          <div style="margin-top:10px;font-size:14px;line-height:1.5;color:#334155;">policy → controller → overlay → adapter，研究入口、控制链和能力接入沿同一轨道向前推。</div>
        </section>
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

test('shared screenshot review blocks surfaced parent groups whose child cards spill outside the group frame', () => {
  const payload = runReviewWithOverflowingChildGroup();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(Array.isArray(payload.slide_reviews[0].metrics.block_content_failures), true);
  assert.equal(payload.slide_reviews[0].metrics.block_content_failures.length > 0, true);
});

test('shared screenshot review blocks visible audience-facing text that is not covered by a qa block', () => {
  const payload = runReviewWithUntaggedTakeawayText();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(Array.isArray(payload.slide_reviews[0].metrics.block_content_failures), true);
  assert.equal(
    payload.slide_reviews[0].metrics.block_content_failures.some((failure) => failure.overflow_reason === 'untagged_text_block'),
    true,
  );
});

test('shared screenshot review blocks adjacent readable qa blocks with unsafe clearance', () => {
  const payload = runReviewWithAdjacentReadableBlocksTooClose();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(
    payload.slide_reviews[0].metrics.block_content_failures.some(
      (failure) => failure.overflow_reason === 'adjacent_readable_blocks_too_close',
    ),
    true,
  );
});
