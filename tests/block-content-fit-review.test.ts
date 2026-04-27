// @ts-nocheck
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

function runReviewWithDecorativeGroundOverlap() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-decorative-ground-review-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });

  const inspection = {
    slideId: 'S05',
    title: '2026 年 AI 能力跃迁',
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
        id: 'visual-ground',
        left: 24,
        top: 24,
        width: 1104,
        height: 592,
        right: 1128,
        bottom: 616,
        area: 653568,
        textNodeCount: 0,
        hasSurfaceFrame: true,
      },
      {
        id: 'header',
        left: 54,
        top: 34,
        width: 1044,
        height: 118,
        right: 1098,
        bottom: 152,
        area: 123192,
        textNodeCount: 2,
        hasSurfaceFrame: false,
      },
      {
        id: 'main-card',
        left: 64,
        top: 178,
        width: 1012,
        height: 244,
        right: 1076,
        bottom: 422,
        area: 246928,
        textNodeCount: 2,
        hasSurfaceFrame: true,
      },
      {
        id: 'footer',
        left: 54,
        top: 590,
        width: 1044,
        height: 28,
        right: 1098,
        bottom: 618,
        area: 29232,
        textNodeCount: 1,
        hasSurfaceFrame: false,
      },
    ],
    auditBlocks: [],
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
      <div data-slide-root="true" data-slide-id="S05" data-title="2026 年 AI 能力跃迁" data-layout-family="multi_zone_compare" data-speaker-seconds="65" style="position:relative;width:1152px;height:648px;">
        <div data-qa-block="visual-ground" style="position:absolute;left:24px;top:24px;width:1104px;height:592px;border-radius:30px;background:linear-gradient(135deg,rgba(37,99,235,0.05),rgba(20,184,166,0.05));"></div>
        <div data-qa-block="header" style="position:absolute;left:54px;top:34px;width:1044px;height:118px;">
          <div style="font-size:44px;line-height:1.12;font-weight:780;">2026 年 AI 能力跃迁</div>
          <div style="font-size:24px;line-height:1.4;font-weight:650;color:#475569;margin-top:8px;">AI 正在组织多步工作。</div>
        </div>
        <div data-qa-block="main-card" data-primary-point="true" style="position:absolute;left:64px;top:178px;width:1012px;height:244px;border-radius:30px;background:#FFFFFF;border:1px solid #CBD5E1;padding:28px;box-sizing:border-box;">
          <div style="font-size:21px;line-height:1.18;font-weight:720;">回答 → 协作 → 工作流</div>
          <div style="font-size:16.5px;line-height:1.45;font-weight:600;color:#475569;margin-top:16px;">质量控制与医生监督进入同一条主线。</div>
        </div>
        <div data-qa-block="footer" style="position:absolute;left:54px;top:590px;width:1044px;height:28px;display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:#475569;border-top:1px solid #CBD5E1;">
          <div>OPL 系列项目介绍</div><div>05</div>
        </div>
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

function runReviewWithInconsistentPageNumbers() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-page-number-review-'));
  const htmlFile = path.join(workspaceRoot, 'deck.html');
  const outputDir = path.join(workspaceRoot, 'screenshots');
  const reviewMarkdown = path.join(workspaceRoot, 'review.md');
  mkdirSync(outputDir, { recursive: true });

  const inspections = [
    {
      slideId: 'S01',
      title: '第一页',
      layoutFamily: 'cover_signal',
      speakerSeconds: 60,
      primaryPoints: 1,
      wrapper: { clientWidth: 1152, clientHeight: 648, scrollWidth: 1152, scrollHeight: 648 },
      bodyScroll: false,
      blocks: [
        { id: 'title', left: 72, top: 64, width: 800, height: 80, right: 872, bottom: 144, area: 64000 },
        { id: 'page-number', left: 1024, top: 588, width: 52, height: 18, right: 1076, bottom: 606, area: 936 },
      ],
      auditBlocks: [],
      titleMeta: { titleFontSize: 56, titleLineCount: 1, titleBlockId: 'title' },
    },
    {
      slideId: 'S02',
      title: '第二页',
      layoutFamily: 'multi_zone_compare',
      speakerSeconds: 60,
      primaryPoints: 1,
      wrapper: { clientWidth: 1152, clientHeight: 648, scrollWidth: 1152, scrollHeight: 648 },
      bodyScroll: false,
      blocks: [
        { id: 'title', left: 72, top: 64, width: 800, height: 80, right: 872, bottom: 144, area: 64000 },
        { id: 'body', left: 96, top: 200, width: 680, height: 220, right: 776, bottom: 420, area: 149600 },
        { id: 'page-number', left: 68, top: 584, width: 72, height: 22, right: 140, bottom: 606, area: 1584 },
      ],
      auditBlocks: [],
      titleMeta: { titleFontSize: 44, titleLineCount: 1, titleBlockId: 'title' },
    },
  ];

  writeFileSync(htmlFile, `<!doctype html>
<html>
<body>
  <div class="slide visible" data-slide-shell="S01">
    <div class="slide-content-wrapper" style="width:1152px;height:648px;overflow:hidden;position:relative;background:#F8FAFC;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="S01" data-title="第一页" data-layout-family="cover_signal" data-speaker-seconds="60" style="position:relative;width:1152px;height:648px;">
        <div data-qa-block="title" style="position:absolute;left:72px;top:64px;width:800px;font-size:56px;line-height:1.08;font-weight:800;color:#0F172A;">第一页</div>
        <div data-qa-block="page-number" style="position:absolute;right:76px;bottom:42px;font-size:18px;line-height:1;font-weight:600;color:#64748B;">01</div>
      </div>
    </div>
  </div>
  <div class="slide" data-slide-shell="S02" style="display:none;">
    <div class="slide-content-wrapper" style="width:1152px;height:648px;overflow:hidden;position:relative;background:#F8FAFC;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">
      <div data-slide-root="true" data-slide-id="S02" data-title="第二页" data-layout-family="multi_zone_compare" data-speaker-seconds="60" style="position:relative;width:1152px;height:648px;">
        <div data-qa-block="title" style="position:absolute;left:72px;top:64px;width:800px;font-size:44px;line-height:1.12;font-weight:780;color:#0F172A;">第二页</div>
        <div data-qa-block="body" data-primary-point="true" style="position:absolute;left:96px;top:200px;width:680px;height:220px;border-radius:28px;background:#FFFFFF;border:1px solid #CBD5E1;"></div>
        <div data-qa-block="page-number" style="position:absolute;left:68px;bottom:40px;font-size:22px;line-height:1;font-weight:600;color:#111827;">2 / 8</div>
      </div>
    </div>
  </div>
  <script>
    const inspections = ${JSON.stringify(inspections)};
    let current = 0;
    window.redcubeDeckReview = {
      totalSlides: inspections.length,
      showSlide(index) {
        current = index;
        document.querySelectorAll('.slide').forEach((slide, slideIndex) => {
          slide.classList.toggle('visible', slideIndex === index);
          slide.style.display = slideIndex === index ? '' : 'none';
        });
      },
      inspectCurrentSlide() { return inspections[current]; }
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

test('shared screenshot review ignores decorative ground containers for occlusion and density', () => {
  const payload = runReviewWithDecorativeGroundOverlap();
  assert.equal(payload.status, 'pass');
  assert.equal(payload.slide_reviews[0].checks.occlusion_free, true);
  assert.equal(payload.slide_reviews[0].checks.visual_density_ok, true);
  assert.deepEqual(payload.slide_reviews[0].metrics.overlaps, []);
  assert.equal(payload.slide_reviews[0].metrics.occupied_ratio < 0.82, true);
});

test('shared screenshot review blocks inconsistent page number syntax and styling across a full deck', () => {
  const payload = runReviewWithInconsistentPageNumbers();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.page_number_consistency_ok, false);
  assert.equal(payload.slide_reviews[0].checks.page_number_consistency_ok, true);
  assert.equal(payload.slide_reviews[1].checks.page_number_consistency_ok, false);
  assert.equal(payload.slide_reviews[1].issues.includes('page_number_consistency_failed'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.syntax_family, 'current_total_slash');
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.reference.syntax_family, 'two_digit');
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('syntax_family'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('position'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('font_size'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('color'), true);
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
