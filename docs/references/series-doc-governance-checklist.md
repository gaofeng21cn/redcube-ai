# 系列项目文档治理清单

## 目标

本清单用于把 `RedCube AI` 放进 `One Person Lab`、`Med Auto Science`、`Med Auto Grant`、`RedCube AI` 这组系列项目的统一文档管理口径里做巡检。
它服务跨仓 docs intake、回归与持续对齐，不替代核心五件套、`docs/program/**`、`docs/policies/**`、typed boundary audit 或 machine-readable contracts。

## 一、默认入口

- `README.md` / `README.zh-CN.md` 是默认公开首页。
- `docs/README.md` / `docs/README.zh-CN.md` 是默认 docs 索引。
- 外部读者先走公开入口；AI / 维护者先走核心五件套，再进入 `docs/program/**`、`docs/references/**`、`docs/policies/**` 与 `contracts/**`。

## 二、核心五件套

- `docs/project.md`
- `docs/status.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`

这五件套必须位于 `docs/` 根目录，并被 `docs/README*` 显式链接。
任何涉及当前主线、formal entry、runtime owner、product-entry truth、family surface、typed boundary 或 program pointer 的变化，都不能只改 program/reference/policy 文档，必须同步更新对应核心文档。

## 三、公开层与内部层

- `README*` 与 `docs/README*` 继续承担双语公开入口。
- `docs/program/**` 承担 active mainline、absorbed tranche 与 provenance brief。
- `docs/references/**` 承担内部参考说明；默认中文维护。
- `docs/policies/**` 承担稳定内部规则。
- 详细 `docs/*.md` 继续作为 repo-tracked 的内部 operator / collaborator 文档，不自动升格为公开面。
- 长期规则要冻结进核心文档、program brief、reference 或 policy；不要把 `AGENTS.md` 继续当第二真相源。

## 四、系列一致性检查

- 文档必须把 `RedCube AI` 写成 visual-deliverable domain gateway 与 `Domain Harness OS`，而不是 `OPL` 顶层 gateway，也不是已经切到上游 `Hermes-Agent` runtime owner 的既成事实。
- 系列项目名称与角色要与四仓当前真相同步：`One Person Lab` 是顶层 gateway，`Med Auto Science` 是 `Research Ops`，`Med Auto Grant` 是 author-side `Grant Ops`。
- 若提到 `Hermes-Agent`，只能指上游外部 runtime 项目 / 服务；仓内 runtime package、pilot、shim、compatibility material 都不能被写成“已接入 Hermes-Agent”。
- 默认公开入口、program brief、内部参考、稳定规则、typed boundary audit 与历史 provenance 必须继续分层，不把 reference/history 重新挤进公开默认入口。
- 修改 docs skeleton、公开入口、product-entry truth、program pointer、typed boundary 或 contract surface 时，必须同步更新相关测试。

## 五、默认验证

- 默认 docs 审计入口：`scripts/verify.sh meta`
- 同义验证入口：`npm run test:meta`
- 历史 provenance 审计入口：`scripts/verify.sh historical` / `npm run test:historical`
- 默认 smoke：`scripts/verify.sh`
- 若验证命令、docs index、program pointer、typed boundary 或 contract surface 有变化，继续同步 `scripts/run-test-group.mjs`、`package.json`、`README*` 与 `tests/*.test.js`
