import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import { executeCli } from '../apps/redcube-cli/src/cli.js';

test('product-entry builds a shared direct-entry envelope for managed deliverable runs', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-'));

  const payload = await executeCli([
    'product-entry',
    '--workspace-root', workspaceRoot,
    '--overlay', 'ppt_deck',
    '--topic-id', 'topic-a',
    '--deliverable-id', 'deck-a',
    '--task-intent', 'run_managed_deliverable',
    '--entry-mode', 'opl-handoff',
    '--user-intent', '先只做主线故事',
    '--stop-after-stage', 'storyline',
  ]);

  assert.equal(payload.ok, true);
  assert.equal(payload.command, 'product-entry');
  assert.equal(payload.product_entry.target_domain_id, 'redcube_ai');
  assert.equal(payload.product_entry.task_intent, 'run_managed_deliverable');
  assert.equal(payload.product_entry.entry_mode, 'opl-handoff');
  assert.equal(payload.product_entry.runtime_session_contract.runtime_owner, 'upstream_hermes_agent');
  assert.equal(payload.product_entry.return_surface_contract.surface_kind, 'managed_run');
  assert.equal(payload.product_entry.domain_payload.deliverable_family, 'ppt_deck');
  assert.equal(payload.product_entry.domain_payload.stop_after_stage, 'storyline');
  assert.match(payload.product_entry.commands.direct_execute, /redcube .*deliverable execute/);
});

test('product-entry fails closed when route task intent omits the required route', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-route-'));

  await assert.rejects(
    () => executeCli([
      'product-entry',
      '--workspace-root', workspaceRoot,
      '--overlay', 'ppt_deck',
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
      '--task-intent', 'run_deliverable_route',
      '--entry-mode', 'direct',
    ]),
    /route/,
  );
});
