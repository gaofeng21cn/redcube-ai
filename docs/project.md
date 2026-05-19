# RedCube AI 项目概览

Owner: `RedCube AI`
Purpose: `current_project_role_and_boundary`
State: `current_truth`
Machine boundary: 人读项目概览。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

## 项目是什么

`RedCube AI` 是独立 visual-deliverable Foundry Agent；它的第一公开身份是视觉交付，而不是 OPL、gateway、harness 或旧 route。
对外发布形态是 `RedCube AI Foundry Agent`，一个 built on `OPL Framework` 的 `OPL-compatible package`：单一 `redcube-ai` app skill、direct product entry、service-safe domain entry、sidecar/projection 和 stage control projection 组成同一 package surface。当前仓库主线按 `Auto-only` 理解，formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
当前可执行基线已经按三层边界收口：对外默认稳定 capability surface 是 `redcube-ai app skill / CLI / MCP / invokeDomainEntry / invokeProductEntry / 本地脚本 / repo-tracked contracts`；默认 product-entry runtime owner 是 `configured_family_runtime_provider`，RCA 返回 OPL stage execution plan 与 domain authority refs，具体 stage attempt runtime / attempt ledger 归 OPL provider；本地 `Codex CLI` 是 provider/executor adapter 的第一公民 concrete executor 选项。`Hermes-Agent` 相关路径只保留为显式 hosted/proof backend 或技术参考，不承诺行为或输出质量与 Codex CLI 等价。
当前入口真相是：`redcube-ai` app skill、`CLI / MCP` 已经构成可验证的 `agent entry`，同时 repo-verified 的轻量 `product entry` service surface 也已落地；`status` 在这里仅指面向 agent 的 product-entry overview / intake / entry-shell contract，`redcube product status` 是当前 product-status command，但真正面向最终用户的成熟 GUI / WebUI / App shell 仍未落地。
当前统一协作模型是：`RedCube AI` 自己继续负责 domain authority、review / publication projection 与 visual-domain truth；stage attempt runtime、queue/wakeup、attempt ledger、generated shell 与 operator/workbench 归 OPL，具体 deliverable 的执行器保持可插拔，`Codex CLI` 是默认可选 concrete executor，而 hosted/proof backend 只作为显式附加层挂在同一套 contract 之下。
`gateway / harness` 在本仓继续作为内部架构边界语言，不作为仓库对外第一身份。
当前已冻结的 direct target shape 是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

`OPL` 的 hosted integration reference surface 对应：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

这说明 `RedCube AI` 的理想型是一个可被用户直接进入、也可被 `OPL` 托管调用的 visual-domain 产品 / 服务节点，而不是把仓库继续磨成 repo-local runtime，或把自己写成整个 `OPL`。
`OPL` 是 stage-led 的完整智能体运行框架，可以把 RCA 作为外部依赖 / admitted domain agent 托管；RCA 不是 OPL 内部模块。OPL 可以读取 RCA stage/action/projection descriptor，负责 queue、wakeup、handoff、receipt、approval/retry 和 operator projection；RCA 继续持有 source intake、communication strategy、visual direction、artifact creation、review/revision、package/handoff 等 stage 语义，以及 visual-domain truth、review/export gate 和 canonical artifact authority。
在这条 OPL 路线上，OPL stage-led family runtime provider 负责 provider profile/provisioning、task registration hydration、runtime status projection、doctor/repair/resume、native helper catalog 与高频状态索引；Temporal 是 production online runtime 的必需 substrate，Hermes 只在显式 hosted/proof backend、Agent executor adapter 或 proof lane 语境中出现。OPL 不持有 RedCube visual-domain truth、canonical artifacts、review-state truth、publication projection truth 或 concrete executor。
当前 stage-led 对齐已经落到 RCA-owned descriptor/projection 层：`family_action_catalog`、`stage_control_projection`、`route_equivalence`、`product sidecar export/dispatch`、`opl_runtime_manager_registration` 与 `standard_domain_agent_skeleton`。这些 surface 让 OPL 能做 discovery、typed queue、wakeup、handoff、receipt 和 operator projection；OPL 只消费 descriptor / refs，不生成 visual route、review verdict、publication projection truth 或 canonical artifact。
当前标准 OPL Agent 语义包的 canonical repo-source 已落到 `agent/`：六个 stage 的 prompt policy 在 `agent/prompts/*.md`，stage、skill、quality gate 与 knowledge 边界分别在 `agent/stages/`、`agent/skills/`、`agent/quality_gates/` 和 `agent/knowledge/`。旧 `prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 仍是真实详细 prompt assets，但它们只是 implementation/detail assets，不再作为 stage control plane 的 canonical `prompt_refs`。

## 项目目标

- 稳定独立 domain-agent 的 formal-entry、service-safe entry 与执行链路，并保持内部 `domain-agent entry -> family -> profile -> pack -> execution / deliverable truth` 边界可维护。
- 把公开定位收口为 `Foundry Agent / OPL-compatible package built on OPL Framework`，并让 app skill、service-safe domain entry、sidecar/projection 和 stage control projection 指向同一发布形态。
- 用 machine-readable contracts 与显式校验收紧 runtime mainline。
- 保持稳定 capability surface、默认 `Codex CLI` concrete executor 与 visual-domain boundary 一起对齐；hosted runtime carrier 只作为显式可选 backend，不改写默认公开合同。
- 将实现目标收敛到 `TypeScript + Python`：TypeScript 持有 product entry、CLI/MCP、contracts、domain-entry/runtime-family shell 与 typed service boundaries；Python 承担 native Office/PPT 操作、截图/导出 helper、文档/PPT 修复循环，并与 MAS/MAG 自动化生态共享工具链。
- 冻结一个可被 `OPL` 托管路径调用的 service-safe domain entry adapter，而不是先做聊天 UI。
- 落地可 direct 调用、也可由 `OPL` 通过托管集成路径调用的 lightweight domain `product entry` service surface，并把 session continuity 收到用户级 runtime-state。
- 保持 Codex App direct skill path 与 OPL 托管 path 的语义等价：两条路径都必须回到 RCA-owned route、review、artifact 和 export surface；Agent executor 是最小具体执行单位，`Codex CLI` 是当前第一公民 executor。
- 保持 `agent/` 作为 Declarative Visual Pack 的单一 canonical repo-source；packages 继续只承载 domain handler、minimal authority function、refs-only adapter 和 native helper implementation。
- 在不改写 domain 语义的前提下，继续维护 absorbed tranche、follow-on board 与 provenance。

## 非目标

- 不把 `RedCube AI` 写成通用助手或整个 `OPL` 系统。
- 不把 `RedCube AI` 写成 `OPL` 内部 workflow。
- 不把 ontology 语义和宿主包装混写。
- 不把 OPL hosted integration、provider layer 或未来 OPL sidecar 写成 RedCube truth owner、executor owner、canonical artifact owner 或 private Hermes fork。
- 不把旧 `external Hermes-Agent runtime substrate` wording、历史 `OPL Gateway` 文件名、repo-local managed runtime pilot、`status` command key 或旧 bridge wording 重新提升为默认 public entry / runtime owner。
- 不用通用 Office/PPT/Python 脚本绕过 RedCube product-entry、runtime-family route、review/export gate；Python native helper 必须挂在 RedCube route/proof lane 与 contract 下。
- 不用隐藏 fallback chain、prompt patch 或静默 profile 推断替代显式 contract。

## 默认入口

建议阅读顺序：

1. `README.md`
2. `docs/README.md`
3. `docs/status.md`
4. `docs/project.md`
5. `docs/architecture.md`
6. `docs/invariants.md`
7. `contracts/runtime-program/current-program.json`
