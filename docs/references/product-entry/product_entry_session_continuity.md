# Product Entry Session Domain Snapshot Boundary

Owner: `RedCube AI`
Purpose: `product_entry_session_domain_snapshot_support`
State: `contract_linked_support`
Machine boundary: 人读 product-entry support。机器真相归 `contracts/runtime-program/product-entry-session-continuity.json`、`contracts/physical_source_morphology_policy.json`、API behavior、source 和 OPL generated product-entry session surface。

状态锚点：`2026-07-10`

## 一句话结论

Product session 的持久化、continuation identity 与 provider currentness 归 OPL；RCA 不再持有本地 session store，也不扫描 workspace runs 推导 session currentness。RCA 只消费 pinned `buildGeneratedProductEntrySessionSurface` 产生的 `opl_generated_product_entry_session_surface`，并返回 domain snapshot、deliverable locator、currentness、Stage Folder locator 与 artifact authority refs。

## 当前调用边界

- `invokeProductEntry`：执行 RCA domain entry，并返回 `session_handoff_refs` 给 OPL 持久化。
- `invokeOplHostedProductEntry`：校验 hosted envelope 后复用同一 domain entry，不组装 session/workbench shell。
- `getProductEntrySession`：必须接收 `opl_generated_session_surface`，只投影其 `domain_projection` 中的 RCA domain refs。
- `opl_generated:product_session`：generic product-session shell 与 continuation 的 owner surface。

OPL generated session surface 必须提供：

- `domain_id=rca`、`domain_owner=redcube_ai` 与 canonical runtime owner
- `entry_session.entry_session_id`
- `delivery_identity`
- `domain_projection.surface_kind=rca_product_entry_session_handoff_refs`
- `domain_projection` 中的 snapshot、currentness、Stage Folder 与 artifact authority refs

provider attempt currentness 必须同时提供 `provider_attempt_ref` 与 `provider_attempt_ledger_ref`；只提供其中一个会 fail closed。

## 已物理退役

RCA source tree 不再包含：

- `product-entry-session-refs.ts`
- `product-entry-currentness-resolver.ts`
- `get-product-entry-session-parts/session-surfaces.ts`
- `product-entry-continuity-surfaces.ts`

`scripts/check-private-platform-retirement.ts` 通过 TypeScript AST hard gate 保证这些文件不得复活，并禁止 product-session owner source 导入 `node:fs` / `node:fs/promises` 或重新输出本地 session persistence 字段。

## 明确不做

- 不保留旧 store compatibility、fallback restore 或 local-currentness wrapper。
- 不把 `entry_session_id` 当成 RCA 本地持久化 key。
- 不返回 continuity、progress、artifact inventory、runtime-loop、family orchestration 或 workbench body。
- 不把 docs、focused tests 或 refs-only projection 写成 OPL runtime readiness 证据。
