# 合同目录说明

这个目录只保留 machine-readable contract surface。

- narrative 协作规则看仓库根 `AGENTS.md`
- 默认人类/AI 入口看 `README*` 与 `docs/README*`，其中 direct route 与单一 `redcube-ai` app skill 是第一公开主语
- 稳定运行边界看 `docs/policies/runtime_operating_model.md`

当前保留的 repo-tracked machine-readable mainline truth：

- `runtime-program/current-program.json`：当前 active mainline pointer，包含 `OPL Runtime Manager` 薄管理层边界与 `TypeScript + Python` 实现目标
- `runtime-program/upstream-hermes-agent-final-target-shape.json`：独立 RCA domain-agent 在显式 hosted runtime carrier 语境下的目标形态冻结件（direct route 与 internal bridge 共用同一下游 domain entry）
- `runtime-program/redcube-product-entry-mvp.json`：当前 direct product-entry service surface 冻结件
- `runtime-program/opl-gateway-federated-product-entry.json`：当前 internal OPL bridge / integration 冻结件
- `runtime-program/managed-product-entry-hardening.json`：当前 product-entry session continuity 冻结件
- `runtime-program/rca-executor-routing-config.schema.json`：RCA executor routing 的 opt-in 配置 schema；只表达 `codex_cli` / `hermes_agent` 与 `structured_call` / `agent_loop`，不保存 provider secret
- `runtime-program/ppt-native-authoring-proof-lane.json`：`ppt_deck` native PPT authoring / repair 显式探索线冻结件，不改变默认 HTML visual route
- `runtime-program/ppt-mainline-quality-closeout.json`：`ppt_deck` HTML 主线视觉质量债核查 closeout，记录历史 OPL-series 问题已由后续 review / repair hardening 覆盖，且不把 native PPT proof lane 当作兜底修复线
- `runtime-program/upstream-hermes-agent-live-verification-closeout.json`：当前 F4 live closeout 证明件
- `runtime-program/upstream-hermes-agent-live-verification-blocker.json`：历史 F4 live blocker 冻结件
- `runtime-program/*.json`：absorbed tranche、prefrozen follow-on board 与 provenance contract

这里不再保留 narrative 的 `project-truth/AGENTS.md` 层。
