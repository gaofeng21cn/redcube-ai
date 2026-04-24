import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cpSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';

export function createPptDeckSurfaceParts(deps) {
  const {
    ensureDir,
    existsSync,
    formatTimestamp,
    getDeliverablePaths,
    readCurrentHtmlArtifact,
    readJson,
    safeArray,
    safeFileMtimeMs,
    safeText,
    isOperatorContextMaterial,
    sharedSourceTruth,
    stageArtifactPath,
    writeJson,
    writeText,
  } = deps;

  function createReviewCapturePaths(deliverablePaths, deliverableId) {
    const captureId = `capture-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots', captureId));
    return {
      captureId,
      screenshotsDir,
      reviewMarkdownFile: path.join(screenshotsDir, `${deliverableId}_视觉质控.md`),
    };
  }

  function sanitizeSurfaceSegment(value, fallback = 'deliverable') {
    const text = safeText(value, fallback)
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/[：]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text || fallback;
  }
  
  function getPptOperatorViewPaths({ deliverablePaths, contract, deliverableId }) {
    const operatorDir = path.join(deliverablePaths.viewsDir, 'operator');
    const chapterBaseName = sanitizeSurfaceSegment(contract?.title, deliverableId);
    return {
      operatorDir,
      chapterBaseName,
      storylineFile: path.join(operatorDir, '故事主线.md'),
      detailedOutlineFile: path.join(operatorDir, '详细大纲.md'),
      outlineDir: path.join(operatorDir, '大纲'),
      blueprintFile: path.join(operatorDir, '大纲', `${chapterBaseName}.md`),
      visualDirectionFile: path.join(operatorDir, '大纲', `${chapterBaseName}_视觉导演稿.md`),
      slidesDir: path.join(operatorDir, '幻灯片'),
      slidesReadmeFile: path.join(operatorDir, '幻灯片', 'README.md'),
      revisionBriefFile: path.join(operatorDir, '幻灯片', '当前返修要求.md'),
      referencesDir: path.join(operatorDir, '参考材料'),
      referenceIndexFile: path.join(operatorDir, '参考材料', '来源索引.md'),
      publishDir: path.join(deliverablePaths.deliverableDir, 'publish'),
      publishReadmeFile: path.join(deliverablePaths.deliverableDir, 'publish', 'README.md'),
      pptxFile: path.join(deliverablePaths.deliverableDir, 'publish', `${deliverableId}.pptx`),
      pdfFile: path.join(deliverablePaths.deliverableDir, 'publish', `${deliverableId}.pdf`),
      presenterNotesFile: path.join(deliverablePaths.deliverableDir, 'publish', `${deliverableId}-presenter-notes.md`),
    };
  }
  
  function getDeliverableViewSurfacePaths(deliverablePaths, deliverableId) {
    return {
      stableHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.html`),
      stableSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`),
      draftHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.html`),
      draftSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.slides.json`),
    };
  }
  
  function ensurePptOperatorViewSurface(paths) {
    ensureDir(paths.operatorDir);
    ensureDir(paths.outlineDir);
    ensureDir(paths.slidesDir);
    ensureDir(paths.referencesDir);
    ensureDir(paths.publishDir);
  }
  
  function sourceIndexEntries(contract) {
    return safeArray(sharedSourceTruth(contract)?.source_index?.sources)
      .filter((source) => source?.status === 'ready' && !isOperatorContextMaterial(source))
      .map((source) => ({
        source_id: safeText(source.source_id),
        title: safeText(source.title),
        relative_path: safeText(source.relative_path),
        kind: safeText(source.kind),
      }));
  }
  
  function buildOperatorReferenceIndex(contract) {
    const lines = [
      '# 来源索引',
      '',
      `- 讲题：${safeText(contract?.title)}`,
      `- 交付目标：${safeText(contract?.goal)}`,
      '',
    ];
    const entries = sourceIndexEntries(contract);
    if (entries.length === 0) {
      lines.push('- 当前没有 audience-facing 来源文件。');
      return `${lines.join('\n')}\n`;
    }
    lines.push('## Audience-facing 来源');
    for (const entry of entries) {
      lines.push(`- ${entry.source_id || entry.kind || 'SRC'}：${entry.title || entry.relative_path || entry.kind}`);
    }
    return `${lines.join('\n')}\n`;
  }
  
  function markdownList(items = [], ordered = false) {
    return safeArray(items)
      .map((item, index) => `${ordered ? `${index + 1}.` : '-'} ${safeText(item)}`)
      .join('\n');
  }
  
  function buildOperatorStorylineMarkdown(contract, artifact) {
    const storyline = artifact?.storyline || {};
    const narrative = storyline?.narrative_arc || {};
    return [
      `# ${safeText(contract.title)} 故事主线`,
      '',
      '## 讲者与课堂契约',
      `- 讲者：${safeText(storyline.speaker)}`,
      `- 听众：${safeText(storyline.audience)}`,
      `- 目标：${safeText(storyline.goal || contract.goal)}`,
      `- 风格：${safeText(storyline.style)}`,
      '',
      '## 核心隐喻',
      safeText(storyline.core_metaphor),
      '',
      '## Hook',
      markdownList(narrative.hook),
      '',
      '## Journey',
      markdownList(narrative.journey, true),
      '',
      '## Resolution',
      markdownList(narrative.resolution),
      '',
      '## 事实锚点',
      `- 主题摘要：${safeText(storyline.fact_library_summary)}`,
      `- 来源充分性：${safeText(storyline.source_sufficiency_judgement)}`,
      `- 深调状态：${safeText(storyline.deep_research_state)}`,
      '',
    ].join('\n');
  }
  
  function buildOperatorDetailedOutlineMarkdown(contract, artifact) {
    const outline = artifact?.detailed_outline || {};
    const slides = safeArray(outline.slides);
    const lines = [
      `# ${safeText(contract.title)} 详细大纲`,
      '',
      `- 总页数：${safeText(outline?.page_budget?.total_slides, String(slides.length))}`,
      `- 交付目标：${safeText(contract.goal)}`,
      '',
      '## 章节结构',
    ];
    for (const chapter of safeArray(outline.chapter_structure)) {
      lines.push(`- ${safeText(chapter.chapter_id)}｜${safeText(chapter.title)}｜${safeText(chapter.slide_range)}`);
    }
    lines.push('', '## 逐页预算');
    for (const slide of slides) {
      lines.push(`### 幻灯片 ${safeText(slide.slide_no)} ${safeText(slide.title)}`);
      lines.push(`- 页面类型：${safeText(slide.page_type)}`);
      lines.push(`- 本页目标：${safeText(slide.page_goal)}`);
      lines.push(`- 核心句：${safeText(slide.core_sentence)}`);
      lines.push('- 证据点：');
      for (const point of safeArray(slide.evidence_points)) {
        lines.push(`  - ${safeText(point)}`);
      }
      lines.push('- 公开来源：');
      for (const source of safeArray(slide.public_sources)) {
        lines.push(`  - ${safeText(source)}`);
      }
      lines.push(`- 过渡句：${safeText(slide.transition_sentence)}`);
      lines.push('');
    }
    return `${lines.join('\n')}\n`;
  }
  
  function buildOperatorBlueprintMarkdown(contract, artifact) {
    const blueprint = artifact?.slide_blueprint || {};
    const slides = safeArray(blueprint.slides);
    const lines = [
      `# ${safeText(contract.title)}（Slides 01-${String(slides.length).padStart(2, '0')}）`,
      '',
      '## 本章目标',
      `- ${safeText(blueprint.chapter_goal)}`,
      `- ${safeText(contract.goal)}`,
      '',
      '---',
      '',
    ];
    for (const slide of slides) {
      lines.push(`幻灯片: ${String(slide.slide_no).padStart(2, '0')}`);
      lines.push(`页面类型: ${safeText(slide.page_type)}`);
      lines.push(`标题: ${safeText(slide.title)}`);
      lines.push(`本页目标: ${safeText(slide.page_goal)}`);
      lines.push('');
      lines.push('页面核心内容:');
      safeArray(slide.page_core_content).forEach((item, index) => {
        lines.push(`- 模块${index + 1}：${safeText(item?.text)}`);
      });
      lines.push('');
      lines.push('视觉呈现方式:');
      lines.push(`- 布局：${safeText(slide.visual_presentation?.layout_family)}`);
      lines.push(`- 图表：${safeText(slide.render_recipe_id)}`);
      lines.push(`- 配色：以视觉导演稿统一冻结，本页先保证 ${safeArray(slide.visual_presentation?.anchor_tracks).join(' / ')}`);
      lines.push(`- 素材引用方式：${safeArray(slide.evidence_and_sources).map((item) => safeText(item?.public_label)).filter(Boolean).join('；') || '按页放置公开来源芯片'}`);
      lines.push('');
      lines.push('角标与标识策略:');
      lines.push('- 页眉/页码：按页控制；默认右下角页码');
      lines.push('- 署名：默认封面显示，正文按页判断');
      lines.push('- 来源文字：仅证据页显示');
      lines.push('');
      lines.push('是否需要外部公开证据:');
      lines.push(`- ${safeArray(slide.evidence_and_sources).length > 0 ? '需要' : '不需要'}`);
      lines.push(`- 若需要：${safeArray(slide.evidence_and_sources).length > 0 ? '公开论文 / 综述 / 指南 / 项目文档' : 'none'}`);
      lines.push('');
      lines.push('证据与图源:');
      safeArray(slide.evidence_and_sources).forEach((item, index) => {
        lines.push(`- 来源${index + 1}：${safeText(item?.public_label)}`);
      });
      lines.push('');
      lines.push('讲稿:');
      lines.push(safeText(slide.speaker_notes));
      lines.push('');
      lines.push('过渡句:');
      lines.push(safeText(slide.transition_sentence));
      lines.push('', '---', '');
    }
    return `${lines.join('\n')}\n`;
  }
  
  function buildOperatorVisualDirectionMarkdown(contract, artifact) {
    const visual = artifact?.visual_direction || {};
    const typographyPlan = visual.typography_plan || {};
    const lines = [
      `# ${safeText(contract.title)}视觉导演稿`,
      '',
      '## 本章视觉宣言',
      `- 这一章像什么：${safeArray(visual.what_it_is).join(' / ')}`,
      `- 这一章不像什么：${safeArray(visual.what_it_is_not).join(' / ')}`,
      `- 目标气质：${safeText(visual.visual_manifest)}`,
      `- 默认退化风险：${safeArray(visual.forbidden_regressions).join(' / ')}`,
      '',
      '## 全章视觉总控',
      `- 视觉母题：${safeText(visual.visual_manifest)}`,
      `- 标题色 / 结论色 / 警示色：${safeText(visual.palette?.ink)} / ${safeText(visual.palette?.accent)} / ${safeText(visual.palette?.success)}`,
      `- 允许元素：${safeArray(visual.what_it_is).join(' / ')}`,
      `- 禁止元素：${safeArray(visual.what_it_is_not).join(' / ')}`,
      `- 字号梯度：cover ${safeText(typographyPlan.cover_title?.font_size)} / body ${safeText(typographyPlan.body_title?.font_size)} / card-title ${safeText(typographyPlan.card_title?.font_size)} / card-body ${safeText(typographyPlan.card_body?.font_size)} / meta ${safeText(typographyPlan.meta_label?.font_size)} / page-no ${safeText(typographyPlan.page_no?.font_size)}`,
      `- 页间连续性约束：${safeArray(visual.continuity_constraints).join('；')}`,
      `- 节奏曲线：${safeArray(visual.rhythm_curve).map((item) => `${safeText(item.slide_id)}=${safeText(item.role)}`).join('；')}`,
      `- 必须破格的关键页：${safeArray(visual.peak_pages).join(' / ')}`,
      `- 页面家族上限：${Object.entries(visual.page_family_ceiling || {}).map(([key, value]) => `${key}:${value}`).join('；')}`,
      '',
      '## 分页视觉角色表',
      '| 幻灯片 | 页面角色 | 首眼抓取点 | 第二视线 | 禁退化语法 |',
      '|---|---|---|---|---|',
    ];
    for (const row of safeArray(visual.page_role_table)) {
      lines.push(`| ${safeText(row.slide_id)} | ${safeText(row.page_role)} | ${safeText(row.first_glance)} | ${safeText(row.second_glance)} | ${safeArray(visual.forbidden_regressions).slice(0, 2).join(' / ')} |`);
    }
    lines.push('', '## 给 HTML 生成器的最终指令');
    for (const instruction of safeArray(visual.final_instruction_to_html_generator)) {
      lines.push(`- ${safeText(instruction)}`);
    }
    return `${lines.join('\n')}\n`;
  }
  
  function copySurfaceFile(source, destination) {
    if (!safeText(source) || !existsSync(source)) return null;
    ensureDir(path.dirname(destination));
    if (path.resolve(source) === path.resolve(destination)) return destination;
    cpSync(source, destination);
    return destination;
  }
  
  function safeReadJsonIfExists(file) {
    if (!safeText(file) || !existsSync(file)) return null;
    try {
      return readJson(file);
    } catch {
      return null;
    }
  }
  
  function extractFirstJsonCodeBlock(markdown) {
    const match = String(markdown || '').match(/```json\s*([\s\S]*?)\s*```/i);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
  
  function normalizeOperatorRevisionBrief(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const slideFeedback = safeArray(value.slide_feedback)
      .map((item) => ({
        slide_id: safeText(item?.slide_id),
        issues: safeArray(item?.issues).map((issue) => safeText(issue)).filter(Boolean),
        keep: safeArray(item?.keep).map((entry) => safeText(entry)).filter(Boolean),
        avoid: safeArray(item?.avoid).map((entry) => safeText(entry)).filter(Boolean),
      }))
      .filter((item) => item.slide_id);
    const targetSlideIds = [...new Set([
      ...safeArray(value.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
      ...slideFeedback.map((item) => item.slide_id),
    ])];
    const globalRequirements = safeArray(value.global_requirements)
      .map((item) => safeText(item))
      .filter(Boolean);
    if (targetSlideIds.length === 0 && globalRequirements.length === 0) {
      return null;
    }
    return {
      target_slide_ids: targetSlideIds,
      global_requirements: globalRequirements,
      slide_feedback: slideFeedback,
    };
  }
  
  function loadOperatorRevisionBrief({
    deliverablePaths,
    contract,
    minimumMtimeMs = 0,
  }) {
    const paths = getPptOperatorViewPaths({
      deliverablePaths,
      contract,
      deliverableId: deliverablePaths.deliverableId,
    });
    if (!existsSync(paths.revisionBriefFile)) return null;
    if (safeFileMtimeMs(paths.revisionBriefFile) < Number(minimumMtimeMs || 0)) {
      return null;
    }
    const parsed = extractFirstJsonCodeBlock(readFileSync(paths.revisionBriefFile, 'utf-8'));
    return normalizeOperatorRevisionBrief(parsed);
  }
  
  
  function derivePptStageArtifactFreshness({ contract, deliverablePaths }) {
    const requiredExportRoute = safeText(contract?.delivery_contract?.required_export_route, 'export_pptx');
    const exportArtifactFile = stageArtifactPath(contract, deliverablePaths, requiredExportRoute);
    const exportArtifactMtimeMs = safeFileMtimeMs(exportArtifactFile);
    return {
      requiredExportRoute,
      exportArtifactFile,
      exportArtifactMtimeMs,
      exportArtifact: safeReadJsonIfExists(exportArtifactFile),
    };
  }
  
  function currentHtmlSourceFile(contract, deliverablePaths) {
    const artifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    return safeText(artifact?.html_bundle?.html_file);
  }
  
  function currentSlidesSourceFile(contract, deliverablePaths) {
    const artifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    return safeText(artifact?.html_bundle?.slides_file);
  }
  
  function syncDeliverableViewDraft(paths, htmlFile, slidesFile) {
    const refs = [];
    const draftHtmlRef = copySurfaceFile(htmlFile, paths.draftHtmlFile);
    if (draftHtmlRef) refs.push(draftHtmlRef);
    const draftSlidesRef = copySurfaceFile(slidesFile, paths.draftSlidesFile);
    if (draftSlidesRef) refs.push(draftSlidesRef);
    return refs;
  }
  
  function seedDeliverableStableViews(paths, htmlFile, slidesFile) {
    const refs = [];
    if (!existsSync(paths.stableHtmlFile)) {
      const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
      if (stableHtmlRef) refs.push(stableHtmlRef);
    }
    if (!existsSync(paths.stableSlidesFile)) {
      const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
      if (stableSlidesRef) refs.push(stableSlidesRef);
    }
    return refs;
  }
  
  function promoteDeliverableStableViews(paths, htmlFile, slidesFile) {
    const refs = [];
    const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
    if (stableHtmlRef) refs.push(stableHtmlRef);
    const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
    if (stableSlidesRef) refs.push(stableSlidesRef);
    return refs;
  }
  
  function listStableRootScreenshotFiles(stableScreenshotsDir) {
    if (!existsSync(stableScreenshotsDir)) return [];
    return readdirSync(stableScreenshotsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^slide-\d+\.(png|jpe?g)$/i.test(entry.name))
      .map((entry) => path.join(stableScreenshotsDir, entry.name));
  }
  
  function stableLatestCaptureFile(deliverablePaths) {
    return path.join(deliverablePaths.reportsDir, 'screenshots', 'latest-capture.json');
  }
  
  function writeStableLatestCapturePointer(deliverablePaths, reviewCapture, slideCount) {
    if (!reviewCapture || typeof reviewCapture !== 'object') return null;
    const captureId = safeText(reviewCapture.capture_id);
    const reviewMarkdownFile = safeText(reviewCapture.review_markdown_file);
    if (!captureId || !reviewMarkdownFile) return null;
    const latestCaptureFile = stableLatestCaptureFile(deliverablePaths);
    writeJson(latestCaptureFile, {
      capture_id: captureId,
      review_markdown_file: reviewMarkdownFile,
      slide_count: Number(slideCount || 0),
    });
    return latestCaptureFile;
  }
  
  function syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { promote = false, seedIfMissing = false } = {}) {
    const sourceDir = safeText(captureScreenshotsDir);
    if (!sourceDir || !existsSync(sourceDir)) return [];
    const stableScreenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
    const sourceFiles = readdirSync(sourceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^slide-\d+\.(png|jpe?g)$/i.test(entry.name))
      .map((entry) => path.join(sourceDir, entry.name));
    if (sourceFiles.length === 0) return [];
    const stableFiles = listStableRootScreenshotFiles(stableScreenshotsDir);
    const shouldSync = promote || (seedIfMissing && stableFiles.length === 0);
    if (!shouldSync) return [];
    for (const file of stableFiles) {
      rmSync(file, { force: true });
    }
    return sourceFiles
      .map((file) => copySurfaceFile(file, path.join(stableScreenshotsDir, path.basename(file))))
      .filter(Boolean);
  }
  
  function buildOperatorSlidesSurfaceState({ contract, deliverablePaths, viewSurfacePaths, latestReviewStatusOverride = '' }) {
    const screenshotReviewArtifact = safeReadJsonIfExists(
      stageArtifactPath(contract, deliverablePaths, 'screenshot_review'),
    );
    return {
      reviewed_html_ready: existsSync(viewSurfacePaths.stableHtmlFile),
      has_pending_draft: existsSync(viewSurfacePaths.draftHtmlFile),
      latest_review_status: safeText(latestReviewStatusOverride, safeText(screenshotReviewArtifact?.status, 'none')),
      stable_html_name: path.basename(viewSurfacePaths.stableHtmlFile),
      draft_html_name: path.basename(viewSurfacePaths.draftHtmlFile),
    };
  }
  
  function buildOperatorSlidesReadmeMarkdown(contract, slidesState) {
    return [
      '# 幻灯片目录说明',
      '',
      `- 讲题：${safeText(contract?.title)}`,
      `- 默认 HTML：${safeText(slidesState?.stable_html_name, 'none')}`,
      `- 草稿 HTML：${slidesState?.has_pending_draft ? safeText(slidesState?.draft_html_name, 'none') : 'none'}`,
      `- 最近一次截图质控：${safeText(slidesState?.latest_review_status, 'none')}`,
      '',
      '规则：',
      '- 只有当 `screenshot_review` 通过时，最新候选 HTML 才能替换默认 `.html`。',
      '- 如果 `screenshot_review` 被 block，当前候选会继续保留在 `.draft.html`，默认 `.html` 不会被失败版本覆盖。',
      '- 在还没有任何通过版之前，默认 `.html` 只是当前预览基线，不代表已经通过截图质控。',
      '- `.draft.html` 只表示 `render_html / fix_html` 之后、下一轮 `screenshot_review` 之前的待审稿，不应直接当作已质控成品。',
      '- 这里保留 audience-facing HTML 与视觉质控文稿，不应放内部备课提示或流程说明。',
      '',
    ].join('\n');
  }
  
  function buildPublishReadmeMarkdown(contract, exportState) {
    if (exportState.currentExportReady && exportState.hasCurrentExportFiles) {
      return [
        '# publish 目录说明',
        '',
        `- 讲题：${safeText(contract?.title)}`,
        '- 当前导出状态：current_export_ready',
        `- 最近一次 export artifact：${formatTimestamp(exportState.exportArtifactMtimeMs)}`,
        '',
        '规则：',
        '- 当前目录中的 `.pptx / .pdf / presenter-notes` 就是当前可交付版本。',
        '- 当前是否仍可直接交付，以 topic 的 publication projection surface 与 deliverable 的 `review-state.json` 为准。',
        '',
      ].join('\n');
    }
  
    if (exportState.hasAnyExportFiles) {
      return [
        '# publish 目录说明',
        '',
        `- 讲题：${safeText(contract?.title)}`,
        '- 当前导出状态：last_export_available',
        `- 最近一次 export artifact：${formatTimestamp(exportState.exportArtifactMtimeMs)}`,
        '',
        '规则：',
        '- 最近一次导出的 `.pptx / .pdf / presenter-notes` 仍保留在当前目录，便于继续审阅、对照和补修。',
        '- 这些文件可能落后于最新 HTML 与截图质控；是否仍可直接交付，以 topic 的 publication projection surface 与 deliverable 的 `review-state.json` 为准。',
        '',
      ].join('\n');
    }
  
    return [
      '# publish 目录说明',
      '',
      `- 讲题：${safeText(contract?.title)}`,
      '- 当前导出状态：no_current_export',
      `- 最近一次 export artifact：${formatTimestamp(exportState.exportArtifactMtimeMs)}`,
      '',
      '规则：',
      '- 当前没有可交付 PPTX；如果你看到 `archive/` 下的旧文件，那只是历史导出留痕。',
      '- 上游 stage 一旦重跑，旧导出会从当前目录退场，直到新的 `export_pptx` 完成。',
        '',
      ].join('\n');
  }
  
  function buildPublishSurfaceState({ route, contract, deliverablePaths, publishPaths, payload }) {
    const freshness = derivePptStageArtifactFreshness({ contract, deliverablePaths });
    const currentExportReady = route === freshness.requiredExportRoute;
    const routeExportMtimeMs = currentExportReady
      ? Math.max(
        safeFileMtimeMs(payload?.export_bundle?.pptx_file),
        safeFileMtimeMs(payload?.export_bundle?.pdf_file),
        safeFileMtimeMs(payload?.export_bundle?.presenter_notes_file),
      )
      : 0;
    return {
      ...freshness,
      currentExportReady,
      hasCurrentExportFiles: [publishPaths.pptxFile, publishPaths.pdfFile, publishPaths.presenterNotesFile]
        .every((file) => existsSync(file)),
      hasAnyExportFiles: [publishPaths.pptxFile, publishPaths.pdfFile, publishPaths.presenterNotesFile]
        .some((file) => existsSync(file)),
      exportArtifactMtimeMs: routeExportMtimeMs || freshness.exportArtifactMtimeMs,
    };
  }
  
  function syncPptCanonicalSurface({ workspaceRoot, topicId, contract, deliverableId, route, payload }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const operatorPaths = getPptOperatorViewPaths({ deliverablePaths, contract, deliverableId });
    const viewSurfacePaths = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId);
    ensurePptOperatorViewSurface(operatorPaths);
    const refs = [];
    writeText(operatorPaths.referenceIndexFile, buildOperatorReferenceIndex(contract));
    refs.push(operatorPaths.referenceIndexFile);
    switch (route) {
      case 'storyline':
        writeText(operatorPaths.storylineFile, buildOperatorStorylineMarkdown(contract, payload));
        refs.push(operatorPaths.storylineFile);
        break;
      case 'detailed_outline':
        writeText(operatorPaths.detailedOutlineFile, buildOperatorDetailedOutlineMarkdown(contract, payload));
        refs.push(operatorPaths.detailedOutlineFile);
        break;
      case 'slide_blueprint':
        writeText(operatorPaths.blueprintFile, buildOperatorBlueprintMarkdown(contract, payload));
        refs.push(operatorPaths.blueprintFile);
        break;
      case 'visual_direction':
        writeText(operatorPaths.visualDirectionFile, buildOperatorVisualDirectionMarkdown(contract, payload));
        refs.push(operatorPaths.visualDirectionFile);
        break;
      case 'screenshot_review': {
        const sourceHtmlFile = currentHtmlSourceFile(contract, deliverablePaths);
        const sourceSlidesFile = currentSlidesSourceFile(contract, deliverablePaths);
        const captureScreenshotsDir = safeText(payload?.review_capture?.screenshots_dir);
        if (safeText(payload?.status) === 'pass') {
          refs.push(...promoteDeliverableStableViews(viewSurfacePaths, sourceHtmlFile, sourceSlidesFile));
          refs.push(...syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { promote: true, seedIfMissing: true }));
          const latestCaptureRef = writeStableLatestCapturePointer(
            deliverablePaths,
            payload?.review_capture,
            safeArray(payload?.slide_reviews).length,
          );
          if (latestCaptureRef) refs.push(latestCaptureRef);
        } else {
          refs.push(...syncDeliverableViewDraft(viewSurfacePaths, sourceHtmlFile, sourceSlidesFile));
          refs.push(...syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { seedIfMissing: true }));
        }
        break;
      }
      default:
        break;
    }
    const slidesState = buildOperatorSlidesSurfaceState({
      contract,
      deliverablePaths,
      viewSurfacePaths,
      latestReviewStatusOverride: route === 'screenshot_review' ? safeText(payload?.status) : '',
    });
    writeText(operatorPaths.slidesReadmeFile, buildOperatorSlidesReadmeMarkdown(contract, slidesState));
    refs.push(operatorPaths.slidesReadmeFile);
    const publishState = buildPublishSurfaceState({
      route,
      contract,
      deliverablePaths,
      publishPaths: operatorPaths,
      payload,
    });
    writeText(operatorPaths.publishReadmeFile, buildPublishReadmeMarkdown(contract, publishState));
    refs.push(operatorPaths.publishReadmeFile);
    return refs;
  }
  
  function appendArtifactRefs(payload, extraRefs) {
    if (safeArray(extraRefs).length === 0) {
      return payload;
    }
    return {
      ...payload,
      artifact_refs: [...new Set([...safeArray(payload?.artifact_refs), ...extraRefs])],
    };
  }
  
  function invalidateDownstreamReviewPatch(route) {
    if (!['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'fix_html'].includes(route)) {
      return null;
    }
    return {
      current_status: 'draft',
      ready_for_export: false,
      latest_review_stage: route,
      pending_reviews: [],
      blocking_reasons: [],
      rerun_from_stage: null,
      rerun_policy: {
        status: 'idle',
        rerun_from_stage: null,
      },
    };
  }
  
  function attachRouteReviewReset(payload, route) {
    const reviewStatePatch = invalidateDownstreamReviewPatch(route);
    if (!reviewStatePatch) return payload;
    return {
      ...payload,
      review_state_patch: {
        ...reviewStatePatch,
        ...(payload?.review_state_patch || {}),
      },
    };
  }

  return {
    appendArtifactRefs,
    attachRouteReviewReset,
    createReviewCapturePaths,
    getDeliverableViewSurfacePaths,
    loadOperatorRevisionBrief,
    seedDeliverableStableViews,
    syncPptCanonicalSurface,
  };
}
