import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { loadRenderPackCompiler } from '../../redcube-runtime/src/render-pack-compiler.js';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '../../redcube-runtime/src/relative-quality.js';
import { getReviewState, isBaselineApprovedState } from '../../redcube-runtime/src/review-state.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const PYTHON_REVIEW = path.join(MODULE_DIR, '../../redcube-runtime/scripts/ppt_deck_review.py');
const PYTHON_EXPORT = path.join(MODULE_DIR, '../../redcube-runtime/scripts/ppt_deck_export.py');
const PROMPT_PACK = Object.freeze({
  storyline: 'prompts/ppt_deck/storyline.md',
  detailed_outline: 'prompts/ppt_deck/detailed_outline.md',
  slide_blueprint: 'prompts/ppt_deck/slide_blueprint.md',
  visual_direction: 'prompts/ppt_deck/visual_direction.md',
  render_html: 'prompts/ppt_deck/render_html.md',
  screenshot_review: 'prompts/ppt_deck/screenshot_review.md',
  export_pptx: 'prompts/ppt_deck/export_pptx.md',
});
const STAGE_REQUIREMENTS = Object.freeze({
  storyline: { requires_artifacts: [] },
  detailed_outline: { requires_artifacts: ['storyline'] },
  slide_blueprint: { requires_artifacts: ['detailed_outline'] },
  visual_direction: { requires_artifacts: ['slide_blueprint'] },
  render_html: { requires_artifacts: ['slide_blueprint', 'visual_direction'] },
  screenshot_review: { requires_artifacts: ['render_html'] },
  export_pptx: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
});
const CANVAS = Object.freeze({ width: 1152, height: 648, ratio: '16:9' });
const BANNED_RENDER_TOKENS = ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'];

function safeText(value) {
  return String(value || '').trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function writeText(file, content) {
  ensureDir(path.dirname(file));
  writeFileSync(file, content, 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = safeArray(contract?.stage_sequence?.stages).find((item) => item?.stage_id === stageId);
  return path.join(
    deliverablePaths.artifactsDir,
    safeText(stage?.output_artifact) || `${stageId}.json`,
  );
}

function readStageArtifact(contract, deliverablePaths, stageId) {
  const file = stageArtifactPath(contract, deliverablePaths, stageId);
  return existsSync(file) ? readJson(file) : null;
}

function promptMeta(route) {
  const relativePath = PROMPT_PACK[route];
  const absolutePath = path.join(REPO_ROOT, relativePath);
  return {
    root: 'prompts/ppt_deck',
    file: path.basename(relativePath),
    relative_path: relativePath,
    source: existsSync(absolutePath) ? 'repo' : 'embedded',
  };
}

function readPromptPackText(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing prompt pack asset: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf-8');
}

function renderSeedValue(value, vars) {
  if (Array.isArray(value)) {
    return value.map((item) => renderSeedValue(item, vars));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renderSeedValue(item, vars)]));
  }
  if (typeof value === 'string') {
    return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => safeText(vars[key]));
  }
  return value;
}

function promptSeed(route, vars = {}) {
  const relativePath = PROMPT_PACK[route];
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) return null;
  const raw = readFileSync(absolutePath, 'utf-8');
  const match = raw.match(/## runtime_seed\s*```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  const rendered = renderSeedValue(JSON.parse(match[1]), vars);
  const profileId = safeText(vars.profile_id);
  if (profileId && rendered?.profile_variants?.[profileId] && typeof rendered.profile_variants[profileId] === 'object') {
    const { profile_variants, ...base } = rendered;
    return {
      ...base,
      ...rendered.profile_variants[profileId],
    };
  }
  return rendered;
}

function sharedSourceTruth(contract) {
  return contract?.shared_source_truth || null;
}

function sharedSourceMaterials(contract) {
  return safeArray(sharedSourceTruth(contract)?.extracted_materials?.materials);
}

function sharedSourceMaterialIds(contract) {
  return sharedSourceMaterials(contract).map((material) => material.material_id);
}

function sharedSourceLabels(contract) {
  const labels = safeArray(sharedSourceTruth(contract)?.source_index?.sources)
    .filter((source) => source.status === 'ready')
    .map((source) => source.relative_path || source.kind);
  return labels.length > 0 ? labels : [
    '公开来源：临床指南 / 系统综述 / 监管原则',
    '公开来源：同行评议论文 / 真实世界研究',
    '公开来源：公开流程规范 / 教学案例',
  ];
}

function sharedSourceSnippet(contract, index = 0) {
  const materials = sharedSourceMaterials(contract);
  if (materials.length === 0) return '';
  const material = materials[index % materials.length];
  return safeText(material?.excerpt || material?.content_text).replace(/\s+/g, ' ').slice(0, 80);
}

function sharedSourceInputMode(contract) {
  return safeText(sharedSourceTruth(contract)?.source_brief?.input_mode);
}

function sharedSourceConfidence(contract) {
  return safeText(sharedSourceTruth(contract)?.source_brief?.confidence);
}

function sharedSourceAudience(contract, fallback) {
  const corpus = `${safeText(sharedSourceTruth(contract)?.source_brief?.brief_text)} ${sharedSourceMaterials(contract).map((material) => safeText(material.content_text)).join(' ')}`;
  if (/学生|课堂|讲课/.test(corpus)) return '医学生与住院学员';
  if (/同行|临床|科研/.test(corpus)) return '临床科研同行';
  if (/管理|决策/.test(corpus)) return '医院管理层';
  return fallback;
}

function extraChecks(contract) {
  const required = safeArray(contract?.review_surface?.required_checks);
  return required.filter((check) => !['overflow_free', 'occlusion_free', 'visual_density_ok', 'speaker_fit_ok'].includes(check));
}

function deriveProfileChecks(contract, blueprintArtifact, storylineArtifact) {
  const slides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
  const pageTypes = slides.map((slide) => slide.page_type);
  const layoutFamilies = slides.map((slide) => safeText(slide?.visual_presentation?.layout_family));
  switch (contract.profile_id) {
    case 'lecture_student':
      return {
        term_explained_on_first_use: slides.some((slide) => ['central_axis', 'myth_fact_split', 'cover_signal'].includes(slide.page_type) && safeArray(slide.page_core_content).length >= 2),
        teaching_progression_clear: ['cover_signal', 'mechanism_track', 'decision_gate', 'closure_peak'].every((type) => pageTypes.includes(type)),
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

function deckPreset(profileId) {
  switch (profileId) {
    case 'lecture_student':
      return {
        speaker: '教学型讲者',
        audience: '医学生与住院学员',
        promise: '让学生看懂 AI 不是工具清单，而是问题拆解、证据判断与执行闭环',
        speaker_seconds: 55,
      };
    case 'lecture_peer':
      return {
        speaker: '同行讲者',
        audience: '临床科研同行',
        promise: '让同行快速对齐问题、方法、证据与边界',
        speaker_seconds: 65,
      };
    case 'executive_briefing':
      return {
        speaker: '汇报型讲者',
        audience: '医院管理层',
        promise: '让决策者先看到关键判断，再理解资源路径与风险',
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

function buildOutlineSlides(contract) {
  const title = safeText(contract.title || '未命名课件');
  const goal = safeText(contract.goal || '讲清主线与动作');
  const preset = deckPreset(contract.profile_id);
  const publicSources = sharedSourceLabels(contract);
  const sourceClaims = sharedSourceMaterials(contract)
    .map((material) => safeText(material.excerpt || material.content_text).replace(/\s+/g, ' ').slice(0, 80))
    .filter(Boolean);
  const seed = promptSeed('detailed_outline', {
    title,
    goal,
    profile_id: contract.profile_id,
    public_source_1: publicSources[0],
    public_source_2: publicSources[1],
    public_source_3: publicSources[2],
  });
  let slides;
  if (Array.isArray(seed?.slides) && seed.slides.length > 0) {
    slides = seed.slides.map((slide) => ({
      ...slide,
      public_sources: Array.isArray(slide.public_sources) && slide.public_sources.length > 0
        ? slide.public_sources
        : [publicSources[0], publicSources[1], publicSources[2]],
    }));
  } else {
    slides = [
    {
      slide_id: 'S01',
      slide_no: 1,
      page_type: 'cover_peak',
      layout_family: 'cover_hero',
      title,
      page_goal: '先定义讲课主问题与听众收益',
      core_sentence: preset.promise,
      page_objective: '建立全场问题、听众收益与课程基调',
      evidence_points: ['为什么现在值得学', '今天不讲工具堆砌', goal],
      public_sources: publicSources.slice(0, 1),
    },
    {
      slide_id: 'S02',
      slide_no: 2,
      page_type: 'stakes_window',
      layout_family: 'multi_zone_compare',
      title: '旧工作流为什么会在这里失效',
      page_goal: '建立问题紧迫性',
      core_sentence: '如果不先拆清任务边界，AI 只会放大错误期待',
      page_objective: '先讲失败模式，再讲 AI 能接什么、不能接什么',
      evidence_points: ['任务定义断裂', '证据质量断裂', '输出解释断裂'],
      public_sources: publicSources.slice(0, 2),
    },
    {
      slide_id: 'S03',
      slide_no: 3,
      page_type: 'central_axis',
      layout_family: 'central_axis',
      title: '把问题、证据、动作绑到同一条轴线',
      page_goal: '让听众抓住总框架',
      core_sentence: '课堂不是堆信息，而是让问题、证据、动作同步推进',
      page_objective: '建立同轴推进的教学骨架',
      evidence_points: ['问题轴', '证据轴', '动作轴'],
      public_sources: publicSources.slice(0, 1),
    },
    {
      slide_id: 'S04',
      slide_no: 4,
      page_type: 'timeline_band',
      layout_family: 'timeline_band',
      title: '从首问到落地的讲授推进轨道',
      page_goal: '展示页面推进节奏',
      core_sentence: '每一页都要知道自己在推进哪一步，而不是重复安全模板',
      page_objective: '显式给出起势、解释、证据、动作、复盘的推进顺序',
      evidence_points: ['起势', '解释', '证据', '动作', '复盘'],
      public_sources: publicSources.slice(0, 2),
    },
    {
      slide_id: 'S05',
      slide_no: 5,
      page_type: 'judgement_ladder',
      layout_family: 'judgement_ladder',
      title: '判断梯：哪些环节适合 AI，哪些必须人工签收',
      page_goal: '讲清边界与风险控制',
      core_sentence: '不要把所有节点都交给同一种模型能力',
      page_objective: '让听众知道何时可信、何时必须人工兜底',
      evidence_points: ['可自动整理', '可 AI 辅助判断', '必须人工签收'],
      public_sources: publicSources.slice(0, 2),
    },
    {
      slide_id: 'S06',
      slide_no: 6,
      page_type: 'evidence_surface',
      layout_family: 'multi_zone_compare',
      title: '证据页必须把来源口径讲给听众听懂',
      page_goal: '建立可信度',
      core_sentence: '证据页不只是贴引用，而是让听众知道结论站在什么公开来源上',
      page_objective: '公开来源与结论必须同屏出现',
      evidence_points: ['公开指南', '同行评议文献', '公开流程资料'],
      public_sources: publicSources,
    },
    {
      slide_id: 'S07',
      slide_no: 7,
      page_type: 'ring_cross',
      layout_family: 'ring_cross',
      title: '把方法落成课堂上的四格动作',
      page_goal: '形成课后可执行框架',
      core_sentence: '讲者最终要给听众一个下课后还能复用的动作框架',
      page_objective: '从课堂内容落成实践步骤',
      evidence_points: ['定义问题', '绑定证据', '组织执行', '复盘回修'],
      public_sources: publicSources.slice(1),
    },
    {
      slide_id: 'S08',
      slide_no: 8,
      page_type: 'closure_peak',
      layout_family: 'summary_peak',
      title: '最后只收束三件必须带走的事',
      page_goal: '回收主线并给出动作清单',
      core_sentence: '结尾页不是重复目录，而是把整条主线压成可回忆的判断句',
      page_objective: '留下记忆点与下一步动作',
      evidence_points: ['先把任务定义清楚', '再把证据界面搭出来', '最后再让 AI 进入执行链'],
      public_sources: publicSources.slice(0, 1),
    },
    ];
  }

  if (sourceClaims.length === 0) {
    return slides;
  }

  return slides.map((slide, index) => {
    const sourceClaim = sourceClaims[index % sourceClaims.length];
    return {
      ...slide,
      core_sentence: index === 0 ? sourceClaim : slide.core_sentence,
      evidence_points: [...slide.evidence_points.slice(0, 2), sourceClaim].slice(0, 3),
      public_sources: publicSources.slice(0, Math.max(1, Math.min(publicSources.length, 3))),
    };
  });
}

function attachCommon(route, contract) {
  return {
    route,
    overlay: contract.overlay,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    prompt_pack: promptMeta(route),
  };
}

function buildStoryline(contract) {
  const preset = deckPreset(contract.profile_id);
  const seed = promptSeed('storyline', { promise: preset.promise });
  return {
    ...attachCommon('storyline', contract),
    storyline: {
      speaker: preset.speaker,
      audience: sharedSourceTruth(contract) ? sharedSourceAudience(contract, preset.audience) : preset.audience,
      goal: safeText(contract.goal),
      style: preset.promise,
      core_metaphor: sharedSourceTruth(contract) && sharedSourceSnippet(contract, 0)
        ? `shared source truth 首要命题：${sharedSourceSnippet(contract, 0)}`
        : safeText(seed?.storyline?.core_metaphor, '把 AI 放回科研链，而不是神化成万能入口'),
      narrative_arc: {
        hook: safeArray(seed?.storyline?.hook).length > 0 ? seed.storyline.hook : ['先定义问题与听众收益'],
        journey: safeArray(seed?.storyline?.journey).length > 0 ? seed.storyline.journey : [
          '把问题拆成可解释的结构',
          '把证据放回公开来源与适用边界',
          '把结论落成可执行动作',
        ],
        resolution: safeArray(seed?.storyline?.resolution).length > 0 ? seed.storyline.resolution : ['带着判断框架与复盘清单离场'],
      },
      source_truth_input_mode: sharedSourceInputMode(contract) || 'seed_only',
      source_truth_confidence: sharedSourceConfidence(contract) || 'low',
      source_truth_material_ids: sharedSourceMaterialIds(contract),
    },
  };
}

function buildDetailedOutline(contract) {
  const slides = buildOutlineSlides(contract);
  return {
    ...attachCommon('detailed_outline', contract),
    detailed_outline: {
      chapter_structure: [
        { chapter_id: 'C1', title: '问题重构', slide_range: '01-03' },
        { chapter_id: 'C2', title: '结构与节奏', slide_range: '04-06' },
        { chapter_id: 'C3', title: '实践收束', slide_range: '07-08' },
      ],
      page_budget: {
        total_slides: slides.length,
      },
      slides: slides.map((slide) => ({
        slide_no: String(slide.slide_no).padStart(2, '0'),
        title: slide.title,
        page_objective: slide.page_objective,
        core_sentence: slide.core_sentence,
        evidence_points: slide.evidence_points,
      })),
    },
  };
}

function makeBlueprintSlide(slide, index, slides, contract) {
  const preset = deckPreset(contract.profile_id);
  return {
    slide_id: slide.slide_id,
    slide_no: slide.slide_no,
    page_type: slide.page_type,
    title: slide.title,
    page_goal: slide.page_goal,
    core_sentence: slide.core_sentence,
    page_core_content: [
      { label: '核心句', text: slide.core_sentence },
      ...slide.evidence_points.map((item, itemIndex) => ({ label: `展开${itemIndex + 1}`, text: item })),
    ],
    visual_presentation: {
      layout_family: slide.layout_family,
      anchor_tracks: anchorTracksForFamily(slide.layout_family),
      canvas: CANVAS,
    },
    evidence_and_sources: slide.public_sources.map((source, sourceIndex) => ({
      source_id: `SRC-${slide.slide_no}-${sourceIndex + 1}`,
      public_label: source,
    })),
    speaker_notes: `${slide.core_sentence}。先用一句话点明本页任务，再按 ${slide.evidence_points.length} 个展开点说明为什么这一步不能跳过。`,
    speaker_seconds: preset.speaker_seconds + (slide.layout_family === 'judgement_ladder' ? 10 : 0),
    transition_sentence: index === slides.length - 1
      ? '最后把三件必须带走的事压成行动清单。'
      : `讲完这一页后，顺着“${slides[index + 1].title}”进入下一页。`,
  };
}

function anchorTracksForFamily(layoutFamily) {
  switch (layoutFamily) {
    case 'central_axis':
      return ['vertical-axis', 'judgement-stops'];
    case 'timeline_band':
      return ['horizontal-track', 'timeline-stops'];
    case 'judgement_ladder':
      return ['ladder-rungs', 'action-checkpoints'];
    case 'ring_cross':
      return ['center-hub', 'cross-zones'];
    case 'multi_zone_compare':
      return ['left-zone', 'center-divider', 'right-zone'];
    default:
      return ['title-column', 'argument-band'];
  }
}

function buildSlideBlueprint(contract) {
  const seed = promptSeed('slide_blueprint');
  const slides = buildOutlineSlides(contract);
  return {
    ...attachCommon('slide_blueprint', contract),
    slide_blueprint: {
      chapter_goal: '逐页落实讲授型 deck 的页面目标、视觉结构与讲稿动作',
      slides: slides.map((slide, index) => makeBlueprintSlide(slide, index, slides, contract)),
      quality_guards: {
        ...(seed?.quality_guards || {}),
        require_visual_direction_before_html: true,
        forbid_template_route_tokens: BANNED_RENDER_TOKENS,
        canvas: CANVAS,
      },
      profile_checks: safeArray(seed?.profile_checks?.[contract.profile_id]),
    },
  };
}

function buildVisualDirection(contract, blueprintArtifact, mode, baselineDeliverableId) {
  const slides = blueprintArtifact.slide_blueprint.slides;
  const seed = promptSeed('visual_direction', { title: contract.title });
  return {
    ...attachCommon('visual_direction', contract),
    visual_direction: {
      visual_manifest: safeText(seed?.visual_direction?.visual_manifest, '浅底高对比、关键页允许峰值、复杂结构显式锚点'),
      what_it_is: safeArray(seed?.visual_direction?.what_it_is).length > 0 ? seed.visual_direction.what_it_is : ['成熟讲者工作台', '结构解释驱动视觉组织'],
      what_it_is_not: safeArray(seed?.visual_direction?.what_it_is_not).length > 0 ? seed.visual_direction.what_it_is_not : ['统一安全模板页', '内部占位来源', '小红书语义替代'],
      palette: {
        canvas: '#F7F8FC',
        ink: '#0F172A',
        accent: '#2563EB',
        accentSoft: '#DBEAFE',
        success: '#0F766E',
      },
      continuity_constraints: [
        '关键页必须与相邻页形成明显差异',
        '来源与页码按页控制',
        '复杂结构页必须显式写出锚点/轨道/网格',
      ],
      rhythm_curve: [
        { slide_id: 'S01', role: 'opening_peak' },
        { slide_id: 'S02', role: 'stakes_rise' },
        { slide_id: 'S03', role: 'clarify_buffer' },
        { slide_id: 'S04', role: 'mechanism_peak' },
        { slide_id: 'S05', role: 'decision_bridge' },
        { slide_id: 'S06', role: 'evidence_peak' },
        { slide_id: 'S07', role: 'practice_bridge' },
        { slide_id: 'S08', role: 'closing_peak' },
      ],
      peak_pages: ['S01', 'S04', 'S06', 'S08'],
      page_family_ceiling: {
        cover_hero: 1,
        central_axis: 1,
        multi_zone_compare: 2,
        timeline_band: 1,
        judgement_ladder: 1,
        ring_cross: 1,
        summary_cross: 1,
      },
      forbidden_regressions: mode === 'optimize_existing'
        ? ['更粗糙', '更单调', '更重', '更挤', '更像统一模板页']
        : ['退化成统一安全模板页'],
      page_role_table: slides.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        page_role: slide.visual_presentation.layout_family,
        first_glance: slide.visual_presentation.anchor_tracks[0],
        second_glance: slide.visual_presentation.anchor_tracks[1] || slide.visual_presentation.anchor_tracks[0],
      })),
      final_instruction_to_html_generator: safeArray(seed?.visual_direction?.final_instruction_to_html_generator).length > 0
        ? seed.visual_direction.final_instruction_to_html_generator
        : [
          '每页在 slidesData 中独立 content',
          '不得退化成统一模板页',
          '先落实导演稿峰值页，再处理安全页',
        ],
      source_truth_confidence: sharedSourceConfidence(contract) || 'low',
      baseline_deliverable_id: safeText(baselineDeliverableId) || null,
      mode,
    },
  };
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeTemplate(text) {
  return String(text || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function renderContract(contract) {
  return contract?.prompt_pack?.render_contract || {};
}

async function compileRenderSlides(contract, slides, visualDirection) {
  const compiler = await loadRenderPackCompiler(contract, 'render_pack.js');
  return compiler.compileRenderSlides({
    slides,
    visualDirection,
    renderContract: renderContract(contract),
    canvas: CANVAS,
  });
}

function buildDeckHtml({ title, slidesMarkup, renderPlan, renderStrategy, shellFile }) {
  const shell = readPromptPackText(shellFile);
  const slidesLiteral = `[\n${slidesMarkup.map((slide) => `  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, layoutFamily: '${slide.layout_family}', recipeId: '${slide.recipe_id}', content: \`${escapeTemplate(slide.content)}\` }`).join(',\n')}\n]`;
  return shell
    .replaceAll('__PPT_DECK_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__PPT_DECK_SLIDES_DATA__', slidesLiteral);
}

function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const contract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
  const missing = safeArray(STAGE_REQUIREMENTS[route]?.requires_artifacts)
    .filter((stageId) => !readStageArtifact(contract, deliverablePaths, stageId));
  if (missing.length > 0) {
    throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
  }
  if (route === 'screenshot_review' && mode === 'optimize_existing' && !safeText(baselineDeliverableId)) {
    throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
  }
  if (route === 'screenshot_review' && mode === 'optimize_existing' && safeText(baselineDeliverableId)) {
    const baselineState = getReviewState({
      workspaceRoot,
      topicId,
      deliverableId: baselineDeliverableId,
    }).state;
    if (!isBaselineApprovedState(baselineState)) {
      throw new Error(`Baseline deliverable is not approved: ${baselineDeliverableId}`);
    }
  }
  if (route === 'export_pptx') {
    const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    if (!reviewArtifact || reviewArtifact.status !== 'pass') {
      throw new Error('Route export_pptx requires screenshot_review to pass before export');
    }
  }
}

function runPython(script, args) {
  if (!existsSync(script)) {
    throw new Error(`Missing ppt_deck python helper: ${script}`);
  }
  const probe = spawnSync('python3', ['--version'], { encoding: 'utf-8' });
  if (probe.status !== 0) {
    throw new Error(`python3 不可用: ${(probe.stderr || probe.stdout || '').trim()}`);
  }
  const result = spawnSync('python3', [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `ppt_deck python helper failed: ${script}`).trim());
  }
  return JSON.parse(result.stdout);
}

async function buildRenderArtifact({ workspaceRoot, topicId, deliverableId, contract }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const contractRender = renderContract(contract);
  if (!safeText(contractRender.compiler_module)) {
    throw new Error('Missing render pack compiler');
  }
  const slides = blueprintArtifact.slide_blueprint.slides;
  const slidesMarkup = await compileRenderSlides(contract, slides, visualArtifact.visual_direction);
  const renderPlan = {
    render_strategy: safeText(contractRender.render_strategy, 'prompt_director_first'),
    shell_file: safeText(contractRender.shell_file, 'render_shell.html'),
    compiler_module: safeText(contractRender.compiler_module, 'render_pack.js'),
    generator_instructions: safeArray(visualArtifact.visual_direction?.final_instruction_to_html_generator),
    peak_pages: safeArray(visualArtifact.visual_direction?.peak_pages),
    page_family_ceiling: visualArtifact.visual_direction?.page_family_ceiling || {},
    slides: slidesMarkup.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.recipe_id,
      peak_page: slide.director_contract.peak_page,
    })),
  };
  const htmlFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.html`);
  const slidesFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`);
  writeText(htmlFile, buildDeckHtml({
    title: contract.title,
    slidesMarkup,
    renderPlan,
    renderStrategy: renderPlan.render_strategy,
    shellFile: `prompts/ppt_deck/${safeText(contractRender.shell_file, 'render_shell.html')}`,
  }));
  writeJson(slidesFile, {
    title: contract.title,
    slides: slidesMarkup.map((slide) => ({
      slideId: slide.slide_id,
      title: slide.title,
      recipeId: slide.recipe_id,
      content: slide.content,
    })),
  });
  return {
    ...attachCommon('render_html', contract),
    html_bundle: {
      html_file: htmlFile,
      slides_file: slidesFile,
      page_count: slidesMarkup.length,
      render_strategy: renderPlan.render_strategy,
      generator_instructions: renderPlan.generator_instructions,
      shell_contract: {
        ratio: CANVAS.ratio,
        width: CANVAS.width,
        height: CANVAS.height,
        controls: ['slide-display-area', 'prev-btn', 'next-btn'],
      },
      slides: slidesMarkup,
    },
    artifact_refs: [htmlFile, slidesFile],
  };
}

function computeSlideReview(page, blueprintSlide, maxPrimaryPoints) {
  const metrics = {
    text_char_count: Number(page.text_chars || page.metrics?.text_char_count || 0),
    block_count: Number(page.zone_count || page.metrics?.block_count || 0),
    overlap_pairs: Number(page.overlap_pairs || page.metrics?.overlap_pairs || 0),
    clipped_nodes: Number(page.clipped_nodes || page.metrics?.clipped_nodes || 0),
  };
  const overflowFree = Boolean(page.overflow_free);
  const occlusionFree = metrics.clipped_nodes === 0 && metrics.overlap_pairs === 0;
  const visualDensityOk = metrics.block_count <= maxPrimaryPoints + 4 && metrics.text_char_count <= 340;
  const speakerFitOk = Number(blueprintSlide?.speaker_seconds || 0) >= 20 && Number(blueprintSlide?.speaker_seconds || 0) <= 120;
  const issues = [];
  if (!overflowFree) issues.push('overflow_detected');
  if (!occlusionFree) issues.push('occlusion_detected');
  if (!visualDensityOk) issues.push('visual_density_out_of_range');
  if (!speakerFitOk) issues.push('speaker_fit_out_of_range');
  return {
    slide_id: page.slide_id,
    title: page.title,
    layout_family: blueprintSlide?.visual_presentation?.layout_family || '',
    screenshot_file: page.screenshot_path,
    status: issues.length === 0 ? 'pass' : 'block',
    checks: {
      overflow_free: overflowFree,
      occlusion_free: occlusionFree,
      visual_density_ok: visualDensityOk,
      speaker_fit_ok: speakerFitOk,
    },
    metrics: {
      text_char_count: metrics.text_char_count,
      block_count: metrics.block_count,
      overlap_pairs: metrics.overlap_pairs,
    },
    issues,
  };
}

function summarizeChecks(slideReviews, contract) {
  const base = {
    overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
    occlusion_free: slideReviews.every((slide) => slide.checks.occlusion_free),
    visual_density_ok: slideReviews.every((slide) => slide.checks.visual_density_ok),
    speaker_fit_ok: slideReviews.every((slide) => slide.checks.speaker_fit_ok),
  };
  for (const check of extraChecks(contract)) {
    base[check] = true;
  }
  return base;
}

function baselineComparison({ workspaceRoot, topicId, baselineDeliverableId, slideReviews }) {
  const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
  const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
  const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
  if (!baselineArtifact) {
    throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
  }
  const currentFailures = slideReviews.filter((slide) => slide.issues.length > 0).length;
  const baselineFailures = safeArray(baselineArtifact.slide_reviews).filter((slide) => safeArray(slide.issues).length > 0).length;
  const currentDensity = slideReviews.reduce((sum, slide) => sum + Number(slide.metrics.text_char_count || 0), 0) / Math.max(slideReviews.length, 1);
  const baselineDensity = safeArray(baselineArtifact.slide_reviews).reduce((sum, slide) => sum + Number(slide.metrics?.text_char_count || 0), 0) / Math.max(safeArray(baselineArtifact.slide_reviews).length, 1);
  const relativeQuality = compareFailuresAndDensity({
    currentFailures,
    baselineFailures,
    currentDensity,
    baselineDensity,
    densityTolerance: 18,
    densityDigits: 2,
    densityLabel: '平均文本量',
  });
  const passed = relativeQuality.verdict !== 'degraded';
  return {
    baseline_deliverable_id: baselineDeliverableId,
    baseline_failures: baselineFailures,
    current_failures: currentFailures,
    baseline_average_text: Number(baselineDensity.toFixed(2)),
    current_average_text: Number(currentDensity.toFixed(2)),
    summary: summarizeRelativeQuality(relativeQuality),
    passed,
    relative_quality: relativeQuality,
  };
}

function buildReviewMarkdown(contract, reviewArtifact) {
  const lines = [
    `# ${contract.title} 视觉质控`,
    '',
    `- 状态：${reviewArtifact.status}`,
    `- overflow_free：${reviewArtifact.checks.overflow_free}`,
    `- occlusion_free：${reviewArtifact.checks.occlusion_free}`,
    `- visual_density_ok：${reviewArtifact.checks.visual_density_ok}`,
    `- speaker_fit_ok：${reviewArtifact.checks.speaker_fit_ok}`,
  ];
  if (Object.hasOwn(reviewArtifact.checks, 'baseline_comparison_passed')) {
    lines.push(`- baseline_comparison_passed：${reviewArtifact.checks.baseline_comparison_passed}`);
  }
  lines.push('', '## 分页记录');
  for (const slide of reviewArtifact.slide_reviews) {
    lines.push(`- ${slide.slide_id} / ${slide.layout_family} / ${slide.status} / ${slide.screenshot_file}`);
  }
  if (reviewArtifact.baseline_review?.summary) {
    lines.push('', '## Baseline Relative Review', reviewArtifact.baseline_review.summary);
  }
  return `${lines.join('\n')}\n`;
}

function buildScreenshotReviewArtifact({ workspaceRoot, topicId, deliverableId, contract, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverableId}_视觉质控.md`);
  const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
  const args = [
    '--html', renderArtifact.html_bundle.html_file,
    '--output-dir', screenshotsDir,
    '--review-markdown', reviewMarkdown,
    '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_slide || 5),
  ];
  if (mode === 'optimize_existing') {
    const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
    const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
    if (!baselineArtifact) {
      throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
    }
    args.push('--baseline-review', stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'));
  }
  const python = runPython(PYTHON_REVIEW, args);
  const latestChecks = {
    ...python.checks,
    ...deriveProfileChecks(contract, blueprintArtifact, storylineArtifact),
  };
  const artifact = {
    ...attachCommon('screenshot_review', contract),
    mode,
    status: python.status,
    checks: latestChecks,
    slide_reviews: python.slide_reviews,
    report_markdown: python.review_markdown || reviewMarkdown,
    metrics: python.metrics,
    artifact_refs: [python.review_markdown || reviewMarkdown, ...python.slide_reviews.map((slide) => slide.screenshot_file)],
    review_state_patch: {
      current_status: python.status === 'pass' ? 'export_ready' : 'blocked_for_revision',
      ready_for_export: python.status === 'pass',
      latest_review_stage: 'screenshot_review',
      latest_checks: latestChecks,
      pending_reviews: python.status === 'pass' ? [] : Object.entries(latestChecks).filter(([, value]) => value === false).map(([key]) => key),
      blocking_reasons: python.status === 'pass' ? [] : Object.entries(latestChecks).filter(([, value]) => value === false).map(([key]) => key),
      rerun_from_stage: python.status === 'pass' ? null : 'render_html',
      rerun_policy: {
        status: python.status === 'pass' ? 'idle' : 'rerun_required',
        rerun_from_stage: python.status === 'pass' ? null : 'render_html',
      },
      approval_state: {
        required: false,
        status: 'not_required',
      },
      publish_state: {
        current: 'not_applicable',
      },
    },
  };
  if (mode === 'optimize_existing' && python.baseline) {
    const relativeQuality = compareFailuresAndDensity({
      currentFailures: python.baseline.current_failed_slides,
      baselineFailures: python.baseline.baseline_failed_slides,
      currentDensity: python.baseline.current_average_density,
      baselineDensity: python.baseline.baseline_average_density,
      densityTolerance: 0.08,
      densityDigits: 4,
      densityLabel: '平均占用率',
    });
    artifact.baseline_review = {
      baseline_deliverable_id: baselineDeliverableId,
      ...python.baseline,
      relative_quality: relativeQuality,
      summary: summarizeRelativeQuality(relativeQuality),
    };
  }
  return artifact;
}

function buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const publishDir = ensureDir(path.join(deliverablePaths.deliverableDir, 'publish'));
  const pptxFile = path.join(publishDir, `${deliverableId}.pptx`);
  const pdfFile = path.join(publishDir, `${deliverableId}.pdf`);
  const notesFile = path.join(publishDir, `${deliverableId}-presenter-notes.md`);
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  writeText(notesFile, blueprintArtifact.slide_blueprint.slides.map((slide) => `## ${slide.slide_id} ${slide.title}\n\n${slide.speaker_notes}`).join('\n\n'));
  const screenshotsDir = path.join(deliverablePaths.reportsDir, 'screenshots');
  const python = runPython(PYTHON_EXPORT, [
    '--screenshots-dir', screenshotsDir,
    '--output-pptx', pptxFile,
    '--output-pdf', pdfFile,
  ]);
  const pptxPath = python.pptx_file || python.pptx_path;
  const pdfPath = python.pdf_file || python.pdf_path;
  return {
    ...attachCommon('export_pptx', contract),
    status: 'completed',
    review_state_patch: {
      current_status: 'completed',
      ready_for_export: true,
      latest_review_stage: 'export_pptx',
      pending_reviews: [],
      blocking_reasons: [],
      rerun_from_stage: null,
      rerun_policy: {
        status: 'idle',
        rerun_from_stage: null,
      },
      approval_state: {
        required: false,
        status: 'not_required',
      },
      publish_state: {
        current: 'not_applicable',
      },
    },
    export_bundle: {
      source_html: renderArtifact.html_bundle.html_file,
      pptx_file: pptxPath,
      pdf_file: pdfPath,
      presenter_notes_file: notesFile,
      page_count: python.page_count,
      page_count_match: python.page_count === renderArtifact.html_bundle.page_count,
      real_conversion_invocation: {
        tool: 'python3',
        script: 'packages/redcube-runtime/scripts/ppt_deck_export.py',
        command: ['--screenshots-dir', screenshotsDir, '--output-pptx', pptxFile, '--output-pdf', pdfFile],
      },
    },
    artifact_refs: [pptxPath, pdfPath, notesFile].filter(Boolean),
  };
}

export function canRunPptDeck(contract) {
  return contract?.deliverable_kind === 'ppt_deck';
}

export async function runPptDeckRoute({ workspaceRoot, topicId, deliverableId, route, contract, mode = 'draft_new', baselineDeliverableId = '' }) {
  ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const stageContract = safeArray(contract.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  let payload;
  switch (route) {
    case 'storyline':
      payload = buildStoryline(contract);
      break;
    case 'detailed_outline':
      payload = buildDetailedOutline(contract);
      break;
    case 'slide_blueprint':
      payload = buildSlideBlueprint(contract);
      break;
    case 'visual_direction':
      payload = buildVisualDirection(contract, readStageArtifact(contract, deliverablePaths, 'slide_blueprint'), mode, baselineDeliverableId);
      break;
    case 'render_html':
      payload = await buildRenderArtifact({ workspaceRoot, topicId, deliverableId, contract });
      break;
    case 'screenshot_review':
      payload = buildScreenshotReviewArtifact({ workspaceRoot, topicId, deliverableId, contract, mode, baselineDeliverableId });
      break;
    case 'export_pptx':
      payload = buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract });
      break;
    default:
      throw new Error(`Unsupported ppt_deck route: ${route}`);
  }
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...payload,
  };
}
