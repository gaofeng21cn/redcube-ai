// @ts-nocheck

export function createPptDeckProfilePresetParts(deps) {
  const {
    safeArray,
    safeText,
  } = deps;

  function extraChecks(contract) {
    const required = safeArray(contract?.review_surface?.required_checks);
    return required.filter((check) => ![
      'overflow_free',
      'occlusion_free',
      'visual_density_ok',
      'speaker_fit_ok',
      'edge_clearance_ok',
      'block_content_fit_ok',
      'title_typography_ok',
      'page_number_consistency_ok',
    ].includes(check));
  }

  function deriveProfileChecks(contract, blueprintArtifact, storylineArtifact) {
    const slides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
    const pageTypes = slides.map((slide) => safeText(slide.page_type || slide?.visual_presentation?.layout_family));
    const layoutFamilies = slides.map((slide) => safeText(slide?.visual_presentation?.layout_family));
    switch (contract.profile_id) {
      case 'lecture_student':
        return {
          term_explained_on_first_use: slides.some((slide) => slideHasTermExplanation(slide)),
          teaching_progression_clear: slides.length === 1
            ? singleSlideTeachingProgressionClear(slides[0])
            : ['cover_signal', 'mechanism_track', 'decision_gate', 'closure_peak'].every((type) => pageTypes.includes(type)),
        };
      case 'lecture_peer':
        return {
          novelty_position_clear: safeText(storylineArtifact?.storyline?.narrative_arc?.journey?.[0]).length > 0,
          method_boundary_explicit: pageTypes.includes('judgement_ladder')
            || pageTypes.includes('decision_gate')
            || layoutFamilies.includes('judgement_ladder'),
        };
      case 'executive_briefing':
        return {
          decision_implication_clear: slides.some((slide) => safeText(slide.page_goal).includes('动作') || safeText(slide.page_goal).includes('决策')),
          conclusion_up_front: safeText(slides[0]?.core_sentence || slides[0]?.page_core_content?.[0]?.text || '').length > 0,
        };
      case 'defense_deck':
        return {
          claim_evidence_traceable: slides.some((slide) => safeArray(slide.evidence_and_sources).length >= 2),
          backup_qa_ready: pageTypes.includes('ring_cross') || pageTypes.includes('summary_peak'),
        };
      default:
        return {};
    }
  }

  function slideTextItems(value) {
    return safeArray(value)
      .map((item) => safeText(item?.text || item?.label || item))
      .filter(Boolean);
  }

  function slideHasTermExplanation(slide) {
    if (!slide) return false;
    const content = slideTextItems(slide.page_core_content);
    if (content.length < 2) return false;
    return content.some((item) => /[:：]/.test(item))
      || safeArray(slide.page_core_content).some((item) => (
        safeText(item?.label).length > 0 && safeText(item?.text).length > 0
      ));
  }

  function singleSlideTeachingProgressionClear(slide) {
    if (!slide) return false;
    const coreContent = slideTextItems(slide.page_core_content);
    const evidencePoints = slideTextItems(slide.evidence_points);
    const anchorTracks = slideTextItems(slide?.visual_presentation?.anchor_tracks);
    const hasGoalAndTakeaway = safeText(slide.page_goal).length > 0
      && safeText(slide.core_sentence).length > 0;
    const joinedProgressionText = [
      ...coreContent,
      ...evidencePoints,
      ...anchorTracks,
      safeText(slide.core_sentence),
      safeText(slide.page_goal),
    ].join(' ');
    const hasStructuredProgression = coreContent.length >= 4
      || (
        coreContent.length >= 2
        && /输入|起点|目标|source|input/i.test(joinedProgressionText)
        && /执行|生成|通道|路线|route|stage|run/i.test(joinedProgressionText)
        && /验收|审阅|导出|交付|证据|闭环|review|export|evidence|gate/i.test(joinedProgressionText)
      );
    const hasEvidenceOrVisualTrack = evidencePoints.length >= 2 || anchorTracks.length >= 1;
    return hasGoalAndTakeaway && hasStructuredProgression && hasEvidenceOrVisualTrack;
  }
  
  function deckPreset(profileId) {
    switch (profileId) {
      case 'lecture_student':
        return {
          speaker: '教学型讲者',
          audience: '医学生与住院学员',
          promise: '让学生看懂主题的核心概念、判断顺序与课堂带走点',
          speaker_seconds: 55,
        };
      case 'lecture_peer':
        return {
          speaker: '同行讲者',
          audience: '临床科研同行',
          promise: '让同行快速对齐主题主线、证据边界与可复用判断',
          speaker_seconds: 65,
        };
      case 'executive_briefing':
        return {
          speaker: '汇报型讲者',
          audience: '医院管理层',
          promise: '让决策者先看到主题要点、判断依据与后续动作',
          speaker_seconds: 45,
        };
      default:
        return {
          speaker: '正式讲者',
          audience: '专业听众',
          promise: '让听众带走可复用的判断框架与动作路径',
          speaker_seconds: 60,
        };
    }
  }
  

  function pageBudget(profileId, contract = null) {
    void profileId;
    const directTextFields = [
      safeText(contract?.title),
      safeText(contract?.goal),
      safeText(contract?.user_intent),
      safeText(contract?.userIntent),
      safeText(contract?.delivery_request?.goal),
      safeText(contract?.delivery_request?.user_intent),
      safeText(contract?.delivery_request?.userIntent),
      safeText(contract?.operator_playbook?.brief_text),
      safeText(contract?.operator_playbook?.user_intent),
    ];
    const sourceTextFields = [
      safeText(contract?.shared_source_truth?.source_brief?.brief_text),
      safeText(contract?.source_truth?.source_brief?.brief_text),
      ...safeArray(contract?.shared_source_truth?.extracted_materials?.materials)
        .flatMap((material) => [
          safeText(material?.title),
          safeText(material?.content_text),
          safeText(material?.content_markdown),
          safeText(material?.excerpt),
        ]),
      ...safeArray(contract?.source_truth?.extracted_materials?.materials)
        .flatMap((material) => [
          safeText(material?.title),
          safeText(material?.content_text),
          safeText(material?.content_markdown),
          safeText(material?.excerpt),
        ]),
      ...safeArray(contract?.materials)
        .flatMap((material) => [
          safeText(material?.title),
          safeText(material?.content_text),
          safeText(material?.content_markdown),
          safeText(material?.excerpt),
        ]),
    ];
    const directCorpus = directTextFields.filter(Boolean).join('\n');
    const sourceCorpus = sourceTextFields.filter(Boolean).join('\n');
    const corpus = [directCorpus, sourceCorpus].filter(Boolean).join('\n');
    const numberValue = (value) => {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
    };
    const chineseNumberValue = (value) => {
      const raw = safeText(value);
      if (/^\d+$/.test(raw)) return numberValue(raw);
      const digits = {
        一: 1,
        二: 2,
        两: 2,
        三: 3,
        四: 4,
        五: 5,
        六: 6,
        七: 7,
        八: 8,
        九: 9,
        十: 10,
      };
      if (raw === '十') return 10;
      if (/^十[一二两三四五六七八九]$/.test(raw)) return 10 + digits[raw[1]];
      if (/^[一二两三四五六七八九]十$/.test(raw)) return digits[raw[0]] * 10;
      if (/^[一二两三四五六七八九]十[一二两三四五六七八九]$/.test(raw)) {
        return digits[raw[0]] * 10 + digits[raw[2]];
      }
      return digits[raw] || null;
    };

    const hardConstraints = {};
    const planningSignals = [];
    const requestConstraints = contract?.delivery_request?.constraints && typeof contract.delivery_request.constraints === 'object'
      ? contract.delivery_request.constraints
      : {};
    const explicitExactSlides = numberValue(requestConstraints.exact_slides ?? requestConstraints.expected_slide_count);
    const explicitMaxSlides = numberValue(requestConstraints.max_slides);
    const explicitMinSlides = numberValue(requestConstraints.min_slides);
    if (explicitExactSlides !== null) {
      hardConstraints.exact_slides = explicitExactSlides;
    }
    if (explicitMaxSlides !== null) {
      hardConstraints.max_slides = explicitMaxSlides;
    }
    if (explicitMinSlides !== null) {
      hardConstraints.min_slides = explicitMinSlides;
    }
    const addSignal = (signal) => {
      const key = JSON.stringify(signal);
      if (planningSignals.some((item) => JSON.stringify(item) === key)) return;
      planningSignals.push(signal);
    };
    const firstHardUpperBound = [...directCorpus.matchAll(/(?:不超过|最多|上限|不多于|至多|<=|≤)\s*(\d{1,3})\s*(?:页|张|slides?)/gi)]
      .map((match) => numberValue(match[1]))
      .find((value) => value !== null);
    if (firstHardUpperBound !== undefined && hardConstraints.max_slides === undefined) {
      hardConstraints.max_slides = firstHardUpperBound;
    }
    const firstHardLowerBound = [...directCorpus.matchAll(/(?:不少于|至少|下限|不低于|>=|≥)\s*(\d{1,3})\s*(?:页|张|slides?)/gi)]
      .filter((match) => !/(?:每(?:一)?(?:篇|个|项|部分|研究)|per\s+(?:paper|item|section))\s*$/i.test(directCorpus.slice(Math.max(0, match.index - 12), match.index)))
      .map((match) => numberValue(match[1]))
      .find((value) => value !== null);
    if (firstHardLowerBound !== undefined && hardConstraints.min_slides === undefined) {
      hardConstraints.min_slides = firstHardLowerBound;
    }
    const firstHardExact = [
      ...directCorpus.matchAll(/(?:必须|固定|正好|恰好|严格|总页数)\s*(?:做成|生成|制作|控制为|为|=)?\s*(\d{1,3})\s*(?:页|张|slides?)(?!\s*(?:以内|以下|内))/gi),
      ...directCorpus.matchAll(/(?:做成|生成|制作)\s*(\d{1,3})\s*(?:页|张|slides?)\s*(?:整|固定|版本)?/gi),
    ]
      .filter((match) => !/(?:不超过|最多|上限|不多于|至多|<=|≤|建议|推荐)\s*$/i.test(directCorpus.slice(Math.max(0, match.index - 10), match.index)))
      .map((match) => numberValue(match[1]))
      .find((value) => value !== null);
    if (firstHardExact !== undefined && hardConstraints.exact_slides === undefined) {
      hardConstraints.exact_slides = firstHardExact;
    }

    for (const match of corpus.matchAll(/(?:建议|推荐|目标|期望|控制在|页数|幻灯片|deck|slides?)?[^\d\n]{0,10}(\d{1,3})\s*(?:[-–—~至到])\s*(\d{1,3})\s*(?:页|张|slides?)/gi)) {
      let min = numberValue(match[1]);
      let max = numberValue(match[2]);
      if (min === null || max === null) continue;
      if (min > max) [min, max] = [max, min];
      addSignal({
        kind: 'suggested_range',
        min_slides: min,
        max_slides: max,
        binding: 'suggestion_only',
      });
    }
    const countExplicitSlidePlanItems = () => {
      const countConsecutive = (numbers) => {
        const uniqueNumbers = [...new Set(numbers.filter((value) => value !== null))].sort((a, b) => a - b);
        const groups = [];
        let current = [];
        for (const itemNo of uniqueNumbers) {
          const previous = current[current.length - 1];
          if (current.length === 0 || itemNo === previous + 1) {
            current.push(itemNo);
          } else {
            groups.push(current);
            current = [itemNo];
          }
        }
        if (current.length > 0) groups.push(current);
        return groups
          .filter((group) => group.length >= 6 && (group[0] === 1 || group.length >= 10))
          .map((group) => group.length)
          .sort((a, b) => b - a)[0] || 0;
      };
      const slideHeadingCount = countConsecutive(
        [...corpus.matchAll(/^\s*#{1,6}\s*Slide\s+(\d{1,3})\s*[：:.-]?/gim)]
          .map((match) => numberValue(match[1])),
      );
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
        const itemNo = match ? numberValue(match[1]) : null;
        const itemText = match ? safeText(match[2]) : '';
        const slideLike = inSlidePlanBlock
          || /页|封面|结束|总览|目录|论文|篇|研究|结果|边界|问题|模型|评分|队列|方法|证据|风险|负担|Knosp|slide|PPT|汇报|总结|引言|结论|临床|终点/i.test(itemText);
        if (itemNo === null || !slideLike) {
          flush();
          continue;
        }
        const previous = current[current.length - 1];
        if (current.length === 0 || itemNo === previous.itemNo + 1) {
          current.push({ itemNo, itemText });
        } else {
          flush();
          current.push({ itemNo, itemText });
        }
      }
      flush();
      const numberedListCount = groups
        .filter((group) => group.length >= 6 && (group[0].itemNo === 1 || group.length >= 10))
        .map((group) => group.length)
        .sort((a, b) => b - a)[0] || 0;
      return Math.max(slideHeadingCount, numberedListCount);
    };
    const slidePlanCount = countExplicitSlidePlanItems();
    if (slidePlanCount > 0) {
      addSignal({
        kind: 'source_slide_plan_suggestion',
        total_slides: slidePlanCount,
        binding: 'suggestion_only',
      });
    }
    const countNamedItems = () => {
      const ordinals = new Set(
        [...corpus.matchAll(/第\s*([一二两三四五六七八九十\d]{1,3})\s*篇/g)]
          .map((match) => chineseNumberValue(match[1]))
          .filter((value) => value !== null),
      );
      const paperNumbers = new Set(
        [...corpus.matchAll(/\bPaper\s*0?(\d{1,2})\b/gi)]
          .map((match) => numberValue(match[1]))
          .filter((value) => value !== null),
      );
      const explicitCount = [...corpus.matchAll(/([一二两三四五六七八九十\d]{1,3})\s*篇(?:成文)?(?:论文|研究|文章)?/g)]
        .map((match) => chineseNumberValue(match[1]))
        .filter((value) => value !== null)
        .sort((a, b) => b - a)[0] || 0;
      return Math.max(ordinals.size, paperNumbers.size, explicitCount);
    };
    const perItemMinimum = [...corpus.matchAll(/(?:每(?:一)?(?:篇|个|项|部分|研究)|至少\s*每(?:一)?(?:篇|个|项|部分|研究))\s*(?:至少|不少于|最低)?\s*(\d{1,2})\s*页/g)]
      .map((match) => numberValue(match[1]))
      .filter((value) => value !== null)
      .sort((a, b) => b - a)[0] || 0;
    const namedItemCount = countNamedItems();
    if (perItemMinimum > 0 && namedItemCount > 0) {
      addSignal({
        kind: 'per_item_coverage_guidance',
        named_item_count: namedItemCount,
        per_item_minimum_slides: perItemMinimum,
        binding: 'suggestion_only',
      });
    }
    return {
      contract_id: 'ppt_deck_ai_first_page_constraints_v1',
      policy: 'Program only carries explicit hard page constraints. Suggested ranges, source slide plans, and per-item coverage hints are context for the AI authoring stage, not validator-owned slide budgets. The full source text is provided so AI decides page count and structure directly.',
      hard_constraints: hardConstraints,
      planning_signals: planningSignals,
    };
  }
  

  return {
    deckPreset,
    deriveProfileChecks,
    extraChecks,
    pageBudget,
  };
}
