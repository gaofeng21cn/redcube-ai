import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('workbench shell exposes top-level tabs and settings entry', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/index.html', import.meta.url), 'utf-8');
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.match(html, /tabsNav/);
  assert.match(html, /<title>RedCube AI Workbench<\/title>/);
  assert.match(html, /RedCube AI Workbench/);
  assert.match(html, /模型设置/);
  assert.match(html, /\.button-link,\s*\.btn-secondary,\s*\.btn-primary\s*\{[\s\S]*display:\s*inline-flex;/);
  assert.match(html, /\.slide-image-box\s*\{/);
  assert.match(html, /\.slide-frame img\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*object-fit:\s*contain;/);
  assert.match(appJs, /工作台/);
  assert.match(appJs, /项目/);
  assert.match(appJs, /运行/);
  assert.match(appJs, /模型/);
});

test('workbench view uses project overview as the default entry and separates inputs from note artifacts', () => {
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.doesNotMatch(appJs, /<div class="section-title">主题<\/div>/);
  assert.match(appJs, /项目总览/);
  assert.match(appJs, /材料系统/);
  assert.match(appJs, /产物系统/);
  assert.match(appJs, /运行建议/);
  assert.match(appJs, /管理输入材料/);
  assert.match(appJs, /查看笔记产物/);
  assert.match(appJs, /进入项目总览/);
  assert.match(appJs, /项目操作/);
  assert.match(appJs, /工作区概览/);
  assert.match(appJs, /项目目录/);
  assert.match(appJs, /焦点项目/);
  assert.match(appJs, /当前运行摘要/);
  assert.match(appJs, /查看历史运行/);
  assert.doesNotMatch(appJs, /最近运行轨迹/);
  assert.match(appJs, /开始首轮生成/);
  assert.match(appJs, /start-topic-workflow/);
  assert.match(appJs, /当前步骤/);
  assert.match(appJs, /失败原因/);
  assert.match(appJs, /重新生成/);
  assert.match(appJs, /参考材料/);
  assert.match(appJs, /人设与规则/);
  assert.match(appJs, /风格基调/);
  assert.match(appJs, /模板/);
  assert.match(appJs, /show-overview/);
  assert.match(appJs, /show-inputs/);
  assert.match(appJs, /show-artifacts/);
  assert.match(appJs, /执行修改/);
  assert.match(appJs, /topic:\s*note\?\.topicSlug\s*\|\|\s*state\.selectedTopicSlug\s*\|\|\s*''/);
  assert.match(appJs, /上传材料/);
  assert.match(appJs, /删除项目/);
  assert.match(appJs, /delete-topic/);
  assert.match(appJs, /await startTopicWorkflow\(result\.topic\);/);
});

test('workbench onboarding guides empty workspaces and first-run startup with direct actions', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/index.html', import.meta.url), 'utf-8');
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.match(html, /\.onboarding-shell\s*\{/);
  assert.match(html, /\.onboarding-step-card\s*\{/);
  assert.match(appJs, /三步启动/);
  assert.match(appJs, /连接工作区/);
  assert.match(appJs, /创建任务骨架/);
  assert.match(appJs, /自动首轮生成/);
  assert.match(appJs, /首轮启动/);
  assert.match(appJs, /创建后会自动进入首轮生成/);
  assert.match(appJs, /data-action="open-create-task"/);
  assert.match(appJs, /data-action="choose-workspace-directory"/);
  assert.doesNotMatch(appJs, /当前工作区还没有可识别主题。先准备好真相源目录，再刷新工作台。/);
});

test('workspace switching uses system directory picker instead of manual path input', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/index.html', import.meta.url), 'utf-8');
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');
  const settingsHtml = readFileSync(new URL('../apps/redcube-web/public/settings.html', import.meta.url), 'utf-8');
  const settingsJs = readFileSync(new URL('../apps/redcube-web/public/settings.js', import.meta.url), 'utf-8');

  assert.doesNotMatch(html, /<input id="workspaceRoot" placeholder="工作区路径"/);
  assert.doesNotMatch(settingsHtml, /<input id="workspaceRoot" placeholder="工作区路径"/);
  assert.match(appJs, /\/api\/SelectWorkspaceDirectory/);
  assert.match(settingsJs, /\/api\/SelectWorkspaceDirectory/);
  assert.doesNotMatch(appJs, /toggleWorkspaceEditor/);
  assert.doesNotMatch(settingsJs, /workspaceEditor\.classList\.toggle/);
});

test('workbench shell uses a more editorial visual system for modern product UI', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/index.html', import.meta.url), 'utf-8');

  assert.match(html, /--display-font:/);
  assert.match(html, /\.shell::before\s*\{/);
  assert.match(html, /\.app-header::before\s*\{/);
  assert.match(html, /\.metric-pill\s*\{[\s\S]*flex-direction:\s*column;/);
  assert.match(html, /font-family:\s*var\(--display-font\)/);
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('settings page is dedicated to provider and api key management', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/settings.html', import.meta.url), 'utf-8');

  assert.match(html, /OpenAI-compatible/);
  assert.match(html, /API Key/);
  assert.match(html, /Base URL/);
});
