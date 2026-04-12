# Upstream Hermes-Agent Final Target Shape

状态锚点：`2026-04-12`

## 一句话结论

`RedCube AI` 的最终目标，不是继续打磨 repo-local runtime，也不是把自己写成整个 `OPL`。
这条主线已经冻结的理想型是：

`User -> RedCube Product Entry -> RedCube Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

放到 `OPL` 顶层语义里，同一目标形态应收口为：

`User -> OPL Product Entry -> OPL Gateway -> Hermes runtime substrate -> RedCube service-safe domain entry -> RedCube visual-domain truth surfaces`

## 最终目标到底是什么

最终目标是把 `RedCube AI` 收敛成一个 `OPL` 可调用、也可独立直达的 visual-domain 产品 / 服务节点。
它应当：

- 让上游 `Hermes-Agent` 真正承担 session / run / watch / resume / scheduling 这层 runtime substrate
- 让 `RedCube AI` 继续承担 `gateway -> family -> profile -> pack` authority 与 visual-domain truth
- 让 direct `RedCube Product Entry` 与 `OPL Gateway` handoff 收敛到同一个 service-safe domain entry contract

最终目标不是让 `RedCube AI` 变成整个 `OPL`，也不是把 repo-local `Hermes` 命名重新包装成“长期 runtime owner”。

## 边界怎么分

上游 `Hermes-Agent` 长线负责：

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

- route / managed run surface 已切到真实上游 `Hermes-Agent`
- `redcube_service_safe_domain_entry` 已冻结为 machine-readable domain adapter
- `CLI` / `MCP` 仍是 repo-verified public entry
- visual-domain truth 仍由 `RedCube AI` 收口，没有被 runtime cutover 冲散

## 当前还没有落地的部分

- repo-verified 的 `RedCube Product Entry` service surface 已落地，但成熟的最终用户产品入口前台壳仍未落地
- repo-verified 的 `OPL Product Entry -> OPL Gateway -> RedCube` handoff 已能进入同一个 downstream product entry，但仍不是成熟的 end-user 托管前台路线
- 当前 landed 的是 service surface、CLI/MCP wrapper 与 session continuity，不是独立 UI 或 managed web runtime shell

## 当前真实 gap

当前已经不是旧的 upstream run-surface terminal-event blocker 在卡这条线了。
在 `2026-04-12` 的当前验证宿主上，live upstream preflight 已能通过，`xiaohongshu` 的 baseline / optimize_existing 链路也已 fresh 穿过 `screenshot_review` 与 `publish_copy`。
因此当前真正还没落地的，不是 runtime substrate proof，也不再是 repo-verified product-entry service surface，而是：

- mature 的最终用户 `RedCube Product Entry` 前台壳
- managed web runtime 上的产品化壳

## 明确不做的事

- 不把 `RedCube AI` 写成整个 `OPL`
- 不把 repo-local `Hermes` 命名重新包装成“已接入上游”
- 不先做聊天 UI、自然语言壳或平台故事
- 不先开新 family、academic poster 或 controller expansion
