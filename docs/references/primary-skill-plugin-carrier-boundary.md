# Primary Skill 与 Plugin Carrier 边界

Owner: `RedCube AI`
Purpose: `primary_skill_plugin_carrier_boundary_reference`
State: `active_support`
Machine boundary: 人读边界说明。机器真相继续归 `contracts/capability_map.json`、`agent/primary_skill/SKILL.md`、`plugins/redcube-ai/.codex-plugin/plugin.json` 和 `plugins/redcube-ai/skills/redcube-ai/SKILL.md`；本文不声明 visual ready、exportable、handoffable、domain ready 或 production ready。

本文说明 RCA rich primary skill 与 Codex plugin skill 的职责区别。它只解释为什么两处 skill 文本同时存在，不把二者写成两套业务能力，也不把 plugin carrier 写成 RCA visual truth owner。

## 当前读法

| Surface | 职责 | 不承担 |
| --- | --- | --- |
| `agent/primary_skill/SKILL.md` | RCA 的标准 OPL domain pack / Rich App primary skill repo source。它是 `contracts/capability_map.json#/capabilities?surface_role=primary_skill` 登记的 canonical source，用于表达 RedCube 作为 visual-deliverable domain app 的主 skill 语义。 | 不持有 visual truth、artifact body、review/export verdict、owner receipt、typed blocker 或 runtime data。 |
| `plugins/redcube-ai/skills/redcube-ai/SKILL.md` | Codex plugin carrier mirror / 安装发现面。它随 `plugins/redcube-ai/.codex-plugin/plugin.json` 暴露给 Codex plugin scaffold、安装发现和外部 carrier channel。 | 不定义第二套 RCA 业务能力，不持有 visual truth、artifact body、review/export verdict、owner receipt、typed blocker 或 runtime data。 |

`plugins/redcube-ai/skills/redcube-ai/SKILL.md` 与 `agent/primary_skill/SKILL.md` 内容接近是有意的 carrier mirror，不是待删除的重复实现。两者的同步关系由 `contracts/capability_map.json` 的 `redcube-ai.primary_skill` capability 记录：canonical path 是 `agent/primary_skill/SKILL.md`，plugin skill 是 `codex_plugin_carrier_compat_mirror`，plugin manifest 是 `canonical_plugin_scaffold_source_locator`。

## 为什么两者都保留

RCA 目标态是标准 OPL Agent：`Declarative Visual Pack + OPL generated/hosted surfaces + minimal authority functions`。`agent/primary_skill/SKILL.md` 属于这个 repo-local semantic pack，是 Rich App / OPL primary skill source 的标准位置。

Codex plugin 安装和发现需要 plugin 目录下的 carrier surface。`plugins/redcube-ai/` 因此保留 `.codex-plugin/plugin.json`、图标和 `skills/redcube-ai/SKILL.md`，让 Codex Developer Mode / plugin Flow 能定位和安装 `redcube-ai`。这个 carrier channel 只解决 metadata、source locator 和安装发现，不改变 RCA domain owner。

## 权威边界

- RCA visual truth、layout/review/export verdict、artifact authority、visual memory accept/reject、owner receipt 和 typed blocker 仍归 RCA owner chain、contracts、source、runtime artifact 与 review/export gates。
- OPL / Codex plugin carrier 可以发现、承载和投影 skill 入口，但不能写 RCA visual truth、artifact body、memory body、review/export verdict、owner receipt、typed blocker 或 runtime data。
- 第 11 条 `Codex plugin legacy alias cutover` 已关闭的是 legacy alias / scaffold 归一：根层 `.codex-plugin/plugin.json`、repo-local installer、`plugins/rca` 和旧 `skills/rca` alias 不再作为安装或发现路径。它不是要求删除 `agent/primary_skill/SKILL.md` 或 `plugins/redcube-ai/skills/redcube-ai/SKILL.md` 之一。
- 以后如果 plugin carrier 的安装机制变化，先更新 `contracts/capability_map.json` 的 capability ref 和 plugin scaffold，再同步本文；不能直接把 carrier mirror 当作重复实现删除。
