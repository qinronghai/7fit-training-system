# PP-G1B2B｜Legacy PP Presentation Bridge Contract

## Scope

Implement a data-only bridge between the legacy PP01–PP26 presentation records
and the frozen PP Method source nodes. This phase does not migrate App
consumers, alter legacy presentation values, or change Method data.

The original plan assumed a cumulative three-file scope: the bridge, its test,
and this plan. Final review found that assumption critically incomplete: a
bridge importing `content.ts` also imports Programming and Exercise domains,
while leaving `content.ts` as an independent PP source would duplicate the
Presentation source of truth. The approved correction is a cumulative
five-file scope.

Base: `5dab7fb902ed3fbaeb3feeb64e7f8077d653cbfd`

Implementation branch: `codex/pp-g1b2b-postpartum-presentation-bridge`

## Approved cumulative scope

Only these five tracked files may change:

1. `src/data/content.ts`
2. `src/data/postpartumPresentationData.ts` (new pure Presentation leaf)
3. `src/data/postpartumPresentationBridge.ts`
4. `tests/pp-postpartum-presentation-bridge.test.ts`
5. this plan document

No sixth file, unrelated change, App migration, F1/F2/G1A, G1B2C, G2, release,
commit, push, PR, or merge is included.

## Ownership and dependency architecture

- Move, do not copy, `Level`, `ActionEntity`, `ppSeeds`, `parseLevels`,
  `postpartumMovements`, and `getPostpartumMovement` from `content.ts` into
  `postpartumPresentationData.ts`, preserving PP01–PP26 values byte/semantically.
- The Presentation leaf has zero runtime imports and no Programming, Exercise,
  PP, App, router, storage, or template dependencies.
- `content.ts` imports and compatibility-re-exports the extracted Presentation
  APIs. Its movement patterns, pattern seeds, routes, templates, library
  actions, and Programming adapters remain unchanged except for this wiring.
- There must be exactly one runtime definition of `ppSeeds` and
  `postpartumMovements`; no duplicated PP dataset is permitted.
- The bridge imports Presentation data directly from
  `./postpartumPresentationData`, with only narrow `./pp/methodNodes` runtime
  and `./pp/types` type dependencies. It must not import `./content` or broad
  Programming/Exercise/App/router/storage/template domains.

## Bridge contract

- Join only by exact `presentation.id === methodNode.id`.
- Select Method nodes only when `node.source?.origin === 'postpartum-course'`.
- Verify after the ID join that `source.sourceId === presentation.id.toUpperCase()`
  and `source.sourceName === presentation.name`; never use those values as join
  keys.
- Preserve the two original object references under a root containing exactly
  `presentation` and `methodNode`; do not flatten fields or convert L→P levels
  or movement patterns into Method pathways.
- Preserve exactly 26 records, with 12 mapped / 9 variant / 5 method-only.
  The method-only IDs are `pp06`, `pp17`, `pp20`, `pp21`, and `pp22`.
- Preserve PP17 as `drill`, `method-only`, and `hostExerciseId = 'plank'`; this
  host metadata is not canonical identity and no canonical fields are added.
- Original PP source nodes accept only `mapped`, `variant`, and `method-only`.
  `add-candidate` and `verify` are rejected fail-closed with a typed
  `UNSUPPORTED_SOURCE_MAPPING_STATUS` issue and a builder throw.
- Export an immutable catalog/container and exact-ID lookup returning
  `undefined` for unknown IDs. Keep the lookup `Map` private. Do not freeze or
  deep-clone the underlying Presentation or Method objects; preserve identity.
- Validation reports typed issues for count drift, duplicate IDs, missing
  counterparts, source ID/name/origin mismatches, unsupported source mapping
  status, expansion nodes, invalid source-node identity, and invalid root shape.

## Tests-first sequence and coverage

Add or adjust `tests/pp-postpartum-presentation-bridge.test.ts` before
production rewiring and record a genuine RED in the ignored plan-scoped SDD
ledger. Cover:

1. exact 26-record coverage, direct origin filtering, 26 selected original
   nodes, 27 expansion nodes excluded, and zero `exp-*` bridge records;
2. reference identity, exact root shape, immutable bridge container, and safe
   exact-ID lookup;
3. source metadata, 12/9/5 mapping distribution, method-only set, PP17 safety,
   and legacy L/P range preservation;
4. independent presentation patterns/pathways and presentation/Method ownership;
5. synthetic negative seams for duplicate/missing counterparts, duplicate
   Method source IDs, source ID/name/origin mismatch, expansion nodes, and both
   unsupported mapping statuses, including typed issue and builder throw;
6. structural import-boundary checks for the bridge and pure leaf;
7. content compatibility/reference parity, including `getPostpartumMovement`,
   26 movements, 34 pattern relationships, and 66 routes.

## Validation gates

Run focused bridge tests, all existing suites, build, SSR/import invariants,
`git diff --check`, and the cumulative scope audit from the base SHA. Report
focused count, full npm test count, build result, SSR probe result (26/0),
diff-check result, exact cumulative changed files, branch/HEAD, and blockers.

Stop for review if the base, clean baseline, or frozen invariant counts differ;
if a sixth tracked file is needed; or if implementation requires a non-exact
PP ID join, L→P conversion, pattern/pathway conversion, fabricated canonical
identity, or flattened duplicate source-of-truth fields.
