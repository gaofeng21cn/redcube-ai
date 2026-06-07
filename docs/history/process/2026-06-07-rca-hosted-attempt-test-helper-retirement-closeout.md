# RCA hosted-attempt test-helper retirement closeout

Owner: `RedCube AI`
Purpose: `hosted_attempt_test_helper_retirement_provenance`
State: `history_provenance`
Machine boundary: 本文是人读过程记录。当前机器真相归 `packages/redcube-domain-entry/src/actions/domain-action-adapter.ts`、`packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/`、`tests/helpers/hosted-attempt-reconciliation.ts`、focused tests 和 repo-native verification output。

## Closeout

The hosted-attempt reconciliation fixture helpers are retired from production `redcube-domain-entry` source and kept only as test-local helpers for the focused receipt-projection test.

## Retired Surface

- Retired production source file: `packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/hosted-attempt-reconciliation.ts`.
- Retired production re-exports from `packages/redcube-domain-entry/src/actions/domain-action-adapter.ts`:
  - `buildHostedAttemptBridgeFixture`
  - `reconcileHostedAttemptReceipt`
  - `isReceiptOnlyHostedAttemptProjection`
  - `assertReceiptOnlyHostedAttemptProjection`
- Replacement: `tests/helpers/hosted-attempt-reconciliation.ts` for `tests/opl-transition-hosted-attempt-receipt.test.ts`.

## Current Boundary

`domain-action-adapter` remains the RCA domain handler target for export and dispatch. It no longer exposes test fixture construction or hosted-attempt projection assertion helpers as production API.

The focused hosted-attempt test still validates refs-only reconciliation and the rule that OPL provider completion, receipt proof or no-regression evidence cannot authorize RCA visual-ready, exportable, handoffable or production soak completion.

## Verification

Verification run on `2026-06-07`:

- `npm run build`
- `node --experimental-strip-types --test tests/opl-transition-hosted-attempt-receipt.test.ts`
- `node --experimental-strip-types --test --test-name-pattern "hosted attempt reconciliation fixture helpers stay out of production domain-entry source" tests/rca-retired-surface-active-guard.test.ts`
- production source scan for `hosted-attempt-reconciliation`, `buildHostedAttemptBridgeFixture`, `reconcileHostedAttemptReceipt`, `isReceiptOnlyHostedAttemptProjection` and `assertReceiptOnlyHostedAttemptProjection`
- `git diff --check`

## Out Of Scope

This lane did not change domain-handler export/dispatch semantics, visual transition spec semantics, guarded action metadata, owner receipt return shapes, readiness claims, production evidence, route execution or artifact authority.
