# RedCube AI 仓库协作规范

## 适用范围

本文件适用于仓库根目录及其所有子目录；若更深层目录存在 `AGENTS.md`，以更近者为准。

## 定位

- `AGENTS.md` 只约束工作方式、少量稳定身份边界和文档生命周期纪律，不承载项目知识细节或阶段完成判断。
- 用户级 `~/.codex/TASTE.md` 记录 OPL family 共享维护开发偏好；进行架构、代码、文档、测试、review、cleanup 和 closeout 判断时，先按用户级 taste 校准，再读取 RCA 事实、contracts、docs 与源码。
- 项目知识默认从 `README*`、`docs/README*`、`docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md` 读取。
- `RedCube AI` 是独立 visual-deliverable domain agent，也可以作为 `OPL` stage-led 智能体运行框架中的 admitted domain agent 被托管。`Stage` 表示大型视觉交付步骤，Agent executor 是 stage 内最小执行单位；`Codex CLI` 是当前第一公民 executor，其他 executor adapter 只能显式接入且不承诺行为效果等价。RCA 持有 visual truth、layout/review/export verdict、route owner、artifact authority、visual memory accept/reject authority 和 owner receipt；通用 runtime、queue、attempt ledger、state-machine runner、workspace/source intake shell、artifact gallery/handoff shell、review/repair transport、native-helper envelope、memory locator 与 App/workbench shell 归 OPL Framework / shared family layer。
- RCA 的理想形态是标准 OPL Agent：`Declarative Visual Pack + OPL generated/hosted surfaces + minimal authority functions`。当前仓内已存在的 managed DAG、attempt/state-machine runner、session store、workspace/source intake、memory/artifact lifecycle、review/repair transport、operator projection、CLI/MCP/product-entry/domain_action_adapter/status wrapper 只能作为迁移输入；不能因为已有 active caller 就写成长期合理私有平台。
- `agent/primary_skill/SKILL.md` 是标准 OPL Agent 的 canonical rich primary skill；`plugins/<agent>/skills/<agent>/SKILL.md` 是 Codex plugin 安装要求的 materialized full-skill carrier mirror。该关系以 `contracts/capability_map.json` 中的 `carrier_projection_contract` 为机器权威；两者字节相同表示同步健康，不表示应删除重复，mirror 漂移才是问题。
- OPL canonical agent/package id 都固定为 `rca`；`redcube-ai` 只作为 repo slug、语言实现包名和 Codex plugin/skill carrier locator，不得作为第二个 package identity 或 compatibility alias。
- 文档和开发计划先设理想态，再找差距；差距不是妥协清单。为了标准 OPL Agent 目标态，可以革命式重构 RCA 并完全抛弃旧模块、旧接口、旧测试、旧目录和旧文案，不以兼容为理由保留历史污染面。
- `gateway / harness` 只作为仓内边界层、执行层或历史语境保留；对外第一身份是 RedCube AI visual-deliverable domain agent。
- 若文档提到 `Hermes-Agent`，只能指上游外部 runtime 项目 / 服务；仓内自写的 runtime package、pilot、shim 或 scaffold，不得写成“已接入 Hermes-Agent”。
- 当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
- 关键 durable surface 继续围绕 `program_id`、`topic_id`、`deliverable_id` 与 OPL-owned `run_id` refs 收口；`auditDeliverable`、`getReviewState`、`getPublicationProjection` 持有 RCA review/projection truth，`runtimeWatch` 只返回 visual review/artifact/blocker/owner evidence refs。

## 开发原则

- 第一优先级：保持 `domain-agent entry -> family -> profile -> pack -> execution / deliverable truth` 的正式控制链路。
- 第二优先级：优先 machine-readable contract、显式校验和 hydrated execution，而不是 prompt-only intent。
- 第三优先级：在不改写 domain 语义的前提下，继续维护同一 mainline 的 absorbed tranche、follow-on board 与 provenance。
- repo-tracked 源码与测试默认都应保持文件边界清晰，优先控制在 `1000` 行以内；超过 `1500` 行应视为明确的拆分信号，而不是继续堆叠实现。
- 新增能力或继续重构时，优先采用稳定薄入口加 `parts/`、`cases/`、`modules/` 等子模块拆分；不要把新逻辑继续堆回单个超长文件。
- 一旦新的 runtime substrate 目标已经明确，新增投入默认服务目标形态；旧宿主只允许作为迁移桥、兼容层或回归对照存在。
- 私有功能面是例外而不是默认。保留在 RCA 的程序面必须是 source readiness、communication/visual direction、review/export verdict、artifact mutation authorization、visual memory accept/reject、owner receipt signing 或 native helper implementation 这类无法声明化的最小 authority function，并写清接口、active caller、不能上收原因、receipt/blocker/ref 输出边界和退役门。
- 已被当前 owner surface 替代的模块、接口、CLI alias、wrapper、facade、聚合测试和文档入口，默认迁移 active caller 后直接退役；需要来龙去脉时只保留 history/tombstone/provenance，不新增 compatibility shim、re-export facade、别名或兼容测试。
- 不做降级处理、兜底补丁、启发式修补或“先糊住再说”式实现。

## 文档分层与生命周期治理

- `README*` 与 `docs/README*` 是默认公开入口。
- `docs/project.md`：项目概览与产品角色。
- `docs/architecture.md`：核心链路与结构边界。
- `docs/invariants.md`：硬约束与不能破坏的边界。
- `docs/decisions.md`：仍有效的关键决策与取舍。
- `docs/status.md`：当前默认入口链路、执行口径、验证口径与历史索引。
- `docs/docs_portfolio_consolidation.md` 是当前文档组合治理入口；维护者应先读核心五件套，再按该文件判断新增、更新、归档或 tombstone。
- 每份长期文档都必须能说明 `owner`、`purpose`、`state`、`machine boundary`；缺少任一信号时，先补入口或归位，再继续扩写。
- 文档治理按内容生命周期判断，文件名和目录名只作为辅助信号；同一文档内的当前事实、active baton、absorbed tranche、support reference、legacy brief 和历史计划应分别归入当前 owner doc、active/reference 层或 history/tombstone 语境。
- 入口文档应先呈现当前状态、层级、新旧关系和下一跳；旧 gateway / bridge / harness / Hermes-first 材料进入 internal integration、provenance 或 tombstone 语境。
- `AGENTS.md` 只保留协作方式、硬约束和少量稳定身份边界；项目事实的完整当前态以 `docs/status.md`、`docs/project.md`、`docs/architecture.md`、`docs/invariants.md`、`contracts/runtime-program/current-program.index.json` 和 `contracts/runtime-program/current-program-parts/**` 为准。
- `docs/product/`：product entry、quickstart、operator handoff、profile 设置与发布协作。
- `docs/runtime/`：runtime topology、executor / substrate、service-safe entry、watch / projection 语义说明。
- `docs/delivery/`：交付物 family、route、proof 环境、示例与人工验证材料。
- `docs/source/`：source readiness、augmentation、research trigger / gate 与 source truth 消费说明。
- `docs/active/`：当前执行、当前计划、当前差距、contract-linked active baton 与 closeout evidence；旧 `docs/program/` active baton 目录已物理退役，新增 recurring active material 不再进入旧目录。
- `docs/public/`：public narrative index；当前较薄，除非未来有真正公开材料，否则保持索引职责。
- `docs/specs/`：当前仍有效的技术规格索引；不扩成杂物层。
- `docs/history/phase-2/`：已吸收 Phase 2 tranche、prefrozen follow-on board 与 provenance brief；旧 `docs/program/phase-2/` 已迁入 history。
- `docs/history/hermes/`：upstream Hermes proof / cutover provenance；旧 `docs/program/` 下 Hermes 记录已迁入 history。
- `contracts/runtime-program/current-program.index.json` 与 `contracts/runtime-program/current-program-parts/**`：当前机器可读主线合同与 active baton 指针。
- `contracts/runtime-program/*.json`：机器可读主线合同。
- `docs/policies/*`：稳定规则。
- `docs/references/*`：定位、背景、审计、target-state 与维护者实践参考。
- `docs/history/`：repo-tracked 历史 provenance、归档过程记录与不再服务当前 baton 的历史计划。

## 文档规则

- `docs/**` 默认只维护中文 canonical 内容；稳定路径优先使用无语言后缀 `.md`。
- 根层 `README*` 是否保留公开双语入口，由产品分发和 public 需求单独决定。
- narrative 规则放根 `AGENTS.md`、`docs/README*` 与核心五件套；machine-readable contract 放 `contracts/runtime-program/*.json`。
- 新文档先判断角色，再决定落点；不要把核心知识、program brief、参考材料和历史记录混在同一层。
- `README*`、`docs/**` 与参考文档是人读面。代码、测试、contracts、dashboard 或 runtime 不得把 prose path、Markdown 章节或文案当成稳定机器接口；确需关联人读材料时，使用 contract/schema/source 路径或 `human_doc:*` 语义 ID。

## 变更与验证

- 保持 diff 小、可审查、可回退。
- 能删就别加；能复用现有模式就别新起抽象。
- 没有明确必要不要新增依赖。
- 修改 formal-entry、execution handle、runtime mainline、program brief 路径、测试命令或 CI 分层时，必须同步改 README、docs、contracts 与相关测试。
- 叙述性 `README*`、`docs/**` 和参考文档不作为脚本/测试的断言对象；可以测试 machine-readable contract、schema、CLI/API 行为、生成产物结构与路径，但不要用测试固定文档措辞、章节或状态文案。
- 默认最小验证入口是 `scripts/verify.sh`。
- 默认 smoke 是 `npm test` / `npm run test:smoke`；`npm run test:fast` 是显式标准本地入口，不作为裸 `npm test` 的默认成本。
- `meta`、`integration`、`e2e` 是 `scripts/verify.sh <lane>` / `scripts/verify-lane.ts <lane>` 显式 lane，不再额外暴露 npm alias；`npm run test:historical` 保留为 contract-bound 显式 lane。
- `npm run test:full` 是 clean-clone 基线。
- `scripts/run-test-group.ts` 是默认 Node 测试分组入口；它必须给所有 Python native helper 子进程注入仓外 cache 环境。新增直接启动 Python 的测试或脚本时，必须显式继承 `PYTHONDONTWRITEBYTECODE`、`PYTHONPYCACHEPREFIX`、pytest 仓外 `cache_dir` 和仓外 project venv 路径，不得把 `.venv`、`__pycache__`、`.pytest_cache` 或 `*.egg-info` 写回开发 checkout。
- plan-closeout 必须显式列出 `planned`、`done`、`deferred`、`skipped`、`verification`、`commit-push state`；任何 `deferred` 项都要写成可检索 backlog，不得让计划项静默消失。

## 并行开发与工作树

- 大改动、长链路工作、并行多 AI 开发，默认先从最新 `main` 开独立 worktree，再在 worktree 内实现和验证。
- 共享根 checkout 只用于轻量阅读、评审、吸收验证后提交、push 和清理，不应长期承担重型实现。
- 新 lane 开始前先清理用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/sessions/*`、tmux session 与 stale `skill-active` 状态。
- worktree 内实现和验证完成后，应尽快吸收回 `main`，并清理对应 worktree、分支与临时状态。

## 本地状态

- 项目级 `.codex/` 与 `.omx/` 已退役，不再作为仓库本地状态入口。
- 项目级 `.runtime-program/` 已退役，不再作为仓库本地控制面。
- 本地 session、prompt、log、report 与 hook 状态统一迁入用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/`。
- 任何机器私有 overlay 也只允许放在用户级 runtime-state 根目录下，不进入 repo-tracked 主线。
- Native PPT 测试使用 `tests/helpers/test-workspace.js` 创建用户级 `$CODEX_HOME/projects/redcube-ai/runtime-state/test-workspaces/` 临时 workspace，以避开 macOS `/private` 授权循环；测试 workspace 必须写入 `.redcube-test-workspace.json` marker，并由 helper 默认清理本进程创建项与过期 marker 目录。需要保留失败现场时显式设置 `REDCUBE_TEST_WORKSPACE_KEEP=1`；不要绕过 helper 直接向该目录长期写入。

<!-- OPL_FLOW_MANAGED_START -->
OPL Flow managed surface: repo_agent_instructions
Plugin: opl-flow
Plugin version: 0.1.7
Profile pointer: contracts/opl-native-profile.json
本块只声明 OPL Flow 工作流 profile 指针；repo-specific 规则、项目事实、contracts、source、tests 和 runtime 输出继续归本仓既有 owner。
请只通过 OPL Flow repo_profile sync 更新本块；本块外内容由目标 repo 自己维护。
<!-- OPL_FLOW_MANAGED_END -->

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->
