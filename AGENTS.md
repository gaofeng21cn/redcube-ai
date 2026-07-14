# RedCube AI

本仓是 OPL 的视觉交付 domain agent，canonical id 为 `rca`。

- RCA 持有 visual truth、layout/review/export verdict、artifact authority、visual memory 和 owner receipts。
- OPL Framework 持有通用 runtime、attempt lifecycle、workspace/source transport、gallery/handoff shell 与 generated interfaces。
- 标准 Agent Pack、native helpers 和 primary-skill carrier 的边界以 `agent/` 与 `contracts/` 为准。
- 当前事实以 contracts、源码、artifacts 和验证输出为准。

默认验证入口：`scripts/verify.sh`。

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->
