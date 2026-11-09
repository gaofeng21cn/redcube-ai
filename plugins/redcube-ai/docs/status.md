# RedCube AI 当前状态

本页只报告源码事实和证据边界；剩余工作的 owner、下一动作和关闭条件见 [未完成验收](./active/rca-ideal-state-gap-plan.md)。

## 当前源码

- `contracts/opl_agent_package_manifest.json` 声明 Package `rca`、当前 Codex carrier 和稳定 entrypoints；source version 从该文件及同步的 Node/Python/Plugin declarations 读取。
- `agent/` 为声明式 visual pack；`contracts/action_catalog.json` 提供完整交付、image proof 和 native proof 的 hosted action binding。
- `scripts/sync_carrier.py` 将当前 tracked 领域资源确定性投影到 `plugins/redcube-ai/`；安装目录含 Mini App adapter、descriptor、阶段合同和 Python native helpers，不依赖仓库外层路径。`--check` 核对投影字节，实际安装与发布仍由各 owner 回读。
- `contracts/generated_surface_handoff.json` 的 repo-local handler targets 为空，`structural_cutover_complete=true`，`production_evidence_complete=false`。
- `contracts/functional_privatization_audit.json` 仅保留 visual authority decisions 与 Python native helpers；物理源码归属由 `contracts/physical_source_morphology_policy.json` 声明。旧私有 CLI、domain-entry、runtime、governance 和 overlay roots 已不存在。
- 当前 manifest 仍包含 source-contract、carrier、health/proof 与 clean-runner metadata。它们不能单独证明完整 installed truth、发布 currentness 或 executor readiness；跨仓 consumer 的现状必须由其 owner fresh 读取。

## PPT工作台经验

已有专业技能现接入源页语义改编、画法校准、增量生产与交付核验三组
stage-scoped知识。逐页提示词消费当前语言、认可画法与参考角色；笔记马克笔
profile是可选示例。`ppt_review_evidence`通过现有OPL helper目录读取真实图片，
绑定首轮与回修观察并计算次数、耗时和已知成本；它不作语义、美术或ready判定。
方法、行为案例与使用方式见[PPT工作台经验](delivery/ppt-workbench-learning.md)。
这些源码和工具能力不代表已经完成真实新版/基线首稿盲评或正式版本激活。

## 领域证据

`contracts/live_stage_run_progress_evidence.json` 记录
`post_standardization_live_stage_evidence_required` typed blocker，
owner、quality/export、long-soak 和 no-regression refs 尚为空，并明确
`domain_ready=false`、`production_ready=false`。

原生 PPT 实现已提供 typed materialization、template preservation、package readback、编辑回归与 parity evaluator 的源码面。`contracts/runtime-program/ppt-master-learning-landing.json` 已区分当前上游学习和历史 blind benchmark pin；这些实现不证明跨 viewer 实测、同源双跑盲评或 RCA parity receipt 已完成。

`contracts/durable_knowledge_catalog.json` 使用 v2 知识模型，分别声明产品归属与方法、政策等内容性质。个人、主题和项目正文通过 Framework 的统一来源绑定消费，不强制复制进 RCA 工作区。领域提案与接受方法由 visual-memory-curator 持有，共用来源核验、冻结与写回机制由 Framework 实现。合同与 carrier 检查证明接入字节；真实交付中的记忆接受、后续复用和规模运行仍须相应 owner evidence。

## 验证边界

`scripts/verify.sh` 是默认源码验证入口，lane 由 `scripts/test-registry.ts` 定义。
`npm run private-platform:readback` 读取结构退役状态；`npm run typecheck` 检查类型。
这些检查只证明源码和声明，不证明真实安装、公开发布或视觉交付。

安装和发布结论需要完整 carrier installed/callable readback、实际 executor route，以及 owner immutable revision、RCA channel `latest-stable` 和匿名 exact-digest readback。真实领域结论还需要 hosted StageRun、artifact lineage、RCA review/export 和 owner receipt。本页不保存版本化 tag、SHA、测试计数或某台机器的历史快照。
