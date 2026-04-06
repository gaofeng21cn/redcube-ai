# TypeScript Migration Policy

这份文档定义 `RedCube AI` 主仓当前稳定的 TypeScript 迁移边界。

## 稳定原则

- 新代码默认使用 TypeScript
- 不做一次性全仓重写
- 旧 JS 只在明确迁移窗口内短期共存
- 不允许把迁移做成“后缀变了，但导出 surface 仍然是 `any`”

## 编译与模块策略

- 主仓采用 `module = NodeNext`
- 主仓采用 `moduleResolution = NodeNext`
- 保持根 `package.json` 的 `type: module` 语义
- package-level `tsconfig` 必须统一继承 root baseline

## 质量门

- typecheck 成为正式质量门
- 新增核心边界必须优先提供可检查的类型 contract
