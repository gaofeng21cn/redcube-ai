# 系列项目文档治理清单

## 目标

本清单用于把 `RedCube AI` 放进 `One Person Lab`、`Med Auto Science`、`Med Auto Grant`、`RedCube AI` 这组系列项目的统一文档管理口径里做巡检。
它服务跨仓 docs intake、回归与持续对齐，不替代核心五件套、`docs/active/**`、`docs/policies/**`、typed boundary audit 或 machine-readable contracts。

## 一、默认入口

- 根层 `README*` 是产品分发与公开首页入口；是否继续保留双语由 public/product 需求单独判断。
- `docs/README.md` 是默认 docs 索引，承载中文 canonical 文档入口。
- 外部读者先走公开入口；AI / 维护者先走核心五件套，再进入 `docs/active/**`、`docs/references/**`、`docs/policies/**`、`docs/history/phase-2/**` 与 `contracts/**`。

## 二、核心五件套

- `docs/project.md`
- `docs/status.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`

这五件套必须位于 `docs/` 根目录，并被 `docs/README.md` 显式链接。
任何涉及当前主线、formal entry、runtime owner、product-entry truth、family surface、typed boundary 或 program pointer 的变化，都不能只改 program/reference/policy 文档，必须同步更新对应核心文档。

## 三、公开层与内部层

- `docs/**` 默认只维护中文 canonical 内容；稳定路径优先使用无语言后缀 `.md`。
- 根层 `README*` 的公开语言策略单独由产品分发和 public 需求决定，不要求 `docs/**` 维护双语镜像。
- `docs/active/**` 承担 active mainline brief；`docs/history/phase-2/**` 与 `docs/history/hermes/**` 承担 absorbed tranche 与 provenance brief。
- `docs/references/**` 承担内部参考说明；默认中文维护。
- `docs/policies/**` 承担稳定内部规则。
- 详细 `docs/*.md` 继续作为 repo-tracked 的内部 operator / collaborator 文档，不自动升格为公开面。
- 长期规则要冻结进核心文档、program brief、reference 或 policy；不要把 `AGENTS.md` 继续当第二真相源。

## 四、系列一致性检查

- 文档必须把 `RedCube AI` 写成 visual-deliverable domain agent；`gateway / harness` 只作为内部架构边界语言，不承担公开第一身份。默认 direct route、OPL-hosted route、configured family runtime provider、`RedCube service-safe domain entry` 与默认 `Codex CLI` 最小执行单元必须写成同一条 repo-verified 链路。OPL 是 stage-led、以 Agent executor 为最小执行单位的完整智能体运行框架；Temporal 是 production online runtime 的必需 substrate；external `Hermes-Agent` 只可写成显式非默认 executor/proof lane、hosted proof backend 或历史 provenance。
- 系列项目名称与角色要与四仓当前真相同步：`One Person Lab` 是 stage-led、以 Agent executor 为最小执行单位 agent runtime framework 与 shared runtime/contracts owner，`Med Auto Science` 是 `Research Ops`，`Med Auto Grant` 是 author-side `Grant Ops`，`RedCube AI` 是视觉交付 domain agent。
- 若提到 `Hermes-Agent`，只能指上游外部 runtime 项目 / 服务；仓内 runtime package、pilot、shim 或迁移材料都只能写成 repo-side adapter 或 service-safe consumption surface。
- 根层公开入口、docs 中文 canonical 层、program brief、内部参考、稳定规则、typed boundary audit 与历史 provenance 必须继续分层，不把 reference/history 重新挤进公开默认入口。旧 gateway、frontdoor、federation、harness-first、OPL-hosted handoff 或 Hermes-first 计划只在 internal integration、provenance、contract reference 或 tombstone 语境保留。
- 仍被 runtime-program contracts 通过 `human_doc:*` 指向的旧 brief 原位保留并补 lifecycle note；无合同引用且不服务当前 baton 的旧计划移动到 `docs/history/` 或 tombstone 语境。
- 修改 docs skeleton、公开入口、product-entry truth、program pointer、typed boundary 或 contract surface 时，必须同步更新相关 contract/test；但不得用测试固定 README/docs prose、标题或状态文案。

## 五、默认验证

- 默认 docs 审计入口：`scripts/verify.sh meta`
- 同义验证入口：`npm run test:meta`
- 历史 provenance 审计入口：`scripts/verify.sh historical` / `npm run test:historical`
- 默认 smoke：`scripts/verify.sh`
- 若验证命令、docs index、program pointer、typed boundary 或 contract surface 有变化，继续同步 `scripts/run-test-group.ts`、`package.json`、`README*` 与 `tests/*.test.ts`
