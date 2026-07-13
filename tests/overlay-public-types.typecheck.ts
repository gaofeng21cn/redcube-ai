import type {
  PosterOnepagerStageRequirements,
  PosterOnepagerStageSequence,
  PptDeckDeliverableKind,
  PptDeckHydrateContractRequest,
  PptDeckPromptPack,
  PptDeckReviewCheck,
  PptDeckReviewSurface,
  PptDeckStageRequirements,
  PptDeckStageSequence,
  XiaohongshuHydratedContract,
  XiaohongshuStageSequence,
} from '@redcube/runtime';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;
type Expect<Value extends true> = Value;
type IsOptional<Value, Key extends keyof Value> = {} extends Pick<Value, Key> ? true : false;

type _PptOverlayId = Expect<Equal<NonNullable<PptDeckHydrateContractRequest['overlay']>, 'ppt_deck'>>;
type _PptDeliverableKind = Expect<Equal<PptDeckDeliverableKind, 'ppt_deck'>>;
type _PptReviewChecks = Expect<Equal<
  Extract<PptDeckReviewCheck, 'baseline_comparison_passed' | 'term_explained_on_first_use'>,
  'baseline_comparison_passed' | 'term_explained_on_first_use'
>>;
type _PptOverflowRerun = Expect<Equal<
  PptDeckReviewSurface['rerun_from_stage']['overflow_free'],
  'repair_image_pages'
>>;
type _PptBaselineRerun = Expect<Equal<
  PptDeckReviewSurface['rerun_from_stage']['baseline_comparison_passed'],
  'visual_direction'
>>;
type _PptProfileRerun = Expect<Equal<
  PptDeckReviewSurface['rerun_from_stage']['term_explained_on_first_use'],
  'storyline' | undefined
>>;

const pptSequence: PptDeckStageSequence = {
  flow_id: 'ppt_deck_standard_flow',
  stages: [],
  quality_route_recommendations: [],
};
pptSequence.stages.push({
  stage_id: 'storyline',
  prompt_file: 'storyline.md',
  output_artifact: 'storyline.json',
  input_stage_refs: [],
});
const pptRequirement: PptDeckStageRequirements['storyline'] = { input_stage_refs: [], can_block_stage_launch: false };
pptRequirement.ready_claim_requires_review_pass = true;

const xiaohongshuSequence: XiaohongshuStageSequence = {
  flow_id: 'xiaohongshu_official_flow',
  stages: [],
  quality_route_recommendations: [],
};
xiaohongshuSequence.stages.push({
  stage_id: 'research',
  prompt_file: 'research.md',
  output_artifact: 'research.json',
  input_stage_refs: [],
});
const xiaohongshuRequirement: XiaohongshuHydratedContract['stage_requirements']['research'] = {
  input_stage_refs: [],
  can_block_stage_launch: false,
};
xiaohongshuRequirement.ready_claim_requires_review_pass = true;

const posterSequence: PosterOnepagerStageSequence = {
  flow_id: 'poster_onepager_mainline_flow',
  stages: [],
  quality_route_recommendations: [],
};
posterSequence.stages.push({
  stage_id: 'storyline',
  prompt_file: 'storyline.md',
  output_artifact: 'storyline.json',
  input_stage_refs: [],
});
const posterRequirement: PosterOnepagerStageRequirements['storyline'] = { input_stage_refs: [], can_block_stage_launch: false };
posterRequirement.ready_claim_requires_review_pass = true;

type NativeLane = PptDeckPromptPack['render_contract']['native_ppt_proof_lane'];
type NativeRoute = NativeLane['runnable_routes'][number];
type HtmlRoute = PptDeckPromptPack['render_contract']['html_authoring_lane']['runnable_routes'][number];
type ImagePageRoute = PptDeckPromptPack['render_contract']['image_page_authoring_lane']['runnable_routes'][number];
type _NativeRoutes = Expect<Equal<NativeRoute, 'author_pptx_native' | 'repair_pptx_native'>>;
type _HtmlRoutes = Expect<Equal<HtmlRoute, 'render_html' | 'fix_html'>>;
type _ImagePageRoutes = Expect<Equal<ImagePageRoute, 'author_image_pages' | 'repair_image_pages'>>;
type _UnitRepairCompatibility = Expect<IsOptional<NativeLane, 'unit_repair_scope'>>;

declare const nativeLane: NativeLane;
nativeLane.runnable_routes.push('author_pptx_native');
// @ts-expect-error public route unions remain constrained by canonical values
nativeLane.runnable_routes.push('not_a_ppt_route');

export {};
