import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('poster hardening freeze docs distinguish knowledge poster, academic poster, and P20 boundary', () => {
  const roadmap = read('.omx/plans/roadmap-redcube-post-step7-long-term-programs.md');
  const latest = read('.omx/reports/redcube-runtime-program/LATEST_STATUS.md');
  const openIssues = read('.omx/reports/redcube-runtime-program/OPEN_ISSUES.md');

  assert.equal(roadmap.includes('`poster_onepager` = knowledge poster'), true);
  assert.equal(roadmap.includes('`paper_poster` / `conference_poster` = academic poster'), true);
  assert.equal(roadmap.includes('**不**等于 poster production quality closeout'), true);

  assert.equal(latest.includes('`P20` 完成定义固定为 extension proof，不等于 poster quality closeout'), true);
  assert.equal(openIssues.includes('knowledge poster，不是 academic poster closeout'), true);
});

test('poster hardening freeze docs freeze academic poster artifacts and review rubric', () => {
  const spec = read('.omx/plans/spec-redcube-poster-production-hardening.md');
  const plan = read('.omx/plans/plan-redcube-poster-production-hardening.md');
  const testSpec = read('.omx/plans/test-spec-redcube-poster-production-hardening.md');

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
    assert.equal(spec.includes(token) || plan.includes(token) || testSpec.includes(token), true, token);
  }
});

test('freeze docs state that future academic poster surface cannot reuse knowledge-poster fixed seed as the formal mainline', () => {
  const combined = [
    read('.omx/plans/spec-redcube-poster-production-hardening.md'),
    read('.omx/plans/plan-redcube-poster-production-hardening.md'),
    read('.omx/plans/test-spec-redcube-poster-production-hardening.md'),
  ].join('\n');

  assert.equal(combined.includes('hero/proof/pathway/cta'), true);
  assert.equal(combined.includes('future academic poster surface 不能沿用 knowledge-poster 固定'), true);
});

test('freeze docs state that future academic poster surface cannot reuse slot_hydration_only as the formal mainline', () => {
  const combined = [
    read('.omx/plans/spec-redcube-poster-production-hardening.md'),
    read('.omx/plans/plan-redcube-poster-production-hardening.md'),
    read('.omx/plans/test-spec-redcube-poster-production-hardening.md'),
  ].join('\n');

  assert.equal(combined.includes('slot_hydration_only'), true);
  assert.equal(combined.includes('future academic poster surface 不能沿用 `slot_hydration_only` 作为正式主线'), true);
});

test('active program switches to poster production hardening while keeping P21 completed', () => {
  const roadmap = read('.omx/plans/roadmap-redcube-post-step7-long-term-programs.md');
  const latest = read('.omx/reports/redcube-runtime-program/LATEST_STATUS.md');

  assert.equal(roadmap.includes('状态：P20 extension proof complete；P21 complete；Poster Production Hardening active'), true);
  assert.equal(latest.includes('当前阶段：Poster Production Hardening / Academic Poster Contract'), true);
  assert.equal(latest.includes('P21 现视为 completed'), true);
});

test('current M2.A machine-readable surface slice exists for paper_poster without touching knowledge poster', () => {
  const requiredCurrentSlicePaths = [
    'packages/redcube-overlay-paper-poster/package.json',
    'prompts/paper_poster/paper_asset_library.md',
    'prompts/paper_poster/poster_storyboard.md',
    'prompts/paper_poster/layout_plan.md',
    'prompts/paper_poster/render_bundle.md',
  ];

  assert.deepEqual(
    requiredCurrentSlicePaths.filter((file) => existsSync(path.resolve(file))),
    requiredCurrentSlicePaths,
  );
});

test('current M2.A prompt surface is academic-poster specific instead of knowledge-poster seeds', () => {
  const combined = [
    read('prompts/paper_poster/paper_asset_library.md'),
    read('prompts/paper_poster/poster_storyboard.md'),
    read('prompts/paper_poster/layout_plan.md'),
    read('prompts/paper_poster/render_bundle.md'),
  ].join('\n');

  for (const token of [
    'figures',
    'tables',
    'citations',
    'affiliations',
    'venue_metadata',
    'far_view_readability',
    'scan_path_clarity',
    'citation_visibility',
    'print_export_safe',
  ]) {
    assert.equal(combined.includes(token), true, token);
  }

  for (const forbidden of [
    '"panel_id": "hero"',
    '"region": "hero_band"',
    '"render_strategy": "slot_hydration_only"',
  ]) {
    assert.equal(combined.includes(forbidden), false, forbidden);
  }
});

test('remaining academic poster surface stays explicit after current M2.A slice', () => {
  const openIssues = read('.omx/reports/redcube-runtime-program/OPEN_ISSUES.md');

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
    assert.equal(openIssues.includes(token), true, token);
  }
});

test('P21 docs freeze generic base contract, extension surface, lane write scopes, and convergence order', () => {
  const combined = [
    read('.omx/plans/spec-redcube-p21-operations-and-evaluation-os.md'),
    read('.omx/plans/plan-redcube-p21-operations-and-evaluation-os.md'),
    read('.omx/plans/test-spec-redcube-p21-operations-and-evaluation-os.md'),
    read('.omx/plans/spec-redcube-poster-production-hardening.md'),
    read('.omx/plans/plan-redcube-poster-production-hardening.md'),
  ].join('\n');

  for (const token of [
    'shared generic ops-eval base contract',
    'family/profile-specific metric extension surface',
    'far_view_readability',
    'scan_path_clarity',
    'figure_claim_alignment',
    'citation_visibility',
    'print_export_safe',
    'P21 generic shared ops/eval contract',
    'P21 operator-facing surface',
    'poster-specific metric extension contract',
    'academic poster contract freeze',
    'Leader-reserved freeze files',
  ]) {
    assert.equal(combined.includes(token), true, token);
  }
});
