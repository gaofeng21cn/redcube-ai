# RCA 文档组合治理

Status: `active_docs_governance`
Owner: `RedCube AI`
Purpose: `docs_lifecycle_governance`
State: `active_support`
Machine boundary: 本文是人读治理入口。RCA 机器真相继续归 `contracts/runtime-program/current-program.json`、schema、source、CLI/MCP/API 行为、runtime artifacts、owner receipts 和语义化 `human_doc:*` id。

## 当前结论

`docs/**` 是 RCA 的中文内部开发与维护参考，不再维护 docs 层双语镜像。稳定路径优先使用无语言后缀 `.md` 承载中文 canonical 内容。历史文件可以保留旧双语或旧路径描述作为 provenance，但 active/reference 索引必须指向当前无后缀路径。

RCA 采用 OPL-family canonical docs taxonomy：

`active/public/product/runtime/delivery/source/policies/specs/references/history`

这个目录集合按长期职责保留，不按当前文件数量决定。RCA 当前 `active/product/runtime/delivery/source/policies/references/history` 都已有真实承载；`public/specs` 可以保持薄索引，但必须写清职责和新增正文准入规则。

## 与 OPL 的分层

OPL 系列项目全局主参考是 `/Users/gaofeng/workspace/one-person-lab/docs/active/opl-family-development-reference.md`。它持有全局 framework 目标、跨仓差距顺序、shared primitive 上收、App/workbench 目标和同名 docs taxonomy。

RCA 文档只维护 visual-deliverable domain agent 的目标、差距、visual truth、review/export verdict、artifact authority、direct product-entry path、OPL-hosted sidecar/projection/receipt 边界，以及 RCA-to-OPL 上收候选。MAS、MAG、MDS 或 OPL-owned App/workbench 的并行 backlog 不写入 RCA active docs。

## 目录职责

| 目录 | 长期职责 | 当前 RCA 承载 |
| --- | --- | --- |
| `docs/` root | docs 入口、核心五件套、docs governance | `README.md`、核心五件套、本文件。 |
| `docs/active/` | 当前执行、当前计划、当前差距、contract-linked active baton、closeout evidence | product entry / managed entry / OPL-hosted entry 等 current baton。 |
| `docs/public/` | public narrative index | 当前较薄；除非未来有真正公开材料，否则保持薄索引。 |
| `docs/product/` | quickstart、profile、public publish、product/operator handoff | 真实承载。 |
| `docs/runtime/` | runtime topology、executor/backend、service-safe entry、watch/projection | 真实承载但较薄，核心是 runtime architecture。 |
| `docs/delivery/` | deliverable family、route、proof、export、manual validation | 真实承载。 |
| `docs/source/` | source readiness、augmentation、deep research trigger/gate | 真实承载。 |
| `docs/policies/` | AI-first、visual memory、runtime operating model、deliverable contract model 等稳定规则 | 真实承载。 |
| `docs/specs/` | 当前仍有效的技术规格索引 | 当前较薄；不扩成杂物层。 |
| `docs/references/` | target state、OPL handoff、memory locator、治理 checklist、support references | 真实承载；不承担 active owner。 |
| `docs/history/` | Hermes proof/provenance、absorbed tranche、历史计划、tombstone | 真实承载。 |

## 非 canonical 目录

旧 `docs/program/` active baton 目录已物理退役。当前 baton brief 进入 `docs/active/`；已吸收 Phase 2 tranche 进入 `docs/history/phase-2/`；upstream Hermes proof/provenance 进入 `docs/history/hermes/`。`human_doc:program_*` 继续作为语义化读者上下文 ID，不暗示物理目录名。

`capabilities` 不作为 RCA docs active 目录复活。Capability truth 优先归 contracts、runtime manifest、CLI/MCP surface、delivery/source/runtime owner docs 或 domain action catalog。

## 内容级整合规则

1. 当前 visual truth、route truth、review/export verdict、artifact authority 合入核心五件套、runtime/delivery/source owner docs 或 machine surfaces。
2. 当前 baton 和 contract-linked active brief 留在 `docs/active/`。
3. Product/operator/profile/release 支撑进入 `docs/product/`。
4. Runtime topology、service-safe entry、watch/projection 进入 `docs/runtime/`。
5. Deliverable route/proof/export/manual validation 进入 `docs/delivery/`。
6. Source readiness、augmentation、deep research trigger/gate 进入 `docs/source/`。
7. AI-first、visual memory、runtime model、deliverable contract model 等稳定规则进入 `docs/policies/`。
8. 目标态、OPL handoff、governance checklist 和支持性技术参考进入 `docs/references/`，不得写成 current truth。
9. Hermes-first、gateway/harness/bridge/federation 旧叙事进入 `docs/history/` 或 tombstone。

## Direct Retirement

当旧模块、旧接口、旧 CLI alias、旧 wrapper、旧 facade、旧测试入口或旧文档入口已被当前 owner surface 替代时，默认直接退役。迁移 active caller 后删除旧面；需要来龙去脉时只保留 history/tombstone/provenance，不新增 compatibility shim、别名、re-export facade 或 compatibility-only 聚合测试。
