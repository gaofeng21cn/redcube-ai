# Historical Deep Research Source Readiness Pack Phase 1 Plan

> 历史规划工件，冻结于 `2026-04-08`。它保留当时的 source-readiness 第一阶段实现设想。当前 direct route、federated route 和活跃运行口径以 `docs/status.md`、`docs/architecture.md`、`docs/README.md` 和 `contracts/runtime-program/current-program.json` 为准。
> 其中引用的 `tests/public-docs-surface.test.ts` 是已退役的历史文档 wording test，不再作为当前可运行验证入口；叙述性 README/docs 由人工/Agent review 对齐。

**Historical goal:** 把第 1 步 `Source Readiness` 升格为正式可消费能力面，先落一版共享 `Source Readiness Pack`，并让 `xiaohongshu` 率先消费它，完成 `Deep Research` 的第一阶段落地。

**Historical architecture:** 保留现有 canonical quartet 作为底层真相面，在同一 `topics/<topic>/canonical/` 下新增一个衍生但正式的 `source-readiness-pack.json`。`xiaohongshu research` 从“混入 storyline 判断”的薄 brief，收紧成“基于 shared source truth 的事实库 / readiness artifact”；`storyline` 再从 source truth / readiness pack 中生成受众、why-now、tension、memory hook。这样不需要先让 `ppt_deck` 长出显式 `research` route，也不会破坏现有 shared runtime 主线。

**Historical tech stack:** Node.js ESM、repo 内置 `node:test`、`@redcube/runtime-protocol`、`@redcube/runtime`、`@redcube/gateway`、`xiaohongshu` family runtime/prompts、CLI/文档 surface。

---

## Scope Check

本次只做第一落地切片，不试图一次实现完整 spec：

- 做：shared `Source Readiness Pack`
- 做：`xiaohongshu` research/storyline 边界收紧
- 做：quickstart / public docs 改口径
- 不做：`ppt_deck` 新增显式 `research` route
- 不做：完整联网 `Deep Research` 执行器
- 不做：重型 `Idea` 系统

## File Structure

### Shared Source Readiness

- Create: `packages/redcube-runtime/src/source-readiness-pack.js`
  - 负责把 canonical quartet 聚合成正式 `Source Readiness Pack`
- Modify: `packages/redcube-runtime/src/source-intake.js`
  - 在写完 canonical quartet 后写入 `source-readiness-pack.json`
- Modify: `packages/redcube-runtime/src/shared-source-truth.js`
  - 把 `source_readiness_pack` 纳入 shared truth 读取面
- Modify: `packages/redcube-runtime-protocol/src/source-truth.ts`
  - 增加 `sourceReadinessPackFile`
- Modify: `packages/redcube-runtime-protocol/src/types.ts`
  - 扩充 `SourceArtifactPaths`

### Xiaohongshu Family

- Modify: `packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts`
  - `buildResearch` 改为 readiness / fact-library artifact
  - `buildStoryline` 改为直接从 source truth / readiness pack 派生 storyline judgement
- Modify: `prompts/xiaohongshu/research.md`
  - runtime seed 改为 readiness / fact library 口径
- Modify: `prompts/xiaohongshu/storyline.md`
  - 明确保留 storyline judgement 职责

### Tests

- Modify: `tests/source-intake.test.ts`
  - 覆盖 canonical `source-readiness-pack.json`
- Modify: `tests/xiaohongshu-deliverable-e2e.test.ts`
  - 覆盖新 research artifact 边界与 storyline 消费来源
- Modify: `tests/family-source-truth-consumption.test.ts`
  - 确认 shared source truth 新 pack 不破坏消费 summary

### Docs

- Modify: `docs/human_quickstart.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`

---

### Task 1: 加入 canonical Source Readiness Pack

**Files:**
- Create: `packages/redcube-runtime/src/source-readiness-pack.js`
- Modify: `packages/redcube-runtime/src/source-intake.js`
- Modify: `packages/redcube-runtime/src/shared-source-truth.js`
- Modify: `packages/redcube-runtime-protocol/src/source-truth.ts`
- Modify: `packages/redcube-runtime-protocol/src/types.ts`
- Test: `tests/source-intake.test.ts`

- [ ] **Step 1: 写失败测试，要求 source intake 额外写出 readiness pack**

```js
test('intakeSource writes canonical source readiness pack for downstream planning', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-intake-pack-'));

  const result = await intakeSource({
    workspaceRoot,
    topicId: 'topic-pack',
    title: '甲状腺门诊沟通',
    brief: '仅有主题和简要说明，需要后续做完整内容交付。',
    keywords: ['甲状腺', '门诊', '患者沟通'],
  });

  assert.equal(result.ok, true);
  assert.equal(existsSync(result.artifactFiles.sourceReadinessPackFile), true);

  const pack = readJson(result.artifactFiles.sourceReadinessPackFile);
  assert.equal(pack.schema_version, 1);
  assert.equal(pack.topic_id, 'topic-pack');
  assert.equal(pack.readiness.input_mode, 'brief_keywords');
  assert.equal(pack.readiness.deep_research_state, 'required');
  assert.equal(Array.isArray(pack.fact_library.reference_source_list), true);
  assert.equal(Array.isArray(pack.fact_library.evidence_gaps), true);
  assert.equal(pack.fact_library.reference_source_list.length > 0, true);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `rtk node --test tests/source-intake.test.ts`
Expected: FAIL，报 `sourceReadinessPackFile` 不存在或 pack 断言失败。

- [ ] **Step 3: 增加 canonical path 与 pack builder**

在 `packages/redcube-runtime-protocol/src/source-truth.ts` 增加新路径：

```js
export function getSourceArtifactPaths(workspaceRoot, topicId) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    topicPaths,
    sourceIndexFile: path.join(topicPaths.canonicalDir, 'source-index.json'),
    extractedMaterialsFile: path.join(topicPaths.canonicalDir, 'extracted-materials.json'),
    sourceAuditFile: path.join(topicPaths.canonicalDir, 'source-audit.json'),
    sourceBriefFile: path.join(topicPaths.canonicalDir, 'source-brief.json'),
    sourceReadinessPackFile: path.join(topicPaths.canonicalDir, 'source-readiness-pack.json'),
  };
}
```

新建 `packages/redcube-runtime/src/source-readiness-pack.js`：

```js
function safeText(value) {
  return String(value || '').trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildSourceReadinessPack({
  topicId,
  title,
  sourceIndex,
  extractedMaterials,
  sourceBrief,
  sourceAudit,
}) {
  const inputMode = safeText(sourceBrief?.input_mode, 'empty');
  const materialIds = safeArray(sourceBrief?.material_ids);
  const sources = safeArray(sourceIndex?.sources).filter((source) => source?.status === 'ready');
  const evidenceGaps = [];

  if (inputMode === 'brief_keywords') evidenceGaps.push('public_evidence_missing');
  if (materialIds.length === 0) evidenceGaps.push('consumable_material_missing');
  if (safeText(sourceAudit?.status) !== 'pass') evidenceGaps.push('source_audit_not_passed');

  return {
    schema_version: 1,
    topic_id: topicId,
    title,
    readiness: {
      input_mode: inputMode,
      confidence: safeText(sourceBrief?.confidence, 'low'),
      sufficiency_status: evidenceGaps.length === 0 ? 'planning_ready' : 'augmentation_required',
      deep_research_state: inputMode === 'brief_keywords' ? 'required' : (evidenceGaps.length > 0 ? 'recommended' : 'not_required'),
      material_count: materialIds.length,
      material_ids: materialIds,
      audit_status: safeText(sourceAudit?.status, 'missing'),
    },
    fact_library: {
      topic_summary: safeText(sourceBrief?.brief_text || title),
      reference_source_list: sources.map((source) => safeText(source.relative_path || source.kind)).filter(Boolean),
      key_fact_groups: safeArray(extractedMaterials?.materials).slice(0, 8).map((material) => ({
        fact_id: material.material_id,
        label: safeText(material.excerpt).slice(0, 80),
        source_id: material.source_id,
      })),
      evidence_gaps: evidenceGaps,
    },
  };
}
```

- [ ] **Step 4: 在 source intake / shared source truth 中接线**

在 `packages/redcube-runtime/src/source-intake.js` 写入 pack：

```js
import { buildSourceReadinessPack } from './source-readiness-pack.js';

const sourceReadinessPack = buildSourceReadinessPack({
  topicId: sourcePaths.topicPaths.topicId,
  title: safeText(title) || sourcePaths.topicPaths.topicId,
  sourceIndex,
  extractedMaterials,
  sourceBrief,
  sourceAudit,
});

writeJson(sourcePaths.sourceReadinessPackFile, sourceReadinessPack);

return {
  ok: auditStatus === 'pass',
  topicId: sourcePaths.topicPaths.topicId,
  artifactFiles: {
    sourceIndexFile: sourcePaths.sourceIndexFile,
    extractedMaterialsFile: sourcePaths.extractedMaterialsFile,
    sourceAuditFile: sourcePaths.sourceAuditFile,
    sourceBriefFile: sourcePaths.sourceBriefFile,
    sourceReadinessPackFile: sourcePaths.sourceReadinessPackFile,
  },
  audit: sourceAudit,
};
```

在 `packages/redcube-runtime/src/shared-source-truth.js` 增加 pack 读取：

```js
if (!existsSync(paths.sourceIndexFile)
  || !existsSync(paths.extractedMaterialsFile)
  || !existsSync(paths.sourceAuditFile)
  || !existsSync(paths.sourceBriefFile)
  || !existsSync(paths.sourceReadinessPackFile)) {
  return null;
}

return {
  refs: {
    source_index: paths.sourceIndexFile,
    extracted_materials: paths.extractedMaterialsFile,
    source_audit: paths.sourceAuditFile,
    source_brief: paths.sourceBriefFile,
    source_readiness_pack: paths.sourceReadinessPackFile,
  },
  source_index: readJson(paths.sourceIndexFile),
  extracted_materials: readJson(paths.extractedMaterialsFile),
  source_audit: readJson(paths.sourceAuditFile),
  source_brief: readJson(paths.sourceBriefFile),
  source_readiness_pack: readJson(paths.sourceReadinessPackFile),
};
```

- [ ] **Step 5: 跑测试确认通过**

Run: `rtk node --test tests/source-intake.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/redcube-runtime/src/source-readiness-pack.js \
  packages/redcube-runtime/src/source-intake.js \
  packages/redcube-runtime/src/shared-source-truth.js \
  packages/redcube-runtime-protocol/src/source-truth.ts \
  packages/redcube-runtime-protocol/src/types.ts \
  tests/source-intake.test.ts
git commit -m "feat: add canonical source readiness pack"
```

### Task 2: 收紧 xiaohongshu research 到 readiness / fact library 边界

**Files:**
- Modify: `packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts`
- Modify: `prompts/xiaohongshu/research.md`
- Test: `tests/xiaohongshu-deliverable-e2e.test.ts`

- [ ] **Step 1: 写失败测试，要求 research 不再承载 storyline judgement 主字段**

```js
test('xiaohongshu research emits source readiness artifact instead of storyline judgement fields', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-research-pack-'));
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书科普',
    brief: '只有主题和门诊沟通目标。',
    keywords: ['甲状腺', '门诊'],
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    route: 'research',
  });

  const research = readJson(result.artifactFile);
  assert.equal(typeof research.research?.topic_summary, 'string');
  assert.equal(typeof research.research?.fact_library_summary, 'string');
  assert.equal(Array.isArray(research.research?.reference_source_list), true);
  assert.equal(Array.isArray(research.research?.evidence_gaps), true);
  assert.equal(research.research?.audience_judgement ?? null, null);
  assert.equal(research.research?.why_now ?? null, null);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `rtk node --test tests/xiaohongshu-deliverable-e2e.test.ts`
Expected: FAIL，现有 `research` 仍输出 `audience_judgement` / `why_now`。

- [ ] **Step 3: 重写 research artifact 为 readiness / fact library 输出**

在 `prompts/xiaohongshu/research.md` 改成：

```md
# xiaohongshu / research

从 shared source truth 生成可供后续消费的 source readiness / fact library artifact。
要求：
- 不输出 storyline judgement
- 输出 topic_summary、fact_library_summary、reference_source_list、evidence_gaps
- 明确当前是 single 还是 series
```

在 `packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts` 中把 `buildResearch()` 改成：

```js
function buildResearch(contract) {
  const pack = sourceTruth(contract)?.source_readiness_pack || null;
  const references = safeArray(pack?.fact_library?.reference_source_list).length > 0
    ? pack.fact_library.reference_source_list
    : sourceLabels(contract);

  return {
    ...attachCommon('research', contract),
    source_readiness: {
      research_positioning: 'shared_source_readiness_augmentation',
      augmentation_triggered: safeText(pack?.readiness?.deep_research_state) === 'required',
      trigger_signals: {
        source_missing_or_insufficient: safeText(pack?.readiness?.sufficiency_status) !== 'planning_ready',
        task_requires_public_evidence: true,
      },
    },
    research: {
      topic_summary: safeText(pack?.fact_library?.topic_summary, contract.title),
      fact_library_summary: safeText(pack?.fact_library?.topic_summary, contract.title),
      mode: isSeries(contract) ? 'series' : 'single',
      reference_source_list: references,
      evidence_gaps: safeArray(pack?.fact_library?.evidence_gaps),
      input_mode: safeText(pack?.readiness?.input_mode, sourceInputMode(contract) || 'seed_only'),
      confidence: safeText(pack?.readiness?.confidence, sourceConfidence(contract) || 'low'),
      source_sufficiency_judgement: safeText(pack?.readiness?.sufficiency_status, 'augmentation_required'),
      source_truth_material_count: sourceMaterials(contract).length,
      source_truth_material_ids: sourceMaterialIds(contract),
      input_output_state: {
        current: 'input_ready',
        next: 'planning_ready',
      },
    },
  };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `rtk node --test tests/xiaohongshu-deliverable-e2e.test.ts`
Expected: PASS，新 `research` artifact 已收紧为 fact library / readiness 输出。

- [ ] **Step 5: Commit**

```bash
git add packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts \
  prompts/xiaohongshu/research.md \
  tests/xiaohongshu-deliverable-e2e.test.ts
git commit -m "refactor: align xiaohongshu research with source readiness"
```

### Task 3: 把 storyline judgement 移回 storyline 阶段

**Files:**
- Modify: `packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts`
- Modify: `prompts/xiaohongshu/storyline.md`
- Test: `tests/xiaohongshu-deliverable-e2e.test.ts`

- [ ] **Step 1: 写失败测试，要求 storyline 直接承担 audience / why-now / tension / memory hook**

```js
test('xiaohongshu storyline derives judgement from source readiness instead of research storyline fields', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-xhs-storyline-boundary-'));
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书科普',
    brief: '患者常问先复查还是先吃药。',
    keywords: ['甲状腺', '门诊'],
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  await runDeliverableRoute({ workspaceRoot, overlay: 'xiaohongshu', topicId: 'topic-a', deliverableId: 'note-a', route: 'research' });
  const storylineResult = await runDeliverableRoute({ workspaceRoot, overlay: 'xiaohongshu', topicId: 'topic-a', deliverableId: 'note-a', route: 'storyline' });
  const storyline = readJson(storylineResult.artifactFile);

  assert.equal(typeof storyline.storyline?.audience_judgement, 'string');
  assert.equal(typeof storyline.storyline?.why_now, 'string');
  assert.equal(typeof storyline.storyline?.tension, 'string');
  assert.equal(typeof storyline.storyline?.memory_hook, 'string');
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `rtk node --test tests/xiaohongshu-deliverable-e2e.test.ts`
Expected: FAIL，`buildStoryline()` 仍从 `research.research` 读取 judgement 字段。

- [ ] **Step 3: 在 runtime 中改用 source truth / pack 派生 storyline inputs**

在 `packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts` 增加：

```js
function buildStorylineInputs(contract, research) {
  return {
    mode: safeText(research?.research?.mode, 'single'),
    audience_judgement: deriveAudienceFromSource(contract),
    tension: deriveTensionFromSource(contract),
    why_now: deriveWhyNowFromSource(contract),
    memory_hook: deriveMemoryHookFromSource(contract),
  };
}
```

并改 `buildStoryline()`：

```js
const storylineInputs = buildStorylineInputs(contract, research);
const authoredArtifact = promptArtifact(contract, 'storyline', storylineInputs);
```

同时在 `prompts/xiaohongshu/storyline.md` 顶部要求中明确：

```md
- `audience judgement / tension / why-now / memory hook` 属于 storyline judgement
- 不依赖 research artifact 输出同名字段
```

- [ ] **Step 4: 跑相关测试**

Run: `rtk node --test tests/xiaohongshu-deliverable-e2e.test.ts tests/xiaohongshu-creative-ownership.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts \
  prompts/xiaohongshu/storyline.md \
  tests/xiaohongshu-deliverable-e2e.test.ts \
  tests/xiaohongshu-creative-ownership.test.ts
git commit -m "refactor: move storyline judgement out of research"
```

### Task 4: 更新 quickstart / public docs 到新第 1 步口径

**Files:**
- Modify: `docs/human_quickstart.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/public-docs-surface.test.ts`
- Test: `tests/runtime-alignment-p0.test.ts`

- [ ] **Step 1: 写失败测试，要求公开文档出现 Source Readiness / Deep Research 正式口径**

```js
test('public docs describe Deep Research as Source Readiness enhancement instead of standalone scout+idea equivalent', () => {
  const readme = readRepoFile('README.md');
  const readmeZh = readRepoFile('README.zh-CN.md');
  const quickstart = readRepoFile('docs/human_quickstart.md');

  assert.equal(readme.includes('Deep Research'), true);
  assert.equal(readmeZh.includes('Deep Research'), true);
  assert.equal(quickstart.includes('Auto-first, human-interruptible-at-any-boundary, loop-gated-before-delivery'), true);
  assert.equal(quickstart.includes('Storyline -> Plan 只是高价值 checkpoint'), true);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `rtk node --test tests/public-docs-surface.test.ts tests/runtime-alignment-p0.test.ts`
Expected: FAIL，文档还没有完整新口径。

- [ ] **Step 3: 修改公开文档**

在 `docs/human_quickstart.md` 补充：

```md
`RedCube` 对外按 5 步理解：

1. `Source Readiness`
2. `Storyline`
3. `Plan`
4. `Visual`
5. `Delivery`

其中：

- `Deep Research` 是 `Source Readiness` 的强化模式
- 人可在任意边界介入
- `Review` 是 `Visual -> Delivery` 之间的循环 gate
```

在 `README.md` / `README.zh-CN.md` 增加一段短说明：

```md
`Deep Research` currently belongs to the shared `Source Readiness` step rather than a standalone creative stage. The runtime remains auto-first, allows human interruption at any stage boundary, and uses a looped review gate before delivery.
```

- [ ] **Step 4: 跑文档测试**

Run: `rtk node --test tests/public-docs-surface.test.ts tests/runtime-alignment-p0.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/human_quickstart.md README.md README.zh-CN.md \
  tests/public-docs-surface.test.ts tests/runtime-alignment-p0.test.ts
git commit -m "docs: publish Source Readiness and Deep Research contract"
```

### Task 5: 端到端回归与收尾

**Files:**
- Test: `tests/source-intake.test.ts`
- Test: `tests/xiaohongshu-deliverable-e2e.test.ts`
- Test: `tests/family-source-truth-consumption.test.ts`
- Test: `tests/review-platform.test.ts`

- [ ] **Step 1: 跑 shared Step 1 与 xiaohongshu 主链回归**

Run:

```bash
rtk node --test \
  tests/source-intake.test.ts \
  tests/xiaohongshu-deliverable-e2e.test.ts \
  tests/family-source-truth-consumption.test.ts \
  tests/review-platform.test.ts
```

Expected: PASS

- [ ] **Step 2: 跑文档与真相面对齐回归**

Run:

```bash
rtk node --test \
  tests/public-docs-surface.test.ts \
  tests/runtime-alignment-p0.test.ts
```

Expected: PASS

- [ ] **Step 3: 做 diff 检查**

Run:

```bash
rtk git diff --check
```

Expected: no output

- [ ] **Step 4: 汇总变更并提交**

```bash
git status --short
git add packages/redcube-runtime \
  packages/redcube-runtime-protocol \
  packages/redcube-runtime-family-xiaohongshu \
  prompts/xiaohongshu \
  docs/human_quickstart.md README.md README.zh-CN.md \
  tests/source-intake.test.ts \
  tests/xiaohongshu-deliverable-e2e.test.ts \
  tests/family-source-truth-consumption.test.ts \
  tests/public-docs-surface.test.ts \
  tests/runtime-alignment-p0.test.ts \
  tests/review-platform.test.ts
git commit -m "feat: land Source Readiness pack phase 1"
```

## Self-Review

### Spec coverage

- `5 步口径`：Task 4
- `Deep Research = Step 1 强化模式`：Task 1 + Task 4
- `research 与 storyline 边界收紧`：Task 2 + Task 3
- `auto-first / 任意边界可介入`：Task 4 文档口径保留，主线执行不加新 gate
- `review loop`：不改动机制，只保留回归验证，Task 5

### Placeholder scan

- 无 `TBD` / `TODO`
- 每个任务都给出具体文件、测试、命令与代码块

### Type consistency

- `sourceReadinessPackFile` 在 protocol path、runtime writer、shared loader、gateway result 中统一命名
- `source_readiness_pack` 作为 shared truth 键名
- `fact_library_summary` / `evidence_gaps` / `source_sufficiency_judgement` 作为新 research 正式字段

## Execution Handoff

Plan complete and saved to `docs/plans/2026-04-08-deep-research-source-readiness-pack-phase-1.md`. Two execution options:

1. Subagent-Driven (recommended) - 我派发新子代理逐任务执行并逐步 review
2. Inline Execution - 在当前 session 里按任务直接实现

当前这轮如果继续执行，推荐走 `Inline Execution`，因为仓库策略要求先把第一切片尽快落地，而且你没有要求额外代理编队。
