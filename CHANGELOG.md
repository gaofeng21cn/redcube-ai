# Changelog

本仓库使用简化版 changelog 记录公开版本的重要变化。

## Unreleased

- 暂无

## 0.1.0 - 2026-03-22

### Added

- 初始化公开 GitHub 仓库与全新单根 git 历史
- 基于 Node/ESM 的主线 CLI、Web UI、Workbench 与测试结构
- 私有 profile 迁移、导出、安装能力
- `README`、`CONTRIBUTING`、`LICENSE`、`SECURITY` 等开源仓库基础文档
- GitHub 发布说明、私有配置说明与公开仓库收口计划文档

### Changed

- 仓库仅保留 Node 主线与公开安全默认配置
- 私有作者信息、正式 prompts、默认工作区改为通过仓库外配置注入
- `config/local/` 收紧为默认整体忽略，只保留说明文件和占位文件
- 项目公开定位收紧为“高质量图文笔记自动生产”，明确面向小红书等图文平台工作流

### Notes

- 当前公开维护主线为 `main`
- 业务 workspace、运行产物和私有配置不属于本仓库内容
