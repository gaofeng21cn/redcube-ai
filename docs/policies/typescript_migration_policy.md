# TypeScript Migration Policy

这份文档定义 `RedCube AI` 主仓当前稳定的 TypeScript 迁移边界。

## 稳定原则

- 新代码默认使用 TypeScript
- 新增实现默认走 TypeScript；新增 JS 必须登记为显式例外
- Agent-facing prompt、skill descriptor 与安装器输出必须把 `TypeScript + Python` 写成默认实现面，避免新 Agent 被仓内残留 JavaScript 文件误导
- 不做一次性全仓重写
- 旧 JS 只在明确迁移窗口内短期共存
- 不允许把迁移做成“后缀变了，但导出 surface 仍然是 `any`”

## JS 例外登记 / JS Exception Registration

- Existing JS residue remains allowed only when it is listed in the TypeScript closeout audit inventory.
- New `.js` files under `apps/*/src/**` or `packages/*/src/**` must be registered before merge.
- Each registered JS exception must identify an owner, the reason it cannot land as TypeScript immediately, and a migration window.
- Unregistered JS residue makes `criteria.js_residue_explicitly_closed_out` fail closed.
- Existing JS residue is line-locked by `contracts/runtime-program/js-residue-line-lock.json`; JS files may shrink during migration, but they may not grow.
- Any new implementation must land in TypeScript, or in Python-owned native helper surfaces when the work is Office/PPT/document automation.

## 编译与模块策略

- 主仓采用 `module = NodeNext`
- 主仓采用 `moduleResolution = NodeNext`
- 保持根 `package.json` 的 `type: module` 语义
- package-level `tsconfig` 必须统一继承 root baseline

## 质量门

- typecheck 成为正式质量门，并且必须先生成 compiled package exports，再执行全仓 `tsc --noEmit`
- 新增核心边界必须优先提供可检查的类型 contract
