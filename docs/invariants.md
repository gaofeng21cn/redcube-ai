# RedCube AI 硬约束

Owner: `RedCube AI`
Purpose: `stable_invariants_and_forbidden_boundaries`
State: `current_policy`
Machine boundary: 人读硬约束。机器真相继续归 contracts、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts、artifact locator 与 RCA-owned review/export gates。

## 身份、入口与主线真相

- 对外主语固定为独立 visual-deliverable domain agent；`gateway / harness` 只作为内部架构边界语言，不成为公开第一身份。
- 当前 formal-entry matrix 固定为 `CLI`（默认正式入口）/ `MCP`（支持协议层）/ `controller`（内部控制面）。不得把 `controller` 写成公开产品入口。
- 当前默认公开 capability contract 固定为 `CLI / MCP / product-entry/service-safe-domain-entry surface + OPL/Temporal hosted scheduling + Codex-default stage execution`；任务启动后的持久在线调度、唤醒、resume、retry/dead-letter 与 attempt ledger 归 OPL/Temporal，`Codex CLI` 仍是 RCA 的最小具体 stage executor。
- OPL canonical agent id 与 package id 都固定为 `rca`。`redcube-ai` 只允许作为 repository slug、npm/Python implementation package name、Codex plugin/skill carrier id 或路径 locator；它不得作为 OPL package alias、package registry key、OCI package namespace 或 rollback identity。
- `contracts/runtime-program/current-program-parts/**` 是 current-program canonical source；`contracts/runtime-program/current-program.index.json` 是最薄 machine-readable locator / check 输入；`contracts/runtime-program/current-program.json` 已退役，不能重新生成、保留或作为 canonical / edit / check surface。`contracts/runtime-program/*.json` 继续承载 tranche / board / provenance 的机器可读真相面。`docs/active/*.md` 与 `docs/history/phase-2/*.md` 是对应人读 brief，必须与 contracts 和 tests 同步。
- repo-verified direct route 与 OPL-hosted route 必须共用同一个 downstream domain-agent entry（service-safe domain entry）。
- Codex-visible RCA plugin source 统一在 `plugins/redcube-ai/`：`plugins/redcube-ai/.codex-plugin/plugin.json` 是 canonical scaffold/source locator，skill 内容与 icon 也在该 plugin tree 下维护。仓库根层 `.codex-plugin/plugin.json`、repo-local installer、legacy `plugins/rca` 与 `plugins/redcube-ai/skills/rca` alias path 已退役，不得恢复；`.agents/plugins/marketplace.json` 不得作为 tracked source，也不得复制第二份根层 `skills/rca` 或 `assets/icon.*` 来制造 parallel skill truth。

## OPL 边界与 runtime substrate

- `OPL` 在 RCA 主线中是可外部依赖的 stage-led、以 Agent executor 为最小执行单位的智能体运行框架；它只持有 family-level session/runtime/projection 与 shared modules/contracts/indexes，不成为 RCA 第一公开身份。
- OPL hosted integration 只允许作为 OPL 侧 thin adapter/projection layer over the Temporal-backed family runtime provider；Temporal 是 OPL production online runtime 的必需 substrate，local provider 只用于 dev/CI/offline diagnostics。
- `Hermes-Agent` / `hermes_agent` 只允许指上游外部 runtime 项目 / 服务或历史 provenance；RCA active source 不得物化对应 adapter、routing config、proof backend、package、pilot、shim 或 scaffold。
- 非 Codex hosted executor、Hermes 历史材料、repo-local managed runtime pilot 与历史 runtime carrier 不得成为 RedCube visual-domain truth owner、canonical artifact owner、review/publication projection owner、scheduler kernel、session store、memory store、production provider、concrete executor 或 private fork。
- 一旦新的 runtime substrate 目标已经明确，新增投入默认服务目标形态；旧宿主只允许作为迁移桥、兼容层、回归对照或 provenance。

## RCA Domain Authority 与标准 Agent 目标

- Retry、candidate race、shape-plan preflight、review 与 repair loop 只能作为质量预算，不能作为 stage transition gate；有可消费 artifact 必须推进，并把未达标项记录为 `completed_with_quality_debt`。
- 质量债务不得生成 execution typed blocker，不得阻断后续 stage，但必须阻止 `visual_ready`、`export_ready`、handoffable、domain-ready 或 production-ready 声明。
- Hard stop 白名单仅包含 executor unavailable、权限/凭据/安全、显式人工门、不可逆动作、authority violation 与 stage identity/currentness mismatch。零/损坏/不可读 artifact 必须转成 failure/no-output diagnostic 与质量债继续推进。
- 同一 deliverable 的 image/native/HTML authoring lane 必须显式锁定；不得以 fallback 或 recovery 为由自动跨 lane。

- 当前 OPL stage-led 对齐 surface 只供 OPL discovery、queue、wakeup、handoff、receipt、retry/dead-letter 和 operator projection 使用；不得授权 OPL 生成 visual route、review verdict、publication projection truth 或 canonical artifact。
- RCA 的 executor-first policy 固定为 `codex_cli` production 默认与 `fail_closed` production route。`fallback_with_proof` 只允许 explicit `experimental_proof` lane，且必须写入 proof；不得让非默认 executor 静默回 Codex、静默替换 Codex，或被写成与 Codex 质量/行为等价。
- RCA 的目标态高于当前实现分布。旧 repo-local managed DAG、attempt/state-machine runner 和 managed-run store 已物理删除；当前 session store、workspace/source intake、memory/artifact lifecycle、review/repair transport、operator projection、CLI/MCP/product-entry/domain_action_adapter/status wrapper 或 executor adapter 只能作为 OPL generated/hosted consumer、refs-only adapter、declarative pack input、minimal authority function 或迁移输入。
- RCA 作为标准 OPL Agent 的长期形态是 `Declarative Visual Pack + OPL generated/hosted surfaces + minimal authority functions`。通用 transport、ledger、index、lifecycle、runner、session、workbench、observability、artifact/review shell、native-helper envelope、executor adapter 和 generated wrapper 必须上收到 OPL primitive / pack compiler / App shell，或收薄成 refs-only adapter / diagnostic cleanup path。
- Live Evidence 后置是 RCA 日常开发基本原则。generated/default caller cutover、repo-local session / domain_action_adapter / runtimeWatch / operator projection / neutral route-run adapter thinning、compatibility-free retirement、naming / legacy string hygiene、Stage Folder / artifact locator / review-repair transport functional boundary 和 no-resurrection guard 属于功能/结构 lane，可以不等待 Temporal controlled visual-stage long-soak、production-like repeated no-regression、真实 visual memory lifecycle receipt、human review success receipt、App/operator sustained consumption 或 production visual-stage evidence 先行关闭。后置 Live Evidence 仍是 visual ready、exportable、handoffable、human approval、production visual-stage long-soak、domain ready 和 production-ready claim 的必要验收；conformance、mock provider route chain、refs-only production acceptance、single dated sample proof 或 provider completion 不能替代。
- `TypeScript + Python` 是实现目标，不是绕过 runtime-family 的许可。Python native PPT/Office helper 必须挂在 RedCube product-entry、route/evidence lane、review/export gate 与 repo-tracked contract 下。
- 外部 PPT method/runtime 只能作为 refs-only learning source。RCA 可以把 communication mode、style 和 visualization pattern 映射到本地 declarative registry，但不得复制上游 runtime、agent protocol、template/icon/SVG body，或让 catalog coverage 成为 visual/review/export authority。
- Blind parity harness 只能返回 `pass_candidate`、`route_back_candidate` 或 `blocked`。缺少真实 same-source 双跑、至少 5 名独立盲评、完整 edit evidence、exact private identity binding、跨 viewer 人工读回和 RCA fresh owner review 时，不得生成 parity owner receipt，也不得声明 visual ready、exportable 或 production ready。
- 保留在 RCA 的私有程序面必须是无法声明化的 visual authority function：source readiness verdict、communication / visual direction decision、review/export verdict、artifact mutation authorization、visual memory accept/reject、owner receipt signer 或 native helper implementation。缺少接口、active caller、不能上收原因、receipt/blocker/ref 输出边界和 no-forbidden-write 证据时，必须作为功能/结构差距处理。
- 开发 checkout 只保存 repo source、docs、schema/contract、locator/index、receipt ref、restore/retention policy 与 authority-function descriptor。真实 workspace state、runtime artifact、receipt instance、PNG/PPTX/PDF/export bundle、临时 build/cache/venv/pycache/pytest cache/install sync 副产物必须写入 workspace/runtime artifact root 或 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
- 如果 OPL workspace initializer 在 repo checkout 根层物化 `workspace.yaml`、`workspace_*.json` 或 `shared/` resource manifest，它们只作为 workspace topology 生成物读取，必须被 `.gitignore` 与 repo hygiene 拦住，不得 track、不得作为 RCA pack compiler source truth，也不得替代 `contracts/opl_domain_manifest_registration.json`。
- `runtime/authority_functions/` 的语义只限最小 RCA authority function anchor；它不得变成 runtime artifact root、generic lifecycle engine、session store、scheduler、runner、queue、workbench、artifact gallery 或 memory body store。
- OPL 上收通用 workspace/file lifecycle primitive 后，RCA 私有 scheduler/runner/session/workbench 残留只能作为迁移输入、refs-only adapter、diagnostic 或 tombstone；不得继续定义长期结构。
- 文档和计划必须先设理想态，再找差距；差距不是妥协清单。处理清楚 active caller、替代 surface、provenance 和必要证据后，旧模块、旧接口、旧测试、旧目录、旧文案和兼容面默认删除、archive 或 tombstone。

## Legacy 退役与 forbidden surface

- 旧 `external Hermes-Agent runtime substrate` route wording、历史 `OPL Gateway` 文件名、repo-local managed runtime pilot、`status` command key 与旧 bridge wording 只能作为 migration provenance、internal integration contract 或 tombstone 语境；active surface 必须以 direct route / service-safe domain entry / RCA domain handler target / OPL-generated `domain_action_adapter` descriptor / stage descriptor / OPL-hosted handoff parity 为准。
- 已物理删除的旧 repo-local deliverable runner、run store、DAG scheduler、managed helper/types 和 public managed action handler 不得以兼容别名、diagnostic fixture 或 standard domain_action_adapter template 名义恢复。
- 已退役的 active 接口不保留兼容别名：`REDCUBE_WORKBENCH_ROOT`、standalone upstream Hermes probe script、`GatewayActionMap` / `getCliGatewayActions`、`callGatewayTool` / `listGatewayTools` / `GatewayTool*`、`source_workbench*`、retired public entry / federation / product frontdesk / source-pack-federation 等旧入口不得重新进入源码、测试、contracts 或 package surface。
- 若历史合同名仍带 `managed`，只能按 provenance / semantic-id 迁移处理，不能解释成 active runtime owner。仍被合同引用的旧文档只能作为 provenance 原位保留。
- Python / native helper 验证必须把 bytecode、pytest cache、`uv sync` project venv 和安装/同步副产物导向仓库外部；开发 checkout 不应产生 `.venv`、`__pycache__`、`.pytest_cache` 或 `*.egg-info` 副产物。

## 文档治理

- `AGENTS.md` 只管工作方式，不堆项目事实；核心项目知识优先收敛到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md`。
- `docs/**` 是中文内部开发与维护参考；稳定路径优先使用无语言后缀 `.md` 承载中文 canonical 内容。根层 `README*` 是否保留公开双语入口，由产品分发和 public 需求单独决定。
- `README*` 与 `docs/README*` 必须先写 RCA 的视觉交付身份，再写 OPL 托管 / 内部集成路径。
- 含有旧 gateway、bridge、harness、旧 Hermes 优先口径或 OPL-first 口径的文档，若仍被 `human_doc:*` 或 runtime-program 合同引用，留在原生命周期层并补充 lifecycle/provenance 说明；无合同引用且不服务当前 baton 的旧计划进入 `docs/history/` 或 tombstone 语境。
- 开发计划 closeout 必须显式列出 `planned`、`done`、`deferred`、`skipped`、`verification`、`commit-push state`；`deferred` 必须可追溯到合同引用、真实 blocker 或明确 history/tombstone 落点。
- 一步到位或并行 lane closeout 必须优先落 machine-readable closeout contract，再由 `docs/**` 做人读解释；测试可以断言合同字段与行为面，不得断言 Markdown 文案。
- 理想态差距和开发计划必须按目标态拆分 `功能/结构差距` 与 `测试/证据差距`；现有通用功能面应由 OPL 承担时，即使可运行，也写成功能/结构差距。
- Live Evidence、production evidence、visual-stage long-soak、production-like repeated no-regression、真实 visual memory lifecycle receipt、human review / export success receipt、App/operator sustained consumption 和 artifact-producing owner receipt 默认进入后置 `测试/证据差距` / readiness lane；只有它们直接保护 visual authority、artifact mutation、owner receipt、typed blocker、human gate、closeout admission 或 production claim 时，才可阻塞对应动作。
- `当前实际` 只能作为迁移起点、风险和证据来源；不得反向约束理想态，不得把现有私有实现包装成长期设计。

## 本地状态

- 项目级 `.codex/`、`.omx/` 与 `.runtime-program/` 已退役，不再作为当前 workflow 入口。
- 本地 session、prompt、log、report 或 hook 状态统一迁入用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
