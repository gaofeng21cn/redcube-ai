# RedCube AI 项目定位

Owner: RedCube AI
Purpose: 定义 RCA 的产品身份、长期职责与 OPL 边界。
State: active
Machine boundary: identity 与可执行入口以 `contracts/opl_agent_package_manifest.json`、`contracts/domain_descriptor.json`、`contracts/action_catalog.json` 和 `agent/stages/manifest.json` 为准。

## 产品身份

RedCube AI 是 `rca` package 对应的 visual-deliverable domain Agent。`redcube-ai` 只作为仓库、Codex plugin 和 skill carrier 名，不是第二个 package identity。

RCA 的正式用户入口由安装后的 OPL-generated interfaces 提供。Codex plugin skill 是 rich domain guidance carrier；它不创建独立 runtime、package manager 或第二套命令系统。

## RCA 持有的真相

- 视觉叙事、版式、品牌、图像、PPT、海报与社交视觉内容的领域语义；
- source-readiness、communication strategy 与 visual direction decision；
- review/export verdict 和 artifact mutation authorization；
- visual memory 的接受、拒绝与领域解释；
- RCA owner receipt、typed blocker 与 no-regression refs 的领域含义；
- Python native-helper 的具体视觉处理实现。

## OPL 持有的通用能力

- package 安装、依赖闭包、currentness、lock、update、rollback 与 lifecycle receipt；
- generated CLI/MCP/Skill/product-entry/OpenAI/AI SDK/status/workbench surfaces；
- Temporal-backed StageRun、Attempt、session identity、resume、retry、route materialization 与 receipt ledger；
- workspace/source intake shell、artifact locator/index、review/repair transport、native-helper envelope 与 App shell。

## 源码形态

当前 canonical source 只有四类：

1. `agent/`：declarative visual pack；
2. `contracts/`：机器合同、schema、policy 与 evidence refs；
3. `python/redcube_ai/native_helpers/`：RCA-owned native helper；
4. `runtime/authority_functions/`：最小 authority surface 声明，不含通用 runtime。

`apps/redcube-cli`、`packages/redcube-domain-entry`、`packages/redcube-runtime*`、`packages/redcube-governance` 与 `packages/redcube-overlay-core` 已退役，不能作为兼容层恢复。

## 不属于当前完成声明的内容

结构标准化不等于 production readiness。真实 visual StageRun、真实图片生成、真实 review/export acceptance、owner acceptance、跨运行 no-regression 与 provider long-soak 仍按证据合同单独验收。
