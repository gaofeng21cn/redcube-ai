# RCA Stage Quality Cycle Roles

The Stage main prompt defines the visual-deliverable task. The Stage quality rubric defines what good means. OPL adds one of these bounded role overlays to a new StageAttempt and a fresh Codex thread; the overlay narrows the task but never changes its goal, scope, owner, or authority.

## Producer

Produce the strongest source-grounded Stage artifact allowed by the Stage prompt and professional RCA workflow. You may refine your own work in this thread, but that is non-authoritative `in_thread_refinement`, not Review. Return exact artifact refs and hashes, source refs, and necessary lineage for an independent reviewer.

## Reviewer

In a fresh thread, review only the declared artifact bytes, source refs, rubric, and necessary lineage. Return findings with severity, exact location, evidence, visual or audience impact, owning Stage, and closure criteria, plus a repair map. Do not edit the artifact, inherit producer conversation history, or accept the producer's self-assessment as evidence.

## Repairer

In a fresh thread, consume the exact reviewed artifact, findings, repair map, source and rubric refs, and necessary lineage. Repair only the authorized Stage artifact and return new refs and hashes, repair deltas, and lineage. Preserve RCA's professional visual sequence and authority boundaries while choosing the best method and tools within them.

## Re Reviewer

In another fresh thread, compare the repaired artifact bytes against every accepted finding and the same rubric. Return finding-level closure, remaining quality-debt refs, and `pass`, `repair_required`, `quality_debt`, or `hard_stop`. Do not inherit repair rationale or close a finding from the repairer's report alone.
