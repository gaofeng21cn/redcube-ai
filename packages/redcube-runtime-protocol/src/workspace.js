import path from 'node:path';

function requireSegment(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export function resolveWorkspaceContract({ workspaceRoot }) {
  const root = path.resolve(requireSegment('workspaceRoot', workspaceRoot));
  return {
    workspaceRoot: root,
    workspaceFile: path.join(root, 'redcube.workspace.json'),
    topicsDir: path.join(root, 'topics'),
    runtimeDir: path.join(root, 'runtime'),
    publishDir: path.join(root, 'publish'),
    overlaysDir: path.join(root, 'overlays'),
  };
}

export function getTopicPaths(workspaceRoot, topicId) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const topic = requireSegment('topicId', topicId);
  const topicDir = path.join(contract.topicsDir, topic);
  return {
    topicId: topic,
    topicDir,
    topicFile: path.join(topicDir, 'topic.json'),
    inputsDir: path.join(topicDir, 'inputs'),
    canonicalDir: path.join(topicDir, 'canonical'),
    notesDir: path.join(topicDir, 'notes'),
    runsDir: path.join(topicDir, 'runs'),
  };
}

export function getNotePaths(workspaceRoot, topicId, noteId) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  const note = requireSegment('noteId', noteId);
  const noteDir = path.join(topicPaths.notesDir, note);
  return {
    noteId: note,
    noteDir,
    noteFile: path.join(noteDir, 'note.json'),
    artifactsDir: path.join(noteDir, 'artifacts'),
    reportsDir: path.join(noteDir, 'reports'),
    viewsDir: path.join(noteDir, 'views'),
  };
}
