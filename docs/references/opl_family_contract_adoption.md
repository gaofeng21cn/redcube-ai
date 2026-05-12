# RCA Adoption of OPL Family Contracts

## Purpose

这份薄适配声明说明 `RedCube AI` 如何满足 `OPL` family runtime / quality / incident / operator projection 合同。它不把 `OPL` 变成 RedCube visual truth owner，也不把医学论文质量门或基金 fundability gate 引入 RCA。

## Runtime Attempt Projection

RCA 通过 product-entry session、`runtimeWatch`、artifact inventory 和 runtime health 映射 `opl_family_runtime_attempt_contract.v1`。这些 surface 可以向 `OPL` 投影 attempt state、retry/backoff、workspace boundary、failure reason、reconciliation status 和 last observed projection。

`OPL Runtime Manager` 只能读取和索引；visual deliverable runtime、route truth、canonical artifacts 继续由 RCA 持有。

## Quality Projection

RCA 通过以下 surface 映射 `opl_family_domain_quality_projection_contract.v1`：

- content-fit review
- `visual_director_review`
- `screenshot_review`
- render proof
- export proof
- `getReviewState`
- `getPublicationProjection`

RCA 的质量门是 visual-deliverable-specific：内容适配、视觉审阅、截图复审、render proof、export proof 与交付物 publication projection。`claim-only ready`、generic persona QA、medical publication gate、grant fundability gate、OPL projection-only 状态都不能成为 RCA visual quality authority。

## Incident Projection

RCA 通过 `runtimeWatch`、managed deliverable report、review/export gate audit 和 operator handoff 映射 `opl_family_incident_learning_loop.v1`。真实 incident 必须回流成 guard、test、contract、runbook、taxonomy update 或 operator projection；domain-specific failure 必须有 RCA-owned closure ref。

## Product Operator Projection

RCA 通过 product entry、product session、OPL-hosted integration、artifact inventory 与 review/publication projection refs 映射 `opl_family_product_operator_projection.v1`。这些投影必须保留 `source_refs`、`freshness`、`owner_split`、`next_surface_ref` 和 `human_gate_reason`。

## Lifecycle Adapter Surface

`opl_family_lifecycle_adapter` 是 RCA 侧的厚 adapter 投影。它把已有 managed-runs、product-entry sessions、artifact inventory、review state、publication projection 与 runtime loop closure 映射为 OPL family persistence / lifecycle / owner-route discovery / adoption surface。

manifest 暴露 `discoverable_manifest_projection`，用于 OPL Runtime Manager 发现 RCA 可采纳的 surface；direct product entry、OPL-hosted product entry 和 product-entry session 响应暴露 `hydrated_session_projection`，用于同一 `entry_session_id` 下恢复、索引和采纳当前 deliverable loop。

该 surface 继续遵守 RCA 当前持久化策略：canonical truth 仍是文件 authority 与可重建 artifact/session index，SQLite sidecar 保持 `deferred_for_rca`，只在实测 file-count 增长、跨 deliverable 查询压力或 retention ledger 成本达到阈值后重新评估。

## Stage Control Projection

`stage_control_projection` 是 RCA 给 OPL family Stage Control Plane 的 descriptor/read-only adapter。它只把现有 hydrated overlay `stage_sequence`、managed-runs、`runtimeWatch`、review/publication projection 与 artifact inventory 投影成 family stage kind；它不调度 stage、不改写 stage sequence、不接管 RedCube managed deliverable runtime。product-entry manifest 暴露的 descriptor 是 OPL discovery smoke 可直接消费的机器面：每个 stage 都带有 goal、owner、skills、allowed_action_refs、handoff、source refs、freshness、stage-to-action parity 与 RCA authority boundary。

当前映射覆盖 `ppt_deck`、`xiaohongshu` 与 `poster_onepager`：

- `source_intake`：PPT 的 `storyline`、小红书的 `research`、poster 的 `storyline`
- `communication_strategy`：PPT 的 `detailed_outline` / `slide_blueprint`、小红书的 `storyline` / `single_note_plan`、poster 的 `poster_blueprint`
- `visual_direction`：各 family 的 `visual_direction`
- `artifact_creation`：PPT 的 `author_image_pages` / explicit HTML / explicit native PPT authoring，小红书的 `author_image_pages` / explicit HTML，poster 的 `render_html`
- `review_and_revision`：visual director review、screenshot review 与对应 repair/fix route
- `package_and_handoff`：PPT 的 `export_pptx`、小红书的 `publish_copy` / `export_bundle`、poster 的 `export_bundle`

RCA 继续持有 visual truth、review/publication projection 与 artifact authority；OPL 只消费 stage descriptor projection。PPT 默认 route 仍是 image-first `author_image_pages`，HTML/native PPT 仍是显式可选路线。

## Boundaries

- `OPL` 只消费 RCA projection，不持有 RedCube visual truth。
- `OPL` 不拥有 canonical artifacts、review truth、publication projection 或 concrete executor。
- RCA 不引入 MAS 的 medical publication gate。
- RCA 不引入 MAG 的 grant fundability gate。
- `Hermes-Agent` 只保留显式 hosted/proof backend，不成为 OPL 或 RCA 的默认 owner。

## Domain Memory Index Status

RCA 当前已经通过 product-entry manifest 顶层 `domain_memory_descriptor` 暴露标准 `family-domain-memory-ref.v1` projection，并继续保留 RCA-owned `domain_memory_descriptor_locator`、migration plan、seed fixture locator、writeback proposal generator、accept/reject command、writeback receipt locator、operator receipt projection、`controlled_visual_stage_attempt` proof descriptor，以及 `controlled_memory_apply_proof`。它们证明 direct RedCube skill 与 OPL-hosted path 可以回到同一 RCA-owned descriptor、sidecar、quality refs，并且 memory apply 只携带 consumed refs、proposal projection、accepted/rejected receipt projection 和 no-forbidden-write audit。

2026-05-12 OPL fresh `domain-memory list --json` 已把 RCA 解析为 resolved descriptor。当前 repo-source contract / descriptor / apply-proof / skeleton audit 已 landed，但 provider-hosted production controlled visual stage soak 仍未完成；真实 visual memory body、真实 receipt instance 和 artifact output 仍属于 workspace/runtime roots。延后期间不得退化 descriptor、sidecar、quality refs、direct route parity 或 no-forbidden-write proof。

该 adapter 只解决 OPL family-level resolved-memory projection。OPL 可以索引、携带和投影 RCA memory refs；memory body、accept/reject、visual route、review/export verdict 与 canonical artifacts 继续由 RCA 持有。
