# RedCube AI 使用入口

Owner: RedCube AI
Purpose: 给用户和 operator 一条不依赖 repo-local runtime 的 RCA 使用路径。
State: active
Machine boundary: 命令形状以当前安装的 OPL-generated interface 为准；本文不冻结 CLI 参数。

## 开始

1. 通过当前 OPL-generated interface 确认 `rca` Package 已由实际 carrier 安装并可调用，
   读取完整 Package 的 fresh readback。Framework 委托 configured native carrier 执行
   物理动作并聚合状态；RCA owner 持有 identity、完整 bytes 与 publication。
2. 从 OPL-generated RCA surface 选择完整 visual-deliverable action，或显式选择 image/native proof action。
3. 提供目标、source/artifact refs、交付格式与需要的 human-review intent。
4. 让 OPL-hosted StageRun 按 RCA declarative stage graph 推进。
5. 从 OPL status/workbench surface 读取 StageRun、artifact、review、blocker 与 owner refs。

## 常用动作语义

- `invoke_product_entry`：启动完整 RCA visual-deliverable stage graph；
- `run_image_ppt_proof`：从 artifact creation 进入 image-first proof；
- `run_native_ppt_proof`：从 artifact creation 进入 editable native PPT proof。

具体 action input/output schema 由当前 `contracts/action_catalog.json` 与 OPL compiled interface 决定。

`rca` 是 executor-neutral 的 `OPL Package(kind=agent)`。Codex Plugin 是当前 carrier
projection，Codex CLI 是当前首选 executor；切换 executor 不应重装 RCA 或丢失任务、
偏好与 typed views。RCA owner 独立发布完整 Package bytes，并只推进自己的
`latest-stable`；普通 dependency 只检查 identity presence 与 callability。

## 人工审阅

需要“先看大纲/蓝图再继续”时，把 human-review intent 放入同一 action invocation。controller 在可审阅 artifact 后 materialize human gate；批准后沿同一 StageRun invocation 和 exact artifact lineage 继续。

## 运行期入口

运行期 action、StageRun/status 和 native-helper 调用都走 OPL-generated/hosted surfaces；本仓的 repo-local scripts 只用于开发验证，RCA 领域判断仍由 RCA owner 持有。
