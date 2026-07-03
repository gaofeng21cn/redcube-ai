# RCA authority functions

Owner: `redcube_ai`
Purpose: declare the minimal RCA authority surfaces retained by this repo.
State: `active_contract_ref`
Machine boundary: this directory is a declaration surface only; it does not
implement a generic runner, queue, or stage lifecycle engine.

RCA remains the owner for owner receipts, typed blockers, visual
quality/export authority, artifact mutation authorization, and visual memory
accept/reject decisions. OPL may host generated surfaces and pass refs through
these boundaries, but it cannot create RCA truth, owner receipts, typed
blockers, quality verdicts, export verdicts, or artifact bodies.
