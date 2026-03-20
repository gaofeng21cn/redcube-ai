import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';

function copyRecursive(srcDir, dstDir) {
  mkdirSync(dstDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(src, dst);
    } else {
      mkdirSync(path.dirname(dst), { recursive: true });
      copyFileSync(src, dst);
    }
  }
}

function safeEntries(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((entry) => !entry.name.startsWith('.'));
}

function noteDirNameFromLegacy(folderName) {
  if (/^Note_/i.test(folderName)) return folderName;
  const match = String(folderName).match(/^(\d{2})_(.+)$/);
  if (match) {
    return `Note_${match[1]}_${match[2]}`;
  }
  return `Note_${folderName}`;
}

function extractInfographicOutline(contentPlan = '') {
  const match = String(contentPlan).match(/\*\*【信息图设计大纲】\*\*[\s\S]*$/);
  return match ? match[0].trim() : '';
}

function buildVisualDirectionDoc(taskTitle, outline) {
  return [
    `# ${taskTitle} 视觉导演稿`,
    '',
    '该文件由当前 Node 主线工作流自动同步，依据信息图设计大纲回写到 workbench 真相源。',
    '',
    outline || '暂无可提取的大纲内容。',
  ].join('\n');
}

function buildOutlineDoc(taskTitle, outline, contentPlanText = '') {
  return outline || [
    `# ${taskTitle} 信息图大纲`,
    '',
    '该文件由当前 Node 主线工作流自动同步。',
    '原始 content_plan.md 中未能稳定提取出独立的大纲段，先保留以下规划内容供 workbench 连续查看：',
    '',
    contentPlanText || '暂无内容。',
  ].join('\n');
}

function buildHtmlGenerationDoc(taskTitle, visualHtmlPath) {
  return [
    `# ${taskTitle} HTML 生成说明`,
    '',
    '该文件由当前 Node 主线工作流自动同步。',
    `- visual.html: ${visualHtmlPath}`,
    '- 说明：HTML 由模型直接生成多页片段后汇总而成，不是简化模板拼接。',
  ].join('\n');
}

function buildVisualReviewDoc(reportText = '') {
  return [
    '# 视觉质控复核',
    '',
    '该文件由当前 Node 主线工作流自动同步。',
    reportText || '已导出 visual.html 与 PNG，等待进一步人工复核。',
  ].join('\n');
}

function copyIfExists(sourceFile, targetFile) {
  if (!existsSync(sourceFile)) return false;
  mkdirSync(path.dirname(targetFile), { recursive: true });
  copyFileSync(sourceFile, targetFile);
  return true;
}

export function syncProjectOutputsToWorkbenchTopic({ workspaceRoot, topic, sourceProjectDir }) {
  const sourceInputsDir = path.join(sourceProjectDir, 'inputs');
  const sourceOutputsDir = existsSync(path.join(sourceProjectDir, 'outputs'))
    ? path.join(sourceProjectDir, 'outputs')
    : path.join(sourceProjectDir, 'outputs_pi');
  const targetTopicDir = path.join(workspaceRoot, 'output', topic);

  mkdirSync(targetTopicDir, { recursive: true });

  const storylineFile = path.join(sourceInputsDir, 'storyline_logic.md');
  if (existsSync(storylineFile)) {
    copyFileSync(storylineFile, path.join(targetTopicDir, '03_叙事风格与故事线.md'));
  }

  const seriesTocFile = path.join(sourceInputsDir, 'series_toc.md');
  if (existsSync(seriesTocFile)) {
    copyFileSync(seriesTocFile, path.join(targetTopicDir, '04_系列笔记目录.md'));
  }

  const syncedNotes = [];
  for (const entry of safeEntries(sourceOutputsDir)) {
    if (!entry.isDirectory()) continue;
    const sourceFolder = path.join(sourceOutputsDir, entry.name);
    const targetNoteDir = path.join(targetTopicDir, noteDirNameFromLegacy(entry.name));
    rmSync(targetNoteDir, { recursive: true, force: true });
    mkdirSync(targetNoteDir, { recursive: true });

    const contentPlan = path.join(sourceFolder, 'content_plan.md');
    const contentPlanText = existsSync(contentPlan) ? readFileSync(contentPlan, 'utf-8') : '';
    const planningDoc = path.join(sourceFolder, '01_单篇策划.md');
    const outlineDoc = path.join(sourceFolder, '02_信息图大纲.md');
    const visualDirectionDoc = path.join(sourceFolder, '02A_视觉导演稿.md');
    const htmlGenerationDoc = path.join(sourceFolder, '03_HTML生成说明.md');
    const publishCopyDoc = path.join(sourceFolder, '04_发布文案.md');
    const visualReviewDoc = path.join(sourceFolder, '05_视觉质控复核.md');

    if (!copyIfExists(planningDoc, path.join(targetNoteDir, '01_单篇策划.md')) && existsSync(contentPlan)) {
      copyFileSync(contentPlan, path.join(targetNoteDir, '01_单篇策划.md'));
    }

    const outline = extractInfographicOutline(contentPlanText);
    if (!copyIfExists(outlineDoc, path.join(targetNoteDir, '02_信息图大纲.md'))) {
      writeFileSync(path.join(targetNoteDir, '02_信息图大纲.md'), buildOutlineDoc(entry.name, outline, contentPlanText), 'utf-8');
    }
    if (!copyIfExists(visualDirectionDoc, path.join(targetNoteDir, '02A_视觉导演稿.md'))) {
      writeFileSync(path.join(targetNoteDir, '02A_视觉导演稿.md'), buildVisualDirectionDoc(entry.name, outline), 'utf-8');
    }

    const visualHtml = path.join(sourceFolder, 'visual.html');
    if (existsSync(visualHtml)) {
      copyFileSync(visualHtml, path.join(targetNoteDir, path.basename(visualHtml)));
      if (!copyIfExists(htmlGenerationDoc, path.join(targetNoteDir, '03_HTML生成说明.md'))) {
        writeFileSync(path.join(targetNoteDir, '03_HTML生成说明.md'), buildHtmlGenerationDoc(entry.name, visualHtml), 'utf-8');
      }
    }
    copyIfExists(publishCopyDoc, path.join(targetNoteDir, '04_发布文案.md'));

    const imagesDir = path.join(sourceFolder, 'images');
    if (existsSync(imagesDir) && statSync(imagesDir).isDirectory()) {
      copyRecursive(imagesDir, path.join(targetNoteDir, 'images'));
    }

    const visualReview = path.join(sourceFolder, 'visual_quality_report.json');
    if (copyIfExists(visualReviewDoc, path.join(targetNoteDir, '05_视觉质控复核.md'))) {
      // prefer real stage doc
    } else if (existsSync(visualReview)) {
      writeFileSync(path.join(targetNoteDir, '05_视觉质控复核.md'), buildVisualReviewDoc(readFileSync(visualReview, 'utf-8')), 'utf-8');
    } else if (existsSync(visualHtml) || existsSync(imagesDir)) {
      writeFileSync(path.join(targetNoteDir, '05_视觉质控复核.md'), buildVisualReviewDoc(), 'utf-8');
    }

    syncedNotes.push(targetNoteDir);
  }

  return {
    ok: true,
    workspaceRoot,
    topic,
    targetTopicDir,
    syncedNotes,
  };
}
