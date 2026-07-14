import { parseArgs } from 'node:util';
import process from 'node:process';

import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

const { values } = parseArgs({ options: { 'command-env': { type: 'string' } } });
const commandEnv = values['command-env'] || 'REDCUBE_PYTHON_COMMAND';
const resolved = resolveRedCubePythonCommand({
  ...process.env,
  REDCUBE_PYTHON_COMMAND: process.env[commandEnv],
});
if (resolved.args.length > 0) throw new Error('Proof shell requires an OPL-managed Python executable without prefix args.');
process.stdout.write(`${resolved.command}\n`);
