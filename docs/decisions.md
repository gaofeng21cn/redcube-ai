# RedCube AI 关键决策

## 2026-04-11

### 决策：采用核心五件套文档骨架

- `docs/project.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`
- `docs/status.md`

原因：让 AI 和维护者能快速定位项目目标、当前主线、硬约束和关键决策。

### 决策：Phase 2 tranche brief 统一下沉到 `docs/program/phase-2/`

原因：`phase_2_*.md` 继续平铺在 docs 根目录会让入口混乱；它们保留为活跃 program brief，但不再占据根目录层级。

### 决策：`contracts/runtime-program/*.json` 与 `docs/program/phase-2/*.md` 成对维护

原因：一个是机器真相，一个是人类可读 brief，不能再各自漂移。

### 决策：目标 substrate 优先于旧宿主硬化

原因：历史主线与当前基线仍然有验证价值，但一旦新的 runtime substrate 目标已经明确，新增投入就应默认服务目标形态。旧宿主形态只能保留为迁移桥、兼容层或回归对照，而不是继续被当成长线产品方向。

### 决策：`Hermes-Agent` 只指上游外部 runtime substrate

- 后续凡是提到 `Hermes-Agent`，只能指上游外部 runtime 项目 / 服务本体。
- 仓内 `docs/program/hermes/*` 与同名 package 只代表本地迁移工件、pilot substrate 或历史 provenance。

### 决策：`docs/program/hermes/` 退为历史本地迁移材料

- 当前还不能把 `docs/program/hermes/*` 写成上游 `Hermes-Agent` 已接管 runtime 的证据。
- 这组文档保留为历史 local-runtime migration artifact，用于追溯为何会走到今天这一步。
- 当前真实主线应回到核心五件套：先完成 truth reset，再推进真实的上游 `Hermes-Agent` pilot。

### 决策：统一 runtime substrate，不强制统一 visual executor

- `Hermes-Agent` 在本仓长线中优先承担 runtime substrate / orchestration owner。
- `RedCube AI` 继续持有 visual deliverable 的 family/profile/pack authority、audit truth 与 executor routing。
- 具体生成步骤允许继续通过 `Executor Adapter` 选择最合适的执行器；只有在拿到显式 proof 后，才允许把某条 route 迁到新的 executor。

## 2026-04-13

### 决策：移除 repo-local pack/compiler 创作路径，保留 pack 的 boundary 语义

- `ppt_deck`、`xiaohongshu`、`poster_onepager` 的受保护创作 stage 统一改为 `runtime-family + upstream Hermes structured generation`。
- repo-local `pack/compiler` 不再 author storyline、blueprint、visual_direction、render_html 这类创作真值。
- `pack` 继续保留为 domain boundary、pack-id carrier 与 typed shell，但不得再回退成脚本填充 / 编译式创作主链。
- legacy `pack-runtime` compiler registry 从 workspace 与依赖图移除，避免测试或后续修改误把旧路径重新接回 active mainline。
