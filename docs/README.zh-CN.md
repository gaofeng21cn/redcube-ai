# Docs

[English](./README.md) | **中文**

这里是 `RedCube AI` 的双语文档索引。

公开口径统一按下面这条理解：

- 对外：`RedCube AI` 是 `Visual Deliverable Gateway`
- 对内：它由 `Visual Deliverable Harness OS` 驱动
- 在 `OPL` 顶层语义里：它是视觉交付 domain gateway，而不是 `OPL` 本体
- 在 Codex / OMX 语境里：`Agent-first` 不等于只能走 `external_llm`，`Codex-native host agent` 可以是正式主执行器

统一生命周期口径：

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

统一审核 overlay：

- `visual_director_review`
- `screenshot_review`

如果你是专家、PI、内容团队负责人或需要接入本项目的技术同事，优先从这里开始。

## 默认对外双语公开面

这份索引和仓库首页一起构成默认 GitHub 双语公开面。
任何被提升到这个公开面的详细正文，都必须同时具备英文 `.md` 与中文 `.zh-CN.md` 镜像，并保持同步更新。

## 仓库跟踪的内部操作文档

### 面向人类操作同事

- [人类用户快速上手](human_quickstart.md)
- [典型交付示例](deliverable_examples.md)

### 面向技术同事 / AI 执行者

- [运行架构说明](runtime_architecture.md)
- [公开发布到 GitHub](public-github-publish.md)

### 私有 / 本地配置文档

- [私有作者信息与 prompts 配置](private-profile-setup.md)

## 稳定内部规则

- [Policies 索引](policies/README.md)
- [运行模型 Policy](policies/runtime_operating_model.md)
- [交付合同模型 Policy](policies/deliverable_contract_model.md)

## 仓库历史

- [更新日志](../CHANGELOG.md)

## 文档边界

- `README*` 与 `docs/README*`：默认对外双语公开面
- 详细 `docs/*.md`：默认仓库跟踪的内部操作文档
- `docs/policies/`：默认仓库跟踪的稳定内部规则
- `docs/superpowers/`：本地 AI / Superpowers 文档、开发计划、设计草案与过程痕迹，不进入 Git 跟踪面
