# RCA Contracts

Owner: RedCube AI
Purpose: 索引标准 Agent 的机器合同。
State: active
Machine boundary: JSON body 和 schema 是机器面；本文只解释 owner 和用途。

## Standard Agent canonical inputs

- `opl_agent_package_manifest.json`：`rca` package sidecar；安装、lock、currentness、update、rollback 和 lifecycle receipt 归 OPL Connect。
- `domain_descriptor.json`：RCA domain identity 与标准 pack refs。
- `pack_compiler_input.json`：declarative visual pack source refs。
- `standard_agent_interface.json`：OPL compiler 可消费的标准接口声明，不含 repo-local command template。
- `standard_agent_conformance_profile.json`：结构 admission profile。
- `generated_surface_handoff.json`：OPL generated/hosted surface ownership；repo-local handler targets 必须为空。
- `action_catalog.json`：RCA hosted action semantics。
- `../agent/stages/manifest.json`：stage graph canonical source。

## RCA authority and artifact contracts

- `owner_receipt_contract.json`：owner receipt / typed blocker / no-regression 领域边界。
- `artifact_locator_contract.json`、`memory_descriptor.json`：body-free locator vocabulary。
- `stage_quality_cycle_policy.json`、`stage_artifact_kernel_adoption.json`、`stage_run_kernel_profile.json`：RCA 对 OPL StageRun 的消费约束。
- `foundry-agent-os-domain-kernel-manifest.json`、`capability_map.json`：领域能力与 carrier projection。

## Native helper and proof contracts

`runtime-program/` 只保留 RCA domain quality、PPT/native-helper 和 developer-proof contracts，例如 `python-native-helper-catalog.json`、`ppt-native-python-engine-contract.json` 与路线质量合同。它不再保存 current-program baton、product-entry、session、domain-entry、runtime package 或 Hermes adapter control plane。

迁移前 `production_acceptance/` snapshot 已物理退役；历史来源只在 `docs/history/` 与 Git history 读取。当前 readiness 必须由 fresh hosted evidence 与 RCA owner receipt 证明。

## Retired machine surfaces

下列合同类别不得恢复：repo-local CLI manifest、TypeScript runtime package build graph、product-entry/session continuity、domain-handler adapter、current-program index/parts、private scheduler/runner、generic workspace/source/review/repair transport 与 package manager。

## Validation

最终字节必须通过 repo tests、private-platform guard、OPL interfaces/conformance、source-closure、default-callers 与 residue readback。任何 pass 都不自动授权 visual-ready 或 production-ready claim。
