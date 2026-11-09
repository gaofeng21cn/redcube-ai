# PPT workbench learning

RCA consumes lecture-production lessons through its existing professional Skills,
stage-scoped knowledge recall, page prompts and review evidence. The user's brief
still selects the narrative, language, style, page constraints and authoring lane.

## Where the method lives

- `agent/knowledge/ppt_source_adaptation.md`: actual source-page duties, translation/restyle fidelity, concise causal continuity and evidence meaning.
- `agent/knowledge/ppt_style_calibration.md`: current accepted examples, reference roles, representative calibration, lettering/object semantics and relative review.
- `agent/knowledge/ppt_production_reuse.md`: page-local briefs, incremental repair, long-deck recovery, notes/copy synchronization and final-package equivalence.
- Existing story, director, page-author and reviewer Skills link the relevant cards; the knowledge catalog scopes recall by stage. The curator preserves the distinction between general lessons and private project/personal choices.
- `prompts/ppt_deck/image_first_prompt_template.md` consumes these decisions. The notebook-marker profile remains an optional example and cannot impose its palette, Chinese wording, decorations or style exclusions on another accepted direction.

## Real-image evidence helper

`ppt_review_evidence` is a read-only catalog helper behind the existing OPL
native-helper envelope. It decodes physical images, checks declared hashes and
source collections, binds RCA first-image observations, and computes generation
counts, elapsed time and known costs. It never judges content, taste or readiness.
The output retains each image's relative reference and hash, the supplied
first-image observations, and the selected image hash. Identical bytes in more than one generation retain
all their recorded attempts; the hash does not invent a selected attempt. Missing reviews
and selections remain `null`, so reopening cannot imply an accepted candidate.

A manifest uses `schema_version: rca.ppt-review-evidence.v1`,
`evidence_kind: rendered_images`, and a nonempty `pages` array. Each page has:

```json
{
  "slide_id": "pivot",
  "variant": "candidate",
  "source_page_ids": ["source-pivot"],
  "generations": [
    {
      "image_ref": "images/first.png",
      "sha256": "<actual sha256>",
      "phase": "initial",
      "attempt_id": "<actual generation identity>",
      "model": "<actual model or recorded tool identity>",
      "elapsed_seconds": 45,
      "cost_usd": null
    }
  ],
  "references": [
    {"image_ref": "refs/style.png", "sha256": "<actual sha256>", "role": "style"}
  ],
  "first_review": {
    "image_sha256": "<first generation sha256>",
    "reviewer_ref": "<RCA review evidence ref>",
    "content": "pass",
    "facts": "unassessed",
    "style": "pass",
    "readability": "pass"
  },
  "selected_image_sha256": "<optional selected generation sha256>"
}
```

References allow `content`, `style`, `anatomy`, `verified_asset` or `neighbor`.
Images are relative to the declared asset root; traversal and nonphysical URIs
are rejected. The initial generation must precede any `refinement` or `repair`.
A review must identify that initial image, not the improved final version.
Unassessed observations and unknown costs remain explicit. Summed generation
elapsed time is not end-to-end wall-clock latency. A selected image is not an
accepted handoff. For the OPL helper request, pass the module arguments:

```text
--manifest <manifest.json> --asset-root <authorized evaluation asset root>
```

The returned `revision` identifies the complete inspected manifest with
deterministic JSON serialization. Carry it with a review handoff and pass
`--expected-revision <revision>` when the Stage reads the decision again. A
changed observation, source mapping or selected candidate rejects that old
revision; image bytes are independently rehashed. This is a currentness check
on the inspected evidence, not a semantic verdict on whether a change invalidates
an independent Review.

Invoke through `opl pack native-helper run` using
`contracts/runtime-program/python-native-helper-catalog.json` and helper id
`ppt_review_evidence`. Tool-only tests may call its Python module with `PYTHONPATH=python`.

The shared `rca.workspace.artifacts` view continues to consume the registered
task's artifact locators. The image-review manifest and its measurements are
owner artifacts on that same task; they do not create another task or a notes
database. Human decisions use the current Framework item action and its payload
schema. Read back the same task after submission: a recorded `human_gate` signal
alone does not prove the controller started a subsequent Attempt. Professional
editing remains in the selected image, slide or document application.

## Evaluation and evidence boundary

The existing standard suite can consume
`agent/professional_skills/rca-ppt-reviewer/resources/workbench-evaluation.json`.
It covers semantic pivots, essential comparisons, style/object fidelity,
concise motivation, research evidence and incremental delivery. Supply authorized
real images at runtime. Keep first attempts separate from refinement and formal
repair, use matched inputs and blinded order, and retain RCA pixel-review refs.

Structural fixtures remain useful for interface tests; placeholder hashes cannot
prove generated quality. Real-file replay proves helper binding and arithmetic,
not that the revised Agent produces better initial slides. A future live
baseline/candidate run must report its actual review evidence before claiming a
quality or efficiency gain. Installed carrier, published package and hosted
Agent acceptance require their own current readback.
