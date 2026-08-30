# PP-G1B2C｜Postpartum Detail Method Surface

## Status

Approved narrow implementation slice. Base: `fe488ebe118af7ca3c8ba0f74f332d71fcd565fd` (PP-G1B2B frozen).

## Goal

Expose the frozen PP-G1B2B presentation bridge on the existing postpartum detail route as a separate, read-only Method surface. The legacy presentation remains the primary coach-facing content and keeps its current behavior.

## Scope

The cumulative tracked scope is exactly:

- `src/App.tsx`
- `tests/v6.acceptance.test.tsx`
- this plan document

The detail page may read `getPostpartumPresentationBridgeRecord(id)` from the frozen bridge. No other production or data file is in scope.

## Contract

For a known postpartum id, render the bridge's Method counterpart beside the existing presentation and expose:

- Method ID, `progressionLevel`, `kind`, and `role`
- primary and secondary pathways
- mapping status
- mapped exercise id or variant id when present
- `hostExerciseId` only when present for a method-only node
- breathing mode, pressure intent, and phase cues when present
- quality-gate criteria and common compensations
- coach notes when present

Mapping semantics remain explicit. A method-only node is not promoted to a canonical Exercise; PP17 remains a drill with `hostExerciseId: plank`. Presentation L-levels and Method P-levels remain separate, with no conversion or inferred pathway.

## Compatibility boundaries

Preserve title/name, presentation L-levels, category, pattern links, safety/risk notes, coach-card text, videos, goals/cues, errors, favorites, recent behavior, navigation, and the unknown-id empty route. Do not change Home, search, recent, favorites, library, pattern routes, `content.ts`, router, styles, storage, recommendation, editing, programming templates, or Method data.

## Verification sequence

1. Baseline gate: branch `codex/pp-g1b2c-postpartum-detail-method-surface`, HEAD `fe488eb`, tracked tree clean.
2. RED: add focused acceptance coverage for a mapped/variant node and PP17 method-only host semantics; observe the missing surface failure.
3. GREEN: implement only the detail-page read-only surface in `App.tsx` through the frozen presentation bridge.
4. Run focused acceptance tests, then the full suite, build, SSR bridge/content invariants, `git diff --check`, and exact three-file scope checks.
5. Record execution evidence and send it to the existing normal ChatGPT C2C conversation for independent Final Review. Do not push, create a PR, merge, release, or enter PP-G1B2C follow-on work without the review result.

## Stop conditions

Stop on baseline drift, a missing bridge record, any need to modify a fourth tracked file, or any request to alter canonical identity/data semantics. Findings remain review items; this phase does not silently expand scope.
