# RCA Visual Memory Curator Minimal Resource Pack

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, a memory body, an owner receipt, a quality verdict, an export verdict, or runtime state.

## Template

```text
proposal_generation:
  status: skip | proposal_candidate
  reason:
  non_authority: true
  non_blocking: true

memory_proposal_candidate:
  deliverable_family:
  stage:
  audience:
  proposed_rule_or_mechanism:
  source_refs:
  evidence_refs:
  review_refs:
  provenance:
  target_scope: { kind: topic, id: stable-topic-identity }
  content_kind: mechanism | policy | state | decision
  evidence_class:
  review_requirement:
  knowledge_id:
  source_revision_ref:
  caveat:

accept_reject_review:
  proposal_ref:
  terminal_export_refs:
  evidence_sufficient:
  reusable_beyond_current_artifact:
  authority_boundary_clear:
  stale_risk:
  verdict:
  owner_receipt_ref:

writeback_lifecycle:
  proposal_ref:
  rca_accept_or_reject_ref:
  receipt_ref:
  source_binding_ref:
  original_and_accepted_revision_refs:
  stage_scoped_retrieval:

reject_reason:
  reason:
  boundary_violated:
  route_back:
```

## Example

```text
deliverable_family: ppt_deck
stage: review_and_revision
audience: clinical operations buyer
proposed_rule_or_mechanism: decision pages work better when the proof object is visible before feature naming
source_refs: screenshot_review:S06, contact_sheet:deck-v1
evidence_refs: screenshot_review:S06, contact_sheet:deck-v1
review_refs: visual_director_review:v1
target_scope: { kind: topic, id: clinical-operations-communication }
content_kind: mechanism
evidence_class: rendered_visual_review
review_requirement: RCA owner review after terminal export, limited to decision-page pacing
caveat: do not turn this into a fixed two-column layout recipe
```

## Checklist

- Proposal generation links to rendered artifact evidence and RCA review refs; owner accept/reject additionally requires terminal export refs.
- Screenshot-review summary may generate a proposal from review evidence alone; no candidate returns `skip` without blocking.
- Package/export only preserves an existing candidate and binds terminal refs; it does not rerun curation.
- Lesson is reusable visual-pattern memory, not current artifact body or slide copy.
- Accepted memory stays prose-first, small, stage-scoped, and provenance-linked.
- Reject deterministic layout recipes, hidden templates, route scorers, and readiness claims.
- Accept/reject decision returns an RCA owner receipt ref.
- OPL public transport carries source/proposal/receipt refs only; private snapshots contain the exact selected source bytes.
- Bind one editable source per knowledge identity. Existing personal notes and project Markdown can be used together without a duplicate body store.
- Accepted writeback uses the Framework's version checks; source changes, expiry and revocation also invalidate affected derived summaries.
- Memory never replaces screenshot review, review/export verdict, artifact authority, or owner receipt.
- Native PPT lessons require both rendered evidence and package readback; unresolved degeneration or viewer drift routes back to repair.
- Accept/reject runs only at the RCA memory-owner surface after terminal export closeout; export never self-signs the receipt.
