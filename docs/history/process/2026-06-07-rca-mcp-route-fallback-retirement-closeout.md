# RCA MCP route fallback retirement closeout

Owner: `RedCube AI`
Purpose: `rca_mcp_route_fallback_retirement_provenance`
State: `history_provenance`
Machine boundary: 本文是人读过程记录。当前 MCP routing truth 归 `apps/redcube-mcp/src/server.ts`、`packages/redcube-domain-entry/src/actions/family-action-catalog.ts`、`buildRedCubeActionMetadata()`、MCP/product-domain action tests 和 repo-native verification output。

## Closeout

The stale MCP routing fallback that mixed catalog-derived routes with a duplicated local route map is retired.

Current owner split:

- `buildRedCubeActionMetadata().mcp_route_definitions`: canonical owner for catalog-backed MCP action routes, including `redcube_product_entry` actions.
- `apps/redcube-mcp/src/server.ts#LOCAL_PROTOCOL_ROUTE_DEFINITIONS`: repo-local direct protocol adapter routes for workspace, source, deliverable and review tools that are not catalog action routes.
- `apps/redcube-mcp/src/server.ts#routeDefinitionFor`: fail-closed arbitration between catalog routes and local protocol adapter routes.

## Retired Surface

- Retired: `TOOL_ROUTE_DEFINITIONS` as a single mixed route owner.
- Retired: empty local `redcube_product_entry` route shell.
- Retired: catalog-empty route definitions silently falling back through `base?.routes`.
- Replacement: non-empty catalog routes win; `redcube_product_entry` with missing catalog routes remains catalog-owned and unsupported; non-product local MCP tools use `LOCAL_PROTOCOL_ROUTE_DEFINITIONS`.

## Verification

Verification run on `2026-06-07`:

- Baseline before source change: `npm run build` passed.
- Baseline after `npm install` in the isolated worktree: `node --experimental-strip-types scripts/run-test-group.ts integration --files tests/product-domain-action-api.test.ts --test-reporter=dot` passed `18` tests and failed the two existing stdio route-run tests before this lane's source changes. The failures were `stdio MCP server can create deliverable, run declared route, and fetch run state` and `stdio MCP server can create and run xiaohongshu deliverable routes on shared runtime`, both at `structuredContent.ok === true` assertions after route execution. They are tracked as pre-existing baseline verification tail, not introduced by this route metadata change.
- `npm run build`: passed after the change.
- Focused route no-resurrection test: `node --experimental-strip-types --test --test-name-pattern "MCP routing retires" tests/product-domain-action-api-cases/definitions-and-delegation.test.ts --test-reporter=dot` passed with `1` test.
- Focused route metadata/delegation tests passed with `11` tests: `MCP catalog definitions`, `MCP product-entry routes`, and local protocol `callDomainTool` delegation/rejection cases.
- Targeted active scan found no `TOOL_ROUTE_DEFINITIONS`, empty local `redcube_product_entry` route shell, `catalogRoutes`, `base?.routes`, or `MCP_ROUTE_METADATA[...] ||` fallback in `apps/redcube-mcp/src/server.ts`.
- `git diff --check`: passed.

## Out Of Scope

This lane did not change product-entry action semantics, domain-handler behavior, route-run execution, Codex runtime mocks, visual/export/domain readiness, production readiness or public CLI actions.
