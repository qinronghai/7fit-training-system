# PP-G1A Female Programming Runtime Adapter Contract

## Status

Approved implementation plan. This phase is limited to a pure, deterministic
adapter from the frozen PP Method, PP-F1 policy, and PP-F2A template layers.

## Scope

Authorized tracked files:

1. `src/data/pp/femaleProgrammingRuntime.ts` (new)
2. `src/data/pp/index.ts` (export-only additions)
3. `tests/pp-female-programming-runtime.test.ts` (new)
4. this plan document (new)

The adapter resolves the eight frozen PP-F2A templates into 24 explicit
HIP/SUPPORT/CORE slot instances. Each instance retains references to the
existing Method node, PP-F1 policy entry, and canonical Exercise record, and
surfaces the existing mapping status, variant identity, eligibility, demand,
breathing, quality gate, compensations, challenge role, and slot.

## Invariants

- Reuse PP-F2A and PP-F1 validators; do not duplicate their business rules.
- `mapped` resolves the mapped canonical Exercise; `variant` resolves its
  canonical host plus the explicit `variantId`.
- `method-only`, `verify`, and `add-candidate` mappings are never executable
  and fail explicitly; no name, alias, source, action, or order inference is
  allowed.
- Conditional readiness remains the template's explicit
  `requiredConditionalNodeIds`; this adapter does not implement member
  readiness or recommendations.
- Breathing remains cross-cutting Method metadata; no BREATH slot is added.
- P-level progression identity remains separate from Female programming roles;
  no L1-L4 assignment or prescription generation is introduced.
- Resolution is pure and deterministic, with no random selection, storage,
  API, App/UI integration, or mutation of upstream data.

## Verification

Run the focused runtime tests, existing PP-F2A, PP-F1, and PP Method tests,
then the complete test suite, production build, Vite SSR import/invariant
check, `git diff --check`, and exact changed-file/status checks. Any baseline
or scope failure is an environment/scope gate and is not a Method verdict.
