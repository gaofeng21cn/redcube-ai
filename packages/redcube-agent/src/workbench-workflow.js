const STAGE_DEFS = [
  {
    id: 'planning',
    title: '单篇策划',
    isDone: (note) => Boolean(note?.stageFiles?.planning),
  },
  {
    id: 'infographic_outline',
    title: '信息图大纲',
    deps: ['planning'],
    isDone: (note) => Boolean(note?.stageFiles?.infographicOutline),
  },
  {
    id: 'visual_direction',
    title: '视觉导演稿',
    deps: ['infographic_outline'],
    isDone: (note) => Boolean(note?.stageFiles?.visualDirection),
  },
  {
    id: 'html_generation',
    title: 'HTML 生成',
    deps: ['visual_direction'],
    isDone: (note) => Boolean(note?.stageFiles?.htmlGeneration && note?.artifacts?.html),
  },
  {
    id: 'publish_copy',
    title: '发布文案',
    deps: ['html_generation'],
    isDone: (note) => Boolean(note?.stageFiles?.publishCopy && note?.artifacts?.publishCopy),
  },
  {
    id: 'visual_review',
    title: '视觉质控',
    deps: ['publish_copy'],
    isDone: (note) => Boolean(note?.stageFiles?.visualReview),
  },
];

export function deriveNoteWorkflow(note, ledger = {}) {
  const stages = [];

  for (const def of STAGE_DEFS) {
    const dependenciesDone = (def.deps || []).every((depId) => {
      const existing = stages.find((stage) => stage.id === depId);
      return existing?.status === 'done';
    });

    let status = 'pending';
    if (def.isDone(note, ledger)) {
      status = 'done';
    } else if ((def.deps || []).length > 0 && !dependenciesDone) {
      status = 'blocked';
    }

    stages.push({
      id: def.id,
      title: def.title,
      status,
      deps: def.deps || [],
    });
  }

  const nextActionStage = stages.find((stage) => stage.status === 'pending') || null;

  return {
    noteSlug: note?.slug || '',
    stages,
    nextAction: nextActionStage
      ? {
        stageId: nextActionStage.id,
        title: nextActionStage.title,
      }
      : null,
  };
}
