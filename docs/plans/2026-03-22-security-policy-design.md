# SECURITY Policy 设计

日期：2026-03-22

## 目标

- 为公开仓库补一份简洁可执行的 `SECURITY.md`
- 不引入个人联系方式或私有渠道
- 明确 private config、API key、业务素材不应公开贴出

## 方案

### 1. 支持范围

- 当前只声明 `main` 分支为维护中的公开版本
- 不承诺历史提交或未发布分支的安全支持

### 2. 漏洞提交流程

- 优先使用 GitHub 的 private vulnerability reporting 或 security advisory 机制
- 若仓库当下未开启私密报告，则先开最小化 public issue，不贴 exploit、密钥、私有配置和业务数据，等待维护者切到非公开沟通

### 3. 内容边界

- 不要求报告者提供任何真实客户数据
- 明确禁止把 `~/.config/redcube/`、`config/local/`、`.env`、API key、业务 workspace 内容公开贴到 issue

### 4. README 入口

- 在 README 的文档导航中补一条 `安全策略`

## 验收标准

- 仓库根目录出现 `SECURITY.md`
- README 可快速找到安全策略入口
- 文本不含个人邮箱、旧项目名、旧人设或本机路径
