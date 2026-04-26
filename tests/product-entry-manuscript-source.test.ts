// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  invokeProductEntry,
} from '@redcube/gateway';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.ts';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const MOCK_REDCUBE_PYTHON_COMMAND = path.join(MODULE_DIR, 'helpers/mock-redcube-python-with-playwright.ts');
const SERIAL_ENV_TEST = { concurrency: false };

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function withMockHermesAndRuntimeState(testFn) {
  const upstream = await startMockCodexCli();
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-state-'));
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('invokeProductEntry managed ppt deck preserves full manuscript evidence without enforcing source slide suggestions', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-manuscript-source-'));
    const sourceFile = path.join(workspaceRoot, 'nfpitnet-three-papers.md');
    const quietOpening = '这一段开头没有任何结果数字，用来证明不能只读资料开头。'.repeat(30);
    const slidePlan = [
      '1. 封面：NF-PitNET 三篇论文科室内部进展汇报',
      '2. 本次同步的范围',
      '3. 共同数据基础',
      '4. 三篇论文一览',
      '5. 第一篇：研究问题与论文主线',
      '6. 第一篇：队列、终点和事件数',
      '7. 第一篇：模型策略和评价指标',
      '8. 第一篇：主要模型表现',
      '9. 第一篇：风险三分位结果',
      '10. 第二篇：研究问题与术后 3 个月 landmark',
      '11. 第二篇：队列、终点和事件数',
      '12. 第二篇：评分构成',
      '13. 第二篇：风险梯度',
      '14. 第二篇：模型比较',
      '15. 第三篇：研究问题与侵袭表型主线',
      '16. 第三篇：队列、终点和事件数',
      '17. 第三篇：Knosp 与侵袭性结构',
      '18. 第三篇：高 Knosp 伴随负担',
      '19. 第三篇：Knosp 之外模型增量',
      '20. 三篇论文的投稿口径总表',
      '21. 结束页',
    ].join('\n');
    writeFileSync(sourceFile, [
      '# NF-PitNET 三篇待投稿论文资料',
      '',
      quietOpening,
      '',
      '## 第一篇论文',
      '分析队列357例；early non-GTR 57/357，占16.0%；GTR 300/357，占84.0%。',
      'AUROC 0.800/0.802；Brier 0.110/0.143；校准斜率1.04/2.41；风险三分位4.2%、8.5%、35.6%。',
      '',
      '## 第二篇论文',
      '持续性术后垂体功能减退98/357，占27.5%；中位随访约776天。',
      '风险梯度8.4%、18.4%、35.7%、53.7%、66.7%；低中高8.4%、27.0%、56.1%；AUROC 0.708；Brier 0.171；校准斜率1.02。',
      '',
      '## 第三篇论文',
      '侵袭性154/357，占43.1%；non-GTR 57/357，占16.0%。',
      'Knosp 0-2为203/203非侵袭；Knosp 3-4为154/154侵袭；视物模糊64.3%；non-GTR 26.6%；中位直径30.0 mm。',
      '最佳Brier差异<0.0001；Knosp+直径non-GTR AUROC 0.800。',
      '',
      '## 推荐逐页内容',
      slidePlan,
    ].join('\n'), 'utf-8');

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'nfpitnet-topic',
      title: 'NF-PitNET 三篇论文同步',
      brief: '三篇待投稿论文投前同步，只讲第一篇、第二篇、第三篇的论文故事、数字证据和边界。',
      keywords: ['NF-PitNET', '第一篇', '第二篇', '第三篇'],
      sourceFiles: [sourceFile],
    });

    const response = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-manuscript-source',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'nfpitnet-topic',
        deliverable_id: 'nfpitnet-deck',
        profile_id: 'lecture_peer',
        title: 'NF-PitNET 三篇待投稿论文科室同步',
        goal: '给科室主任和同事同步三篇准备投稿的 NF-PitNET 论文，不超过30页。只讲第一篇、第二篇、第三篇的论文故事、研究问题、队列终点、方法主线、主要数字结果、结论边界和投稿口径。',
        user_intent: '先跑到详细大纲。资料包中的推荐逐页内容只作为参考，页数和结构由 AI 基于完整材料与硬约束决定，且所有论文结论必须有数字证据。',
        stop_after_stage: 'detailed_outline',
      },
    });

    assert.equal(response.ok, true);
    const managedRun = response.domain_entry_surface.result_surface.managed_run;
    assert.deepEqual(
      managedRun.route_runs.map((stageRun) => stageRun.stage_id),
      ['storyline', 'detailed_outline'],
    );

    const artifactDir = path.join(
      workspaceRoot,
      'topics',
      'nfpitnet-topic',
      'deliverables',
      'nfpitnet-deck',
      'artifacts',
    );
    const storyline = readJson(path.join(artifactDir, 'storyline.json'));
    const outline = readJson(path.join(artifactDir, 'detailed_outline.json'));
    assert.equal(storyline.storyline.manuscript_evidence_table.length, 3);
    assert.match(
      storyline.storyline.manuscript_evidence_table[0].key_numeric_results.join('\n'),
      /57\/357|16\.0|AUROC|Brier|1\.04/,
    );
    assert.notEqual(outline.detailed_outline.slides.length, 21);
    assert.equal(outline.detailed_outline.slides.length <= 30, true);

    const storylineAudit = readJson(managedRun.route_runs[0].prompt_audit_ref);
    const outlineAudit = readJson(managedRun.route_runs[1].prompt_audit_ref);
    assert.equal(
      storylineAudit.input.source_authoring_context.source_materials_full_text[0].content_text.includes('Knosp+直径non-GTR AUROC 0.800'),
      true,
    );
    assert.equal(storylineAudit.input.source_authoring_context.approved_slide_plan, undefined);
    assert.equal(storylineAudit.input.source_authoring_context.source_slide_plan_suggestions.total_slides, 21);
    assert.equal(storylineAudit.input.source_authoring_context.source_slide_plan_suggestions.binding, 'suggestion_only');
    assert.equal(outlineAudit.input.source_authoring_context.manuscript_evidence_table.length, 3);
    assert.equal(
      outlineAudit.input.source_authoring_context.source_materials_full_text[0].content_text.length > quietOpening.length,
      true,
    );
  });
});
