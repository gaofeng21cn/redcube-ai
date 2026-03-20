# Private Profile Bundle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 RedCube 增加私有人设迁移、导出和安装闭环，让公开仓库与个人资产彻底分离，同时支持跨电脑一键恢复。

**Architecture:** 私有资产统一落到 `~/.config/redcube/`。`bootstrap` 从外部工作目录复制私有 prompts 并生成 `identity.json` / `runtime.json`；`export` 把当前私有层打成 bundle；`install` 把 bundle 安装到目标配置目录并恢复运行时指向。

**Tech Stack:** Node.js ESM、内置 `fs/path/os`、Node test、CLI。

---

### Task 1: 写失败测试

**Files:**
- Create: `tests/private-profile.test.js`
- Modify: `tests/cli-smoke.test.js`

1. 为 `bootstrapPrivateProfile()` 写失败测试，断言能从外部 `system/自动小红书/` 复制 prompts，并写出私有 `identity.json` / `runtime.json`。
2. 为 `exportPrivateProfile()` / `installPrivateProfile()` 写 round-trip 失败测试，断言 bundle 可导出并在新目录恢复。
3. 为 CLI `profile --action <bootstrap|export|install>` 写冒烟失败测试。
4. 运行针对性测试，确认红灯。

### Task 2: 实现私有资产工具层

**Files:**
- Create: `packages/redcube-config/src/private-profile.js`
- Modify: `packages/redcube-config/src/index.js`

1. 实现 `resolveConfigHome()`。
2. 实现从作者档案库/路由规则提取 `identity` 的最小解析。
3. 实现 `bootstrapPrivateProfile()`，把源目录复制到 `configHome/prompts/aligned/自动小红书/`。
4. 实现 `exportPrivateProfile()`，输出可搬运 bundle。
5. 实现 `installPrivateProfile()`，从 bundle 恢复到目标 `configHome`。
6. 运行针对性测试，确认变绿。

### Task 3: 接入 CLI

**Files:**
- Modify: `apps/redcube-cli/src/cli.js`

1. 增加 `profile` 命令和 `--action` 路由。
2. 支持 `--source-dir`、`--bundle`、`--config-home`、`--force`。
3. 输出结构化 JSON，便于脚本和自动化使用。
4. 跑 CLI 冒烟测试，确认通过。

### Task 4: 文档与验证

**Files:**
- Modify: `README.md`

1. 补充私有层推荐目录和 `bootstrap/export/install` 用法。
2. 运行 `node --test tests/private-profile.test.js tests/cli-smoke.test.js`。
3. 运行 `node --test tests/*.test.js`。
4. 最后做一次敏感串扫描，确认私有信息未回流仓库。
