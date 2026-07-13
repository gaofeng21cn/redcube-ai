# Owner Receipt Policy

Owner receipt signer: RedCube AI.

Receipt refs are required when RCA claims:
- source truth frozen
- communication strategy accepted
- visual direction accepted
- artifact mutation authorized
- review/export verdict recorded
- visual memory accepted or rejected
- package handoff recorded

OPL provider completion, generated surface readiness, stage descriptor admission, and runtime attempt completion are not RCA owner receipts.

Producer, reviewer, repairer, and re-reviewer Attempts return receipt-ready fields and evidence refs only. Route helpers and Stage Folder writers never synthesize owner receipts. For a final package claim, OPL first materializes the formal Review receipt from persisted independent Attempts; RCA's `emit_domain_owner_receipt` authority surface then validates the formal receipt and domain refs before signing the owner receipt.
