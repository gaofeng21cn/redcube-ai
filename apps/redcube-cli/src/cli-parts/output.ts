export function printJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

export function fail(message: string, code = 1): never {
  printJson({
    ok: false,
    error_kind: 'cli_usage_error',
    recommended_action: 'read_help',
    error: message,
  });
  process.exit(code);
}
