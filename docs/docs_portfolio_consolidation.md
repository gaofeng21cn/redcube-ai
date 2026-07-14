# RCA 文档组合治理

Owner: RedCube AI
Purpose: 规定当前文档的 owner、生命周期与折回方式。
State: active
Machine boundary: 文档路径不是机器 ABI；contract/schema/source ref 才是稳定机器引用。

## 默认入口

先读 `README.md`，再读 `docs/README.md` 和核心五件套：`project.md`、`architecture.md`、`invariants.md`、`decisions.md`、`status.md`。

## 生命周期

- 当前事实进入核心五件套；
- 未完成差距进入 `docs/active/`；
- 稳定领域规则进入 `docs/policies/`；
- 交付与 proof 说明进入 `docs/delivery/`；
- 支撑设计进入 `docs/references/`；
- 完成计划、旧 CLI/runtime/product-entry、Hermes 与 Phase 2 叙事只进入 `docs/history/`。

## No-second-truth

active docs 不得：

- 宣布 repo-local CLI、domain-handler、runtime package 或 current-program baton 为当前入口；
- 把 developer proof 写成 production path；
- 把 conformance/test/receipt ref 写成 visual-ready 或 production-ready；
- 复制 action catalog、stage manifest、schema 或 package lifecycle 状态形成第二机器真相。

## 维护动作

新增文档前必须明确 owner、purpose、state、machine boundary。内容完成后折回核心 owner doc 或迁入 history；不要长期保留完成的 active inventory。
