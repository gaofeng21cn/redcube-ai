# Visual Memory Stage Skill Policy Ref

Owner: `RedCube AI`
Purpose: `stage_skill_policy_ref_for_visual_memory_boundary`
State: `policy_ref_not_standalone_professional_skill`
Machine boundary: 本文件是 Declarative Visual Pack 的旧 `agent/skills/*.md` policy ref，用来约束 stage 如何提出、接受、拒绝和投影 visual memory。它不是 standalone Codex professional skill，也不是 external skill repo。

策略:
- Memory body 和 accept/reject verdict 归 RCA。
- 当 rendered artifacts 与 review evidence 证明某个 visual pattern 时，review stage 可以提出 memory writeback refs。
- 接受或拒绝必须经过 AI-first RCA judgment，并返回 owner receipt refs。
- OPL 只接收 locator、proposal、receipt 和 operator projection refs；它不能读写 memory body。

分工说明:
- Stage prompt 决定 stage output boundary。
- Professional specialist skill 承载可复用 review 与 visual-pattern 方法。
- Tool/helper 可以 render、screenshot、compare、export 或记录 refs，但不能接受或拒绝 visual memory。
- 本文件只声明 memory-related stage behavior 的 policy refs。
