import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';

function safeEntries(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((entry) => !entry.name.startsWith('.'));
}

function classifyInputFile(relativePath) {
  const normalized = String(relativePath || '').replaceAll('\\', '/').toLowerCase();
  const fileName = path.basename(normalized);

  if (normalized.startsWith('templates/')) return 'template';
  if (fileName === 'agent_preset.md' || /(preset|persona|人设|角色|system)/.test(fileName)) return 'persona_rule';
  if (/(style|tone|voice|风格)/.test(fileName)) return 'style';
  if (/(storyline|叙事)/.test(fileName)) return 'storyline';
  if (/(series_toc|系列笔记目录|toc)/.test(fileName)) return 'series_toc';
  if (/(source_material|素材|材料|参考|资料|文献|lecture|讲课|fact|research)/.test(normalized)) return 'reference_material';
  if (/^(00_|brief|启动任务|任务说明)/.test(fileName) || /(任务说明|启动任务|brief)/.test(fileName)) return 'task_brief';
  return 'other';
}

function collectInputFiles(inputDir, baseDir = inputDir) {
  const files = [];

  for (const entry of safeEntries(inputDir)) {
    const fullPath = path.join(inputDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectInputFiles(fullPath, baseDir));
      continue;
    }

    const relativePath = path.relative(baseDir, fullPath);
    files.push({
      fullPath,
      relativePath,
      fileName: path.basename(fullPath),
      category: classifyInputFile(relativePath),
      content: readFileSync(fullPath, 'utf-8'),
    });
  }

  return files;
}

function writeMergedFile(targetFile, title, files) {
  if (!files.length) return;

  const merged = files.map((file) => [
    `# ${title}: ${file.fileName}`,
    '',
    file.content.trim(),
  ].join('\n')).join('\n\n');

  mkdirSync(path.dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, merged, 'utf-8');
}

export function syncWorkbenchTopicToProject({ workspaceRoot, rootDir, topic }) {
  const inputDir = path.join(workspaceRoot, 'input', topic);
  const projectDir = path.join(rootDir, 'projects', topic);
  const inputsDir = path.join(projectDir, 'inputs');
  const rawMaterialsDir = path.join(inputsDir, 'raw_materials');

  if (!existsSync(inputDir)) {
    throw new Error(`未找到 topic 输入目录: ${inputDir}`);
  }

  rmSync(rawMaterialsDir, { recursive: true, force: true });
  mkdirSync(rawMaterialsDir, { recursive: true });

  const files = collectInputFiles(inputDir);
  const styleFiles = [];
  const storylineFiles = [];
  const tocFiles = [];

  for (const file of files) {
    if (file.category === 'template' || file.category === 'persona_rule') continue;

    if (file.category === 'style') {
      styleFiles.push(file);
      continue;
    }

    if (file.category === 'storyline') {
      storylineFiles.push(file);
      continue;
    }

    if (file.category === 'series_toc') {
      tocFiles.push(file);
      continue;
    }

    const destination = path.join(rawMaterialsDir, file.relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(file.fullPath, destination);
  }

  rmSync(path.join(inputsDir, 'style_guide.md'), { force: true });
  rmSync(path.join(inputsDir, 'storyline_logic.md'), { force: true });

  writeMergedFile(path.join(inputsDir, 'style_guide.md'), '风格材料', styleFiles);
  writeMergedFile(path.join(inputsDir, 'storyline_logic.md'), '叙事材料', storylineFiles);

  if (tocFiles.length) {
    copyFileSync(tocFiles[0].fullPath, path.join(inputsDir, 'series_toc.md'));
  }

  return {
    ok: true,
    topic,
    inputDir,
    projectDir,
    inputsDir,
    rawMaterialsDir,
    fileCount: files.length,
  };
}
