# Visual Deliverable Authoring Stage Skill Policy Ref

Owner: `RedCube AI`
Purpose: `stage_skill_policy_ref_for_ai_first_visual_authoring`
State: `policy_ref_not_standalone_professional_skill`
Machine boundary: 本文件是 Declarative Visual Pack 的旧 `agent/skills/*.md` policy ref，用来约束 stage authoring 行为。它不是 standalone Codex professional skill，也不沉淀完整的 story architecture、visual direction、page authoring 或 review 方法。

适用 stage:
- `source_intake`
- `communication_strategy`
- `visual_direction`
- `artifact_creation`
- `review_and_revision`

策略:
- 使用 RedCube route contracts 和已批准 source truth 作为 authoring contract。
- 可见交付物文本必须面向 audience；internal route names、source ids、prompt fields 和 operator notes 保持私有。
- Screenshot 和 rendered page 是主要 review evidence。
- 返回 refs、receipts、typed blockers 和 repair targets，不返回泛化 success flag。

分工说明:
- Stage prompt 是每个 stage 的 operating surface。
- Professional specialist skill 是 repo-local 可复用方法层，覆盖 story architecture、visual direction、page authoring、review、native PPT design 和 template profiling。
- Tool/helper 处理 imagegen、screenshot/render、Office/PPT materialization、validation、export 和 manifests。
- 本文件只提供 stage 消费的 policy refs。
