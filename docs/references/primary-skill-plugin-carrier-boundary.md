# Primary Skill 与 Plugin Carrier 边界

Owner: `RedCube AI`
Purpose: `primary_skill_plugin_carrier_boundary_reference`
State: `active_support`
Machine boundary: 人读边界说明。机器真相继续归 `contracts/capability_map.json`、`agent/primary_skill/SKILL.md`、`plugins/redcube-ai/.codex-plugin/plugin.json` 和 `plugins/redcube-ai/skills/redcube-ai/SKILL.md`；本文不声明 visual ready、exportable、handoffable、domain ready 或 production ready。

本文说明 RCA rich primary skill 与 Codex plugin skill 的职责区别。它只解释为什么两处 skill 文本同时存在，不把二者写成两套业务能力，也不把 plugin carrier 写成 RCA visual truth owner。该模式是 OPL standard-agent carrier pattern：repo-local canonical source 与 Codex install carrier 同时保留，但权威只归 canonical source 和 RCA owner surfaces。

## 当前读法

| Surface | 职责 | 不承担 |
| --- | --- | --- |
| `agent/primary_skill/SKILL.md` | RCA 的标准 OPL domain pack / Rich App primary skill canonical source。它是 `contracts/capability_map.json#/capabilities?surface_role=primary_skill` 登记的 canonical source，用于表达 RedCube 作为 visual-deliverable domain app 的主 skill 语义。 | 不持有 visual truth、artifact body、review/export verdict、owner receipt、typed blocker 或 runtime data。 |
| `plugins/redcube-ai/skills/redcube-ai/SKILL.md` | Codex plugin install carrier 的 materialized full skill copy / compat mirror。它随 `plugins/redcube-ai/.codex-plugin/plugin.json` 暴露给 Codex plugin scaffold、安装发现和外部 carrier channel；Codex plugin 安装需要真实 `SKILL.md` 文件，所以这里保留物理文件，而不是 stub、symlink 或纯指针。 | 不定义第二套 RCA 业务能力，不持有 agent membership / status 权威，不覆盖 canonical source，也不持有 visual truth、artifact body、review/export verdict、owner receipt、typed blocker 或 runtime data。 |

`plugins/redcube-ai/skills/redcube-ai/SKILL.md` 与 `agent/primary_skill/SKILL.md` 的 full-copy 关系是有意的 carrier materialization，不是待删除的重复实现。两者的同步关系由 `contracts/capability_map.json` 的 `redcube-ai.primary_skill.carrier_projection_contract` 记录：`canonical_source=agent/primary_skill/SKILL.md`，`carrier_materialization=materialized_full_skill_copy`，`codex_install_requires_real_skill_md=true`，`carrier_role=transport_install_detail_not_agent_membership_or_status`，`authority=false`。

## 为什么两者都保留

RCA 目标态是标准 OPL Agent：`Declarative Visual Pack + OPL generated/hosted surfaces + minimal authority functions`。`agent/primary_skill/SKILL.md` 属于这个 repo-local semantic pack，是 Rich App / OPL primary skill source 的标准位置。

Codex plugin 安装和发现需要 plugin 目录下的真实 `SKILL.md` carrier surface。`plugins/redcube-ai/` 因此保留 `.codex-plugin/plugin.json`、图标和 `skills/redcube-ai/SKILL.md`，让 Codex Developer Mode / plugin Flow 能定位和安装 `redcube-ai`。这个 carrier channel 只解决 metadata、source locator、安装发现和 transport，不改变 RCA domain owner。

## 权威边界

- RCA visual truth、layout/review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker 仍归 RCA owner chain、contracts、source、runtime artifact 与 review/export gates。
- OPL / Codex plugin carrier 可以发现、承载和投影 skill 入口，但不能写 RCA visual truth、artifact body、memory body、review/export verdict、owner receipt、typed blocker 或 runtime data，也不能成为 agent membership/status 权威。
- 第 11 条 `Codex plugin legacy alias cutover` 已关闭的是 legacy alias / scaffold 归一：根层 `.codex-plugin/plugin.json`、repo-local installer、`plugins/rca` 和旧 `skills/rca` alias 不再作为安装或发现路径。它不是要求删除 `agent/primary_skill/SKILL.md` 或 `plugins/redcube-ai/skills/redcube-ai/SKILL.md` 之一。
- 以后如果 plugin carrier 的安装机制变化，先更新 `contracts/capability_map.json` 的 capability ref 和 plugin scaffold，再同步本文；不能直接把 carrier mirror 当作重复实现删除，也不能把它降成 stub、symlink 或纯指针。
