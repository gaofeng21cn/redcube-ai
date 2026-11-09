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

OfficeCLI 安装器与 Docker proof 镜像每次准备环境时解析官方最新版，从同一
release 下载二进制与 `SHA256SUMS` 并校验，不固定历史版本，也不关闭官方
自动更新。已安装的最新版可以复用；更新以原子替换保留正在运行的旧进程。
依赖检查在临时目录实际创建并关闭 PPTX，仅 `--version` 成功不能证明
materializer 可用。Linux CI 曾在建档时出现 `System.Private.Xml` 装配加载
失败，故最终仍须通过完整 native proof，不能由下载、版本号或自动更新
单独推断生成与渲染成功。

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

也可以使用隔离容器。当前源码 CI 基线是 `.nvmrc` 的 Node 26.13.0 LTS，
fallback 镜像跟随 Node 26 的受支持更新；容器与 hosted CI 分别验证：

```bash
docker build -f tools/native-ppt-proof/Dockerfile -t redcube-native-ppt-proof .
docker run --rm redcube-native-ppt-proof
docker run --rm -v "$PWD:/workspace" --mount type=volume,target=/workspace/node_modules -w /workspace redcube-native-ppt-proof bash -c "npm ci && tools/native-ppt-proof/run.sh --skip-system-deps --output-dir artifacts/image-native-ppt-proof"
docker run --rm -v "$PWD:/workspace" redcube-native-ppt-proof chown -R "$(id -u):$(id -g)" /workspace/artifacts/image-native-ppt-proof
```

容器以 root 生成产物，OfficeCLI 可能将 PPTX 保存为仅 owner 可读；最后一条命令
只把本次输出目录交还给宿主用户，便于读取和打包。即使 proof 失败，也应在查看已有
产物前执行该命令；Qualification 对该目录执行相同的 ownership 交接后再上传。

镜像构建会按 Docker `TARGETARCH` 选择 OfficeCLI 的 x64 或 arm64 官方资产，并把
`contracts/` 复制到镜像，使默认 doctor 命令在不挂载源码时也能完成自身诊断。
Qualification 的 `image-native-ppt-proof` job 在原生 amd64 与 arm64 runner 上
先真实 build 镜像，再运行默认 doctor 并检查 helper 与 renderer 可用，
最后在源码挂载和独立 `node_modules` volume 中执行 native proof；其 artifact 只证明
该镜像的构建与容器内 proof，不替代 hosted native proof、视觉审查、发布或业务验收。

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

原生 true-render 与容器 proof CI job 在 Qualification 的 workflow dispatch 或
每周定时运行；默认快测不声明 renderer 或生产验收完成。
