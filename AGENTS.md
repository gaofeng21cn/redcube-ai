# RedCube AI

本仓是视觉交付 domain agent；`contracts/opl_agent_package_manifest.json` 定义 `agent_id/package_id=rca`，`contracts/domain_descriptor.json` 定义 `domain_id=redcube_ai`。

- RCA 持有 visual truth、layout/review/export verdict、artifact、visual memory 和 owner receipt authority；Framework 只提供通用 runtime、transport、gallery/handoff shell 与 generated interfaces。
- `agent/primary_skill/SKILL.md` 是主路由，稳定能力和 carrier 映射以 `agent/` 与 `contracts/` 为准。
- Plugin、CLI 或其他 carrier/executor 不取得 RCA identity、完整 installed truth 或领域 authority。
- 当前源码与证据边界见 `docs/status.md`，剩余工作见 `docs/active/rca-ideal-state-gap-plan.md`，文档更新与退役见 `docs/docs_portfolio_consolidation.md`；不得从根规则推断 release 或 production ready。
- 默认验证运行 `scripts/verify.sh`；视觉或交付物变更还须执行对应的 render、pixel/layout 和 artifact readback。
- 模块拆分以职责内聚和调用清晰为准，在日常开发与 PR 阶段维护，不靠机械行数阈值或周期拆文件脚本：既避免把不相关职责堆成巨石文件，也禁止制造嵌套 `*_parts/*_parts`、过薄胶水切片或大段回调参数转运；重构优先消除重复与化简调用链，来源不明或储备能力默认保留（无静态调用者只作调查信号）。

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->

- 软件包发布统一使用 OPL OCI 流程和标准安装入口，不创建或保留独立 GitHub Release 页面及附件。共享规则由 Framework 的 docs/delivery/artifact-package-lifecycle-boundary.md 持有。

- GitHub 上自己新建的对外文本用英文书写：commit subject/body、PR 标题与正文、Issue、comment、Release 正文与 Release Notes。产品名、代码标识、路径、命令与原始引用除外。他人写的 Issue、PR 或 comment，无论对方用什么语言，回复沿用对方的语言；历史中已有的非英文 commit 保持原样。
