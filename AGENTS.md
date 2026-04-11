# Redcube Ai Repository Agent Contract

This root `AGENTS.md` is the repository-native contract for direct sessions that enter from the project root, including Codex App and plain Codex sessions.

## Scope

Apply this file to the repository root and all descendants unless a deeper `AGENTS.md` overrides it for a narrower subtree.

## Project Truth

The authoritative project truth contract lives at `contracts/project-truth/AGENTS.md`.
Read that file first whenever repository-specific goals, architecture priorities, mutation rules, or domain constraints matter.
Canonical host adapter references are maintained by the installed runtime/tooling surface; do not depend on repo-local dev-host docs.

## Working Agreements

- Keep diffs small, reviewable, and reversible.
- Prefer deletion over addition when simplification preserves behavior.
- Reuse existing patterns and utilities before introducing new abstractions.
- Do not add new dependencies without explicit justification.
- Run the relevant tests, type checks, and validation commands before claiming completion.
- Final reports should include what changed and any remaining risks or known gaps.

## Worktree Discipline

- Heavy long-running work must run in an isolated worktree created from current `main`.
- Keep the shared root checkout on `main` for light reads, planning, review, absorb-to-`main`, push, and cleanup; do not let it become the long-running owner checkout.
- Allow at most one active long-running mainline per worktree. If multiple long-running lanes are needed, create multiple worktrees.
- Before starting a new long-running lane, ensure the owner worktree is clean and free of stale `.runtime-program/state/sessions/*`, lingering tmux sessions, and stale `skill-active` state.
- After the lane stops, either absorb the verified commits back to `main` or explicitly abandon the lane, then remove its worktree/branch and clear related tmux/session state.
- Do not rely on session-only isolation to prevent hook interference; use physical worktree isolation.

## Local State

- `.runtime-program/` and `.codex/` are local tooling state and must remain untracked.
- `.runtime-program/local/AGENTS.local.md` is reserved for machine-specific private overlays.
