import test from 'node:test';
import assert from 'node:assert/strict';

import { buildServiceEntryCommand } from '../packages/redcube-runtime/src/upstream-hermes-bridge.js';

test('buildServiceEntryCommand carries REDCUBE_PYTHON_COMMAND into upstream service entry shell command', () => {
  const command = buildServiceEntryCommand({
    requestFile: '/tmp/redcube-request.json',
    responseFile: '/tmp/redcube-response.json',
    envAssignments: {
      REDCUBE_PYTHON_COMMAND: '/opt/python-with-playwright',
    },
  });

  assert.match(command, /^env REDCUBE_PYTHON_COMMAND='\/opt\/python-with-playwright' node /);
  assert.match(command, /--request-file '\/tmp\/redcube-request\.json'/);
  assert.match(command, /--response-file '\/tmp\/redcube-response\.json'/);
});
