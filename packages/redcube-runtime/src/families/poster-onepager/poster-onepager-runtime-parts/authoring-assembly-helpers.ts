// @ts-nocheck
export function createPosterOnepagerAuthoringAssemblyHelpers(deps) {
  const {
    MIN_REVIEW_PRIMARY_POINTS,
    MIN_REVIEW_QA_BLOCKS,
    normalizeStringList,
    operatorMaterials,
    requireText,
    safeArray,
    safeText,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
  } = deps;

  function sourceTopicSummary(contract) {
    return safeText(contract.title)
      || safeText(sourceTruth(contract)?.source_brief?.brief_text);
  }

  function summarizePanels(slide) {
    return safeArray(slide?.panels).map((panel) => ({
      panel_id: safeText(panel?.panel_id),
      region: safeText(panel?.region),
      label: safeText(panel?.label),
      text: safeText(panel?.text),
      support_points: safeArray(panel?.support_points),
    }));
  }

  function buildAuthoringContext(contract) {
    return {
      title: safeText(contract.title),
      delivery_goal: safeText(contract.goal),
      profile_id: contract.profile_id,
      topic_summary: sourceTopicSummary(contract),
      ready_sources: sourceLabels(contract),
      source_materials_full_text: sourceMaterials(contract)
        .map((material) => ({
          material_ref: safeText(material.material_id),
          source_ref: safeText(material.source_id),
          title: safeText(material.title) || safeText(material.relative_path),
          content_text: safeText(material.content_text || material.excerpt),
        }))
        .filter((item) => item.content_text),
      source_truth: {
        input_mode: safeText(sourceTruth(contract)?.source_brief?.input_mode, 'seed_only'),
        confidence: safeText(sourceTruth(contract)?.source_brief?.confidence, 'low'),
        material_ids: sourceMaterialIds(contract),
      },
      operator_playbook_full_text: operatorMaterials(contract)
        .map((material) => ({
          material_ref: safeText(material.material_id),
          source_ref: safeText(material.source_id),
          content_text: safeText(material.content_text || material.excerpt),
        }))
        .filter((item) => item.content_text),
      authoring_guardrails: [
        'delivery_goal 和制作要求不能原样写进海报 headline、panel 文案或 review_summary。',
        '不要把内部工作流、模板说明、系统指令、隐藏审核口径写进读者可见内容。',
        'source_materials_full_text 是完整资料输入，不得只依据 topic_summary、ready_sources 或截断 excerpt 做内容判断。',
        'operator_playbook_full_text 只作为制作约束，不得被改写成海报 headline、panel 文案、来源标签或审阅总结。',
        '如果共享事实层不足，只能做保守表达，不得编造医学结论、效果承诺或伪来源。',
        '海报必须是 AI 直接创作内容，不得退化成固定模板编译或 slot 填空产物。',
      ],
    };
  }

  function storylineOutputContract() {
    return {
      headline: '<string>',
      subheadline: '<string>',
      audience_judgement: '<string>',
      why_now: '<string>',
      proof_promise: '<string>',
      call_to_action: '<string>',
    };
  }

  function posterBlueprintOutputContract() {
    return {
      render_recipe_id: 'poster.evidence_columns',
      headline: '<string>',
      subheadline: '<string>',
      anchor_tracks: ['<string>', '<string>', '<string>'],
      panels: [
        {
          panel_id: 'hero',
          region: 'hero_band',
          label: '<string>',
          text: '<string>',
          support_points: ['<string>', '<string>'],
        },
      ],
    };
  }

  function visualDirectionOutputContract() {
    return {
      visual_manifest: '<string>',
      poster_motif: '<string>',
      peak_region: '<region from current poster_blueprint.panels>',
      panel_emphasis: {
        '<region from current poster_blueprint.panels>': '<AI-authored emphasis>',
      },
      page_family_ceiling: {
        '<region from current poster_blueprint.panels>': '<AI-authored reuse ceiling>',
      },
      anti_template_constraints: ['<string>', '<string>'],
      forbidden_regressions: ['<string>', '<string>'],
      final_instruction_to_html_generator: ['<string>', '<string>'],
      palette: {
        paper: '#FFF9F1',
        ink: '#0F172A',
        accent: '#1D4ED8',
        highlight: '#F97316',
      },
    };
  }

  function renderHtmlOutputContract() {
    return {
      slides: [
        {
          slide_id: 'P01',
          content_html: '<section data-slide-root=\"true\" data-slide-id=\"P01\">...</section>',
        },
      ],
      render_summary: ['<string>', '<string>'],
    };
  }

  function directorReviewOutputContract() {
    return {
      director_intent_landed: true,
      anti_template_ok: true,
      message_hierarchy_clear: true,
      evidence_trace_clear: true,
      weak_regions: ['hero_band'],
      rewrite_action: 'none | revise_render_html',
      review_summary: '<string>',
    };
  }

  function screenshotReviewOutputContract() {
    return {
      director_intent_landed: true,
      anti_template_ok: true,
      message_hierarchy_clear: true,
      weak_regions: ['hero_band'],
      review_summary: '<string>',
      slide_reviews: [
        {
          slide_id: 'P01',
          judgement: 'pass',
          visual_findings: ['<string>'],
          recommended_fix: 'none',
        },
      ],
    };
  }

  function normalizePanel(panel, index) {
    return {
      panel_id: requireText(panel?.panel_id, `poster_blueprint.panels[${index}].panel_id`),
      region: requireText(panel?.region, `poster_blueprint.panels[${index}].region`),
      label: requireText(panel?.label, `poster_blueprint.panels[${index}].label`),
      text: requireText(panel?.text, `poster_blueprint.panels[${index}].text`),
      support_points: normalizeStringList(
        panel?.support_points,
        `poster_blueprint.panels[${index}].support_points`,
        { min: 1, max: 4 },
      ),
    };
  }

  function normalizeInlineText(value, maxLength = 220) {
    return safeText(value).replace(/\s+/g, ' ').slice(0, maxLength);
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

  function hydrateRenderedSlideRootMetadata(html, metadata, slideId) {
    const rootTagMatch = String(html || '').match(/<[^>]+data-slide-root=(["'])true\1[^>]*>/i);
    if (!rootTagMatch) {
      throw new Error(`poster render_html slide missing data-slide-root=true: ${slideId}`);
    }
    let rootTag = rootTagMatch[0];
    for (const [name, value] of Object.entries(metadata || {})) {
      if (value === undefined || value === null || value === '') continue;
      rootTag = upsertHtmlAttribute(rootTag, name, value);
    }
    return String(html || '').replace(rootTagMatch[0], rootTag);
  }

  function validateRenderedReviewAnchors(html, slideId, familyLabel = 'poster') {
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

  function buildHtml({ title, slides, renderPlan, renderStrategy, shellText }) {
    const slidesLiteral = `\n[${slides.map((slide) => `\n  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, layoutFamily: ${JSON.stringify(slide.layout_family)}, recipeId: '${slide.recipe_id}', templateId: '${slide.template_id}', speakerSeconds: 45, peakRegion: ${JSON.stringify(slide.director_contract?.peak_region || '')}, directorRole: ${JSON.stringify(slide.director_contract?.peak_region || '')}, content: \`${escapeTemplate(slide.content)}\` }`).join(',')}\n]`;
    return shellText
      .replaceAll('__REDCUBE_TITLE__', escapeHtml(title))
      .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
      .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
      .replaceAll('__REDCUBE_SLIDES_DATA__', slidesLiteral);
  }

  function stripHtml(value) {
    return String(value || '').replace(/<[^>]+>/g, ' ');
  }

  function loadRenderedPosterSlideHtmlMap(renderArtifact) {
    return new Map(
      safeArray(renderArtifact?.html_bundle?.slides)
        .map((slide) => [safeText(slide?.slide_id), requireText(slide?.content, 'render_html.html_bundle.slides[].content')])
        .filter(([slideId]) => slideId),
    );
  }

  return {
    buildAuthoringContext,
    buildHtml,
    directorReviewOutputContract,
    hydrateRenderedSlideRootMetadata,
    loadRenderedPosterSlideHtmlMap,
    normalizeInlineText,
    normalizePanel,
    posterBlueprintOutputContract,
    renderHtmlOutputContract,
    screenshotReviewOutputContract,
    stripHtml,
    storylineOutputContract,
    summarizePanels,
    validateRenderedReviewAnchors,
    visualDirectionOutputContract,
  };
}
