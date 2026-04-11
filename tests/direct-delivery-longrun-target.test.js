import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('direct-delivery longrun target doc stays future-facing and does not rewrite current truth', () => {
  const doc = read('docs/direct_delivery_longrun_target_state.md');
  const docsIndex = read('docs/README.md');
  const docsIndexZh = read('docs/README.zh-CN.md');
  const currentProgram = JSON.parse(read('contracts/runtime-program/current-program.json'));

  assert.equal(docsIndex.includes('direct_delivery_longrun_target_state.md'), true);
  assert.equal(docsIndexZh.includes('direct_delivery_longrun_target_state.md'), true);
  assert.equal(docsIndex.includes('future-facing design target'), true);
  assert.equal(docsIndexZh.includes('future-facing 目标态文档'), true);

  assert.equal(doc.includes('future-facing'), true);
  assert.equal(doc.includes('不是当前 repo truth 的改写'), true);
  assert.equal(doc.includes('截至 `2026-04-09`，当前已 absorbed 的 direct-delivery tranche 仍是：'), true);
  assert.equal(doc.includes('`phase_2_direct_delivery_lifecycle_stage_convergence`'), true);
  assert.equal(doc.includes('`contracts/runtime-program/current-program.json` 需要立刻切到新 baton 的证明'), true);
  assert.equal(doc.includes('`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`'), true);
  assert.equal(doc.includes('`Storyline + Plan` 仍映射到当前 policy 的 `Story Architecture`'), true);
  assert.equal(doc.includes('`operator_handoff / closeout` 仍属于 `Delivery`，不是第六步'), true);
  assert.equal(doc.includes('`ppt_deck`'), true);
  assert.equal(doc.includes('guarded `poster_onepager`'), true);
  assert.equal(doc.includes('`xiaohongshu`：explicit human publication'), true);
  assert.equal(doc.includes('`controller` 已成为独立公开正式入口的证明'), true);
  assert.equal(doc.includes('## 5.1 Source Readiness'), true);
  assert.equal(doc.includes('## 5.2 Storyline'), true);
  assert.equal(doc.includes('## 5.3 Plan'), true);
  assert.equal(doc.includes('## 5.4 Visual'), true);
  assert.equal(doc.includes('## 5.5 Delivery'), true);
  assert.equal(doc.includes('## 6. operator_handoff / closeout boundary'), true);

  assert.equal(currentProgram.current_state.active_baton.id, 'hermes_stable_family_closure_truth');
  assert.equal(currentProgram.current_state.phase_label, 'Hermes / stable family closure truth');
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_runtime_watch_locator_integrity_hardening.status, 'closeout_completed');
  assert.equal(currentProgram.current_state.active_baton.scope.excluded_scope.includes('managed web runtime completion claim'), true);
});
