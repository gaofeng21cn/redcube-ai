# Native Helper Stage Skill Policy Ref

Owner: `RedCube AI`
Purpose: `stage_skill_policy_ref_for_native_helper_boundaries`
State: `policy_ref_not_standalone_professional_skill`
Machine boundary: 本文件是 Declarative Visual Pack 的旧 `agent/skills/*.md` policy ref，用来约束 stage 如何使用 native helper。它不是 standalone Codex professional skill，也不是 tool/helper 本体。

策略:
- Native helper 只能通过 RCA route policy、review/export gates、helper catalog refs 和 owner receipt refs 物化文件。
- Native helper 可以返回 conversion failure、geometry evidence、package manifest 和 artifact refs。
- Native helper 不能生成 visual ready、exportable、handoffable、communication acceptance、visual direction acceptance 或 review verdict。
- Helper output 必须留在 workspace/runtime artifact roots，不能写回 repo source directory。

分工说明:
- Stage prompt 决定 stage 目标和返回 refs。
- Professional specialist skill 承载 native PPT design、template profiling 等可复用专业方法。
- Tool/helper 只负责物化、校验、截图、渲染、导出和记录 manifest。
- 本文件只声明 stage 使用 helper 的 policy boundary。
