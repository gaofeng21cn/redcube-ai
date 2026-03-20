import path from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import {
  buildHtmlGenerationDocMarkdown,
  applyAutoFix,
  buildContentPlanMarkdown,
  buildInfographicOutlineDocMarkdown,
  buildPlanningDocMarkdown,
  buildPublishCopyDocMarkdown,
  buildVisualDirectionDocMarkdown,
  buildTaskFolderName,
  buildVisualHtml,
  buildVisualReviewDocMarkdown,
  createPublishBundle,
  ensureDir,
  evaluateVisualHtml,
  getProjectPaths,
  loadProjectBundle,
  parseContentPlanMarkdown,
  readJsonIfExists,
  writeJson,
  writePlaceholderImage,
  writeText,
} from '../../redcube-tools/src/index.js';
import { generateNoteDraft } from '../../redcube-llm/src/index.js';

export async function runWorkflowDomain(config, context) {
  const mode = config.mode || 'full';
  const loaded = loadProjectBundle(context.rootDir, config.project, config.tasks || '');

  if (!loaded.ok) {
    return {
      ok: false,
      errors: loaded.errors,
      warnings: loaded.warnings,
      projectName: config.project,
      totalTasks: 0,
      successTasks: 0,
      taskResults: [],
      outputDir: loaded.paths.outputsDir,
      mode,
    };
  }

  ensureDir(loaded.paths.outputsDir);

  const taskResults = [];
  let success = 0;

  for (const [idx, taskTitle] of loaded.tasks.entries()) {
    const taskIndex = idx + 1;
    const folderName = buildTaskFolderName(taskIndex, taskTitle);
    const outputFolder = path.join(loaded.paths.outputsDir, folderName);
    ensureDir(outputFolder);

    const steps = {
      planned: false,
      htmlGenerated: false,
      evaluated: false,
      fixed: false,
      published: false,
    };

    try {
      let note = readJsonIfExists(path.join(outputFolder, 'note.json'));

      if (mode === 'full' || mode === 'plan') {
        note = await generateNoteDraft({
          taskTitle,
          rawMaterials: loaded.rawMaterials,
          styleGuide: loaded.styleGuide,
          storylineLogic: loaded.storylineLogic,
          llmConfig: context.planningLlmConfig || null,
          runtimeConfig: context.runtimeConfig || null,
        });

        writeJson(path.join(outputFolder, 'note.json'), note);
        writeText(path.join(outputFolder, 'content_plan.md'), buildContentPlanMarkdown(note));
        writeStageDocs({ outputFolder, taskTitle, note, html: '', report: null, runtimeConfig: context.runtimeConfig || null });
        steps.planned = true;
      }

      if (mode === 'full' || mode === 'html') {
        if (!note) {
          note = readJsonIfExists(path.join(outputFolder, 'note.json'));
        }

        if (!note) {
          const contentPlan = existsSync(path.join(outputFolder, 'content_plan.md'))
            ? readFileSync(path.join(outputFolder, 'content_plan.md'), 'utf-8')
            : '';
          note = buildFallbackNote(taskTitle, contentPlan);
        }

        let html = buildVisualHtml(note, taskTitle);
        writeJson(path.join(outputFolder, 'html_fragments.json'), [{ content: html }]);
        writeText(path.join(outputFolder, 'visual.html'), html);
        writePlaceholderImage(path.join(outputFolder, 'images'));
        writeText(
          path.join(outputFolder, '03_HTML生成说明.md'),
          buildHtmlGenerationDocMarkdown(note, taskTitle, {
            planningPath: path.join(outputFolder, '01_单篇策划.md'),
            outlinePath: path.join(outputFolder, '02_信息图大纲.md'),
            visualDirectionPath: path.join(outputFolder, '02A_视觉导演稿.md'),
            htmlFileName: 'visual.html',
          }),
        );
        writeText(path.join(outputFolder, '04_发布文案.md'), buildPublishCopyDocMarkdown(note, taskTitle, { runtimeConfig: context.runtimeConfig || null }));
        steps.htmlGenerated = true;

        if (mode === 'full') {
          const evalBefore = evaluateVisualHtml(html);
          steps.evaluated = true;

          if (evalBefore.needFix && config.autoFix !== false) {
            html = applyAutoFix(html, evalBefore.issues);
            writeJson(path.join(outputFolder, 'corrected_fragments.json'), [{ content: html }]);
            writeText(path.join(outputFolder, 'visual.html'), html);
            writePlaceholderImage(path.join(outputFolder, 'images'));
            steps.fixed = true;
          }

          const evalAfter = evaluateVisualHtml(html);
          writeJson(path.join(outputFolder, 'visual_quality_report.json'), {
            status: 'completed',
            needFix: evalAfter.needFix,
            allIssues: evalAfter.issues,
          });
          writeText(
            path.join(outputFolder, '05_视觉质控复核.md'),
            buildVisualReviewDocMarkdown(
              {
                needFix: evalAfter.needFix,
                allIssues: evalAfter.issues,
              },
              {
                totalPages: Math.min(Math.max((note?.outline?.length || 4) + 1, 5), 10),
                pngDir: path.join(outputFolder, 'images'),
              },
            ),
          );
        }
      }

      taskResults.push({
        index: taskIndex,
        taskTitle,
        status: 'success',
        folder: outputFolder,
        steps,
      });
      success += 1;
    } catch (error) {
      taskResults.push({
        index: taskIndex,
        taskTitle,
        status: 'failed',
        folder: outputFolder,
        error: error instanceof Error ? error.message : String(error),
        steps,
      });
    }
  }

  const summary = {
    ok: true,
    projectName: config.project,
    mode,
    totalTasks: loaded.tasks.length,
    successTasks: success,
    outputDir: loaded.paths.outputsDir,
    taskResults,
    warnings: loaded.warnings,
  };

  writeJson(path.join(loaded.paths.outputsDir, 'run_summary.json'), summary);
  return summary;
}

export async function evaluateWorkflowDomain(config, context) {
  const paths = getProjectPaths(context.rootDir, config.project);
  ensureDir(paths.outputsDir);

  const taskFolders = readdirSync(paths.outputsDir)
    .filter((name) => /^\d{2}_/.test(name))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  let needFixCount = 0;
  const taskResults = [];

  for (const folderName of taskFolders) {
    const folder = path.join(paths.outputsDir, folderName);
    const visualFile = path.join(folder, 'visual.html');

    if (!existsSync(visualFile)) {
      taskResults.push({ folder: folderName, status: 'skipped', reason: 'visual.html 缺失' });
      continue;
    }

    let html = readFileSync(visualFile, 'utf-8');
    const before = evaluateVisualHtml(html);

    if (before.needFix) {
      needFixCount += 1;
    }

    let fixed = false;
    if (before.needFix && config.autoFix) {
      html = applyAutoFix(html, before.issues);
      writeText(visualFile, html);
      writeJson(path.join(folder, 'corrected_fragments.json'), [{ content: html }]);
      fixed = true;
    }

    const after = evaluateVisualHtml(html);
    writeJson(path.join(folder, 'visual_quality_report.json'), {
      status: 'completed',
      needFix: after.needFix,
      allIssues: after.issues,
    });

    taskResults.push({
      folder: folderName,
      status: 'completed',
      needFix: after.needFix,
      fixed,
      issuesBefore: before.issues,
      issuesAfter: after.issues,
    });
  }

  const summary = {
    projectName: config.project,
    totalTasks: taskFolders.length,
    tasksNeedingFix: needFixCount,
    taskResults,
    outputDir: paths.outputsDir,
  };

  writeJson(path.join(paths.outputsDir, 'evaluation_summary.json'), summary);
  return summary;
}

export async function rerunTaskFromStageDomain(config = {}, context = {}) {
  const rootDir = context.rootDir || process.cwd();
  const project = String(config.project || '').trim();
  const taskFolder = String(config.taskFolder || '').trim();
  const fromStage = String(config.fromStage || 'planning').trim() || 'planning';
  const paths = getProjectPaths(rootDir, project);
  const outputFolder = path.join(paths.outputsDir, taskFolder);

  if (!project) {
    return { ok: false, error: 'project 不能为空' };
  }
  if (!taskFolder) {
    return { ok: false, error: 'taskFolder 不能为空' };
  }
  if (!existsSync(outputFolder)) {
    return { ok: false, error: `任务目录不存在: ${outputFolder}` };
  }

  const taskTitle = taskFolder.replace(/^\d{2}_/, '');
  const steps = {
    planned: false,
    htmlGenerated: false,
    evaluated: false,
    fixed: false,
  };

  if (['planning', 'infographic_outline', 'visual_direction'].includes(fromStage)) {
    const contentPlanFile = path.join(outputFolder, 'content_plan.md');
    const contentPlan = existsSync(contentPlanFile) ? readFileSync(contentPlanFile, 'utf-8') : '';
    const note = parseContentPlanMarkdown(contentPlan, taskTitle);
    writeJson(path.join(outputFolder, 'note.json'), note);
    writeStageDocs({ outputFolder, taskTitle, note, html: '', report: null, runtimeConfig: context.runtimeConfig || null });
    steps.planned = true;
    return materializeTaskArtifacts({
      outputFolder,
      taskTitle,
      note,
      autoFix: config.autoFix !== false,
      steps,
      runtimeConfig: context.runtimeConfig || null,
    });
  }

  if (fromStage === 'html_generation' || fromStage === 'publish_copy' || fromStage === 'visual_review') {
    let html = existsSync(path.join(outputFolder, 'visual.html'))
      ? readFileSync(path.join(outputFolder, 'visual.html'), 'utf-8')
      : '';

    if (!html) {
      const note = readJsonIfExists(path.join(outputFolder, 'note.json'))
        || buildFallbackNote(taskTitle, existsSync(path.join(outputFolder, 'content_plan.md'))
          ? readFileSync(path.join(outputFolder, 'content_plan.md'), 'utf-8')
          : '');
      html = buildVisualHtml(note, taskTitle);
    }

    return materializeExistingHtml({
      outputFolder,
      taskTitle,
      html,
      autoFix: config.autoFix !== false,
      steps,
      runtimeConfig: context.runtimeConfig || null,
    });
  }

  return { ok: false, error: `不支持的 fromStage: ${fromStage}` };
}

export function publishWorkflowDomain(config, context) {
  return createPublishBundle({ rootDir: context.rootDir, project: config.project });
}

export function listTaskArtifacts(rootDir, project, taskFolder) {
  const paths = getProjectPaths(rootDir, project);
  const folder = path.join(paths.outputsDir, taskFolder);

  if (!existsSync(folder)) {
    return {
      ok: false,
      error: `任务目录不存在: ${folder}`,
    };
  }

  const files = readdirSync(folder);
  return {
    ok: true,
    project,
    taskFolder,
    folder,
    files,
  };
}

function buildFallbackNote(taskTitle, contentPlan) {
  const parsed = parseContentPlanMarkdown(contentPlan, `${taskTitle}：快速掌握`);
  const body = parsed.body || `围绕 ${taskTitle} 进行要点说明。`;
  return {
    titleOptions: parsed.titleOptions?.length ? parsed.titleOptions : [`${taskTitle}：快速掌握`],
    body,
    hashtags: parsed.hashtags?.length ? parsed.hashtags : ['小红书运营', '知识科普'],
    outline: parsed.outline?.length ? parsed.outline : ['核心信息', '方法步骤', '行动建议'],
  };
}

function extractBodyFromPlan(contentPlan) {
  const match = (contentPlan || '').match(/\*\*【小红书正文】\*\*\s*\n\n([\s\S]*?)(?:\n\n\*\*【信息图设计大纲】\*\*|$)/);
  return match ? match[1].trim() : '';
}

function materializeTaskArtifacts({ outputFolder, taskTitle, note, autoFix, steps, runtimeConfig = null }) {
  let html = buildVisualHtml(note, taskTitle);
  writeJson(path.join(outputFolder, 'html_fragments.json'), [{ content: html }]);
  writeText(path.join(outputFolder, 'visual.html'), html);
  writePlaceholderImage(path.join(outputFolder, 'images'));
  writeText(
    path.join(outputFolder, '03_HTML生成说明.md'),
    buildHtmlGenerationDocMarkdown(note, taskTitle, {
      planningPath: path.join(outputFolder, '01_单篇策划.md'),
      outlinePath: path.join(outputFolder, '02_信息图大纲.md'),
      visualDirectionPath: path.join(outputFolder, '02A_视觉导演稿.md'),
      htmlFileName: 'visual.html',
    }),
  );
  writeText(path.join(outputFolder, '04_发布文案.md'), buildPublishCopyDocMarkdown(note, taskTitle, { runtimeConfig }));
  steps.htmlGenerated = true;

  const evalBefore = evaluateVisualHtml(html);
  steps.evaluated = true;

  if (evalBefore.needFix && autoFix) {
    html = applyAutoFix(html, evalBefore.issues);
    writeJson(path.join(outputFolder, 'corrected_fragments.json'), [{ content: html }]);
    writeText(path.join(outputFolder, 'visual.html'), html);
    writePlaceholderImage(path.join(outputFolder, 'images'));
    steps.fixed = true;
  }

  const evalAfter = evaluateVisualHtml(html);
  writeJson(path.join(outputFolder, 'visual_quality_report.json'), {
    status: 'completed',
    needFix: evalAfter.needFix,
    allIssues: evalAfter.issues,
  });
  writeText(
    path.join(outputFolder, '05_视觉质控复核.md'),
    buildVisualReviewDocMarkdown(
      {
        needFix: evalAfter.needFix,
        allIssues: evalAfter.issues,
      },
      {
        totalPages: Math.min(Math.max((note?.outline?.length || 4) + 1, 5), 10),
        pngDir: path.join(outputFolder, 'images'),
      },
    ),
  );

  return {
    ok: true,
    project: '',
    taskFolder: path.basename(outputFolder),
    folder: outputFolder,
    steps,
  };
}

function materializeExistingHtml({ outputFolder, html, autoFix, steps, runtimeConfig = null }) {
  let nextHtml = html;
  writeJson(path.join(outputFolder, 'html_fragments.json'), [{ content: nextHtml }]);
  writeText(path.join(outputFolder, 'visual.html'), nextHtml);
  writePlaceholderImage(path.join(outputFolder, 'images'));
  steps.htmlGenerated = true;

  const evalBefore = evaluateVisualHtml(nextHtml);
  steps.evaluated = true;

  if (evalBefore.needFix && autoFix) {
    nextHtml = applyAutoFix(nextHtml, evalBefore.issues);
    writeJson(path.join(outputFolder, 'corrected_fragments.json'), [{ content: nextHtml }]);
    writeText(path.join(outputFolder, 'visual.html'), nextHtml);
    writePlaceholderImage(path.join(outputFolder, 'images'));
    steps.fixed = true;
  }

  const evalAfter = evaluateVisualHtml(nextHtml);
  writeJson(path.join(outputFolder, 'visual_quality_report.json'), {
    status: 'completed',
    needFix: evalAfter.needFix,
    allIssues: evalAfter.issues,
  });
  const note = readJsonIfExists(path.join(outputFolder, 'note.json')) || null;
  if (note) {
    writeText(
      path.join(outputFolder, '03_HTML生成说明.md'),
      buildHtmlGenerationDocMarkdown(note, path.basename(outputFolder).replace(/^\d{2}_/, ''), {
        planningPath: path.join(outputFolder, '01_单篇策划.md'),
        outlinePath: path.join(outputFolder, '02_信息图大纲.md'),
        visualDirectionPath: path.join(outputFolder, '02A_视觉导演稿.md'),
        htmlFileName: 'visual.html',
      }),
    );
    writeText(
      path.join(outputFolder, '04_发布文案.md'),
      buildPublishCopyDocMarkdown(note, path.basename(outputFolder).replace(/^\d{2}_/, ''), { runtimeConfig }),
    );
  }
  writeText(
    path.join(outputFolder, '05_视觉质控复核.md'),
    buildVisualReviewDocMarkdown(
      {
        needFix: evalAfter.needFix,
        allIssues: evalAfter.issues,
      },
      {
        totalPages: note ? Math.min(Math.max((note?.outline?.length || 4) + 1, 5), 10) : 1,
        pngDir: path.join(outputFolder, 'images'),
      },
    ),
  );

  return {
    ok: true,
    project: '',
    taskFolder: path.basename(outputFolder),
    folder: outputFolder,
    steps,
  };
}

function writeStageDocs({ outputFolder, taskTitle, note, html, report, runtimeConfig = null }) {
  writeText(
    path.join(outputFolder, '01_单篇策划.md'),
    note?.planningDocMarkdown || buildPlanningDocMarkdown(note, taskTitle, { runtimeConfig }),
  );
  writeText(path.join(outputFolder, '02_信息图大纲.md'), buildInfographicOutlineDocMarkdown(note, taskTitle));
  writeText(path.join(outputFolder, '02A_视觉导演稿.md'), buildVisualDirectionDocMarkdown(note, taskTitle));

  if (html) {
    writeText(
      path.join(outputFolder, '03_HTML生成说明.md'),
      buildHtmlGenerationDocMarkdown(note, taskTitle, {
        planningPath: path.join(outputFolder, '01_单篇策划.md'),
        outlinePath: path.join(outputFolder, '02_信息图大纲.md'),
        visualDirectionPath: path.join(outputFolder, '02A_视觉导演稿.md'),
        htmlFileName: 'visual.html',
      }),
    );
  }

  writeText(path.join(outputFolder, '04_发布文案.md'), buildPublishCopyDocMarkdown(note, taskTitle, { runtimeConfig }));

  if (report) {
    writeText(
      path.join(outputFolder, '05_视觉质控复核.md'),
      buildVisualReviewDocMarkdown(report, {
        totalPages: Math.min(Math.max((note?.outline?.length || 4) + 1, 5), 10),
        pngDir: path.join(outputFolder, 'images'),
      }),
    );
  }
}
