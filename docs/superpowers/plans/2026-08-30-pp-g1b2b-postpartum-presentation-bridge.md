# PP-G1B2B｜Legacy PP Presentation Bridge Contract

## Scope

Implement a data-only bridge between the legacy PP01–PP26 presentation records
and the frozen PP Method source nodes. This phase does not migrate App
consumers, alter legacy presentation data, or change Method data.

Base: `5dab7fb902ed3fbaeb3feeb64e7f8077d653cbfd`

Implementation branch: `codex/pp-g1b2b-postpartum-presentation-bridge`

## Ownership contract

- Join only by exact `presentation.id === methodNode.id`.
- Select Method nodes only when `methodNode.source?.origin === 'postpartum-course'`.
- Verify, after the ID join, that `source.sourceId === presentation.id.toUpperCase()`
  and `source.sourceName === presentation.name`; never use those values as join keys.
- Preserve the two original object references under `presentation` and `methodNode`.
- Keep legacy `level` separate from Method `progressionLevel`; perform no L→P conversion.
- Keep legacy `movementPatterns` separate from Method pathways; perform no conversion.
- Preserve 12 mapped / 9 variant / 5 method-only source-node distribution.
- Keep `pp06`, `pp17`, `pp20`, `pp21`, and `pp22` method-only.
- Keep PP17 as `drill` with `hostExerciseId = 'plank'`; host context is not canonical identity.
- Keep presentation media/copy/category/order in the presentation reference and
  Method controls in the Method reference.
- Do not introduce F1/F2/G1A, Exercise, Programming, App, router, or storage dependencies.

## Contract

Create `src/data/postpartumPresentationBridge.ts` with a reference-oriented
`PPPostpartumPresentationRecord` containing exactly `presentation` and
`methodNode` at its root. Export a pure validator, a fail-closed builder, the
default 26-record catalog, and exact-ID lookup returning `undefined` for an
unknown ID. Validation must report typed issues for count drift, duplicate IDs,
missing counterparts, source ID/name/origin mismatches, and invalid source-node
identity. Malformed input makes the builder throw; ordinary unknown lookup does
not throw.

## Tests-first sequence

Add `tests/pp-postpartum-presentation-bridge.test.ts` before production code and
confirm the new contract tests fail because the bridge module/API is absent.
Cover:

1. exactly 26 records, bidirectional coverage, and no `exp-*` nodes;
2. reference identity for presentation and Method objects;
3. root shape is only `presentation` and `methodNode`;
4. source metadata invariants and 12/9/5 mapping distribution;
5. exact method-only set and PP17 safety;
6. legacy L/P mismatch and range preservation;
7. independent patterns/pathways and presentation/Method ownership;
8. exact lookup and safe unknown lookup;
9. synthetic negative seams: duplicate/missing presentation or Method,
   duplicate Method source, source ID/name/origin mismatch, and expansion nodes.

## Validation gates

After implementation, run the focused bridge tests, all existing suites (baseline
257 plus the actual new total), build, SSR/import invariants, `git diff --check`,
and the cumulative scope audit from the base SHA. The cumulative tracked scope
must be exactly these three new files:

- `src/data/postpartumPresentationBridge.ts`
- `tests/pp-postpartum-presentation-bridge.test.ts`
- this plan document

All existing files and PRs #10/#11/#12 remain untouched. No push, PR, merge,
release, G1B2C, F2B, or G2 action is included.

## Stop conditions

Stop for review if the base, clean baseline, or frozen invariants differ; if a
frozen file or a fourth file is required; or if implementation requires any
join other than exact PP ID, L→P conversion, pattern/pathway conversion,
fabricated canonical identity, or flattened duplicate source-of-truth fields.

## Task 1: implement and verify the bridge contract

In the isolated G1B2B worktree, write the bridge contract tests first and
confirm a genuine RED caused by the missing module. Then add the minimal
`postpartumPresentationBridge.ts` implementation, preserving the two source
object references and the exact identity/ownership rules above. Add the
approved bridge plan document, run focused and full validation, and leave all
existing files untouched. The task is complete only when the cumulative
tracked diff contains exactly the three approved new files and all required
tests, build, SSR, diff, and invariant checks pass.
