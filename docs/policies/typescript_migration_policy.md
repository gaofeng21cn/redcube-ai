# TypeScript Migration Policy

Owner: `RedCube AI`
Purpose: `typescript_migration_policy`
State: `current_policy`
Machine boundary: 人读实现语言 policy。机器真相继续归 source、package manifests、tsconfig、line-budget / JS residue contracts、tests 和 CI behavior。

这份文档定义 `RedCube AI` 主仓当前稳定的 TypeScript 迁移边界。

## 稳定原则

- 新代码默认使用 TypeScript
- 新增实现默认走 TypeScript；Office/PPT/document native helper 默认走 repo-owned Python helper
- Agent-facing prompt、skill descriptor 与安装器输出必须把 `TypeScript + Python` 写成默认产品实现面，并明确 `apps/`、`packages/` 下的 repo-tracked JavaScript 已退役
- 不做一次性全仓重写
- 旧产品 JS 迁移窗口已关闭；`apps/`、`packages/` 下已跟踪 JavaScript 维持零文件预算
- 不允许把迁移做成“后缀变了，但导出 surface 仍然是 `any`”

## JS 例外登记 / JS Exception Registration

- Repo-tracked product JavaScript under `apps/` and `packages/` is retired and must remain at zero files.
- New `.js`, `.mjs`, or `.cjs` files under `apps/` or `packages/` make the TypeScript closeout audit fail closed.
- Tests may use native Node.js `.js` syntax; TypeScript test files remain first-class only where type-level contracts or typed fixtures require them. The test registry owns that mixed JS/TS partition.
- Any new implementation must land in TypeScript, or in Python-owned native helper surfaces when the work is Office/PPT/document automation.

## 编译与模块策略

- 主仓采用 `module = NodeNext`
- 主仓采用 `moduleResolution = NodeNext`
- 保持根 `package.json` 的 `type: module` 语义
- package-level `tsconfig` 必须统一继承 root baseline

## 质量门

- typecheck 成为正式质量门，并且必须先生成 compiled package exports，再执行全仓 `tsc --noEmit`
- 新增核心边界必须优先提供可检查的类型 contract
