# Upstream Hermes-Agent Live Verification Closeout

状态锚点：`2026-04-12`

生命周期说明：本文件是 F4 live verification closeout provenance。它证明过历史 Hermes-hosted proof lane 的 live run surface，不改变当前默认执行口径：RCA first public identity 是视觉交付领域智能体，OPL-hosted route 是内部集成路径，默认最小具体执行单元仍是 `Codex CLI`。

## 一句话结论

`docs/program/upstream_hermes_agent_fast_cutover_board.md` 的 F4 端到端验证与 absorb，
现在已经可以在当前验证宿主上诚实写成 completed。

这不是因为 repo-local runtime 回来了，
也不是因为我们把旧 blocker 文档删掉了；
而是因为同一宿主上的 fresh live verification 已经重新拿到全绿证据。

## Fresh closeout proof

1. live preflight 已通过标准 launcher 重放：
   - 命令：`npm run test:e2e`
   - launcher：`scripts/run-test-group.ts -> hermes gateway run -q --replace`
   - Python helper：`REDCUBE_PYTHON_COMMAND=/opt/homebrew/opt/python@3.14/bin/python3.14`
   - 结果：`/v1/health`、`/v1/models`、`/v1/runs`、`/v1/runs/{run_id}/events` preflight 通过，并拿到 terminal `run.completed`
2. `ppt_deck` 与 `xiaohongshu` live e2e 已 fresh 全绿：
   - 命令：`npm run test:e2e`
   - `ppt_deck` 证明面：`screenshot_review`、`export_pptx`、`optimize_existing relative review`、shared source-truth proof
   - `xiaohongshu` 证明面：`publish_copy`、`export_bundle`、`optimize_existing relative review`、shared source-truth proof
   - 结果：`16/16 pass`
3. guarded `poster_onepager` 已补齐 fresh upstream proof：
   - 命令：`node --experimental-strip-types scripts/run-test-group.ts integration --test-name-pattern 'poster_onepager|knowledge-poster'`
   - 证明面：guarded knowledge-poster managed execution、shared source-truth consumption、shared runtime route/review/export
   - 结果：`32/32 pass`
4. 同一主线的 shared runtime contract lane 仍然是绿的：
   - 命令：`npm run test:fast`
   - 结果：closeout 当次记录为 `64/64 pass`
   - 备注：若后续 fast lane 吸收新的 active-baton capability tests，计数以 fresh verification 输出为准，不改写这次 F4 closeout 的 completed 结论

## 对历史 blocker 的诚实处理

`contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json`
与 `docs/program/upstream_hermes_agent_live_verification_blocker.md`
不会被改写成“从未发生过”。

这次 closeout 只说明两件事：

- 历史 `ppt_deck screenshot_review` 失败，在标准 `run-test-group` live launcher + Playwright Python contract 下没有再次复现
- 历史 `/v1/runs/{run_id}/events` terminal-event 缺失，在本轮 fresh live verification 里也没有再次复现

因此当前可以诚实宣称：

- upstream `Hermes-Agent` live run surface 在该 closeout 中可被验证；当前 OPL-hosted 口径由 `OPL Runtime Manager` 作为薄 adapter/projection layer 消费
- `RedCube AI` 继续拥有 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 与 visual-domain truth
- F4 不再是当前宿主上的 stop boundary

但当前不能过度宣称：

- mature `RedCube Product Entry` 已落地
- `OPL Product Entry -> OPL Runtime Manager -> configured family runtime provider -> RedCube` 已进入同一 downstream hosted integration path，但仍不是成熟 end-user 托管前台路线；Hermes-first live verification 是历史 proof，不是当前生产 substrate 结论

## 当前真实 gap

F4 closeout 完成后，当前主线剩余的 truthful gap 是：

- mature 的 `RedCube Product Entry` end-user product shell
- managed web runtime 上的 end-user 产品化壳

也就是说，下一阶段的问题已经不是“旧 terminal-event blocker 是否仍阻塞当前宿主”，
而是“最终用户产品入口何时以同一个 service-safe domain entry 落地”。
