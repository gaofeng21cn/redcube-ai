# RedCube AI

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

<p align="center"><strong>帮助专家把知识稳定做成正式视觉成果</strong></p>
<p align="center">幻灯片 · 小红书笔记 · 海报</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>面向谁</strong><br/>
      希望把知识稳定交付为视觉成果的专家、PIs 与专业团队
    </td>
    <td width="33%" valign="top">
      <strong>控制什么</strong><br/>
      交付质量、审阅节奏、阶段约束，以及从草稿到导出的收口过程
    </td>
    <td width="33%" valign="top">
      <strong>最终产出</strong><br/>
      面向讲授、汇报、传播与发布的高质量视觉交付物
    </td>
  </tr>
</table>

> `RedCube AI` 的目标，是帮助专家把结构化知识稳定做成正式视觉交付物，并让整个过程可审阅、可重跑、可导出。
> 在统一口径下，它是共享 `Unified Harness Engineering Substrate` 上的视觉交付 `Domain Harness OS`。

## 产品定位

如果你的目标，是把知识稳定地交付成正式的视觉成果，那么 `RedCube AI` 提供的是一条可治理、可审阅、可重跑的交付主线。

它的重点是把视觉交付这件事组织成正式生产线。

当前这条 runtime 叙事已经不再只是 repo-local。
`RedCube AI` 现在已经冻结了真实上游 `Hermes-Agent` activation proof，并把 `runDeliverableRoute` 与 managed execution 的 run surface 切到上游 `Hermes-Agent` API server。
今天可执行的基线因此变成：

- route / managed execution 的 run surface 由上游 `Hermes-Agent` 主责
- visual-domain truth、audit、review、export 与 deliverable state 继续由 `RedCube AI` 主责
- reachable upstream gateway / API server 是硬前提；缺失时整条 cutover fail-closed

因此，仓里保留的 `Hermes` 历史命名仍然只是 absorbed artifact / compatibility material，不再单独承担 runtime owner 证明。

这一步对应的仓库级 activation gate 仍是 `upstream-hermes-agent-activation-package`，probe 命令是 `node scripts/probe-upstream-hermes-agent.mjs --json --require-run-surface`。
给 future `OPL Gateway` 调用的 service-safe adapter shell 则冻结为 `redcube_service_safe_domain_entry`，对应合同在 `contracts/runtime-program/service-safe-domain-entry-adapter.json`。
如果本机全局 `hermes` CLI 仍落后于上游 gateway 启动修复，live verification lane 可以显式设置 `REDCUBE_HERMES_GATEWAY_COMMAND` 指向已知良好的 upstream 启动命令，而不是把这个仓误写成已经把 Hermes 本地修好了。
这条 override 只负责修正“启动的是哪份 upstream checkout”，并不能掩盖 `/v1/runs/{run_id}/events` 这类 upstream run-surface 自身失败。
同一组 live lane 现在还会冻结 `REDCUBE_PYTHON_COMMAND` 给 screenshot review / export helper 使用；如果没有显式设置，`scripts/run-test-group.mjs` 会先执行 `python3 -c "import sys; import playwright; print(sys.executable)"` 去探测带 Playwright 的 Python，找不到就直接 fail-closed。

`Codex-default host-agent runtime` 当前承担本地 operator / development host 的角色。
当前 formal-entry matrix 已固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`。
当前仓内已实现且可验证的公开正式入口是 `CLI` 与 `MCP`；`controller` 继续承担内部控制面角色。
当前仓库主线按 `Auto-only` 理解；如果未来要做 `Human-in-the-loop` 产品，应作为兼容 sibling 或 upper-layer product 复用同一 substrate。
只要保持同一套 substrate contract 与 domain boundary，后续可以迁移到托管 web runtime，而不改变本项目的 domain 身份。

## 入口分层与产品边界

当前仓内已经 repo-verified 的入口包含 `operator entry`、`agent entry`，以及一层薄的 service-level `product entry`，也就是说：

- `operator entry`：给人类操作同事使用的命令、workspace 准备、调试、审阅和导出控制面
- `agent entry`：由 `Codex` 或其他 host-agent 调用的 `CLI + MCP`
- `product entry`：direct RedCube entry 与 OPL federation 的可调用服务面已经落地，但真正面向最终用户的成熟前台壳仍未落地

现在仓内已经通过 `redcube product` 这一组命令落下一层 repo-tracked 的 lightweight product-entry shell。
当前 repo-verified 的公开面包括：`redcube product invoke`、`redcube product federate`、`redcube product session` 与 `redcube product manifest`。
其中 `redcube product manifest` 是当前壳的 machine-readable discovery surface：它会冻结 direct / federated / session 这三类入口面，但不会把仓库写成“成熟最终用户前台已经落地”。

这个仓已经冻结的 direct domain 产品入口路线是：

`User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

而在 `OPL` 家族级入口里，顶层路线也必须收敛到同一条下游形态：

`User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

这条目标路线现在已经冻结在 `docs/program/upstream_hermes_agent_final_target_shape.md` 与 `contracts/runtime-program/upstream-hermes-agent-final-target-shape.json`。
当前 repo-verified 的 `product entry` service surface 已经包括 `invokeProductEntry`、`invokeFederatedProductEntry`、`getProductEntrySession` 以及对应的 `CLI` / `MCP` wrapper。
仍需诚实说明的是：成熟的最终用户 `product entry` 前台壳并未落地；这次落地的是可调用服务面与 session continuity，不是聊天 UI 或托管 Web 前端。
当前 live `integration` / `e2e` / `full` verification 也会用 `--test-concurrency=1` 串行化 Node test files，避免仓库把上游 Hermes 当前的 concurrent-run ceiling 打爆，再把 429 误报成 domain drift。
同一组 live lane 现在还带着一条显式 Python-helper contract：screenshot review 与 export helper 必须通过 `REDCUBE_PYTHON_COMMAND` 或自动解析出的 Playwright Python 执行，而不是默认假设 upstream Hermes 自己的 virtualenv 已经装好了 Playwright。

这条 handoff 至少应共享一套最小 envelope：

- `target_domain_id`
- `task_intent`
- `entry_mode`
- `workspace_locator`
- `runtime_session_contract`
- `return_surface_contract`

在这层共享 envelope 之上，`RedCube AI` 再补充视觉交付特有 payload，例如 `deliverable_family`、`topic_id`、`deliverable_id`。
这层共享 envelope 现在已经能通过 `redcube product` 这组入口做 repo-verified 输出：`redcube product manifest` 负责发现当前壳，`invoke / federate / session` 负责实际调用。

内部参考说明见：[轻量产品入口与 OPL Handoff](docs/references/lightweight_product_entry_and_opl_handoff.md)。

当前主线还冻结了一套明确的执行句柄与持久表面合同：

- `program_id`：active mainline 的 control-plane 指针
- `topic_id`：canonical source truth 与 publication projection 所属的 topic 聚合根身份
- `deliverable_id`：review、export 与 delivery contract 所绑定的持久交付物身份
- `run_id`：单次 routed delivery execution 的 per-run 执行句柄
- `auditDeliverable` / `runtimeWatch`：当前 canonical audit / watch 表面
- `getReviewState` / `getPublicationProjection`：当前 canonical review / projection 表面

## 它能帮你做什么

- 把课程内容、学术材料、行业知识和专业观点组织成正式的 `幻灯片`
- 把结构化知识整理成 `小红书笔记`，用于科普传播、知识发布和系列内容输出
- 产出 `海报`，作为比幻灯片更便于传播、比社交内容更结构化的单页视觉交付物
- 在同一条受控流程里完成审阅、重跑、导出与交付收口

## 当前可用的交付物

| 交付物 | 当前状态 | 典型场景 |
| --- | --- | --- |
| `幻灯片` | 已稳定可用 | 课程讲义、学术报告、正式汇报、内部简报 |
| `小红书笔记` | 已稳定可用 | 知识传播、科普图文、系列内容发布 |
| `海报` | 部分完成 | 当前海报能力主要对应 `知识海报`；面向论文或会议的学术海报仍在完善 |

这里要明确一个边界：

- 幻灯片和小红书笔记，是当前两条已经稳定可用的主线
- 海报能力已经接入，但目前主要是 `知识海报`
- 面向论文或会议的 `学术海报` 还没有完全做完

## 为什么它存在

很多生成工具可以快速给你一版内容，但不擅长控制最终交付质量。

`RedCube AI` 的优先级不一样：

- 先判断这次交付到底要服务谁，再组织最终成果
- 先把阶段顺序、审阅节点和导出要求明确下来
- 先保留可审计的中间状态，再谈最后导出的文件
- 让智能代理承担执行，让人类保留关键接受与否的判断权

## 适合什么场景

如果你经常遇到下面这些场景，`RedCube AI` 就适合你：

- 你已经有原始材料，需要把它们收口成正式视觉交付物
- 你不想在 PPT、图文发布、导出和审阅之间来回切换多套工具链
- 你希望交付过程可以复查、可重跑，并形成稳定的返工与收口机制
- 你希望智能代理多做执行，但关键质量判断仍由专家自己把关

## 最快开始方式

如果你是医生、教授、PI、内容负责人或专业团队成员，最快的使用方式是把目标、受众、材料和约束清楚地交给你的智能代理，再让它带着 `RedCube AI` 推进。

通常只需要三步：

1. 准备一个独立工作区，把材料放进去。
   这个目录可以直接是一个全新的 workspace；你不需要手工搭完整结构，Codex / Agent 可以在里面按 canonical workspace contract 初始化 `redcube.workspace.json`、`topics/`、`runtime/`、`publish/` 等目录。
2. 告诉智能代理这次要做的是 `幻灯片`、`小红书笔记` 还是 `海报`，以及面向谁、最终要达到什么目标。
3. 让智能代理使用 `RedCube AI` 推进这次视觉交付，并由你审核关键节点。

如果你想更快开始，可以直接给智能代理一句话指令。

`Deep Research` 属于 `Source Readiness`。输入材料太薄时，Agent 应先把 Step 1 固定在 canonical `source intake -> source augment -> source execute-augmentation` 这条链路上，再进入后续交付步骤。
`planning_ready` 必须成为 `Source Readiness` 内部正式、可机读的放行 gate。

如果你想先用一个共享正式入口，而不是自己逐步调用每个子命令，那么可以直接从 `source research` 开始。
它就是 Step 1 的统一 orchestration surface：先执行 `source intake`，然后根据当前 route 决定是停在 canonical result staging，还是继续执行 augmentation。

如果你走的是 `result_file` / Agent-native route，也可以把 Step 1 更明确地展开成：

`source intake -> source augment -> source prepare-augmentation-result -> source write-augmentation-result -> source execute-augmentation`

这保持了同一个产品阶段，只是把 `Source Readiness` 内部的 result scaffold 与 canonical write surface 明确暴露出来，Codex / Agent 不需要自己猜目录和 contract。

场景一，你已经准备好了参考材料：

> 请把这个目录当作本次项目的独立 RedCube workspace。先执行 `workspace doctor`，再执行 `source intake` 读取并水合我提供的材料；然后根据任务目标创建 `topic` 与 `deliverable`，并按正式链路推进 review、rerun 与 export。若是小红书系列，请把每篇笔记建成独立 deliverable，例如 `note-01`、`note-02`。

场景二，你只有主题，希望它先把事实材料准备好：

> 请把这个目录当作本次项目的独立 RedCube workspace。围绕主题“{{主题}}”先进入 `Source Readiness`：如果现有材料不足，就强制执行 `source augmentation` / `Deep Research`，直到 Step 1 到达 `planning_ready`；只有 canonical source readiness gate 放行后，才创建 deliverable 并推进正式交付链路。若是小红书系列，请按一篇笔记一个 deliverable 建模。

这里有一个需要诚实说明的边界：

- 当前正式稳定的是 `source intake + shared source truth`
- `Deep Research` 现在是共享 canonical source substrate 上的 `Source Readiness` augmentation 能力，供 `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 复用
- `planning_ready` 是 Step 1 的正式、可机读放行 gate；不能只看 `source_audit = pass`
- 它当前负责解决 source insufficiency 与 evidence gaps
- 真正的内容策略和讲述主线，仍然从 `storyline` 开始

当前更适合把 `RedCube AI` 当作“面向一个独立 workspace 的运行时”。
当前最适合的组织粒度是：

- `1 个 workspace = 1 个相对独立的内容项目或系列`
- `1 个 topic = 1 个主题`
- `1 个 deliverable = 1 个正式交付物`，例如 `1 篇小红书笔记`、`1 套 PPT` 或 `1 张海报`

对于“小红书系列笔记”，推荐理解为：

- `1 个 workspace = 1 个系列项目`
- `1 个 topic = 1 条系列主线`
- `1 个 deliverable = 系列中的 1 篇笔记`，例如 `note-01`、`note-02`

当前 canonical workspace contract 建议按下面理解：

```text
<workspace>/
├── redcube.workspace.json
├── topics/
│   └── <topic-id>/
│       ├── topic.json
│       ├── inputs/
│       ├── canonical/
│       ├── deliverables/
│       │   └── <deliverable-id>/
│       │       ├── deliverable.json
│       │       ├── artifacts/
│       │       ├── contracts/
│       │       ├── reports/
│       │       └── views/
│       └── runs/
├── runtime/
├── publish/
└── overlays/
```

这里要特别注意：

- `canonical/`、`contracts/`、`reports/` 属于正式运行落盘层，建议由 `RedCube AI` 自动维护，不建议手工编辑
- 当前对一个全新空目录，首次执行 `source intake` 就会自动补 `redcube.workspace.json`、`topics/<topic>/inputs/`、`topics/<topic>/canonical/` 等基础结构
- 后续执行 `deliverable create` 时，会继续补 `topic.json`、`deliverable.json` 以及对应的 deliverable 目录

因此，针对新目录的推荐调用顺序是：

1. `redcube workspace doctor`
2. `redcube source intake`（材料已足够时）
3. `redcube source research`（材料薄或只有主题时）
4. `redcube deliverable create`
5. `redcube deliverable audit`
6. `redcube deliverable run`

你可以直接把下面这段话发给智能代理：

> 请先读取我提供的材料，并判断这次交付更适合做成幻灯片、小红书笔记，还是海报。如果我已经明确指定交付物类型，就按该类型执行。然后使用 RedCube AI（`https://github.com/gaofeng21cn/redcube-ai`）作为视觉交付 gateway 与 Domain Harness OS，把这些材料组织成可审阅、可迭代、可导出的正式交付物。请明确目标受众、交付目标、关键信息结构、审阅节点和最终导出要求；如果方向不清楚，请先提出澄清问题，而不是直接生成一版含糊结果。

如果你希望 Agent 在一个全新的目录里直接开工，可以把要求再说得更明确一些：

> 请把这个目录当作本次项目的独立 RedCube workspace。若缺少 `redcube.workspace.json`，先把 `workspace doctor` 当作诊断步骤，再由 `source intake` 或 `source research` 正式写入 canonical workspace contract；把这次项目理解为 `1 个 workspace`、`1 个 topic` 与若干 `deliverable`。请先执行 `workspace doctor`，再执行 `source intake` 水合 shared source truth；若源材料不足，则继续执行 `source augment` 与 `source execute-augmentation`，把 Step 1 推到 `planning_ready`。随后为本次目标创建 deliverable，并按正式阶段推进审阅、重跑与导出。对于小红书系列，请把每篇笔记建成独立 deliverable，例如 `note-01`、`note-02`，不要把整组系列混成一个 deliverable。

## 当前待完善的地方

`RedCube AI` 现在已经可用，并正朝更完整的长期形态继续推进。

当前最主要的待完善项有：

- `ppt_deck` 与 `xiaohongshu` 是当前稳定交付面；`stable deliverable manual-test-driven hardening` 已完成 closeout，并形成了 tracked stable backlog（当前无新增 findings）
- `source intake + shared source truth` 已作为稳定 `Source Readiness` 能力面进入正式主线；`CLI / MCP` 已可在同一 substrate 上水合 canonical shared source truth，并由 `ppt_deck` / `xiaohongshu` 通过共享 gateway 主线消费
- source-readiness deep research trigger + gate convergence 已在同一主线上吸收一条 tranche：`Deep Research` 已冻结为共享 `Source Readiness` augmentation，而 `planning_ready` 现在通过 canonical `source-readiness-pack.json`、`source-augmentation-request/result/report` 与 `source-research-report` 共同收口
- `review / export / gate / audit hardening` 已在同一主线上吸收一条 tranche；换句话说，review / export / gate / audit hardening 已在同一主线上吸收一条 tranche：`auditDeliverable` 与 `runtimeWatch` 已可暴露 canonical source readiness 与 export gate summaries
- family source-truth consumption convergence 已在同一主线上吸收一条 tranche：`ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 已围绕同一份 hydrated `source_truth_contract` 与统一 `source_truth_consumption` summary 收口，同时 authoritative fail-closed source gate 继续留在 `auditDeliverable` / `runtimeWatch`
- publication projection / delivery contract convergence 已在同一主线上吸收一条 tranche：`ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 现在都通过 hydrated `delivery_contract` 对齐 topic 级 `publication-state.json`，并继续把 canonical review state 作为治理真相面
- direct-delivery operator handoff hardening 已在同一主线上吸收一条 tranche：`ppt_deck` 与 guarded `poster_onepager` 现在会暴露统一的 machine-readable `operator_handoff`，而 `xiaohongshu` 继续保持显式 human publication
- direct-delivery lifecycle stage convergence 已在同一主线上吸收一条 tranche：`ppt_deck` 与 guarded `poster_onepager` 现在会暴露统一的 machine-readable `lifecycle_stage_contract` 与对齐后的 `lifecycle_stage_summary`，同时 `Storyline + Plan` 继续映射到 `Story Architecture`，`operator_handoff / closeout` 继续留在 `Delivery`
- workspace / operator quickstart convergence 已在同一主线上吸收一条 tranche：brand-new / thin workspace 现在围绕 `workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run` 这条 canonical operator route 暴露 repo-verified quickstart surface，而不再依赖单独的 workspace-init 产品表面
- operator surface consistency hardening 已在同一主线上吸收一条 tranche：`workspace doctor` 现在把 brand-new workspace bootstrap guidance 收紧到 `source intake` / `source research`，command-scoped `--help` 保持 machine-readable 且不会执行真实命令，而 `CLI review watch` / `MCP runtime_watch` 现在围绕同一 `runtimeWatch` locator truth 与共享治理 summaries 收口
- route / managed execution 的 run surface 已经由上游 `Hermes-Agent` 主责；历史 `repo-local managed runtime pilot` 只保留为迁移 provenance、兼容桥与回归对照，不再是当前 runtime owner
- 当前行为收口还新增了 `governance_surface.runtime_topology`：create / review / audit / watch / projection 现在在同一 deliverable/topic 边界上看到同一份 runtime topology 真相
- runtime watch locator integrity hardening 继续作为同一主线上的 absorbed provenance：deliverable-scope run record 仍持久化 `topic_id` / `deliverable_id`，而 `runtimeWatch` / `CLI review watch` / `MCP runtime_watch` 在 quartet locator 指向错误 topic 或 deliverable 的 run 时继续 fail-closed
- 海报能力还没完全收口：
  - 当前海报主线主要对应 `知识海报`
  - 面向论文或会议的学术海报能力仍在完善
- trigger + gate convergence 之外的 source plane 持续增强仍是同一主线上的后续 hardening
- 与 OPL 的正式联动还在后续阶段

## 文档入口

- [Docs 索引](docs/README.zh-CN.md)

更细的操作文档继续保留在仓库中，但默认不属于对外双语公开正文面；只有在英文 `.md` 与中文 `.zh-CN.md` 镜像同步补齐后，才会被提升到默认公开面。

<details>
<summary><strong>给技术同事 / AI 执行者</strong></summary>

## 当前架构

```text
用户 / 智能代理
  -> CLI（默认）/ MCP
      -> 网关
          -> 交付物层 / 场景层 / 配置层 / 包层
              -> Domain Harness OS（运行在 Unified Harness Engineering Substrate 上）
                  -> 上游 Hermes-Agent runtime substrate（当前 route / managed run owner）
                      -> Codex-local operator / development host / workspace bridge
                  -> repo-local managed runtime pilot（历史迁移工件 / 兼容桥）
                  -> managed web runtime（真实 substrate 迁移后的未来选项）
```

正式控制链：

```text
网关
  -> 交付物层 / 场景层 / 配置层 / 包层
      -> 执行与审计内核
          -> 交付物存储 / 运行记录 / 事件日志
```

## 当前技术情况

当前 repo main 已稳定可验证的运行边界：

- `P19 / 创作主导权修复` 已被视为完成，当前不允许回退。
- `P20 / 第三类交付物接入证明` 已通过 `poster_onepager` 完成，但其含义仅限 `知识海报` extension proof。
- `P21 / 运行评估与运营面` 已有仓内 closeout artifact，可视为已完成范围，但不是当前 active mainline。
- 当前 active mainline 已经把 route / managed run owner 切到上游 `Hermes-Agent`：phase-2 的 source-truth / governance / operator-surface 工作继续作为 absorbed provenance 保留，而 `ppt_deck`、`xiaohongshu` 与 guarded `poster_onepager` 继续在同一 RedCube visual-domain truth 上收口；历史 repo-local runtime 不再是当前 owner。
- 共享 `Gateway`、run/watch、review、audit、artifact persistence 主线已可通过 `CLI` 与 `MCP` 验证。

当前仍需诚实说明的限制：

- `controller` 还没有作为独立正式入口在仓内落地。
- `poster_onepager` 当前只代表 `知识海报`。
- `paper_poster / conference_poster` 学术海报合同仍是后续阶段，不是当前 active mainline。
- `Codex-default host-agent runtime` 继续只作为本地 operator / development host，而不是长期产品 runtime owner。
- route / managed execution 现在已经 fail-closed 到真实上游 `Hermes-Agent` proof；冻结闸门仍是 `upstream-hermes-agent-activation-package`，service-safe domain adapter shell 是 `redcube_service_safe_domain_entry`。
- 当前 fresh proof 使用 `hermes gateway run -q`；默认 `hermes gateway run` 仍会因上游 `RedactingFormatter` bug 崩溃，这不能被误写成仓内已修能力。
- 如果验证宿主上的全局 `hermes` CLI 仍指向这份有问题的 upstream checkout，请用 `REDCUBE_HERMES_GATEWAY_COMMAND` 把 integration / e2e verification 指到一条已知良好的 upstream gateway 启动命令。
- 当前 live verification 还要求 `/v1/runs` 与 `/v1/runs/{run_id}/events` 真正发出 terminal event；在 2026-04-12 这台验证宿主上，即使切到最新 upstream launch override，也会因为 events stream 在 terminal event 之前就关闭而被 block。
- managed web runtime 仍是同一 substrate 上的未来形态，不得伪装成已完成。
- source plane 扩展与运营面收口仍属于同一主线上的后续工作。
- OPL 联动仍属后续工作。

## 当前推荐入口

1. `CLI`
2. `MCP`

## 安装与基础验证

```bash
npm install
npm run test:full
npm run typecheck
```

本地测试分层：

- `npm test` / `npm run test:fast`：日常开发用的轻量 smoke slice；但在 clean CI / 全新克隆里，它现在也需要 Python、Noto CJK 字体与 Playwright，因为 poster runtime 的 smoke 路径已经包含 governed screenshot review
- `npm run test:meta`：repo-tracked truth、文档、contract 与 TypeScript 治理检查
- `npm run test:integration`：建立在同一套 Python / 字体 / Playwright review stack 之上的更宽 runtime 行为测试
- `npm run test:e2e`：依赖 Python、字体与 Playwright 的 render / export 端到端测试
- `npm run test:full`：clean-clone 基线使用的完整验证入口

GitHub Actions CI 默认只跑 quality lane（`npm run typecheck`、`npm run test:fast`、`npm run test:meta`）。live-upstream 的 `integration` / `e2e` / `full` 仍是显式验证 lane，只应在能证明真实 Hermes run surface 的准备好宿主上执行。

查看 CLI：

```bash
npm run redcube -- help
```

启动 MCP：

```bash
npm run mcp
```

## 一个最小 CLI 例子

```bash
npm run redcube -- deliverable create \
  --workspace-root /ABS/PATH/TO/WORKSPACE \
  --overlay ppt_deck \
  --profile-id lecture_student \
  --topic-id thyroid-basics \
  --deliverable-id lecture-01 \
  --title "甲状腺基础" \
  --goal "向本科生讲清甲状腺基础知识"
```

</details>

## 文档约定

- 面向 GitHub 与外部读者的默认双语公开面，统一通过 [`docs/`](docs/README.zh-CN.md) 进入
- `docs/superpowers/` 目录只保留本地 AI / Superpowers 文档，并在 Git 中忽略
- 开发过程中的计划、草案与中间设计，不应继续进入公开仓库文档面
