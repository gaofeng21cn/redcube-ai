import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const POSTER_FREEZE_CONTRACT = 'contracts/runtime-program/poster-production-hardening-freeze.json';
const P21_CLOSEOUT_CONTRACT = 'contracts/runtime-program/p21-operations-evaluation-closeout.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('poster freeze contract distinguishes knowledge poster, academic poster, and P20 boundary under historical-snapshot framing', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  assert.equal(poster.historical_snapshot, true);
  assert.equal(poster.snapshot_note, '2026-04-06_long_term_roadmap_snapshot');
  assert.equal(poster.boundary.poster_onepager, 'knowledge_poster');
  assert.deepEqual(poster.boundary.academic_poster_surfaces, ['paper_poster', 'conference_poster']);
  assert.equal(poster.boundary.not_equal_to, 'poster_production_quality_closeout');
});

test('poster freeze contract enumerates academic poster artifacts and review rubric explicitly', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  for (const token of [
    'paper_asset_library',
    'figure_table_bank',
    'evidence_map',
    'poster_storyboard',
    'panel_plan',
    'figure_priority_plan',
    'layout_plan',
    'figure_caption_rewrite',
    'render_bundle',
    'poster_eval_report',
    'far_view_readability',
    'scan_path_clarity',
    'figure_claim_alignment',
    'density_balance',
    'citation_visibility',
    'venue_metadata_complete',
    'print_export_safe',
    'paper_poster',
    'conference_poster',
  ]) {
    assert.equal(poster.surface_catalog.declared_artifacts.includes(token), true, token);
  }
});

test('poster freeze contract states that future academic poster surface cannot reuse knowledge-poster fixed seed as the formal mainline', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  assert.equal(poster.future_academic_poster_constraints.cannot_reuse_knowledge_poster_fixed_seed, 'hero/proof/pathway/cta');
});

test('poster freeze contract states that future academic poster surface cannot reuse slot_hydration_only as the formal mainline', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  assert.equal(poster.future_academic_poster_constraints.cannot_reuse_formal_mainline_strategy, 'slot_hydration_only');
});

test('current tracked program truth keeps poster freeze historical while family source-truth consumption convergence stays on the same source-readiness mainline', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const latestP21 = readJson(P21_CLOSEOUT_CONTRACT);
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'Phase2');
  assert.equal(currentProgram.current_state.workstream, 'phase_2_family_source_truth_consumption_convergence');
  assert.equal(currentProgram.current_state.review_closeout.status, 'passed');
  assert.deepEqual(currentProgram.current_state.active_baton.scope.runtime_planes, ['shared_source_truth', 'story_architecture', 'visual_authorship', 'delivery_packaging', 'review', 'export', 'gate', 'audit']);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.consumer_families, ['ppt_deck', 'xiaohongshu']);
  assert.deepEqual(currentProgram.current_state.active_baton.scope.guarded_poster_surface, ['poster_onepager']);
  assert.equal(currentProgram.current_state.active_baton.scope.consumer_families.includes('poster_onepager'), false);
  assert.equal(latestP21.historical_snapshot, true);
  assert.equal(latestP21.is_active_mainline, false);
  assert.equal(poster.historical_snapshot, true);
  assert.equal(poster.is_active_mainline, false);
});

test('current M2.A machine-readable surface slice exists for paper_poster without touching knowledge poster', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  assert.deepEqual(
    poster.current_slice.required_paths.filter((file) => existsSync(path.resolve(file))),
    poster.current_slice.required_paths,
  );
});

test('current M2.A prompt surface is academic-poster specific instead of knowledge-poster seeds', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);
  const combined = poster.current_slice.required_paths.map((file) => read(file)).join('\n');

  for (const token of poster.current_slice.required_content_tokens) {
    assert.equal(combined.includes(token), true, token);
  }

  for (const forbidden of poster.current_slice.forbidden_content_tokens) {
    assert.equal(combined.includes(forbidden), false, forbidden);
  }
});

test('remaining academic poster surface stays explicit after current M2.A slice', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);

  for (const token of [
    'prompts/paper_poster/figure_table_bank.md',
    'prompts/paper_poster/evidence_map.md',
    'prompts/paper_poster/panel_plan.md',
    'prompts/paper_poster/figure_priority_plan.md',
    'prompts/paper_poster/figure_caption_rewrite.md',
    'prompts/paper_poster/poster_eval_report.md',
    'prompts/paper_poster/visual_director_review.md',
    'prompts/paper_poster/screenshot_review.md',
  ]) {
    assert.equal(poster.surface_catalog.remaining_surfaces.includes(token), true, token);
  }
});

test('P21 closeout contract stays linked as the poster metrics extension surface authority', () => {
  const poster = readJson(POSTER_FREEZE_CONTRACT);
  const p21 = readJson(P21_CLOSEOUT_CONTRACT);

  assert.equal(poster.dependencies.ops_eval_extension_contract, P21_CLOSEOUT_CONTRACT);
  for (const token of [
    'far_view_readability',
    'scan_path_clarity',
    'figure_claim_alignment',
    'citation_visibility',
    'print_export_safe',
  ]) {
    assert.equal(p21.family_profile_metric_extension_surface.metric_ids.includes(token), true, token);
  }
});
