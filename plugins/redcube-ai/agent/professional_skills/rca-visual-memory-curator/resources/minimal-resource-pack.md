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
  reusable_pattern:
  evidence_refs:
  review_refs:
  provenance:
  scope:
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
  locator_projection_ref:
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
reusable_pattern: decision pages work better when the proof object is visible before feature naming
evidence_refs: screenshot_review:S06, contact_sheet:deck-v1
review_refs: visual_director_review:v1
scope: future clinical operations decks, decision-page pacing only
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
- OPL transport carries locator/proposal/receipt/projection refs only.
- Memory never replaces screenshot review, review/export verdict, artifact authority, or owner receipt.
- Native PPT lessons require both rendered evidence and package readback; unresolved degeneration or viewer drift routes back to repair.
- Accept/reject runs only at the RCA memory-owner surface after terminal export closeout; export never self-signs the receipt.
