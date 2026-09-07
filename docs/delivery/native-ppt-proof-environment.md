# Native PPT 开发 Proof 环境

本页是隔离 developer/CI proof 的运行说明。原生对象与目标验收归 [native spec](../specs/native-ppt-ppt-master-parity.md)，设计方法归专业 Skill 和 [来源参考](../references/native-ppt-open-source-design-discipline.md)。真实用户交付从 OPL-hosted action 进入，不能用本页 runner 代替。

## 依赖

`contracts/runtime-program/ppt-native-python-engine-contract.json` 和
`contracts/runtime-program/python-native-helper-catalog.json` 声明 helper。
当前 writer 为 OfficeCLI，true render 使用 LibreOffice headless -> PDF -> Poppler PNG，中文字体优先 Noto Sans CJK SC。

开发安装器：

```bash
tools/native-ppt-proof/install-deps.sh
```

macOS 使用 Homebrew 安装 LibreOffice、Poppler 和字体；Debian/Ubuntu 使用 apt。
这是显式开发环境准备，不是 hosted action 的隐式安装动作。

Python 依赖由 `pyproject.toml` 和 `uv.lock` 提供，Node 使用 `npm ci`。
venv 必须在 checkout 外：

```bash
export UV_PROJECT_ENVIRONMENT="$(mktemp -d)/redcube-ai-native-helper-venv"
uv sync --locked --no-dev --extra native --no-install-project
npm ci
PYTHONPATH=python "$UV_PROJECT_ENVIRONMENT/bin/python" -m redcube_ai.native_helpers.doctor
```

`--no-install-project` 与 `PYTHONPATH=python` 避免向源码写入 venv 或 egg-info。
doctor 返回 renderer availability 与缺失 capability；不可用时记录
`missing_renderer_dependency`，不能以 synthetic preview 或 OfficeCLI validate 冒充 true render。

## 运行

```bash
tools/native-ppt-proof/run.sh --skip-system-deps --output-dir /tmp/rca-native-ppt-proof
```

不带 `--skip-system-deps` 时 runner 可以调用开发安装器；
`REDCUBE_NATIVE_PPT_PROOF_SKIP_SYSTEM_DEPS=1` 具有同样的跳过效果。
选择外部 workspace/artifact 目录保存结果，避免将样片纳入源码。

runner 通过 exact helper/probe contract 物化 `data_charts` fixture，输出
doctor、helper output、package readback、quality verdict、proof summary、
artifact index、PPTX/PDF、shape manifest 与 PNG screenshots。

也可以使用隔离容器：

```bash
docker build -f tools/native-ppt-proof/Dockerfile -t redcube-native-ppt-proof .
docker run --rm -it -v "$PWD:/workspace" -w /workspace redcube-native-ppt-proof bash -lc "npm ci && tools/native-ppt-proof/run.sh --skip-system-deps --output-dir /tmp/rca-native-ppt-proof"
```

需要保留容器产物时，将外部输出目录单独挂载到容器的输出路径。

## 结果解读

Mock provider/Codex fixture 只证明 plumbing、shape-plan validation、物化、render wiring 和 export-file wiring。它不是设计样片，不能签 visual、export、handoff、domain 或 production ready。

真实 native sample 必须由 hosted `run_native_ppt_proof` 或明确 native 的
`artifact_creation` Attempt 产生 AI-authored `editable_shape_plan`，保留
design spec、professional design brief、真实截图、独立 review 和 export evidence。
Helper 不选择模板或设计；可读候选携带质量债继续，ready 声明保持关闭。

Agent Lab 仅消费 refs、比较候选和效率；它不取得 artifact mutation、memory、
review/export 或 owner receipt authority。尚未闭合的 live 与跨 viewer 证据见
[未完成验收](../active/rca-ideal-state-gap-plan.md)。

## 定向检查

```bash
node --test tests/python-native-helper-catalog.test.js tests/native-ppt-proof-fixture-contract.test.js tests/ppt-native-quality-package-gates.test.js
```

原生 true-render CI job 只在 workflow dispatch、nightly 或带
`native-ppt-proof` label 的 PR 中运行；默认快测不声明 renderer 或生产验收完成。
