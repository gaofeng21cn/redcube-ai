export function evaluatePosterStorylineGate({ headline }) {
  const text = String(headline || '').trim();
  return {
    ok: text.length > 0,
    blocker: text.length > 0 ? null : 'headline_missing',
    next_action: text.length > 0 ? 'continue' : 'rerun_storyline',
  };
}
