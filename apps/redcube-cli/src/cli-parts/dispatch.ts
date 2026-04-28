import { getCliGatewayActions } from './gateway-actions.js';
import { buildCommandHelp, buildHelp } from './help.js';
import { parseArgs, resolveWorkspaceRoot } from './options.js';
import { loadPrivateProfileModule } from './private-profile.js';
import type { CliDependenciesMap, JsonMap } from './types.js';

export async function executeCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  const [command, ...rest] = argv;
  const subcommand = rest[0];
  const options = parseArgs(rest);
  const gateway = getCliGatewayActions(deps.gateway || {});
  const cwd = deps.cwd || process.cwd;
  const loadPrivateProfile = deps.loadPrivateProfileModule || loadPrivateProfileModule;

  if (!command || command === 'help' || command === '--help') {
    return buildHelp(gateway);
  }

  if (options.help === true) {
    const commandHelp = buildCommandHelp([command, subcommand].filter(Boolean).join(' '));
    if (commandHelp) {
      return commandHelp;
    }
  }

  if (command === 'workspace') {
    if (subcommand !== 'doctor') {
      throw new Error('workspace 命令仅支持 doctor');
    }

    return gateway.doctorWorkspace({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
    });
  }

  if (command === 'topics') {
    if (subcommand !== 'list') {
      throw new Error('topics 命令仅支持 list');
    }

    return gateway.listTopics({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
    });
  }

  if (command === 'source') {
    if (subcommand === 'intake') {
      return gateway.intakeSource({
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
      return gateway.researchSource({
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
      return gateway.prepareSourceAugmentation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        title: options.title || '',
      });
    }

    if (subcommand === 'prepare-augmentation-result') {
      return gateway.prepareSourceAugmentationResult({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    if (subcommand === 'write-augmentation-result') {
      return gateway.writeSourceAugmentationResult({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        inputFile: options.inputFile || '',
        payloadFile: options.payloadFile || '',
      });
    }

    if (subcommand === 'execute-augmentation') {
      return gateway.executeSourceAugmentation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    throw new Error('source 命令仅支持 intake|research|augment|prepare-augmentation-result|write-augmentation-result|execute-augmentation');
  }

  if (command === 'deliverable') {
    if (subcommand === 'create') {
      return gateway.createDeliverable({
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
      return gateway.getDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
      });
    }

    if (subcommand === 'audit') {
      return gateway.auditDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        mode: options.mode || 'draft_new',
        baselineDeliverableId: options.baselineDeliverableId || '',
      });
    }

    if (subcommand === 'run') {
      return gateway.runDeliverableRoute({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        route: options.route || '',
        adapter: options.adapter || undefined,
      });
    }

    if (subcommand === 'execute') {
      return gateway.runManagedDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        adapter: options.adapter || undefined,
        userIntent: options.userIntent || '',
        stopAfterStage: options.stopAfterStage || '',
        mode: options.mode || 'draft_new',
        baselineDeliverableId: options.baselineDeliverableId || '',
      });
    }

    throw new Error('deliverable 命令仅支持 create|get|audit|execute|run');
  }

  if (command === 'managed') {
    if (subcommand === 'get') {
      return gateway.getManagedRun({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        managedRunId: options.managedRunId || '',
      });
    }

    if (subcommand === 'supervise') {
      return gateway.superviseManagedRun({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        managedRunId: options.managedRunId || '',
      });
    }

    throw new Error('managed 命令仅支持 get|supervise');
  }

  if (command === 'product') {
    if (subcommand === 'frontdesk') {
      return gateway.getProductFrontdesk({
        workspace_root: resolveWorkspaceRoot(options, cwd),
      });
    }

    if (subcommand === 'start') {
      return gateway.getProductStart({
        workspace_root: resolveWorkspaceRoot(options, cwd),
      });
    }

    if (subcommand === 'preflight') {
      return gateway.getProductPreflight({
        workspace_root: resolveWorkspaceRoot(options, cwd),
      });
    }

    if (subcommand === 'invoke') {
      return gateway.invokeProductEntry({
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

    if (subcommand === 'federate') {
      return gateway.invokeFederatedProductEntry({
        target_domain_id: options.targetDomainId || 'redcube_ai',
        task_intent: options.taskIntent || 'run_managed_deliverable',
        entry_mode: options.entryMode || 'opl_gateway',
        workspace_locator: {
          workspace_root: resolveWorkspaceRoot(options, cwd),
        },
        runtime_session_contract: {
          runtime_owner: 'upstream_hermes_agent',
        },
        return_surface_contract: {
          surface_kind: options.returnSurfaceKind || 'product_entry',
        },
        entry_session_contract: {
          entry_session_id: options.entrySessionId || '',
        },
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

    if (subcommand === 'session') {
      return gateway.getProductEntrySession({
        entry_session_id: options.entrySessionId || '',
      });
    }

    if (subcommand === 'manifest') {
      return gateway.getProductEntryManifest({
        workspace_root: resolveWorkspaceRoot(options, cwd),
      });
    }

    throw new Error('product 命令支持 frontdesk|start|preflight|invoke|session|manifest；internal OPL bridge 由外层 shell 调用');
  }

  if (command === 'review') {
    if (subcommand === 'get') {
      return gateway.getReviewState({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
      });
    }

    if (subcommand === 'projection') {
      return gateway.getPublicationProjection({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    if (subcommand === 'watch') {
      return gateway.runtimeWatch({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        runId: options.runId || '',
      });
    }

    if (subcommand === 'mutate') {
      const issues = String(options.issues || '').trim();
      return gateway.applyReviewMutation({
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

    throw new Error('review 命令仅支持 get|projection|watch|mutate');
  }

  if (command === 'runs') {
    if (subcommand !== 'get') {
      throw new Error('runs 命令仅支持 get');
    }

    return gateway.getRun({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
      runId: options.runId || '',
    });
  }

  if (command === 'report') {
    if (subcommand !== 'performance') {
      throw new Error('report 命令仅支持 performance');
    }

    return gateway.buildPerformanceReport({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
      topicId: options.topicId || null,
      deliverableId: options.deliverableId || null,
    });
  }

  if (command === 'profile') {
    if (options.action === 'list') {
      return gateway.getOverlayCatalog();
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
