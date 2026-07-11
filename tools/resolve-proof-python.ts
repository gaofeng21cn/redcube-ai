import { parseArgs } from 'node:util';
import { resolveDomainPythonCommand } from 'opl-framework/domain-helper-runtime';

const { values } = parseArgs({ options: { 'command-env': { type: 'string' } } });
const resolved = resolveDomainPythonCommand({ command_env: values['command-env'] || 'REDCUBE_PYTHON_COMMAND' });
if (resolved.args.length > 0) throw new Error('Proof shell requires an OPL-managed Python executable without prefix args.');
process.stdout.write(`${resolved.command}\n`);
