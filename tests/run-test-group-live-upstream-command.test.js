import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_HERMES_GATEWAY_COMMAND,
  readHermesGatewayLaunchConfig,
} from '../scripts/run-test-group-lib.mjs';

test('run-test-group uses the canonical Hermes gateway command by default', () => {
  const config = readHermesGatewayLaunchConfig({});

  assert.equal(DEFAULT_HERMES_GATEWAY_COMMAND, 'hermes gateway run -q --replace');
  assert.deepEqual(config, {
    command: 'hermes gateway run -q --replace',
    usesShell: false,
  });
});

test('run-test-group allows overriding the live Hermes gateway launch command explicitly', () => {
  const config = readHermesGatewayLaunchConfig({
    REDCUBE_HERMES_GATEWAY_COMMAND:
      'PYTHONPATH=/tmp/hermes-upstream /tmp/venv/bin/python /tmp/hermes-upstream/hermes_cli/main.py gateway run -v --replace',
  });

  assert.deepEqual(config, {
    command:
      'PYTHONPATH=/tmp/hermes-upstream /tmp/venv/bin/python /tmp/hermes-upstream/hermes_cli/main.py gateway run -v --replace',
    usesShell: true,
  });
});
