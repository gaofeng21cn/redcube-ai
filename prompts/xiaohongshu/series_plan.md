# xiaohongshu / series_plan

Use this detailed asset when `storyline.mode_decision.result` is `series`. The professional method owner is `agent/professional_skills/rca-xhs-content-strategist/SKILL.md`; this file defines the family-specific handoff shape.

## AI-first series contract

- Build the series from full source truth, audience needs, and distinct reader tasks.
- A narrative act is not a note quota. Split overloaded chapters until each note has one coherent question and a readable page estimate.
- Each note must declare what it covers, which evidence anchors support it, what adjacent notes cover, and what must not be repeated.
- For medicine-related content, use comparison, class, mechanism, decision context, or evidence-bound patient questions rather than a promotional single-drug profile.
- For medical content, preserve evidence, uncertainty, and seek-care/action boundaries. `认知 -> 希望 -> 同行` is optional narrative guidance, not a substitute for source truth.
- Normal dense notes may target 8-14 pages; no note may exceed 18 pages. Shorter notes remain valid when the reader task closes cleanly.

## Handoff Shape

```json
{
  "series_architecture": {
    "status": "required",
    "series_thesis": "<one source-grounded series thesis>",
    "recommended_note_range": "<AI-authored range and rationale>",
    "chapters": [
      {
        "chapter_id": "C01",
        "chapter_role": "<reader progression role>",
        "reader_question": "<question this chapter resolves>",
        "topic_units": ["<source-grounded unit>"],
        "transition": "<bridge to next chapter>"
      }
    ],
    "note_briefs": [
      {
        "note_id": "N01",
        "chapter_id": "C01",
        "working_title": "<normally <=20 Chinese characters>",
        "reader_question": "<one distinct question>",
        "content_scope": "<included and excluded scope>",
        "evidence_anchors": ["<public or source-grounded evidence anchor>"],
        "estimated_pages": "<AI-authored estimate, max 18>",
        "transition": "<previous/next bridge>",
        "no_repeat_scope": ["<facts owned elsewhere in the series>"]
      }
    ],
    "publication_arc": ["<sequence role and continuity instruction>"]
  }
}
```
