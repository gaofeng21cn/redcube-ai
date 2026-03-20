#!/usr/bin/env node

import { loadRuntimeConfig } from '../../../packages/redcube-config/src/index.js';
import {
  bootstrapPrivateProfile,
  exportPrivateProfile,
  installPrivateProfile,
} from '../../../packages/redcube-config/src/private-profile.js';
import {
  createProject,
  doctorProject,
  evaluateWorkflow,
  generateSeriesToc,
  generateStoryline,
  getRunStatus,
  getTaskArtifacts,
  listProjects,
  publishProject,
  retryTaskStep,
  runWorkflow,
} from '../../../packages/redcube-agent/src/index.js';

function parseArgs(argv) {
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      options[toCamel(key)] = true;
      continue;
    }

    options[toCamel(key)] = next;
    i += 1;
  }

  return options;
}

function toCamel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function printJson(data) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

function fail(message, code = 1) {
  printJson({ ok: false, error: message });
  process.exit(code);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const options = parseArgs(rest);
  const runtimeConfig = loadRuntimeConfig({
    env: process.env,
    explicit: {
      rootDir: options.rootDir || '',
    },
  });
  const rootDir = runtimeConfig.rootDir;

  if (!command || command === 'help' || command === '--help') {
    printJson({
      usage: {
        run: 'redcube run --project <name> --mode <full|plan|html> --tasks <1,2> --fix-pages <1,2> --auto-fix --root-dir <dir>',
        eval: 'redcube eval --project <name> --auto-fix --root-dir <dir>',
        publish: 'redcube publish --project <name> | --all --root-dir <dir>',
        doctor: 'redcube doctor --project <name> --root-dir <dir>',
        create: 'redcube create --project <name> --root-dir <dir>',
        toc: 'redcube toc --project <name> --note-mode <auto|series|single> --root-dir <dir>',
        storyline: 'redcube storyline --project <name> --prompt-file <file.md> --root-dir <dir>',
        list: 'redcube list --root-dir <dir>',
        status: 'redcube status --run-id <id> --root-dir <dir>',
        artifacts: 'redcube artifacts --project <name> --task-folder <folder> --root-dir <dir>',
        retry: 'redcube retry --project <name> --task-folder <folder> --step <plan|html|full> --root-dir <dir>',
        profile: 'redcube profile --action <bootstrap|export|install> [--source-dir <dir>] [--bundle <file>] [--config-home <dir>] [--force]',
      },
    });
    return;
  }

  if (command === 'run') {
    if (!options.project) fail('run 命令需要 --project');

    const result = await runWorkflow(
      {
        project: options.project,
        mode: options.mode || 'full',
        tasks: options.tasks || '',
        fixPages: options.fixPages || '',
        autoFix: options.autoFix !== false && options.noAutoFix !== true,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'eval') {
    if (!options.project) fail('eval 命令需要 --project');

    const result = await evaluateWorkflow(
      {
        project: options.project,
        tasks: options.tasks || '',
        autoFix: options.autoFix === true,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'publish') {
    if (!options.project && !options.all) {
      fail('publish 命令需要 --project 或 --all');
    }

    const result = await publishProject(
      {
        project: options.project,
        all: options.all === true,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'doctor') {
    if (!options.project) fail('doctor 命令需要 --project');

    const result = await doctorProject(
      {
        project: options.project,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'create') {
    if (!options.project) fail('create 命令需要 --project');
    const result = await createProject(
      {
        project: options.project,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'toc') {
    if (!options.project) fail('toc 命令需要 --project');
    const result = await generateSeriesToc(
      {
        project: options.project,
        noteMode: options.noteMode || 'auto',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'storyline') {
    if (!options.project) fail('storyline 命令需要 --project');
    const result = await generateStoryline(
      {
        project: options.project,
        promptFile: options.promptFile || '',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'list') {
    const result = await listProjects({}, { rootDir });
    printJson(result);
    return;
  }

  if (command === 'status') {
    const result = await getRunStatus(
      {
        runId: options.runId || '',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'artifacts') {
    if (!options.project || !options.taskFolder) {
      fail('artifacts 命令需要 --project 和 --task-folder');
    }

    const result = await getTaskArtifacts(
      {
        project: options.project,
        taskFolder: options.taskFolder,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'retry') {
    if (!options.project || !options.taskFolder) {
      fail('retry 命令需要 --project 和 --task-folder');
    }

    const result = await retryTaskStep(
      {
        project: options.project,
        taskFolder: options.taskFolder,
        step: options.step || 'full',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'profile') {
    if (options.action === 'bootstrap') {
      const result = bootstrapPrivateProfile({
        sourceSystemDir: options.sourceDir || '',
        configHome: options.configHome || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    if (options.action === 'export') {
      const result = exportPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    if (options.action === 'install') {
      const result = installPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    fail('profile 命令需要 --action <bootstrap|export|install>');
  }

  fail(`未知命令: ${command}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
