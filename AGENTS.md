# RedCube AI

本仓是视觉交付 domain agent；`contracts/opl_agent_package_manifest.json` 定义 `agent_id/package_id=rca`，`contracts/domain_descriptor.json` 定义 `domain_id=redcube_ai`。

- RCA 持有 visual truth、layout/review/export verdict、artifact、visual memory 和 owner receipt authority；Framework 只提供通用 runtime、transport、gallery/handoff shell 与 generated interfaces。
- `agent/primary_skill/SKILL.md` 是主路由，稳定能力和 carrier 映射以 `agent/` 与 `contracts/` 为准。
- Plugin、CLI 或其他 carrier/executor 不取得 RCA identity、完整 installed truth 或领域 authority。
- 当前兼容字段与迁移计划留在 `README.md`、contracts 和 active plans；不得从根规则推断 release 或 production ready。
- 默认验证运行 `scripts/verify.sh`；视觉或交付物变更还须执行对应的 render、pixel/layout 和 artifact readback。

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->
