# Product

Owner: RedCube AI
Purpose: 说明用户/operator 如何进入 RCA。
State: active
Machine boundary: action 名、输入输出与 installed state 读 OPL-generated interface 和 package lifecycle readback。

RCA 不提供 repo-local product shell。正式入口是安装 `rca` package 后由 OPL 生成的 CLI、MCP、Skill、product-entry、OpenAI、AI SDK、status 与 workbench surfaces。

- [Human quickstart](./human_quickstart.md)
- [Public GitHub publish](./public-github-publish.md)

Codex plugin skill 是 domain guidance carrier；package identity、安装状态、currentness 和 lifecycle receipt 归 OPL Connect。
