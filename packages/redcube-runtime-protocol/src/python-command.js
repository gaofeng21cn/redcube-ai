import { spawnSync } from 'node:child_process';

export const REDCUBE_PYTHON_COMMAND_ENV = 'REDCUBE_PYTHON_COMMAND';
export const PYTHON_PLAYWRIGHT_PROBE_COMMAND = 'python3';
export const PYTHON_PLAYWRIGHT_PROBE_ARGS = ['-c', 'import sys; import playwright; print(sys.executable)'];

function safeText(value) {
  return String(value || '').trim();
}

function probeFailureMessage(result) {
  const stderr = safeText(result?.stderr);
  const stdout = safeText(result?.stdout);
  return stderr || stdout || 'unknown probe failure';
}

export function resolveRedCubePythonCommand({
  env = process.env,
  spawnSyncImpl = spawnSync,
} = {}) {
  const explicitCommand = safeText(env?.[REDCUBE_PYTHON_COMMAND_ENV]);
  if (explicitCommand) {
    return {
      command: explicitCommand,
      source: 'env',
    };
  }

  let probe;
  try {
    probe = spawnSyncImpl(PYTHON_PLAYWRIGHT_PROBE_COMMAND, PYTHON_PLAYWRIGHT_PROBE_ARGS, {
      encoding: 'utf-8',
    });
  } catch (error) {
    throw new Error([
      `${REDCUBE_PYTHON_COMMAND_ENV} 未设置，且 python3 playwright 探测启动失败。`,
      `请设置 ${REDCUBE_PYTHON_COMMAND_ENV} 指向已安装 playwright 的 Python 可执行文件。`,
      `Probe command: ${PYTHON_PLAYWRIGHT_PROBE_COMMAND} ${PYTHON_PLAYWRIGHT_PROBE_ARGS.join(' ')}`,
      `Probe error: ${error instanceof Error ? error.message : String(error)}`,
    ].join('\n'));
  }

  if (probe?.status === 0) {
    const resolvedCommand = safeText(probe.stdout)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1);
    if (resolvedCommand) {
      return {
        command: resolvedCommand,
        source: 'python3_with_playwright',
      };
    }
  }

  throw new Error([
    `${REDCUBE_PYTHON_COMMAND_ENV} 未设置，且无法从 python3 探测到带 playwright 的 Python。`,
    `请设置 ${REDCUBE_PYTHON_COMMAND_ENV} 指向已安装 playwright 的 Python 可执行文件。`,
    `Probe command: ${PYTHON_PLAYWRIGHT_PROBE_COMMAND} ${PYTHON_PLAYWRIGHT_PROBE_ARGS.join(' ')}`,
    `Probe result: ${probeFailureMessage(probe)}`,
  ].join('\n'));
}
