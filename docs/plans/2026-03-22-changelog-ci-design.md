# CHANGELOG 与基础 CI 设计

日期：2026-03-22

## 目标

- 为公开仓库补一个最小但可维护的 `CHANGELOG.md`
- 为 GitHub 仓库补一个基础 CI，确保 push / PR 至少会跑安装和 Node 测试
- 不引入复杂发布流程、版本自动化或多平台矩阵

## 方案

### CHANGELOG

- 使用简化版 Keep a Changelog 结构
- 先建 `Unreleased`
- 再补 `0.1.0 - 2026-03-22`，覆盖这次公开仓库初始化和开源收口动作

### CI

- 新增 `.github/workflows/ci.yml`
- 触发条件：
  - `push`
  - `pull_request`
- 运行环境：
  - `ubuntu-latest`
  - `node-version: 22`
- 运行步骤：
  - checkout
  - setup-node
  - `npm install`
  - `npm test`

### README

- 在标题区域补 CI badge
- 在文档导航补 `CHANGELOG.md`

## 验收标准

- GitHub 仓库能识别到新的 Actions workflow
- `npm test` 本地 fresh 通过
- 文档不引入私有信息
