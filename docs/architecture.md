# RedCube AI 架构

## 主链路

`RedCube AI` 的正式主链路是：

`gateway -> family -> profile -> pack -> harness execution -> audit / review / publication projection`

当前仓内可执行的 runtime 基线仍是 repo-local managed runtime + 本地 operator host。
长线目标才是把 session / run / watch / memory / scheduling 这类 substrate 责任迁到真实的上游 `Hermes-Agent`，同时保持上面的 domain chain 不变。

## 结构角色

### 1. Public docs

- `README*`
- `docs/README*`

这层负责对外说明项目是什么、当前主线在哪里、如何理解 formal-entry 与 product role。

### 2. Core maintainer docs

- `docs/project.md`
- `docs/status.md`
- `docs/architecture.md`
- `docs/invariants.md`
- `docs/decisions.md`

这层负责 AI / 维护者快速建立上下文。

### 3. Machine-readable runtime program

- `contracts/runtime-program/current-program.json`
- `contracts/runtime-program/*.json`

这层负责活跃主线指针、absorbed tranche、follow-on board 与 provenance contract。

### 4. Program briefs

- `docs/program/*/*.md`

这层负责与 contracts 对应的人类可读 tranche brief，不是默认公开首页叙事。

### 5. Stable rules and references

- `docs/policies/*`
- `docs/references/*`

这层分别承载稳定规则和非活跃参考材料。
