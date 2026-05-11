# Upstream Hermes-Agent Final Target Shape

状态锚点：`2026-04-12`

## 一句话结论

`RedCube AI` 的最终目标，不是继续打磨 repo-local runtime，也不是把自己写成整个 `OPL`。
对外第一身份是独立 visual-deliverable domain agent，`gateway / harness` 只作为内部边界语言。
这条主线已经冻结的理想型是：

`User -> RedCube Product Entry -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

放到 `OPL` 顶层语义里，同一目标形态应收口为：

`User -> OPL Product Entry -> OPL Runtime Manager -> configured family runtime provider -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

## 最终目标到底是什么

最终目标是把 `RedCube AI` 收敛成一个 `OPL` 可调用、也可独立直达的 visual-domain 产品 / 服务节点。
它应当：

- 让 `OPL Runtime Manager` 作为 OPL 侧 thin product-managed adapter/projection layer，管理 configured family runtime provider 的 profile/provisioning、task registration hydration、runtime status projection、doctor/repair/resume、native helper catalog 与高频状态索引；Temporal 是生产 substrate 目标，Hermes 只保留 legacy/optional provider 或显式 proof lane
- 让 `RedCube AI` 继续承担 `gateway -> family -> profile -> pack` authority 与 visual-domain truth
- 让 direct `RedCube Product Entry` 与 `OPL Runtime Manager` handoff 收敛到同一个 service-safe domain entry contract
- 让 `Codex CLI` 继续作为 executor adapter 背后的默认 concrete executor，不改写 default executor owner

最终目标不是让 `RedCube AI` 变成整个 `OPL`，也不是把 repo-local `Hermes` 命名重新包装成“长期 runtime owner”。

## 边界怎么分

`OPL Runtime Manager` 长线负责：

- product-managed adapter/projection layer
- configured family runtime provider 的 registration / status / doctor / repair / resume 投影
- native helper catalog 与高频状态索引

configured family runtime provider 可承担：

- runtime substrate / orchestration
- run session、interrupt / resume、watch、recovery
- future product-entry shell 背后的 runtime session continuity

`RedCube AI` 长线继续负责：

- visual domain gateway
- family / profile / pack authority
- `program_id`、`topic_id`、`deliverable_id`、`run_id`
- `auditDeliverable`、`runtimeWatch`、`getReviewState`、`getPublicationProjection`
- canonical artifacts、review / projection、delivery contract 与 export truth

因此，future `RedCube Product Entry` 的价值，不是替代上游 runtime，而是把用户入口稳定接到同一个 service-safe domain entry 上。

## 当前已经落地的部分

- external `Hermes-Agent` live/proof substrate 已有历史可验证 closeout 记录；当前 federation 入口通过 `OPL Runtime Manager` 作为薄 adapter/projection layer 消费 configured family runtime provider，不把 repo-local wrapper 或 Hermes-first proof 写成当前 substrate ownership proof
- `redcube_service_safe_domain_entry` 已冻结为 machine-readable domain adapter
- `CLI` / `MCP` 仍是 repo-verified public entry
- repo-verified direct route 与 `OPL Runtime Manager` internal bridge 已对齐为同一 downstream domain-agent entry
- visual-domain truth 仍由 `RedCube AI` 收口，没有被 runtime cutover 冲散

## 当前还没有落地的部分

- repo-verified 的 `RedCube Product Entry` service surface 已落地，但成熟的最终用户产品入口前台壳仍未落地
- repo-verified 的 `OPL Product Entry -> OPL Runtime Manager -> configured family runtime provider -> RedCube` internal bridge 已能进入同一个 downstream product entry，但仍不是成熟的 end-user 托管前台路线，也不等于生产级 Temporal stage execution 已完成
- 当前 landed 的是 service surface、CLI/MCP wrapper 与 session continuity，不是独立 UI 或 managed web runtime shell

## 当前真实 gap

当前已经不是旧的 upstream run-surface terminal-event blocker 在卡这条线了。
在 `2026-04-12` 的当前验证宿主上，live upstream preflight 已能通过，`xiaohongshu` 的 baseline / optimize_existing 链路也已 fresh 穿过 `screenshot_review` 与 `publish_copy`。
因此当前真正还没落地的，不是旧 terminal-event proof blocker，也不再是 repo-verified product-entry service surface，而是：

- mature 的最终用户 `RedCube Product Entry` 前台壳
- managed web runtime 上的产品化壳

## 明确不做的事

- 不把 `RedCube AI` 写成整个 `OPL`
- 不把 repo-local `Hermes` 命名重新包装成“已接入上游”
- 不先做聊天 UI、自然语言壳或平台故事
- 不先开新 family、academic poster 或 controller expansion
