// @ts-nocheck
export function createPptDeckAuthoringSourceHelpers(deps) {
  const {
    PPT_PAGE_LIBRARY,
    audienceFacingMaterials,
    deckPreset,
    normalizeStringList,
    pageBudget,
    requireText,
    resolveSpeakerIdentity,
    safeArray,
    safeText,
    sharedFactLibrarySummary,
    sharedOperatorMaterials,
    sharedSourceAudience,
    sharedSourceConfidence,
    sharedSourceDeepResearchState,
    sharedSourceInputMode,
    sharedSourceLabels,
    sharedSourceMaterialIds,
    sharedSourceSufficiencyStatus,
  } = deps;

  function authoringCorpus(contract) {
    return [
      safeText(contract?.title),
      safeText(contract?.goal),
      safeText(contract?.user_intent),
      safeText(contract?.userIntent),
      safeText(contract?.delivery_request?.goal),
      safeText(contract?.delivery_request?.user_intent),
      safeText(contract?.delivery_request?.userIntent),
      safeText(contract?.shared_source_truth?.source_brief?.brief_text),
      ...audienceFacingMaterials(contract).map((material) => safeText(material?.content_text || material?.excerpt)),
    ].filter(Boolean).join('\n');
  }

  function hasQuantitativeEvidence(text) {
    return /(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?\s*%|\bAUROC\b|\bBrier\b|校准斜率|calibration|Knosp\s*\d|<\s*0\.?\d+|中位|median|\d+\.\d+)/i.test(safeText(text));
  }

  function manuscriptSyncRequired(contract) {
    const corpus = authoringCorpus(contract);
    return /(投稿|待投|要投|投的论文|成文论文|manuscript|第一篇|第二篇|第三篇)/i.test(corpus)
      && /(论文|paper|manuscript|研究)/i.test(corpus)
      && hasQuantitativeEvidence(corpus);
  }

  function manuscriptSyncContract(contract) {
    if (!manuscriptSyncRequired(contract)) return null;
    return {
      purpose: 'manuscript_submission_sync',
      source_consumption_policy: 'AI must receive and read source_materials_full_text. Programmatic snippets or first-lines are not an acceptable substitute.',
      evidence_table_policy: 'The storyline stage must read source_materials_full_text and author manuscript_evidence_table as structured evidence for downstream outline and blueprint stages.',
      visible_slide_focus: [
        '同步三篇待投稿或已成文论文的研究故事、主要结论和数字证据',
        '每篇论文至少覆盖研究问题、队列/终点、方法或模型策略、关键数字结果、结论边界',
      ],
      required_evidence_policy: '每篇论文的主要发现页必须把关键数字写入 title/core_sentence/evidence_points/page_core_content 中的至少一个听众可见字段。',
      prohibited_framing: [
        '不要把论文同步改写成临床应用推广、科室价值展示、管理行动建议或可复用框架宣传',
        '不要使用“科室价值”“应用场景”“服务随访安排”“服务手术策略”“证据链可复用”作为章节目标',
      ],
    };
  }

  function manuscriptEvidenceExtractionContract(contract) {
    if (!manuscriptSyncRequired(contract)) return null;
    return {
      contract_id: 'ppt_deck_ai_first_manuscript_evidence_table_v1',
      source_input: 'source_materials_full_text',
      extraction_owner: 'storyline_ai_stage',
      output_field: 'manuscript_evidence_table',
      downstream_consumers: ['detailed_outline', 'slide_blueprint', 'render_html'],
      required_row_fields: [
        'manuscript_label',
        'research_question',
        'primary_endpoint',
        'method_or_model',
        'key_numeric_results',
        'main_conclusion',
        'boundary',
      ],
      policy: [
        'storyline 必须从 source_materials_full_text 全文抽取每篇论文的数字证据表',
        'detailed_outline 和 slide_blueprint 必须消费 manuscript_evidence_table，不得重新退化成抽象概括',
        '程序只校验结构和可见数字是否存在，不用开头片段替 AI 选证据',
      ],
    };
  }

  function manuscriptLabels(contract, slides = []) {
    const corpus = [
      authoringCorpus(contract),
      ...safeArray(slides).flatMap((slide) => [
        slide?.title,
        slide?.core_sentence,
        ...(safeArray(slide?.page_core_content).map((item) => item?.text ?? item)),
      ]),
    ].map((item) => safeText(item)).filter(Boolean).join('\n');
    return [...new Set([...corpus.matchAll(/第\s*([一二三四五六七八九十\d]{1,3})\s*篇/g)]
      .map((match) => `第${safeText(match[1])}篇`))]
      .slice(0, 8);
  }

  function visibleSlideText(slide) {
    return [
      slide?.title,
      slide?.core_sentence,
      ...safeArray(slide?.evidence_points),
      ...safeArray(slide?.page_core_content).map((item) => item?.text ?? item),
    ].map((item) => safeText(item)).filter(Boolean).join('\n');
  }

  function assertManuscriptEvidenceDensity(slides, contract, label) {
    if (!manuscriptSyncRequired(contract)) return;
    const labels = manuscriptLabels(contract, slides);
    if (labels.length === 0) return;
    for (const manuscriptLabel of labels) {
      const manuscriptSlides = safeArray(slides)
        .filter((slide) => visibleSlideText(slide).includes(manuscriptLabel));
      if (manuscriptSlides.length === 0) {
        throw new Error(`${label} manuscript sync requires a visible section for ${manuscriptLabel}`);
      }
      const hasVisibleEvidence = manuscriptSlides.some((slide) => hasQuantitativeEvidence(visibleSlideText(slide)));
      if (!hasVisibleEvidence) {
        throw new Error(`${label} manuscript sync requires visible numeric evidence for ${manuscriptLabel}`);
      }
    }
  }

  function normalizeManuscriptEvidenceRow(row, index, label) {
    const normalized = {
      manuscript_label: requireText(row?.manuscript_label, `${label}[${index}].manuscript_label`),
      research_question: requireText(row?.research_question, `${label}[${index}].research_question`),
      primary_endpoint: requireText(row?.primary_endpoint, `${label}[${index}].primary_endpoint`),
      method_or_model: requireText(row?.method_or_model, `${label}[${index}].method_or_model`),
      key_numeric_results: normalizeStringList(row?.key_numeric_results, `${label}[${index}].key_numeric_results`, { min: 2, max: 8 }),
      main_conclusion: requireText(row?.main_conclusion, `${label}[${index}].main_conclusion`),
      boundary: requireText(row?.boundary, `${label}[${index}].boundary`),
    };
    if (!normalized.key_numeric_results.some((item) => hasQuantitativeEvidence(item))) {
      throw new Error(`${label}[${index}].key_numeric_results must include numeric evidence from source_materials_full_text`);
    }
    return normalized;
  }

  function normalizeManuscriptEvidenceTable(value, contract, label) {
    const rows = safeArray(value).map((row, index) => normalizeManuscriptEvidenceRow(row, index, label));
    if (!manuscriptSyncRequired(contract)) return rows;
    const requiredLabels = manuscriptLabels(contract);
    if (requiredLabels.length === 0) return rows;
    for (const manuscriptLabel of requiredLabels) {
      const row = rows.find((item) => safeText(item.manuscript_label).includes(manuscriptLabel));
      if (!row) {
        throw new Error(`${label} must include structured evidence for ${manuscriptLabel}`);
      }
      if (!row.key_numeric_results.some((item) => hasQuantitativeEvidence(item))) {
        throw new Error(`${label} must include numeric evidence for ${manuscriptLabel}`);
      }
    }
    return rows;
  }

  function assertPageConstraints(slides, contract, label) {
    const budget = pageBudget(contract.profile_id, contract);
    const slideCount = safeArray(slides).length;
    const constraints = budget?.hard_constraints || {};
    const exactSlides = Number(constraints.exact_slides);
    if (Number.isFinite(exactSlides) && exactSlides > 0 && slideCount !== exactSlides) {
      throw new Error(`${label} must honor hard exact slide count ${exactSlides}: got ${slideCount} slides`);
    }
    const minSlides = Number(constraints.min_slides);
    if (Number.isFinite(minSlides) && minSlides > 0 && slideCount < minSlides) {
      throw new Error(`${label} must honor hard minimum slide count ${minSlides}: got ${slideCount} slides`);
    }
    const maxSlides = Number(constraints.max_slides);
    if (Number.isFinite(maxSlides) && maxSlides > 0 && slideCount > maxSlides) {
      throw new Error(`${label} must honor hard maximum slide count ${maxSlides}: got ${slideCount} slides`);
    }
  }

  function fullSourceMaterials(contract) {
    return audienceFacingMaterials(contract)
      .map((material, index) => ({
        material_ref: safeText(material?.material_id) || `material_${index + 1}`,
        source_ref: safeText(material?.source_id),
        title: safeText(material?.title) || safeText(material?.relative_path),
        content_text: safeText(material?.content_text || material?.excerpt),
      }))
      .filter((material) => material.content_text);
  }

  function fullOperatorMaterials(contract) {
    return sharedOperatorMaterials(contract)
      .map((material, index) => ({
        material_ref: safeText(material?.material_id) || `operator_material_${index + 1}`,
        source_ref: safeText(material?.source_id),
        title: safeText(material?.title) || safeText(material?.relative_path),
        content_text: safeText(material?.content_text || material?.excerpt),
      }))
      .filter((material) => material.content_text);
  }

  function extractSourceSlidePlanSuggestions(contract) {
    const corpus = [
      ...sharedOperatorMaterials(contract),
      ...audienceFacingMaterials(contract),
    ]
      .map((material) => safeText(material?.content_text || material?.excerpt))
      .filter(Boolean)
      .join('\n\n');
    const matches = [...corpus.matchAll(/^##\s+Slide\s+(\d+)\s*[：:.-]?\s*(.*)$/gim)];
    const bySlideNo = new Map();
    for (const match of matches) {
      const slideNo = Number(match[1]);
      if (!Number.isFinite(slideNo) || slideNo <= 0 || bySlideNo.has(slideNo)) continue;
      bySlideNo.set(slideNo, {
        slide_no: slideNo,
        title: safeText(match[2]),
      });
    }
    if (bySlideNo.size === 0) {
      const lines = corpus.split(/\r?\n/);
      const groups = [];
      let current = [];
      let inSlidePlanBlock = false;
      const flush = () => {
        if (current.length > 0) {
          groups.push(current);
          current = [];
        }
      };
      for (const line of lines) {
        const match = line.match(/^\s*(\d{1,3})[.、)、)]\s*(\S[\s\S]*)$/);
        const isSlidePlanHeading = !match && /(?:推荐|建议|批准|approved).*(?:逐页|每页|页内容|页结构|页计划|幻灯片|slides?|PPT)|(?:逐页|每页).*(?:内容|结构|计划)|slide\s*plan/i.test(line);
        if (isSlidePlanHeading) {
          flush();
          inSlidePlanBlock = true;
          continue;
        }
        if (/^\s{0,3}#{1,4}\s+\S/.test(line) && !isSlidePlanHeading) {
          flush();
          inSlidePlanBlock = false;
          continue;
        }
        const slideNo = match ? Number(match[1]) : null;
        const rawTitle = match ? safeText(match[2]) : '';
        const slideLike = inSlidePlanBlock
          || /页|封面|结束|总览|目录|论文|篇|研究|结果|边界|问题|模型|评分|队列|方法|证据|风险|负担|Knosp|slide|PPT|汇报|总结|引言|结论|临床|终点/i.test(rawTitle);
        if (!Number.isFinite(slideNo) || slideNo <= 0 || !slideLike) {
          flush();
          continue;
        }
        const previous = current[current.length - 1];
        if (current.length === 0 || slideNo === previous.slide_no + 1) {
          current.push({
            slide_no: slideNo,
            title: rawTitle.replace(new RegExp(`^第\\s*${slideNo}\\s*页\\s*[：:.-]?\\s*`), '').trim() || rawTitle,
          });
        } else {
          flush();
          current.push({ slide_no: slideNo, title: rawTitle });
        }
      }
      flush();
      const numberedSlides = groups
        .filter((group) => group.length >= 6 && (group[0].slide_no === 1 || group.length >= 10))
        .sort((a, b) => b.length - a.length)[0] || [];
      for (const slide of numberedSlides) {
        if (!bySlideNo.has(slide.slide_no)) bySlideNo.set(slide.slide_no, slide);
      }
    }
    if (bySlideNo.size === 0) return null;
    const slides = [...bySlideNo.values()].sort((a, b) => a.slide_no - b.slide_no);
    return {
      binding: 'suggestion_only',
      policy: 'Source slide plans are planning suggestions for the AI authoring stage. They are not approved contracts and must not be used by validators to force page count, order, or title coverage.',
      total_slides: slides.length,
      slides,
    };
  }

  function buildAuthoringContext(contract) {
    const preset = deckPreset(contract.profile_id);
    const speakerIdentity = resolveSpeakerIdentity(contract, preset.speaker);
    const pagePlanningContract = pageBudget(contract.profile_id, contract);
    return {
      title: safeText(contract.title),
      delivery_goal: safeText(contract.goal),
      profile_id: contract.profile_id,
      speaker: speakerIdentity,
      speaker_signature: speakerIdentity,
      speaker_role: preset.speaker,
      audience: sharedSourceAudience(contract, preset.audience),
      promise: preset.promise,
      page_budget: pagePlanningContract,
      page_planning_contract: pagePlanningContract,
      page_library: PPT_PAGE_LIBRARY,
      source_fact_summary: sharedFactLibrarySummary(contract),
      ready_sources: sharedSourceLabels(contract),
      source_materials_full_text: fullSourceMaterials(contract),
      content_density_contract: manuscriptSyncContract(contract),
      source_evidence_extraction_contract: manuscriptEvidenceExtractionContract(contract),
      source_truth: {
        input_mode: sharedSourceInputMode(contract) || 'seed_only',
        confidence: sharedSourceConfidence(contract) || 'low',
        sufficiency_status: sharedSourceSufficiencyStatus(contract),
        deep_research_state: sharedSourceDeepResearchState(contract),
        material_ids: sharedSourceMaterialIds(contract),
      },
      audience_visibility_contract: {
        contract_id: 'ppt_deck_audience_visible_surface_v1',
        visible_surfaces: [
          'slide title',
          'core sentence',
          'page_core_content',
          'audience-readable evidence summary',
          'chart or diagram labels',
          'cover speaker identity',
        ],
        private_authoring_surfaces: [
          'speaker_notes',
          'transition_sentence',
          'page_goal',
          'page_objective',
          'visual_anchor_tracks',
          'operator_playbook',
          'operator_playbook_full_text',
          'revision_context',
          'source_id',
          'material_id',
          'prompt instructions',
        ],
        speaker_notes_policy: 'speaker_notes are speaker/export notes only. They may guide the talk track but must not be quoted, paraphrased as visible slide body, or turned into footer callouts.',
        public_label_policy: 'When source materials use internal management IDs, project numbers, source IDs, or material IDs, keep those identifiers in provenance only and use the user-approved audience labels in visible slides, such as first/second/third manuscript labels.',
        forbidden_visible_markers: [
          'speaker_notes',
          'transition_sentence',
          'page_goal',
          'source_id',
          'material_id',
          'Paper 001',
          'Paper 002',
          'Paper 003',
          'Paper 004',
          '001',
          '002',
          '003',
          '004',
          'SRC-*',
          'MAT-*',
          '讲稿',
          '备忘录',
          '内部管理编号',
          '建议表达',
          '来源口径',
          '可发表表达',
          '发表表达边界',
        ],
      },
      source_slide_plan_suggestions: extractSourceSlidePlanSuggestions(contract),
      operator_playbook_full_text: fullOperatorMaterials(contract),
      authoring_guardrails: [
        '如果 operator_playbook_full_text 提供了具名讲者署名，speaker / speaker_signature 必须保留 exact identity，不得泛化成“同行讲者”“正式讲者”等占位标签',
        'delivery_goal 只表示制作目标，不得原样进入 slide 标题、正文、讲稿或视觉宣言',
        '不要把“封面必须署名”“重点回答三件事”“先讲什么后讲什么”等系统操作说明写成 audience-facing 内容',
        'operator_playbook_full_text 只作为制作约束，不得被改写成课堂正文、标题、来源或讲稿台词',
        'speaker_notes、transition_sentence、page_goal、page_objective、visual_anchor_tracks 是讲者/作者工作面，不能成为听众可见标题、正文、页脚或卡片文案',
        'source_id、material_id、SRC-*、MAT-*、内部项目编号与管理编号只允许留在 provenance，不允许作为听众可见论文标签；若用户给出对外口径，必须按该口径重命名',
        '如果共享事实材料不足，只能做保守抽象，不要发明内部流程细节或伪来源',
        '如果 content_density_contract.purpose 是 manuscript_submission_sync，页面主语必须是论文故事、结论和数字证据；不要改写成应用价值、管理建议或科室价值宣传',
        '如果 source_evidence_extraction_contract 存在，storyline 必须先从 source_materials_full_text 全文产出 manuscript_evidence_table；outline、blueprint 和 render 后续阶段必须沿用这张结构化证据表',
        'source_materials_full_text 是完整资料，不是摘要；storyline、detailed_outline、slide_blueprint 必须通读全文后选择论文故事、结论与证据，不能只依赖开头、标题或 source_fact_summary',
        'source_slide_plan_suggestions、page_budget.planning_signals 和 source_fact_summary 只是 AI 规划参考；页数和故事结构由 AI 基于全文资料与 hard_constraints 决定，不得把建议逐页内容当作批准合同',
      ],
    };
  }

  return {
    assertManuscriptEvidenceDensity,
    assertPageConstraints,
    buildAuthoringContext,
    extractSourceSlidePlanSuggestions,
    fullOperatorMaterials,
    fullSourceMaterials,
    hasQuantitativeEvidence,
    manuscriptEvidenceExtractionContract,
    manuscriptSyncContract,
    manuscriptSyncRequired,
    normalizeManuscriptEvidenceTable,
  };
}
