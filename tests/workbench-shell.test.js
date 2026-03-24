import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('workbench shell exposes top-level tabs and settings entry', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/index.html', import.meta.url), 'utf-8');
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.match(html, /tabsNav/);
  assert.match(html, /<title>RedCube AI Workbench<\/title>/);
  assert.match(html, /DIRECTOR_CONSOLE/);
  assert.match(html, /Crystalline Logic/);
  assert.match(html, /模型设置/);
  assert.doesNotMatch(html, /Search productions/);
  assert.match(html, /\.shell-sidebar\s*\{/);
  assert.match(html, /\.shell-topbar\s*\{/);
  assert.match(html, /\.glass-panel\s*\{/);
  assert.match(html, /\.glass-card\s*\{/);
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
  assert.match(appJs, /导演建议/);
  assert.match(appJs, /管理输入材料/);
  assert.match(appJs, /查看笔记产物/);
  assert.match(appJs, /进入项目总览/);
  assert.match(appJs, /项目操作/);
  assert.match(appJs, /状态摘要/);
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
  assert.doesNotMatch(appJs, /AI Workspace Active/);
});

test('workbench onboarding guides empty workspaces and first-run startup with direct actions', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/index.html', import.meta.url), 'utf-8');
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.match(html, /\.console-hero-grid\s*\{/);
  assert.match(html, /\.console-status-grid\s*\{/);
  assert.match(html, /\.console-table-shell\s*\{/);
  assert.match(html, /\.insight-pane\s*\{/);
  assert.match(appJs, /编号/);
  assert.match(appJs, /操作/);
  assert.match(appJs, /当前导演任务/);
  assert.match(appJs, /允许联网搜集资料/);
  assert.match(appJs, /连接工作区/);
  assert.match(appJs, /创建任务/);
  assert.match(appJs, /打开运行页/);
  assert.match(appJs, /首轮启动/);
  assert.match(appJs, /系统会先补足研究材料，再继续主线生产/);
  assert.match(appJs, /data-action="open-create-task"/);
  assert.match(appJs, /data-action="choose-workspace-directory"/);
  assert.doesNotMatch(appJs, /当前工作区还没有可识别主题。先准备好真相源目录，再刷新工作台。/);
  assert.doesNotMatch(appJs, /三步启动/);
  assert.doesNotMatch(appJs, /First Run Protocol/);
  assert.doesNotMatch(appJs, /production table/);
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

test('workbench shell uses stitch-third style shell and frosted system cards', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/index.html', import.meta.url), 'utf-8');

  assert.match(html, /--display-font:/);
  assert.match(html, /--primary:/);
  assert.match(html, /--surface-container-low:/);
  assert.match(html, /\.shell-sidebar\s*\{/);
  assert.match(html, /\.shell-topbar\s*\{/);
  assert.match(html, /\.console-metric-card\s*\{/);
  assert.match(html, /\.insight-pane\s*\{/);
  assert.match(html, /\.console-production-layout\s*\{/);
  assert.match(html, /backdrop-filter:\s*blur\(12px\)/);
  assert.match(html, /font-family:\s*var\(--display-font\)/);
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('workbench overview uses stitch-third production table and rerun affordance', () => {
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.match(appJs, /当前主线/);
  assert.match(appJs, /console-production-layout/);
  assert.match(appJs, /输入准备度/);
  assert.match(appJs, /当前方向/);
  assert.match(appJs, /局部重跑/);
  assert.match(appJs, /最近产物/);
  assert.match(appJs, /执行优化/);
});

test('runs view uses the console shell instead of the legacy admin list', () => {
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.match(appJs, /所有主线运行都在这里留痕。/);
  assert.match(appJs, /运行账本/);
  assert.match(appJs, /账本编号/);
  assert.match(appJs, /刷新账本/);
  assert.match(appJs, /失败定位/);
  assert.doesNotMatch(appJs, /RedCube 持久化的运行态记录/);
  assert.doesNotMatch(appJs, /还没有 smoke run 记录。/);
});

test('models view uses the console routing shell instead of the legacy split sidebar', () => {
  const appJs = readFileSync(new URL('../apps/redcube-web/public/app.js', import.meta.url), 'utf-8');

  assert.match(appJs, /让每个阶段都走对模型。/);
  assert.match(appJs, /路由控制台/);
  assert.match(appJs, /阶段覆盖/);
  assert.match(appJs, /验证链路/);
  assert.doesNotMatch(appJs, /这里专门负责默认模型和阶段覆盖。/);
  assert.doesNotMatch(appJs, /provider 和 model catalog/);
});

test('macos app launcher is versioned as source plus build script', () => {
  const gitignore = readFileSync(new URL('../.gitignore', import.meta.url), 'utf-8');
  const commandScript = readFileSync(new URL('../RedCube AI Web.command', import.meta.url), 'utf-8');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf-8');

  assert.match(gitignore, /RedCube AI\.app\//);
  assert.match(commandScript, /scripts\/launch-redcube-web\.sh/);
  assert.match(readme, /RedCube AI\.app/);
  assert.match(readme, /scripts\/build-macos-app\.sh/);
});

test('settings page is dedicated to provider and api key management', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/settings.html', import.meta.url), 'utf-8');
  const settingsJs = readFileSync(new URL('../apps/redcube-web/public/settings.js', import.meta.url), 'utf-8');

  assert.match(html, /OpenAI-compatible/);
  assert.match(html, /API Key/);
  assert.match(html, /Base URL/);
  assert.doesNotMatch(html, /provider 绑定/);
  assert.doesNotMatch(settingsJs, /OpenAI-compatible endpoint/);
  assert.doesNotMatch(settingsJs, /OpenAI-compatible endpoints 已接入/);
  assert.doesNotMatch(settingsJs, /Stage-ready model catalog/);
});

test('settings page shares the redcube shell and brand system', () => {
  const html = readFileSync(new URL('../apps/redcube-web/public/settings.html', import.meta.url), 'utf-8');

  assert.match(html, /<title>RedCube AI Model Console<\/title>/);
  assert.match(html, /RedCube AI/);
  assert.match(html, /AI_WORKBENCH/);
  assert.match(html, /MODEL_CONSOLE/);
  assert.match(html, /让 RedCube AI 的模型底座清晰、可控、可追踪。/);
  assert.match(html, /供应商矩阵/);
  assert.match(html, /模型库/);
  assert.match(html, /操作账本/);
  assert.match(html, /配置快照/);
  assert.match(html, /工作区镜像/);
  assert.match(html, /控制台状态/);
  assert.doesNotMatch(html, /只保留一套稳定提示词，也只保留一套稳定模型配置入口。/);
  assert.doesNotMatch(html, /Provider Matrix/);
  assert.doesNotMatch(html, /Model Library/);
  assert.doesNotMatch(html, /Run Ledger/);
  assert.match(html, /\.shell-sidebar\s*\{/);
  assert.match(html, /\.shell-topbar\s*\{/);
  assert.match(html, /\.glass-panel\s*\{/);
  assert.match(html, /Space\+Grotesk/);
  assert.match(html, /Manrope/);
  assert.match(html, /--primary:/);
  assert.match(html, /--surface-container-low:/);
  assert.match(html, /OpenAI-compatible/);
  assert.match(html, /API Key/);
  assert.match(html, /Base URL/);
});
