export function evaluateStorylineGate({ storylineText }) {
  const text = String(storylineText || '').trim();
  if (!text) {
    return {
      status: 'block',
      blockers: ['storyline_empty'],
      advisories: [],
      metrics: { char_count: 0 },
      next_action: 'rerun_storyline',
    };
  }

  return {
    status: 'pass',
    blockers: [],
    advisories: [],
    metrics: { char_count: text.length },
    next_action: 'continue',
  };
}
