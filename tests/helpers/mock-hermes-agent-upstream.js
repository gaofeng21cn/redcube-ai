import http from 'node:http';
import { once } from 'node:events';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCallback);

export const REDCUBE_SERVICE_ENTRY_ENVELOPE_BEGIN = 'REDCUBE_SERVICE_ENTRY_ENVELOPE_BEGIN';
export const REDCUBE_SERVICE_ENTRY_ENVELOPE_END = 'REDCUBE_SERVICE_ENTRY_ENVELOPE_END';

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function parseEnvelope(input) {
  const text = String(input || '');
  const start = text.indexOf(REDCUBE_SERVICE_ENTRY_ENVELOPE_BEGIN);
  const end = text.indexOf(REDCUBE_SERVICE_ENTRY_ENVELOPE_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('service entry envelope missing from upstream run input');
  }
  const jsonText = text
    .slice(start + REDCUBE_SERVICE_ENTRY_ENVELOPE_BEGIN.length, end)
    .trim();
  return JSON.parse(jsonText);
}

function toSse(events) {
  return events
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join('');
}

export function withEnv(overrides) {
  const backup = {};
  for (const [key, value] of Object.entries(overrides)) {
    backup[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }
  return () => {
    for (const [key, value] of Object.entries(backup)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

export async function startMockHermesAgentUpstream() {
  let runCounter = 0;
  const runs = new Map();

  const server = http.createServer(async (request, response) => {
    try {
      if (!request.url) {
        response.writeHead(500).end();
        return;
      }

      if (request.url === '/v1/health') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok', platform: 'hermes-agent' }));
        return;
      }

      if (request.url === '/v1/models') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          object: 'list',
          data: [{ id: 'hermes-agent', object: 'model' }],
        }));
        return;
      }

      if (request.url === '/v1/runs' && request.method === 'POST') {
        const body = await readJsonBody(request);
        const envelope = parseEnvelope(body.input);
        const runId = `run_mock_${++runCounter}`;
        const startedAt = Date.now() / 1000;
        const sessionId = String(body.session_id || runId);

        const runPromise = (async () => {
          const events = [{
            event: 'tool.started',
            run_id: runId,
            timestamp: startedAt,
            tool: 'terminal',
            preview: envelope.command,
          }];

          try {
            await exec(envelope.command, {
              cwd: envelope.cwd,
            });
            events.push({
              event: 'tool.completed',
              run_id: runId,
              timestamp: Date.now() / 1000,
              tool: 'terminal',
              duration: 0,
              error: false,
            });
            events.push({
              event: 'message.delta',
              run_id: runId,
              timestamp: Date.now() / 1000,
              delta: 'DONE',
            });
            events.push({
              event: 'run.completed',
              run_id: runId,
              timestamp: Date.now() / 1000,
              output: JSON.stringify({
                status: 'completed',
                response_file: envelope.response_file,
                session_id: sessionId,
              }),
              usage: {
                input_tokens: 0,
                output_tokens: 0,
                total_tokens: 0,
              },
            });
            return events;
          } catch (error) {
            events.push({
              event: 'tool.completed',
              run_id: runId,
              timestamp: Date.now() / 1000,
              tool: 'terminal',
              duration: 0,
              error: true,
            });
            events.push({
              event: 'run.failed',
              run_id: runId,
              timestamp: Date.now() / 1000,
              error: error instanceof Error ? error.message : String(error),
            });
            return events;
          }
        })();

        runs.set(runId, runPromise);
        response.writeHead(202, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ run_id: runId, status: 'started' }));
        return;
      }

      if (request.url.startsWith('/v1/runs/') && request.url.endsWith('/events')) {
        const runId = request.url.slice('/v1/runs/'.length, -'/events'.length);
        const runPromise = runs.get(runId);
        if (!runPromise) {
          response.writeHead(404, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ error: { message: `run not found: ${runId}` } }));
          return;
        }

        const events = await runPromise;
        response.writeHead(200, { 'content-type': 'text/event-stream' });
        response.write(toSse(events));
        response.end(': stream closed\n\n');
        return;
      }

      response.writeHead(404).end();
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      }));
    }
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('mock upstream address unavailable');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      server.close();
      await once(server, 'close');
    },
  };
}
