# RedCube AI 使用入口

Owner: RedCube AI
Purpose: 给用户和 operator 一条不依赖 repo-local runtime 的 RCA 使用路径。
State: active
Machine boundary: 命令形状以当前安装的 OPL-generated interface 为准；本文不冻结 CLI 参数。

## 开始

1. 通过 OPL package lifecycle 安装或更新 `rca` package，并读取 currentness / lifecycle receipt。
2. 从 OPL-generated RCA surface 选择完整 visual-deliverable action，或显式选择 image/native proof action。
3. 提供目标、source/artifact refs、交付格式与需要的 human-review intent。
4. 让 OPL-hosted StageRun 按 RCA declarative stage graph 推进；不要在仓库里启动第二个 runner。
5. 从 OPL status/workbench surface 读取 StageRun、artifact、review、blocker 与 owner refs。

## 常用动作语义

- `invoke_product_entry`：启动完整 RCA visual-deliverable stage graph；
- `run_image_ppt_proof`：从 artifact creation 进入 image-first proof；
- `run_native_ppt_proof`：从 artifact creation 进入 editable native PPT proof。

具体 action input/output schema 由当前 `contracts/action_catalog.json` 与 OPL compiled interface 决定。

## 人工审阅

需要“先看大纲/蓝图再继续”时，把 human-review intent 放入同一 action invocation。controller 在可审阅 artifact 后 materialize human gate；批准后沿同一 StageRun invocation 和 exact artifact lineage 继续。

## 禁止路径

不要调用 repo-local `redcube`、`@redcube/domain-entry`、`@redcube/runtime`、历史 product-entry/domain-handler wrapper，或直接编辑 StageRun/session/current pointer。native helper 也只能在受约束 Attempt 中经 OPL envelope 调用。
