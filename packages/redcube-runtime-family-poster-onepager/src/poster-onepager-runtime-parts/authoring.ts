// @ts-nocheck
export function createPosterOnepagerAuthoringParts(deps) {
  const {
    BANNED_RENDER_TOKENS,
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    MIN_REVIEW_PRIMARY_POINTS,
    MIN_REVIEW_QA_BLOCKS,
    attachCommon,
    creativeExecution,
    creativeSourceStamp,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeInlineText: providedNormalizeInlineText,
    normalizeStringList,
    operatorMaterials,
    promptRoute,
    readStageArtifact,
    requireObjectArray,
    requireText,
    reviewOverlayForRoute,
    safeArray,
    safeText,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
    stageOrder,
    publicSources,
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
    
    function validateRenderedPosterHtml(content, slideId) {
      const html = requireText(content, `render_html.slides[${slideId}].content_html`);
      if (!/data-slide-root=(["'])true\1/.test(html)) {
        throw new Error(`poster render_html slide missing data-slide-root=true: ${slideId}`);
      }
      if (!new RegExp(`data-slide-id=(["'])${slideId}\\1`).test(html)) {
        throw new Error(`poster render_html slide missing matching data-slide-id: ${slideId}`);
      }
      if (/<script\b/i.test(html)) {
        throw new Error(`poster render_html slide contains forbidden script tag: ${slideId}`);
      }
      if (/<style\b/i.test(html)) {
        throw new Error(`poster render_html slide contains forbidden style tag: ${slideId}`);
      }
      return html;
    }
    
    function loadRenderedPosterSlideHtmlMap(renderArtifact) {
      return new Map(
        safeArray(renderArtifact?.html_bundle?.slides)
          .map((slide) => [safeText(slide?.slide_id), requireText(slide?.content, 'render_html.html_bundle.slides[].content')])
          .filter(([slideId]) => slideId),
      );
    }
    
    function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
      const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
      const storedContract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
      const required = safeArray(storedContract?.stage_requirements?.[route]?.requires_artifacts);
      const missing = required.filter((stageId) => !readStageArtifact(storedContract, deliverablePaths, stageId));
      if (missing.length > 0) {
        throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
      }
      if (route === 'screenshot_review') {
        const directorReview = readStageArtifact(storedContract, deliverablePaths, 'visual_director_review');
        if (!directorReview || directorReview.status !== 'pass') {
          throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
        }
      }
      if (route === 'export_bundle') {
        const reviewArtifact = readStageArtifact(storedContract, deliverablePaths, 'screenshot_review');
        if (!reviewArtifact || reviewArtifact.status !== 'pass') {
          throw new Error('Route export_bundle requires screenshot_review to pass before export');
        }
      }
      if (route === 'screenshot_review' && mode === 'optimize_existing' && !safeText(baselineDeliverableId)) {
        throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
      }
      if (route === 'screenshot_review' && mode === 'optimize_existing' && safeText(baselineDeliverableId)) {
        const baselineState = getReviewState({ workspaceRoot, topicId, deliverableId: baselineDeliverableId }).state;
        if (!isBaselineApprovedState(baselineState)) {
          throw new Error(`Baseline deliverable is not approved: ${baselineDeliverableId}`);
        }
      }
      return { deliverablePaths };
    }
    
    async function generateStorylineDraft(contract, adapter = CODEX_DEFAULT_ADAPTER) {
      const { data, generationRuntime } = await generateStructuredArtifact({
        adapter,
        family: 'poster_onepager',
        route: 'storyline',
        promptRelativePath: promptRoute(contract, 'storyline'),
        context: buildAuthoringContext(contract),
        outputContract: storylineOutputContract(),
      });
      return {
        authoredStoryline: {
          headline: requireText(data?.headline, 'storyline.headline'),
          subheadline: requireText(data?.subheadline, 'storyline.subheadline'),
          audience_judgement: requireText(data?.audience_judgement, 'storyline.audience_judgement'),
          why_now: requireText(data?.why_now, 'storyline.why_now'),
          proof_promise: requireText(data?.proof_promise, 'storyline.proof_promise'),
          call_to_action: requireText(data?.call_to_action, 'storyline.call_to_action'),
        },
        generationRuntime,
      };
    }
    
    async function buildStoryline(contract, adapter = CODEX_DEFAULT_ADAPTER) {
      const { authoredStoryline, generationRuntime } = await generateStorylineDraft(contract, adapter);
      return {
        ...attachCommon('storyline', contract, generationRuntime, adapter),
        creative_execution: creativeExecution(
          lifecycleStageForRoute(contract, 'storyline') || 'story_architecture',
          generationRuntime,
          adapter,
        ),
        storyline: {
          ...authoredStoryline,
          source_truth_material_ids: sourceMaterialIds(contract),
          creative_sources: {
            headline: creativeSourceStamp({
              route: 'storyline',
              lifecycleStage: 'story_architecture',
              authoredSurface: 'headline',
              materializedFrom: CREATIVE_MATERIALIZED_FROM,
              generationRuntime,
              adapter,
            }),
            proof_promise: creativeSourceStamp({
              route: 'storyline',
              lifecycleStage: 'story_architecture',
              authoredSurface: 'proof_promise',
              materializedFrom: CREATIVE_MATERIALIZED_FROM,
              generationRuntime,
              adapter,
            }),
          },
        },
      };
    }
    
    function buildPosterBlueprintContext(contract, storylineArtifact) {
      return {
        ...buildAuthoringContext(contract),
        storyline: {
          headline: safeText(storylineArtifact?.storyline?.headline),
          subheadline: safeText(storylineArtifact?.storyline?.subheadline),
          audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
          why_now: safeText(storylineArtifact?.storyline?.why_now),
          proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
          call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
        },
      };
    }
    
    async function generatePosterBlueprintDraft(
      contract,
      deliverablePaths,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
      const { data, generationRuntime } = await generateStructuredArtifact({
        adapter,
        family: 'poster_onepager',
        route: 'poster_blueprint',
        promptRelativePath: promptRoute(contract, 'poster_blueprint'),
        context: buildPosterBlueprintContext(contract, storylineArtifact),
        outputContract: posterBlueprintOutputContract(),
      });
      return {
        storylineArtifact,
        authoredBlueprint: {
          render_recipe_id: requireText(data?.render_recipe_id, 'poster_blueprint.render_recipe_id'),
          headline: requireText(data?.headline, 'poster_blueprint.headline'),
          subheadline: requireText(data?.subheadline, 'poster_blueprint.subheadline'),
          anchor_tracks: normalizeStringList(data?.anchor_tracks, 'poster_blueprint.anchor_tracks', { min: 3, max: 6 }),
          panels: requireObjectArray(data?.panels, 'poster_blueprint.panels', { min: 4, max: 6 }).map(normalizePanel),
        },
        generationRuntime,
      };
    }
    
    async function buildPosterBlueprintArtifact(
      contract,
      deliverablePaths,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const { storylineArtifact, authoredBlueprint, generationRuntime } = await generatePosterBlueprintDraft(
        contract,
        deliverablePaths,
        adapter,
      );
      const sources = sourceLabels(contract);
      const layoutFamily = safeText(
        authoredBlueprint.panels[1]?.region || authoredBlueprint.panels[0]?.region,
        'evidence_columns',
      );
      const majorBlueprintText = creativeSourceStamp({
        route: 'poster_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const recipeDecision = creativeSourceStamp({
        route: 'poster_blueprint',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'render_recipe_id',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      return {
        ...attachCommon('poster_blueprint', contract, generationRuntime, adapter),
        creative_execution: creativeExecution(
          lifecycleStageForRoute(contract, 'poster_blueprint') || 'story_architecture',
          generationRuntime,
          adapter,
        ),
        lifecycle_stage: lifecycleStageForRoute(contract, 'poster_blueprint') || 'story_architecture',
        poster_blueprint: {
          headline: authoredBlueprint.headline,
          subheadline: authoredBlueprint.subheadline,
          render_recipe_id: authoredBlueprint.render_recipe_id,
          slides: [
            {
              slide_id: 'P01',
              slide_no: 1,
              title: authoredBlueprint.headline,
              layout_family: layoutFamily,
              render_recipe_id: authoredBlueprint.render_recipe_id,
              page_goal: safeText(contract.goal),
              headline: authoredBlueprint.headline,
              subheadline: authoredBlueprint.subheadline,
              audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
              why_now: safeText(storylineArtifact?.storyline?.why_now),
              proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
              call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
              panels: authoredBlueprint.panels,
              evidence_and_sources: sources.slice(0, 2).map((source, sourceIndex) => ({
                source_id: `SRC-${sourceIndex + 1}`,
                public_label: source,
              })),
              visual_presentation: {
                layout_family: layoutFamily,
                anchor_tracks: authoredBlueprint.anchor_tracks,
                canvas: CANVAS,
              },
              creative_sources: {
                major_blueprint_text: majorBlueprintText,
                render_recipe_id: recipeDecision,
              },
              creative_authorship: {
                major_blueprint_text: majorBlueprintText,
                render_recipe_id: recipeDecision,
              },
            },
          ],
          quality_guards: {
            require_visual_direction_before_html: true,
            forbid_template_route_tokens: BANNED_RENDER_TOKENS,
            canvas: CANVAS,
          },
        },
      };
    }
    
    function buildVisualDirectionContext(contract, storylineArtifact, blueprintArtifact) {
      return {
        ...buildAuthoringContext(contract),
        storyline: {
          headline: safeText(storylineArtifact?.storyline?.headline),
          subheadline: safeText(storylineArtifact?.storyline?.subheadline),
          audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
          why_now: safeText(storylineArtifact?.storyline?.why_now),
          proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
          call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
        },
        blueprint: {
          headline: safeText(blueprintArtifact?.poster_blueprint?.headline),
          subheadline: safeText(blueprintArtifact?.poster_blueprint?.subheadline),
          render_recipe_id: safeText(blueprintArtifact?.poster_blueprint?.render_recipe_id),
          slides: safeArray(blueprintArtifact?.poster_blueprint?.slides).map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
            render_recipe_id: slide.render_recipe_id,
            anchor_tracks: safeArray(slide?.visual_presentation?.anchor_tracks),
            panels: summarizePanels(slide),
          })),
        },
      };
    }
    
    async function generateVisualDirectionDraft(
      contract,
      deliverablePaths,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
      const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
      const { data, generationRuntime } = await generateStructuredArtifact({
        adapter,
        family: 'poster_onepager',
        route: 'visual_direction',
        promptRelativePath: promptRoute(contract, 'visual_direction'),
        context: buildVisualDirectionContext(contract, storylineArtifact, blueprintArtifact),
        outputContract: visualDirectionOutputContract(),
      });
      return {
        blueprintArtifact,
        authoredVisualDirection: {
          visual_manifest: requireText(data?.visual_manifest, 'visual_direction.visual_manifest'),
          poster_motif: requireText(data?.poster_motif, 'visual_direction.poster_motif'),
          peak_region: requireText(data?.peak_region, 'visual_direction.peak_region'),
          panel_emphasis: data?.panel_emphasis && typeof data.panel_emphasis === 'object'
            ? data.panel_emphasis
            : (() => {
                throw new Error('Missing visual_direction.panel_emphasis in upstream poster generation output');
              })(),
          page_family_ceiling: data?.page_family_ceiling && typeof data.page_family_ceiling === 'object'
            ? data.page_family_ceiling
            : (() => {
                throw new Error('Missing visual_direction.page_family_ceiling in upstream poster generation output');
              })(),
          anti_template_constraints: normalizeStringList(
            data?.anti_template_constraints,
            'visual_direction.anti_template_constraints',
            { min: 2, max: 6 },
          ),
          forbidden_regressions: normalizeStringList(
            data?.forbidden_regressions,
            'visual_direction.forbidden_regressions',
            { min: 2, max: 6 },
          ),
          final_instruction_to_html_generator: normalizeStringList(
            data?.final_instruction_to_html_generator,
            'visual_direction.final_instruction_to_html_generator',
            { min: 2, max: 6 },
          ),
          palette: data?.palette && typeof data.palette === 'object'
            ? data.palette
            : (() => {
                throw new Error('Missing visual_direction.palette in upstream poster generation output');
              })(),
        },
        generationRuntime,
      };
    }
    
    async function buildPosterVisualDirectionArtifact(
      contract,
      deliverablePaths,
      mode,
      baselineDeliverableId,
      adapter = CODEX_DEFAULT_ADAPTER,
    ) {
      const { blueprintArtifact, authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(
        contract,
        deliverablePaths,
        adapter,
      );
      const visualManifest = creativeSourceStamp({
        route: 'visual_direction',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'visual_manifest',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const posterMotif = creativeSourceStamp({
        route: 'visual_direction',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'poster_motif',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const pageFamilyCeiling = creativeSourceStamp({
        route: 'visual_direction',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'page_family_ceiling',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      return {
        ...attachCommon('visual_direction', contract, generationRuntime, adapter),
        creative_execution: creativeExecution(
          lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
          generationRuntime,
          adapter,
        ),
        lifecycle_stage: lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
        mode,
        visual_direction: {
          ...authoredVisualDirection,
          baseline_deliverable_id: mode === 'optimize_existing' ? safeText(baselineDeliverableId) || null : null,
          creative_sources: {
            visual_manifest: visualManifest,
            poster_motif: posterMotif,
            page_family_ceiling: pageFamilyCeiling,
          },
          creative_authorship: {
            visual_manifest: visualManifest,
            poster_motif: posterMotif,
            page_family_ceiling: pageFamilyCeiling,
          },
          blueprint_slide_count: safeArray(blueprintArtifact?.poster_blueprint?.slides).length,
        },
      };
    }

  return {
    buildAuthoringContext,
    buildPosterBlueprintArtifact,
    buildPosterVisualDirectionArtifact,
    buildStoryline,
    buildHtml,
    directorReviewOutputContract,
    loadRenderedPosterSlideHtmlMap,
    normalizeInlineText,
    renderHtmlOutputContract,
    screenshotReviewOutputContract,
    stripHtml,
    summarizePanels,
    hydrateRenderedSlideRootMetadata,
    validateRenderedPosterHtml,
    validateRenderedReviewAnchors,
  };
}
