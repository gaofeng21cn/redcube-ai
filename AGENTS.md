# RedCube AI

本仓是 OPL 的视觉交付 domain agent，canonical id 为 `rca`。

- RCA 是 `OPL Package(kind=agent)`：持有 executor-neutral 的 Package identity、
  capabilities、业务 task / typed-view 语义和稳定 entrypoint identity。
- RCA 持有 visual truth、layout/review/export verdict、artifact authority、visual memory 和 owner receipts。
- OPL Framework 持有通用 runtime、attempt lifecycle、workspace/source transport、gallery/handoff shell 与 generated interfaces。
- Package、carrier 与 executor 必须分离。Codex Plugin 只是当前首个 carrier projection，
  Codex CLI 是当前首选 executor；两者都不是 RCA Package identity 或领域 truth。
- 一方完整 Package bytes 由 RCA owner 独立发布到自己的 GHCR repository，只推进自己的
  `latest-stable`。普通 required/optional dependency 只检查 identity presence 与
  entrypoint callability，不以版本、ABI、lock、payload、digest、Release Set 或原子闭包
  作为组合门禁。
- exact ref / digest 只保护一次发布的 bytes 完整性，或 RCA artifact/evidence lineage；
  不得反向成为普通 Package 安装或运行 lock。
- 当前 `contracts/opl_agent_package_manifest.json` 仍含旧 lifecycle 字段，是待 dual-read
  迁移的兼容合同，不得作为新增 resolver、lock、payload、receipt 或 rollback 设计依据。
- 标准 Agent Pack、native helpers 和 primary-skill carrier projection 的边界以
  `agent/` 与 `contracts/` 为准。
- 当前事实以 contracts、源码、artifacts 和验证输出为准。

默认验证入口：`scripts/verify.sh`。

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->
