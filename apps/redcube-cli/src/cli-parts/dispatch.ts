import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  auditDeliverable,
  applyReviewMutation,
  createDeliverable,
  doctorWorkspace,
  getDeliverable,
  getOverlayCatalog,
  getPublicationProjection,
  getReviewState,
  getRun as getDomainEntryRun,
  invokeDomainEntry,
  invokeProductEntry,
  buildPerformanceReport,
  intakeSource,
  researchSource,
  prepareSourceAugmentation,
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
  executeSourceAugmentation,
  listTopics as listTopicsDomainEntry,
  runDeliverableRoute,
} from '@redcube/domain-entry';

import { buildCommandHelp, buildHelp } from './help.js';
import { buildCliJsonSummary } from './json-summary.js';
import { parseArgs, resolveWorkspaceRoot } from './options.js';
import { printJson } from './output.js';
import { loadPrivateProfileModule } from './private-profile.js';
import type { CliDependenciesMap, JsonMap } from './types.js';

const DEFAULT_DOMAIN_ACTIONS = {
  auditDeliverable,
  applyReviewMutation,
  createDeliverable,
  doctorWorkspace,
  getDeliverable,
  getOverlayCatalog,
  getPublicationProjection,
  getReviewState,
  getRun: getDomainEntryRun,
  exportDomainHandler: async (request: Record<string, unknown>) => {
    const domainEntry = await import('@redcube/domain-entry');
    return (domainEntry as Record<string, any>).exportDomainHandler(request);
  },
  dispatchDomainHandler: async (request: Record<string, unknown>) => {
    const domainEntry = await import('@redcube/domain-entry');
    return (domainEntry as Record<string, any>).dispatchDomainHandler(request);
  },
  invokeDomainEntry,
  invokeProductEntry,
  runNativePptProductEntryProof: async (request: Record<string, unknown>) => {
    const domainEntry = await import('@redcube/domain-entry');
    return (domainEntry as Record<string, any>).runNativePptProductEntryProof(request);
  },
  buildPerformanceReport,
  intakeSource,
  researchSource,
  prepareSourceAugmentation,
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
  executeSourceAugmentation,
  listTopics: listTopicsDomainEntry,
  runDeliverableRoute,
};

export function getCliDomainActions(overrides: Record<string, unknown> = {}): typeof DEFAULT_DOMAIN_ACTIONS {
  return {
    ...DEFAULT_DOMAIN_ACTIONS,
    ...overrides,
  };
}

function shouldPrintSummary(argv: string[]): boolean {
  const options = parseArgs(argv);
  return options.jsonSummary === true || options.quiet === true;
}

function repoRootFromCwd(cwd: () => string): string {
  return path.resolve(cwd());
}

function workspaceReceiptScaleoutRoots(options: JsonMap): string[] {
  const raw = options.workspaceReceiptScaleoutRoot || options.workspaceReceiptScaleoutRoots;
  if (!raw || raw === true) {
    return [];
  }
  return String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function runRepoOwnedImagePptProof(options: JsonMap, cwd: () => string): JsonMap {
  const repoRoot = repoRootFromCwd(cwd);
  const outputDir = String(options.outputDir || 'artifacts/image-ppt-proof');
  const args = [
    'tools/image-ppt-proof/run.sh',
    '--output-dir',
    outputDir,
    options.liveImageGeneration === true ? '--live-image-generation' : '--mock-image-generation',
  ];
  if (options.skipSystemDeps === true) args.push('--skip-system-deps');
  if (options.fixture) args.push('--fixture', String(options.fixture));
  if (options.styleReferenceDir) args.push('--style-reference-dir', String(options.styleReferenceDir));
  const result = spawnSync(args[0], args.slice(1), {
    cwd: repoRoot,
    encoding: 'utf-8',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`redcube image-ppt proof failed: ${result.stderr || result.stdout}`);
  }
  const artifactIndexFile = path.resolve(repoRoot, outputDir, 'artifact-index.json');
  return {
    ok: true,
    surface_kind: 'image_ppt_product_entry_proof',
    command: 'redcube image-ppt proof',
    repo_owned_runner: true,
    public_skill_policy: 'do_not_register_as_second_public_skill',
    image_generation_mode: options.liveImageGeneration === true ? 'live' : 'mock',
    live_mode_requires_explicit_flag: true,
    mock_mode_calls_api: false,
    output_dir: path.resolve(repoRoot, outputDir),
    artifact_index_file: artifactIndexFile,
    runner_stdout: result.stdout,
  };
}

export async function executeCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  const [command, ...rest] = argv;
  const subcommand = rest[0];
  const options = parseArgs(rest);
  const domainEntry = getCliDomainActions(deps.domainActions || {});
  const cwd = deps.cwd || process.cwd;
  const loadPrivateProfile = deps.loadPrivateProfileModule || loadPrivateProfileModule;

  if (!command || command === 'help' || command === '--help') {
    return buildHelp(domainEntry);
  }

  if (options.help === true) {
    const commandHelp = buildCommandHelp(
      command === 'domain-handler'
        ? [command, subcommand, rest[1]].filter(Boolean).join(' ')
        : [command, subcommand].filter(Boolean).join(' '),
    );
    if (commandHelp) {
      return commandHelp;
    }
  }

  if (command === 'workspace') {
    if (subcommand !== 'doctor') {
      throw new Error('workspace 命令仅支持 doctor');
    }

    return domainEntry.doctorWorkspace({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
    });
  }

  if (command === 'topics') {
    if (subcommand !== 'list') {
      throw new Error('topics 命令仅支持 list');
    }

    return domainEntry.listTopics({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
    });
  }

  if (command === 'source') {
    if (subcommand === 'intake') {
      return domainEntry.intakeSource({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        title: options.title || '',
        brief: options.brief || '',
        keywords: options.keywords || '',
        sourceFiles: options.sourceFiles || '',
        operatorFiles: options.operatorFiles || '',
      });
    }

    if (subcommand === 'research') {
      return domainEntry.researchSource({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        title: options.title || '',
        brief: options.brief || '',
        keywords: options.keywords || '',
        sourceFiles: options.sourceFiles || '',
        operatorFiles: options.operatorFiles || '',
        payloadFile: options.payloadFile || '',
      });
    }

    if (subcommand === 'augment') {
      return domainEntry.prepareSourceAugmentation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        title: options.title || '',
      });
    }

    if (subcommand === 'prepare-augmentation-result') {
      return domainEntry.prepareSourceAugmentationResult({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    if (subcommand === 'write-augmentation-result') {
      return domainEntry.writeSourceAugmentationResult({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        inputFile: options.inputFile || '',
        payloadFile: options.payloadFile || '',
      });
    }

    if (subcommand === 'execute-augmentation') {
      return domainEntry.executeSourceAugmentation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    throw new Error('source 命令仅支持 intake|research|augment|prepare-augmentation-result|write-augmentation-result|execute-augmentation');
  }

  if (command === 'deliverable') {
    if (subcommand === 'create') {
      return domainEntry.createDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        profileId: options.profileId || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        title: options.title || '',
        goal: options.goal || '',
      });
    }

    if (subcommand === 'get') {
      return domainEntry.getDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
      });
    }

    if (subcommand === 'audit') {
      return domainEntry.auditDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        mode: options.mode || 'draft_new',
        baselineDeliverableId: options.baselineDeliverableId || '',
      });
    }

    if (subcommand === 'run') {
      return domainEntry.runDeliverableRoute({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        route: options.route || '',
        adapter: options.adapter || undefined,
      });
    }

    if (subcommand === 'execute') {
      return domainEntry.invokeDomainEntry({
        target_domain_id: 'redcube_ai',
        task_intent: 'run_opl_stage_execution_plan',
        entry_mode: 'service_call',
        workspace_locator: {
          workspace_root: resolveWorkspaceRoot(options, cwd),
        },
        runtime_session_contract: {
          runtime_owner: 'configured_family_runtime_provider',
          session_mode: 'ephemeral_run',
        },
        return_surface_contract: {
          surface_kind: 'opl_stage_execution_plan',
        },
        domain_payload: {
          deliverable_family: options.overlay || '',
          topic_id: options.topicId || '',
          deliverable_id: options.deliverableId || '',
          adapter: options.adapter || undefined,
          user_intent: options.userIntent || '',
          stop_after_stage: options.stopAfterStage || '',
          mode: options.mode || 'draft_new',
          baseline_deliverable_id: options.baselineDeliverableId || '',
        },
      });
    }

    throw new Error('deliverable 命令仅支持 create|get|audit|execute|run');
  }

  if (command === 'product') {
    if (subcommand === 'invoke') {
      return domainEntry.invokeProductEntry({
        workspace_locator: {
          workspace_root: resolveWorkspaceRoot(options, cwd),
        },
        entry_session_contract: {
          entry_session_id: options.entrySessionId || '',
        },
        task_intent: options.taskIntent || '',
        delivery_request: {
          deliverable_family: options.overlay || '',
          topic_id: options.topicId || '',
          deliverable_id: options.deliverableId || '',
          profile_id: options.profileId || '',
          title: options.title || '',
          goal: options.goal || '',
          route: options.route || '',
          adapter: options.adapter || '',
          user_intent: options.userIntent || '',
          lifecycle_policy: options.lifecyclePolicy || '',
          stop_after_stage: options.stopAfterStage || '',
          mode: options.mode || 'draft_new',
          baseline_deliverable_id: options.baselineDeliverableId || '',
        },
      });
    }

    throw new Error('product 命令仅保留 invoke domain handler target；status/session/manifest/domain_action_adapter 等 generated/default wrapper 由 OPL 持有');
  }

  if (command === 'domain-handler') {
    if (subcommand === 'export') {
      const scaleoutRoots = workspaceReceiptScaleoutRoots(options);
      const request: JsonMap = {
        workspace_root: resolveWorkspaceRoot(options, cwd),
        format: options.format || 'json',
      };
      if (scaleoutRoots.length > 0) {
        request.workspace_receipt_scaleout_roots = scaleoutRoots;
      }
      return domainEntry.exportDomainHandler(request);
    }

    if (subcommand === 'dispatch') {
      return domainEntry.dispatchDomainHandler({
        task_file: options.task || options.taskFile || '',
        format: options.format || 'json',
      });
    }

    throw new Error('domain-handler 命令仅支持 export|dispatch');
  }

  if (command === 'native-ppt') {
    if (subcommand === 'proof') {
      return domainEntry.runNativePptProductEntryProof({
        workspace_root: resolveWorkspaceRoot(options, cwd),
        entry_session_id: options.entrySessionId || '',
        topic_id: options.topicId || '',
        deliverable_id: options.deliverableId || '',
        route: options.route || 'author_pptx_native',
        adapter: options.adapter || '',
        user_intent: options.userIntent || '',
        stop_after_stage: options.stopAfterStage || '',
      });
    }

    throw new Error('native-ppt 命令仅支持 proof');
  }

  if (command === 'image-ppt') {
    if (subcommand === 'proof') {
      return runRepoOwnedImagePptProof(options, cwd);
    }

    throw new Error('image-ppt 命令仅支持 proof');
  }

  if (command === 'review') {
    if (subcommand === 'get') {
      return domainEntry.getReviewState({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
      });
    }

    if (subcommand === 'projection') {
      return domainEntry.getPublicationProjection({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    if (subcommand === 'mutate') {
      const issues = String(options.issues || '').trim();
      return domainEntry.applyReviewMutation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        mutation: {
          type: options.type || '',
          actor: options.actor || 'agent',
          review_stage: options.reviewStage || '',
          rerun_from_stage: options.rerunFromStage || '',
          issues: issues ? issues.split(',').map((item) => item.trim()).filter(Boolean) : [],
          baseline_deliverable_id: options.baselineDeliverableId || '',
          notes: options.notes || '',
        },
      });
    }

    throw new Error('review 命令仅支持 get|projection|mutate；runtimeWatch default wrapper 由 OPL status/workbench/read-model caller 持有');
  }

  if (command === 'runs') {
    if (subcommand !== 'get') {
      throw new Error('runs 命令仅支持 get');
    }

    return domainEntry.getRun({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
      runId: options.runId || '',
    });
  }

  if (command === 'report') {
    if (subcommand !== 'performance') {
      throw new Error('report 命令仅支持 performance');
    }

    return domainEntry.buildPerformanceReport({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
      topicId: options.topicId || null,
      deliverableId: options.deliverableId || null,
    });
  }

  if (command === 'profile') {
    if (options.action === 'list') {
      return domainEntry.getOverlayCatalog();
    }

    if (options.action === 'bootstrap') {
      const { bootstrapPrivateProfile } = await loadPrivateProfile();
      return bootstrapPrivateProfile({
        sourceSystemDir: options.sourceDir || '',
        configHome: options.configHome || '',
        force: options.force === true,
      });
    }

    if (options.action === 'export') {
      const { exportPrivateProfile } = await loadPrivateProfile();
      return exportPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
    }

    if (options.action === 'install') {
      const { installPrivateProfile } = await loadPrivateProfile();
      return installPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
    }

    throw new Error('profile 命令需要 --action <list|bootstrap|export|install>');
  }

  throw new Error(`未知命令: ${command}`);
}

export async function runCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  const result = await executeCli(argv, deps);
  const printer = deps.printJson || printJson;
  printer(shouldPrintSummary(argv) ? buildCliJsonSummary(result) : result);
  return result;
}

export async function main(argv = process.argv.slice(2), deps: CliDependenciesMap = {}): Promise<JsonMap> {
  return runCli(argv, deps);
}
