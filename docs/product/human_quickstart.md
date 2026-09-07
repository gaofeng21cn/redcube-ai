# RedCube AI 使用入口

Owner: RedCube AI
Purpose: 给用户和 operator 一条不依赖 repo-local runtime 的 RCA 使用路径。
State: active
Machine boundary: 命令形状以当前安装的 OPL-generated interface 为准；本文不冻结 CLI 参数。

## 安装 Codex 入口

在 Codex 桌面中打开本仓；首次 checkout 或 marketplace 变化后重启应用，在 Plugins 中安装 RedCube AI，再新建任务调用 `@RedCube AI` 或 `$redcube-ai`。

CLI 在仓库根目录管理同一 carrier：

```bash
codex plugin marketplace add .
codex plugin marketplace list --json
codex plugin add redcube-ai@redcube-ai --json
codex plugin list --marketplace redcube-ai --available --json
```

需要移除时使用 `codex plugin remove redcube-ai@redcube-ai --json`；删除 marketplace 使用 `codex plugin marketplace remove redcube-ai --json`。这些操作只管理入口 Skill carrier，不安装 OPL Base，也不证明完整 Package、hosted StageRun 或视觉验收。

## 执行交付

1. 从当前 OPL interface 和实际 carrier 读取完整 `rca` Package 的 installed/callable 状态以及 executor readiness；缺少 runtime 或完整 bytes 时交由对应平台 owner 处理。
2. 普通交付选择 `invoke_product_entry`；仅做 image proof 时选 `run_image_ppt_proof`，明确 native proof 时选 `run_native_ppt_proof`。动作输入与输出以 `contracts/action_catalog.json` 为准。
3. 提供目标、受众、source/artifact refs、交付格式和人工审阅意图，让同一 hosted StageRun 按 RCA 阶段图继续。
4. 从 OPL status/workbench 读取 artifact、review、blocker 和 owner refs。候选文件与质量债要明确说明，不能由文件存在推断正式接受。

## 人工审阅

需要“先看大纲/蓝图再继续”时，把 human-review intent 放入同一 action invocation。controller 在可审阅 artifact 后 materialize human gate；批准后沿同一 StageRun invocation 和 exact artifact lineage 继续。

## 运行期入口

运行期 action、StageRun/status 和 native-helper 调用都走 OPL-generated/hosted surfaces；本仓的 repo-local scripts 只用于开发验证，RCA 领域判断仍由 RCA owner 持有。
