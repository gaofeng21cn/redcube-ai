# RCA domain handler wording closeout

Owner: `RedCube AI`
Purpose: `rca_domain_handler_wording_retirement_closeout`
State: `history_closeout`
Machine boundary: 本文是本轮文档治理证据。当前 direct/hosted boundary 机器真相继续归 product-entry manifest、domain-handler source、CLI/MCP/API behavior、contracts、runtime artifacts、owner receipts 和 OPL-generated descriptor refs。
Date: `2026-06-06`

## Planned

- 退役 public/support docs 中把 `domain_action_adapter` 写成 RCA 正向 callable entry 的旧 wording。
- 当前读法统一为 RCA `domain-handler export|dispatch` target，加 OPL-generated `domain_action_adapter` descriptor refs。
- 保留 tests/contracts/source 中用于 refs-only descriptor、negative guard 或 semantic id 的 `domain_action_adapter` 用法。

## Done

- `README.zh-CN.md` 与英文 README 的 public quickstart wording 对齐为 `product domain_handler/projection refs`。
- `docs/references/rca-visual-deliverable-agent-ideal-state.md` 将 OPL-hosted path、entry diagram 和 support reference wording 收敛到 RCA domain handler target。
- `docs/references/integration/opl-family-contract-adoption.md` 将 memory descriptor parity wording 收敛为 domain-handler refs / OPL-generated descriptor refs 分层。

## Deferred

- 无。本轮只处理 current non-history docs 的 stale wording，不改 contracts/source/tests。

## Skipped

- 未删除 `domain_action_adapter` negative guards、descriptor refs、manifest refs 或 tests；这些仍保护 OPL-generated descriptor 和 refs-only boundary。
- 未重写 Hermes、runtime owner 或 domain memory support reference 的其它当前内容。

## Verification

Commands run from `/Users/gaofeng/workspace/redcube-ai/.worktrees/rca-domain-handler-wording-20260606`:

```bash
rtk rg -n "product domain_action_adapter|thin domain_action_adapter|domain_action_adapter surface|domain_action_adapter / projection refs|domain_action_adapter、quality refs" README*.md docs --glob '!docs/history/**'
rtk git diff --check
rtk sh -lc '! rg -n "^(<<<<<<<|=======|>>>>>>>)" README*.md docs'
```

Result:

- Targeted stale wording scan found no matches in current non-history docs.
- `git diff --check` passed.
- Conflict-marker scan found no matches.

## Commit-Push State

- Commit pending at closeout verification time.
- Push not performed in this tranche.
