# README 流程图与开源文档设计

日期：2026-03-22

## 目标

- 在 README 首页补一张足够简洁的流程图，快速说明 RedCube AI 的主线执行方式
- 为仓库补齐标准开源文件：`LICENSE` 和 `CONTRIBUTING.md`
- 保持公开仓库口径，不引入私有工作流痕迹、作者人设或旧项目信息

## 方案

### README 流程图

- 使用 Mermaid
- 放在首页前半段，紧跟“架构概览”之后
- 只展示用户真正关心的主线：
  - inputs
  - research
  - storyline
  - workflow
  - truth sync
  - publish

### LICENSE

- 采用 `MIT`
- 版权主体使用中性表述 `RedCube Contributors`
- 避免在许可证文件里写入个人实名

### CONTRIBUTING

- 只写对当前仓库有效的规则：
  - 先看 README 和 docs
  - 提交前跑 Node 测试
  - 不把业务工作区、运行产物、私有配置和私有 prompts 提交到仓库
  - 变更要聚焦，文档和行为保持一致

## 验收标准

- README 在 GitHub 首页可直接显示流程图
- 仓库根目录出现 `LICENSE` 和 `CONTRIBUTING.md`
- 文本不含私有敏感信息
- fresh 测试通过并已推送到 GitHub
