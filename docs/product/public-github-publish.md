# 公开发布到 GitHub

Owner: `RedCube AI`
Purpose: `public_repository_publish_guide`
State: `active_support`
Machine boundary: 人读发布协作指南。机器真相继续归 git state、GitHub remote state、repo source、contracts、ignored local config 和 runtime artifacts。

本文档说明如何把当前 RedCube 仓库作为一个公开仓库发布，同时继续把个人作者信息、私有 prompts 和业务素材留在仓库外。

## 原则

- 公开仓库只放代码、公开 prompts、测试、公开文档
- 个人作者人设、品牌、私有 prompts、业务素材不进仓库
- 运行时工作区也不放在本仓库根目录
- GitHub 首页与公开引用文档优先放在 `docs/`

## 发布前确认

在仓库根目录执行：

```bash
git log --oneline --decorate -n 3
git remote -v
git status --short --ignored
```

理想状态：

- 只有新的主分支历史
- 没有旧 remote
- 工作树干净
- `.env`、`.cursor/`、`config/local/` 之类本地文件保持忽略状态

## 使用 GitHub CLI 创建仓库并推送

先确认当前机器已经登录 GitHub：

```bash
gh auth status
```

然后在仓库根目录执行：

```bash
gh repo create gaofeng21cn/redcube-ai \
  --public \
  --source=. \
  --remote=origin \
  --push
```

如果你要换仓库名，只需要替换 `gaofeng21cn/redcube-ai`。

## 推送后检查

```bash
git remote -v
git log -1 --format='%an <%ae>'
gh repo view --web
```

建议重点确认：

- `origin` 已写入
- 最近一次提交作者符合你的预期
- GitHub 页面只包含公开仓库应有内容

## 后续日常使用建议

### 1. 不把业务工作区放到仓库里

推荐把真实使用工作区放到独立目录，再通过配置指向它：

```bash
export REDCUBE_ROOT_DIR="/absolute/path/to/workspace"
export REDCUBE_WORKSPACE_ROOT="/absolute/path/to/workspace"
```

### 2. 不把私有 prompts 和作者信息放回仓库

请把以下内容放在仓库外：

- `~/.config/redcube/`
- `<workspace>/.redcube/`
- `config/local/` 下的本机私有覆盖文件

### 3. 提交前先检查差异

```bash
git status --short
git diff --stat
```

如果看到你不希望公开的本地素材，先停下，确认它们是否真的在受 `.gitignore` 保护。
