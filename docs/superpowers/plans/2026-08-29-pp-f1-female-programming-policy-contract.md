# PP-F1｜Female Programming Policy Contract

日期：2026-08-29  
基线：`3204f1cbabc213efb6c949df601edadad370cd68`  
分支：`codex/pp-f1-female-programming-policy`

## Scope

PP-F1 adds an independent policy layer above the frozen PP Method Layer. It
defines explicit eligibility, HIP/SUPPORT/CORE slot membership, challenge role,
demand score, conditional readiness, candidate selection, and 1+1+1 block
validation. The policy matrix covers all 53 Method nodes exactly once with the
frozen PP-E5 classification: A_DIRECT 17, B_CONDITIONAL 28, and C_METHOD_ONLY
8.

Breathing remains a cross-cutting Method execution layer. P-Level, canonical
Exercise identity, Technique Level, generic Programming roles, PP-F2 templates,
member readiness engines, UI/runtime integration, persistence, and release
operations remain outside this phase.

## Contract

- `PPFemalePolicyEntry` contains only `nodeId`, eligibility, allowed slots,
  allowed challenge roles, and demand.
- Selectable slots are exactly `HIP`, `SUPPORT`, and `CORE`.
- C_METHOD_ONLY entries have no slots, roles, or demand (`NONE`).
- B_CONDITIONAL entries require node-specific `readyConditionalNodeIds`.
- A valid block has one entry per slot, three unique node IDs, exactly one
  `PRIMARY_CHALLENGE`, at most one `HIGH` demand node, and total demand no more
  than 6.
- A `HIGH` demand node must be the primary challenge; the known
  `PP03 + PP18 + PP24` triple-high combination is rejected.

## Verification

The PP-F1 focused suite covers matrix coverage, frozen counts, identity/layer
separation, C-node exclusion, conditional readiness, slot and role semantics,
duplicate-node rejection, high-demand guardrails, and PP-F2 boundary checks.
The implementation must also preserve the E5B acceptance surface: 104
Exercises, 53 Method nodes, 45 graph edges, zero Method contract errors, zero
Verification Ledger entries, PP17 as drill/method-only hosted by `plank`, and
the existing full test/build/SSR/diff-check gates.
