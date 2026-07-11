# RedCube AI 项目概览

Owner: `RedCube AI`
Purpose: `current_project_role_and_boundary`
State: `current_truth`
Machine boundary: 人读项目概览。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

## 项目是什么

`RedCube AI` 是独立持有视觉领域语义与交付权威、但由 OPL 安装、注册和运行的 visual-deliverable Foundry Agent；它不是独立应用或独立 runtime。
对外产品入口由 OPL 托管；repo-local CLI、service-safe domain entry 与 RCA `domain-handler export|dispatch` 只作为 OPL 可调用的开发和领域 target，不构成第二套安装或最终用户入口。RCA manifest / lock 不声明 OPL Framework implementation dependency，Temporal 与通用 Framework 依赖只由 OPL 安装维护。
机器可读 `series_design_profile` 不再由 RCA 仓复制或维护。`contracts/foundry_agent_series.json` 是 OPL Foundry policy 的 RCA thin consumer，`contracts/domain_descriptor.json` 只保留 domain-specific profile / refs anchor：RCA 的视觉资料、品牌资产、图片、文档和交付 brief 输入，以及 PPT/PDF/PNG/export bundle/handoff refs 输出，记录在 `visual_domain_delta_refs`、`domain_specific_profile`、`agent/` 和 RCA-owned authority refs 中。OPL 持有 canonical OPL Agent lifecycle、generic input/output slots、stage pack sections、closeout shape、generated descriptors、provider-backed runtime、stage attempts、queue/wakeup、retry/human gate、receipt ledger 与 App/workbench shell；RCA 继续持有 visual truth、route truth、review/export verdict、artifact authority、visual memory accept/reject 和 owner receipt。
当前可执行基线已经按三层边界收口：对外默认稳定 capability surface 是 `redcube-ai app skill / CLI / MCP / invokeDomainEntry / invokeProductEntry / 本地脚本 / repo-tracked contracts`；默认 product-entry runtime owner 是 `configured_family_runtime_provider`，RCA 返回 OPL stage execution plan 与 domain authority refs，任务启动后的持久在线调度、唤醒、resume、retry/dead-letter、generic executor selection、stage attempt runtime / attempt ledger 归 OPL/Temporal provider；本地 `Codex CLI` 是 RCA 唯一物化的 concrete stage executor。`Hermes-Agent` 相关路径只保留为上游 external runtime provenance 或技术参考。
当前入口真相是：`redcube-ai` app skill、`CLI / MCP` 已经构成可验证的 `agent entry`，同时 repo-verified 的轻量 `product entry` service surface 也已落地；`status` 在这里仅指面向 agent 的 product-entry overview / intake / entry-shell contract。repo-local `redcube product` CLI 当前只保留 `invoke` 作为 direct domain target；product status / session / manifest wrapper 由 OPL generated/default caller 持有。真正面向最终用户的成熟 GUI / WebUI / App shell 仍未落地。
当前统一协作模型是：`RedCube AI` 自己继续负责 domain authority、review / publication projection 与 visual-domain truth；stage attempt runtime、queue/wakeup、attempt ledger、generated shell 与 operator/workbench 归 OPL/Temporal，具体 deliverable 的执行器保持可插拔，`Codex CLI` 是默认 concrete stage executor，而非默认 executor / proof adapter 只作为显式附加层挂在同一套 contract 之下。
`gateway / harness` 在本仓继续作为内部架构边界语言，不作为仓库对外第一身份。
当前已冻结的 direct target shape 是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

`OPL` 的 hosted integration reference surface 对应：

`User -> OPL Product Entry -> OPL stage-led family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

这说明 `RedCube AI` 的理想型是一个可被用户直接进入、也可被 `OPL` 托管调用的 visual-domain 产品 / 服务节点，而不是把仓库继续磨成 repo-local runtime，或把自己写成整个 `OPL`。
`OPL` 是 stage-led 的完整智能体运行框架，可以把 RCA 作为外部依赖 / admitted domain agent 托管；RCA 不是 OPL 内部模块。OPL 可以读取 RCA stage/action/projection descriptor，负责 queue、wakeup、handoff、receipt、approval/retry 和 operator projection；RCA 继续持有 source intake、communication strategy、visual direction、artifact creation、review/revision、package/handoff 等 stage 语义，以及 visual-domain truth、review/export gate 和 canonical artifact authority。
在这条 OPL 路线上，OPL stage-led family runtime provider 负责 provider profile/provisioning、task registration hydration、runtime status projection、doctor/repair/resume、generic executor selection、attempt ledger、native helper catalog 与高频状态索引；Temporal 是 production online runtime 的必需 substrate。RCA 只物化 Codex concrete executor，历史 Hermes 材料不构成 active adapter/proof backend。OPL 不持有 RedCube visual-domain truth、canonical artifacts、review-state truth、publication projection truth 或 RCA concrete executor。
当前 stage-led 对齐已经落到 RCA refs-only descriptor/projection 层：product-entry manifest 仍可投影 `family_action_catalog`、`family_stage_control_plane`、`route_equivalence`、`domain-handler export|dispatch`、OPL-generated `domain_action_adapter` descriptor refs、`opl_runtime_manager_registration`，以及 artifact locator、domain memory locator、owner receipt、guarded action target、visual transition 和 no-forbidden-write proof 等 explicit domain authority refs；OPL standard skeleton mapping / runtime shell / workbench shell 归 OPL generated/hosted surface。RCA root `contracts/action_catalog.json` 现在也是 OPL `family-action-catalog.v1` 标准输入，只把 RCA domain handler targets、supported generated surfaces 和 authority boundary 作为 catalog metadata 表达，不再保留旧 RCA 私有 action-target 第二形状。Stage refs、pack refs 和 authority refs 继续由对应 root contracts 持有，不复制 OPL generic control-plane / pack-compiler body。这些 surface 让 OPL 能做 discovery、typed queue、wakeup、handoff、receipt 和 operator projection；OPL 只消费 descriptor / refs，不生成 visual route、review verdict、publication projection truth 或 canonical artifact。
当前标准 OPL Agent 语义包的 canonical repo-source 已落到 `agent/`：六个 stage 的 prompt policy 在 `agent/prompts/*.md`，stage、skill-policy、quality gate 与 knowledge 边界分别在 `agent/stages/`、`agent/skills/`、`agent/quality_gates/` 和 `agent/knowledge/`。旧 `prompts/ppt_deck/` 与 `prompts/xiaohongshu/` 仍是真实详细 prompt assets，但它们只是 implementation/detail assets，不再作为 stage control plane 的 canonical `prompt_refs`。

RCA 当前把 stage prompt、professional specialist skill、tool/helper 分成三层，不再把所有 prompt、policy 和工具都叫 skill：

- Stage prompt 是 stage operating surface：`agent/prompts/*.md` 说明这一 stage 应该做什么、读取哪些 source / prior stage refs、返回哪些 receipts / refs / typed blockers / repair targets；它不沉淀跨 stage 的专业方法，也不物化文件。
- Professional specialist skill 是可复用的专业方法层：story architecture、visual direction、page authoring、review、native PPT design、template profiling 等方法可被多个 stage 调用。RCA professional skills 先作为 repo-local 能力沉淀，不创建新的外部 repo、外部产品或第二套 public skill。
- Tool/helper 是 materialization / validation / export surface：Codex-native imagegen、screenshot/render、Office / PPT helper、manifest / locator / export helper 只负责生成、渲染、校验、导出和记录 refs；工具不是 skill，也不能替代 RCA review/export verdict。
- 旧 `agent/skills/*.md` 是 Declarative Visual Pack 里的 stage skill policy refs，用来约束 stage 如何使用 authoring policy、helper 和 memory policy；它们不是可单独安装或对外暴露的 Codex professional skills。

Native PPT 的 external learning 也服从这三层：pinned `ppt-master` 只作为 pattern source，communication/style/visualization ids 映射到 RCA declarative registries 和现有 professional skills；typed native object、presentation semantics、package readback、editability runner 和 blind parity evaluator 继续归现有 helper/test/contract surface。当前这些能力是 non-live landed；真实同源盲评、跨 PowerPoint/LibreOffice/Keynote 或 Google Slides 的 fresh 人工读回、owner receipt 与 visual ready 仍是后置 evidence/authority lane。

## 项目目标

- 稳定独立 domain-agent 的 formal-entry、service-safe entry 与执行链路，并保持内部 `domain-agent entry -> family -> profile -> pack -> execution / deliverable truth` 边界可维护。
- 把公开定位收口为 `Foundry Agent / OPL-compatible package built on OPL Framework`，并让 app skill、service-safe domain entry、RCA domain handler target、OPL-generated `domain_action_adapter` descriptor/projection 和 stage control projection 指向同一发布形态。
- 用 machine-readable contracts 与显式校验收紧 runtime mainline。
- 保持稳定 capability surface、默认 OPL/Temporal 托管调度、默认 `Codex CLI` concrete stage executor 与 visual-domain boundary 一起对齐；非默认 executor / proof adapter 只作为显式可选 backend，不改写默认公开合同。
- 将实现目标收敛到 `TypeScript + Python`：TypeScript 持有 product entry、CLI/MCP、contracts、domain-entry/runtime-family shell 与 typed service boundaries；Python 承担 native Office/PPT 操作、截图/导出 helper、文档/PPT 修复循环，并与 MAS/MAG 自动化生态共享工具链。
- 冻结一个可被 `OPL` 托管路径调用的 service-safe domain entry adapter，而不是先做聊天 UI。
- 落地可 direct 调用、也可由 `OPL` 通过托管集成路径调用的 lightweight domain `product entry` service surface，并把 session continuity 收到用户级 runtime-state。
- 保持 Codex App direct skill path 与 OPL 托管 path 的语义等价：两条路径都必须回到 RCA-owned route、review、artifact 和 export surface；Agent executor 是最小具体执行单位，`Codex CLI` 是当前第一公民 executor。
- 保持 `agent/` 作为 Declarative Visual Pack 的单一 canonical repo-source；packages 继续只承载 domain handler、minimal authority function、refs-only adapter 和 native helper implementation。
- 在不改写 domain 语义的前提下，继续维护 current owner docs；已吸收 tranche、旧 follow-on board 和 provenance 归 `docs/history/**` 读取，不作为当前 board 入口。

## 非目标

- 不把 `RedCube AI` 写成通用助手或整个 `OPL` 系统。
- 不把 `RedCube AI` 写成 `OPL` 内部 workflow。
- 不把 ontology 语义和宿主包装混写。
- 不把 OPL hosted integration、provider layer 或未来 OPL domain_action_adapter 写成 RedCube truth owner、executor owner、canonical artifact owner 或 private Hermes fork。
- 不把旧 `external Hermes-Agent runtime substrate` wording、历史 `OPL Gateway` 文件名、repo-local managed runtime pilot、`status` command key 或旧 bridge wording 重新提升为默认 public entry / runtime owner。
- 不用通用 Office/PPT/Python 脚本绕过 RedCube product-entry、runtime-family route、review/export gate；Python native helper 必须挂在 RedCube route、evidence lane 与 contract 下。
- 不用隐藏 fallback chain、prompt patch 或静默 profile 推断替代显式 contract。

## 默认入口

建议阅读顺序：

1. `README.md`
2. `docs/README.md`
3. `docs/status.md`
4. `docs/project.md`
5. `docs/architecture.md`
6. `docs/invariants.md`
7. `contracts/runtime-program/current-program.index.json` 与 `contracts/runtime-program/current-program-parts/**`
