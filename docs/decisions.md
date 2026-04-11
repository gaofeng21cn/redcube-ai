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

### 决策：产品 runtime 主线迁到 `docs/program/hermes/`

- `Hermes` 成为新的 runtime substrate owner
- `Codex-default host-agent runtime` 退为 transition deployment host / regression bridge / development shell
- `docs/program/hermes/*.md` 与对应 machine-readable contract 成对维护
