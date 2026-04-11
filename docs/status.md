# RedCube AI 当前状态

## 当前角色

- 仓库角色：visual-deliverable domain gateway 与 `Domain Harness OS`
- 当前执行口径：`Hermes-backed runtime substrate`
- 当前 deployment host：`Codex-default host-agent runtime`（仅 bridge / regression host / development shell）
- 当前主线：`Auto-only`

## 当前主线

- 当前 active tranche：`Hermes / runtime substrate canonical closure`
- 当前 active mainline pointer：`contracts/runtime-program/current-program.json`
- 当前 program brief 目录：`docs/program/hermes/`

## 当前优先事项

1. 保持 contracts、program brief、README/docs 入口和 tests 同步。
2. 继续把 Hermes runtime topology、canonical path 与 shared governance surface 保持一致。
3. 只把旧 host-agent 保留为过渡宿主，不再把它写成长期产品 runtime owner。

## 默认验证

- 默认最小验证：`scripts/verify.sh`
- meta 验证：`scripts/verify.sh meta`
- integration 验证：`scripts/verify.sh integration`
- e2e 验证：`scripts/verify.sh e2e`
- full 验证：`scripts/verify.sh full`
