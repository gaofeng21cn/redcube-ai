// @ts-nocheck
import {
  MIN_REVIEW_PRIMARY_POINTS,
  MIN_REVIEW_QA_BLOCKS,
  PAGE_FIX_ROUTE,
  collectSlidesNeedingTargetedRevision,
  currentHtmlStageId,
  readCurrentHtmlArtifact,
  readStageArtifact,
  requireText,
  safeArray,
  safeText,
  normalizeStringList,
} from './shared.js';
import {
  buildStorylineInputs,
  isSeries,
  operatorMaterials,
  publicSources,
  resolveAuthorBranding,
  sourceBlockingEvidenceGaps,
  sourceConfidence,
  sourceDeepResearchState,
  sourceEvidenceGaps,
  sourceInputMode,
  sourceLabels,
  sourceMaterialIds,
  sourceMaterials,
  sourceResidualEvidenceGaps,
  sourceSufficiencyStatus,
  sourceTopicSummary,
  sourceTruth,
} from './support-source-truth.js';

export {
  buildStorylineInputs,
  isSeries,
  promptArtifact,
  promptMeta,
  promptPackRoot,
  promptRoute,
  promptSeed,
  publicSources,
  readPromptPackText,
  resolveAuthorBranding,
  resolvePromptPackAsset,
  sourceBlockingEvidenceGaps,
  sourceConfidence,
  sourceDeepResearchState,
  sourceEvidenceGaps,
  sourceInputMode,
  sourceLabels,
  sourceMaterialIds,
  sourceResidualEvidenceGaps,
  sourceSufficiencyStatus,
  sourceTopicSummary,
  sourceTruth,
} from './support-source-truth.js';

export function buildVisualAnchorSystem() {
  return {
    preferred_library: 'Font Awesome Free',
    secondary_library_for_xiaohongshu: 'emoji',
    consistency_rule: '同一页、同一组锚点保持统一语法，优先完整语义图标；短词 badge 只能做辅助标签',
    required_peak_page_anchor: '封面、机制峰值页和结尾页至少提供一个语义明确的 Font Awesome Free 图标锚点；emoji 只做补充',
    forbidden_patterns: [
      '孤立单字贴纸',
      '单个汉字或字母被当作唯一视觉锚点',
      '和正文无关的随机装饰符号',
      '把内部标签伪装成视觉锚点',
      '图标、编号或 badge 压住标题、正文或署名',
    ],
  };
}

export function buildSignatureExposureGrammar() {
  return {
    cover_note: '封面署名固定在底部稳定角标区，远离主标题与主链卡，不把署名伪装成流程备注。',
    closing_page: '结尾页把署名显示与品牌副标压在页脚稳定区，和收藏条、行动卡保持独立间距。',
    continuity_rule: '同一 deliverable 的署名显示、副标和品牌语气保持完全一致，图文与发布文案共用同一套作者身份。',
  };
}

export function normalizeVisualAnchorSystem(value, field = 'visual_direction.visual_anchor_system') {
  return {
    preferred_library: requireText(value?.preferred_library, `${field}.preferred_library`),
    secondary_library_for_xiaohongshu: requireText(
      value?.secondary_library_for_xiaohongshu,
      `${field}.secondary_library_for_xiaohongshu`,
    ),
    consistency_rule: requireText(value?.consistency_rule, `${field}.consistency_rule`),
    required_peak_page_anchor: requireText(value?.required_peak_page_anchor, `${field}.required_peak_page_anchor`),
    forbidden_patterns: normalizeStringList(value?.forbidden_patterns, `${field}.forbidden_patterns`, { min: 3, max: 6 }),
  };
}

export function normalizeSignatureExposureGrammar(value, field = 'visual_direction.signature_exposure_grammar') {
  return {
    cover_note: requireText(value?.cover_note, `${field}.cover_note`),
    closing_page: requireText(value?.closing_page, `${field}.closing_page`),
    continuity_rule: requireText(value?.continuity_rule, `${field}.continuity_rule`),
  };
}

function buildLayoutFamilyGuardrails() {
  return {
    cover_note: {
      visual_intent: '封面像成熟作者的观点卡，先读标题，再读副句，再看到清楚的视觉锚点与底部署名。',
      blocking_failures: [
        '副标题或主判断句被主卡、轨道或装饰层压住。',
        '视觉锚点只是孤立单字、莫名贴纸或和主题无关的装饰。',
        '底部署名和副标被主内容挤压，失去稳定的封口感。',
      ],
      layout_rules: [
        '封面必须有一个语义明确的视觉锚点，优先 Font Awesome Free 图标，emoji 只做补充。',
        '视觉锚点不得遮挡标题、副标题或主链卡；它服务阅读，不抢主文案。',
        '作者署名与副标固定在底部稳定区，和主内容之间保持清楚呼吸。',
      ],
    },
    evidence_strip: {
      visual_intent: '证据条页要像研究判断条带，编号、图标与正文各就各位，底部继续承担收束句。',
      blocking_failures: [
        '编号圆点、短线或图标压到标题或正文上方。',
        '三条证据都堆在中上区，下方只剩明显空白带。',
        '底部收束句退化成贴边薄条，不能承担记忆封口。',
      ],
      layout_rules: [
        '条带内容覆盖上中下区，底部继续承担结论或带走点。',
        '任何点标、编号或图标都要退到文字下层，并与正文保持独立留白。',
        '如果条带放不下，优先减字、扩卡和重排，不用坏断句硬塞。',
      ],
    },
    process_track: {
      visual_intent: '机制峰值页，读者首眼要看到一条在推进的主线，而不是一堆挤在顶部的小卡片。',
      blocking_failures: [
        '圆点或连线压住标题、正文或关键词。',
        '三张站牌卡全部挤在上半区，导致下方出现明显大空白。',
        '卡片宽度太窄，标题与正文被迫切成坏断句。',
      ],
      layout_rules: [
        '轨道节点、连接线和正文必须分层���节点与连线都要避开文本。',
        '三张站牌卡需要覆盖上中下三个垂直带，页面重心要延展到中下区。',
        '标题优先保证自然的 1 到 2 行，正文保持完整语义块，避免碎裂换行。',
        '底部总结条与轨道区之间保留稳定呼吸，不出现明显五分之一空白带。',
      ],
    },
    action_checklist: {
      visual_intent: '结尾页像一张可收藏判断卡，三问向下压紧，收藏条与署名页脚形成稳定双层封口。',
      blocking_failures: [
        '第三问卡片和收藏条、署名页脚互相挤压。',
        '结尾标题被无意义换行拆坏，形成单字挂行。',
        '下方署名或副标贴边，像后台备注而不是内容品牌。',
      ],
      layout_rules: [
        '结尾标题优先保持自然单行或双行，短句不主动拆成坏断句。',
        '第三问、收藏条、署名页脚必须分别保有独立底边与间距。',
        '署名和品牌副标要像内容品牌露出，固定在底部稳定区。',
      ],
    },
  };
}

export function buildAuthoringContext({ workspaceRoot, contract, research = null }) {
  const authorBranding = resolveAuthorBranding(workspaceRoot, contract);
  return {
    title: safeText(contract.title),
    delivery_goal: safeText(contract.goal),
    profile_id: contract.profile_id,
    topic_summary: safeText(research?.research?.topic_summary, sourceTopicSummary(contract)),
    mode: safeText(research?.research?.mode, isSeries(contract) ? 'series' : 'single'),
    ready_sources: sourceLabels(contract),
    source_materials_full_text: sourceMaterials(contract)
      .map((material) => ({
        material_ref: safeText(material.material_id),
        source_ref: safeText(material.source_id),
        content_text: safeText(material.content_text || material.excerpt),
      }))
      .filter((item) => item.content_text),
    source_truth: {
      input_mode: sourceInputMode(contract) || 'seed_only',
      confidence: sourceConfidence(contract) || 'low',
      sufficiency_status: sourceSufficiencyStatus(contract),
      deep_research_state: sourceDeepResearchState(contract),
      evidence_gaps: sourceEvidenceGaps(contract),
      blocking_evidence_gaps: sourceBlockingEvidenceGaps(contract),
      residual_evidence_gaps: sourceResidualEvidenceGaps(contract),
      material_ids: sourceMaterialIds(contract),
    },
    operator_playbook_full_text: operatorMaterials(contract)
      .map((material) => ({
        material_ref: safeText(material.material_id),
        source_ref: safeText(material.source_id),
        content_text: safeText(material.content_text || material.excerpt),
      }))
      .filter((item) => item.content_text),
    ai_first_framing_contract: buildStorylineInputs(contract, research),
    author_branding: authorBranding,
    visual_anchor_system: buildVisualAnchorSystem(),
    signature_exposure_grammar: buildSignatureExposureGrammar(),
    layout_family_guardrails: buildLayoutFamilyGuardrails(),
    authoring_guardrails: [
      '交付目标和制作要求不能原样进入读者可见正文。',
      '不要把内部资料、来源索引、工作流注释、系统操作说明写成小红书正文。',
      'source_materials_full_text 是完整资料输入，不得只依据 topic_summary、ready_sources 或截断 excerpt 做内容判断。',
      'operator_playbook_full_text 只作为制作约束，不得被改写成标题、正文、评论区文案或来源口径。',
      '来源必须翻译成读者能理解的公开口径，不能直接写内部文件名。',
      '如果共享事实层不足，只能保守表达，不得编造医学结论、效果承诺或平台反馈。',
      '如果存在 author_branding，封面或结尾至少一处要有 audience-facing 署名露出，且图文与发布文案保持同一署名。',
      '小红书视觉锚点优先使用 Font Awesome Free，emoji 只做补充；同一页锚点风格保持统一。',
      '禁止用孤立单字贴纸、随机装饰符号或疑似内部标签充当视觉锚点。',
      '标题、正文和标签都必须在自然语义处换行；若单行成立，就不要为了造型强塞 <br/>。',
    ],
  };
}

export function storylineOutputContract() {
  return {
    mode: 'single | series',
    audience_judgement: '<string>',
    tension: '<string>',
    why_now: '<string>',
    memory_hook: '<string>',
    hook: '<string>',
    narrative_progression: ['<string>', '<string>', '<string>', '<string>'],
    journey: ['<string>', '<string>', '<string>'],
    resolution: '<string>',
  };
}

export function singleNotePlanOutputContract() {
  return {
    title_options: ['<string>', '<string>', '<string>'],
    slides: [
      {
        slide_id: '<stable slide id, e.g. N01>',
        title: '<string>',
        layout_family: 'cover_note | myth_compare | sequence_stack | process_track | evidence_strip | action_checklist',
        render_recipe_id: 'xhs.hero_note',
        page_goal: '<string>',
        progression_role: 'hook | tension | explain | mechanism_peak | evidence_peak | memory_close',
        page_core_content: ['<string>', '<string>', '<string>'],
        visual_presentation: {
          layout_family: '<string>',
          main_visual_action: '<string>',
          action_primitive: '<string>',
          anchor_tracks: ['<string>', '<string>', '<string>'],
          anti_template_note: '<string>',
        },
        source_language: '<string>',
        speaker_notes: '<string>',
        transition: '<string>',
      },
    ],
  };
}

export function visualDirectionOutputContract() {
  return {
    director_statement: '<string>',
    visual_motif: '<string>',
    material_rules: {
      paper_base: '<string>',
      main_accent: '#2563EB',
      warning_accent: '#DC2626',
    },
    rhythm_curve: [{ slide_id: '<slide_id from current single_note_plan>', role: '<visual role>' }],
    peak_pages: ['<slide_id from current single_note_plan>'],
    page_family_ceiling: {
      '<layout_family from current single_note_plan>': '<AI-authored reuse ceiling>',
    },
    anti_template_constraints: ['<string>', '<string>'],
    source_language_discipline: '<string>',
    visual_anchor_system: {
      preferred_library: 'Font Awesome Free',
      secondary_library_for_xiaohongshu: 'emoji',
      consistency_rule: '<string>',
      required_peak_page_anchor: '<string>',
      forbidden_patterns: ['<string>', '<string>', '<string>'],
    },
    signature_exposure_grammar: {
      cover_note: '<string>',
      closing_page: '<string>',
      continuity_rule: '<string>',
    },
    forbidden_regressions: ['<string>', '<string>'],
  };
}

export function renderHtmlOutputContract() {
  return {
    slides: [
      {
        slide_id: 'N01',
        content_html: '<div data-slide-root="true" data-slide-id="N01">...</div>',
      },
    ],
    render_summary: ['<string>', '<string>'],
  };
}

export function fixHtmlOutputContract() {
  return {
    slides: [
      {
        slide_id: 'N01',
        content_html: '<div data-slide-root="true" data-slide-id="N01">...</div>',
      },
    ],
  };
}

export function buildFixHtmlRevisionContext(contract, deliverablePaths, operatorRevisionBrief = null) {
  const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  const screenshotReview = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
  if (!directorReview && !screenshotReview && !operatorRevisionBrief) {
    return null;
  }
  return {
    visual_director_review: directorReview?.visual_director_review
      ? {
          weak_pages: safeArray(directorReview.visual_director_review.weak_pages),
          review_summary: safeText(directorReview.visual_director_review.review_summary),
        }
      : null,
    screenshot_review: screenshotReview
      ? {
          failed_checks: Object.entries(screenshotReview.checks || {})
            .filter(([, value]) => value === false)
            .map(([key]) => key),
          weak_pages: safeArray(screenshotReview.ai_review?.weak_pages),
          review_summary: safeText(screenshotReview.ai_review?.review_summary),
          slide_feedback: safeArray(screenshotReview.slide_reviews).map((slide) => ({
            slide_id: safeText(slide?.slide_id),
            screenshot_file: safeText(slide?.screenshot_file),
            blocked_checks: safeArray(slide?.mechanical_issues).length > 0
              ? safeArray(slide?.mechanical_issues)
              : safeArray(slide?.issues),
            ai_findings: safeArray(slide?.ai_review?.visual_findings),
            recommended_fix: safeText(slide?.ai_review?.recommended_fix),
          })),
        }
      : null,
    operator_revision_brief: operatorRevisionBrief,
  };
}

export function selectFixHtmlSlideIds(planArtifact, screenshotReviewArtifact, operatorRevisionBrief = null) {
  const slideReviews = safeArray(screenshotReviewArtifact?.slide_reviews);
  const targetedSlideIds = new Set(
    collectSlidesNeedingTargetedRevision(slideReviews)
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean),
  );
  safeArray(operatorRevisionBrief?.target_slide_ids)
    .map((slideId) => safeText(slideId))
    .filter(Boolean)
    .forEach((slideId) => targetedSlideIds.add(slideId));
  safeArray(screenshotReviewArtifact?.ai_review?.weak_pages)
    .map((slideId) => safeText(slideId))
    .filter(Boolean)
    .forEach((slideId) => targetedSlideIds.add(slideId));
  const failedChecks = Object.entries(screenshotReviewArtifact?.checks || {})
    .filter(([, value]) => value === false)
    .map(([key]) => key);
  if (failedChecks.includes('cover_density_ok')) {
    const coverSlideId = safeText(safeArray(planArtifact?.single_note_plan?.slides)[0]?.slide_id);
    if (coverSlideId) {
      targetedSlideIds.add(coverSlideId);
    }
  }
  return [...targetedSlideIds];
}

export function loadPriorRenderedXhsSlideHtmlMap(renderArtifact) {
  return new Map(
    safeArray(renderArtifact?.html_bundle?.slides)
      .map((slide) => [safeText(slide?.slide_id), requireText(slide?.content, 'html_bundle.slides[].content')])
      .filter(([slideId]) => slideId),
  );
}

export function buildFixHtmlLocalInspection(screenshotReviewArtifact, targetSlideIds) {
  const targetSet = new Set(safeArray(targetSlideIds).map((slideId) => safeText(slideId)).filter(Boolean));
  return safeArray(screenshotReviewArtifact?.slide_reviews)
    .filter((slide) => targetSet.has(safeText(slide?.slide_id)) && safeText(slide?.screenshot_file))
    .map((slide, index) => ({
      label: `${safeText(slide?.slide_id)} ${safeText(slide?.title, `Card ${index + 1}`)}`.trim(),
      path: safeText(slide?.screenshot_file),
      media_type: 'image/png',
      purpose: `${safeText(slide?.slide_id)} 当前被拦下的卡片截图；局部修复遮挡、溢出、换行和层级问题，不要顺手重画其他页。`,
    }));
}

export function directorReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    memory_hook_present: true,
    homogeneous_layout_risk: 0.18,
    weak_pages: ['N03'],
    review_summary: '<string>',
    rewrite_action: 'none | revise_render_html',
  };
}

export function screenshotReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: ['N04'],
    review_summary: '<string>',
    slide_reviews: [
      {
        slide_id: 'N01',
        judgement: 'pass',
        visual_findings: ['<string>'],
        recommended_fix: 'none',
      },
    ],
  };
}

export function publishCopyOutputContract() {
  return {
    body: '<string>',
    first_comment: '<string>',
    interaction_questions: ['<string>', '<string>'],
    hashtags: ['#话题1', '#话题2', '#话题3'],
    publish_suggestion: {
      recommended_time: '<string>',
    },
  };
}

export function summarizePlanSlides(planArtifact) {
  return safeArray(planArtifact?.single_note_plan?.slides).map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    layout_family: slide.layout_family,
    render_recipe_id: slide.render_recipe_id,
    page_goal: slide.page_goal,
    progression_role: slide.progression_role,
    page_core_content: safeArray(slide.page_core_content),
    visual_presentation: slide.visual_presentation,
    source_language: slide.source_language,
    transition_sentence: slide.transition_sentence,
  }));
}

export function stripHtml(text) {
  return safeText(text)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlAttribute(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeTemplate(text) {
  return String(text || '').replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

function countMatches(text, pattern) {
  const matches = String(text || '').match(pattern);
  return matches ? matches.length : 0;
}

function upsertHtmlAttribute(tag, name, value) {
  const attrPattern = new RegExp(`\\s${name}=(["']).*?\\1`, 'i');
  const serialized = ` ${name}="${escapeHtmlAttribute(value)}"`;
  if (attrPattern.test(tag)) {
    return tag.replace(attrPattern, serialized);
  }
  return tag.replace(/\/?>$/, (suffix) => `${serialized}${suffix}`);
}

export function hydrateRenderedSlideRootMetadata(html, metadata, slideId) {
  const rootTagMatch = String(html || '').match(/<[^>]+data-slide-root=(["'])true\1[^>]*>/i);
  if (!rootTagMatch) {
    throw new Error(`render_html slide missing data-slide-root=true: ${slideId}`);
  }
  let rootTag = rootTagMatch[0];
  for (const [name, value] of Object.entries(metadata || {})) {
    if (value === undefined || value === null || value === '') continue;
    rootTag = upsertHtmlAttribute(rootTag, name, value);
  }
  return String(html || '').replace(rootTagMatch[0], rootTag);
}

export function validateRenderedReviewAnchors(html, slideId, familyLabel = 'xiaohongshu') {
  const qaBlocks = countMatches(html, /data-qa-block=(["'])[^"']+\1/gi);
  if (qaBlocks < MIN_REVIEW_QA_BLOCKS) {
    throw new Error(`${familyLabel} render_html slide missing required data-qa-block anchors: ${slideId}`);
  }
  const primaryPoints = countMatches(html, /data-primary-point=(["'])true\1/gi);
  if (primaryPoints < MIN_REVIEW_PRIMARY_POINTS) {
    throw new Error(`${familyLabel} render_html slide missing required data-primary-point=true anchor: ${slideId}`);
  }
  return html;
}

export function buildHtml({ title, slides, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `[\n${slides.map((slide) => `  { slideId: '${slide.slide_id}', slideNo: ${Number(slide.slide_no || 0)}, title: ${JSON.stringify(slide.title)}, layoutFamily: ${JSON.stringify(slide.layout_family)}, recipeId: '${slide.recipe_id}', templateId: ${JSON.stringify(slide.template_id || '')}, speakerSeconds: ${Number(slide.speaker_seconds || 0)}, peakPage: ${slide.director_contract?.peak_page ? 'true' : 'false'}, directorRole: ${JSON.stringify(slide.director_contract?.page_role || '')}, content: \`${escapeTemplate(slide.content)}\` }`).join(',\n')}\n]`;
  return shellText
    .replaceAll('__REDCUBE_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__REDCUBE_SLIDES_DATA__', slidesLiteral);
}

export function renderContract(contract) {
  return contract?.prompt_pack?.render_contract || {};
}

export function validateRenderedSlideContent(content, slideId) {
  const html = requireText(content, `render_html.slides[${slideId}].content_html`);
  if (!/data-slide-root=(["'])true\1/.test(html)) {
    throw new Error(`render_html slide missing data-slide-root=true: ${slideId}`);
  }
  if (!new RegExp(`data-slide-id=(["'])${slideId}\\1`).test(html)) {
    throw new Error(`render_html slide missing matching data-slide-id: ${slideId}`);
  }
  if (/<script\b/i.test(html)) {
    throw new Error(`render_html slide contains forbidden script tag: ${slideId}`);
  }
  if (/<style\b/i.test(html)) {
    throw new Error(`render_html slide contains forbidden style tag: ${slideId}`);
  }
  if (/<img[^>]+src=(["'])https?:\/\//i.test(html)) {
    throw new Error(`render_html slide contains forbidden external image: ${slideId}`);
  }
  return html;
}
