import { main } from '../packages/redcube-runtime/src/execute-redcube-service-entry.js';

main(process.argv).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
