# PP-G1B2D｜Postpartum Library Bridge Catalog

## Status

Approved narrow implementation slice. Base: `9a364a1be7576a35381b5664f8b487c22b92a98d` (PP-G1B2C frozen).

## Goal

Make the existing `#/library/postpartum` collection consume the frozen `postpartumPresentationBridgeCatalog` while preserving the current Presentation-facing library UX.

## Scope

The cumulative tracked scope is exactly:

- `src/App.tsx`
- `tests/v6.acceptance.test.tsx`
- this plan document

The collection may read bridge records, but no bridge, Presentation, Method, router, storage, style, or data-file implementation changes are allowed.

## Contract

Use `postpartumPresentationBridgeCatalog` as the collection source. For each record, all library semantics remain owned by `record.presentation`:

- PP01–PP26 coverage and existing order
- L0–L4 level filtering
- category filtering
- PP id/name search
- result count
- existing `PostpartumCard` display and `#/postpartum/:id` links

Do not add Method P-levels, pathways, mapping state, canonical Exercise data, host metadata, readiness, recommendation, or Method filters to library cards. The existing detail route remains independently bridge-backed by G1B2C.

## Frozen boundaries

Keep `postpartumMovements`, `getPostpartumMovement`, and `content.ts` compatibility exports unchanged for the remaining Home, recent, favorites, common-action, and Pattern consumers. Do not migrate those consumers in this phase. Do not change router, styles, storage, data files, Method files, programming, F2B, G2, deployment, release, push, PR, or merge.

## Verification sequence

1. Baseline gate: branch `codex/pp-g1b2d-postpartum-library-bridge-catalog`, HEAD `9a364a1`, tracked tree clean, `.c2c.json` only untracked harness artifact; frozen G1B2C and G1B2B tests pass.
2. RED: add acceptance coverage deriving expected catalog entries and filter results from `postpartumPresentationBridgeCatalog`, plus a narrow App source-boundary assertion; observe a genuine failure before production edits.
3. GREEN: import the frozen catalog and change only `PostpartumLibrary` to filter `record.presentation` and render `record.presentation` through the existing card.
4. Run focused acceptance, G1B2B bridge, frozen G1B2C, G1B1, G1A, F2A, F1, and PP Method regressions; then full tests, build, SSR bridge invariant, `git diff --check`, exact three-file scope, and final status.
5. Record execution evidence and send it to the existing normal ChatGPT C2C conversation for independent Final Review.

## Stop conditions

Stop for review if a fourth tracked file is required, bridge or compatibility data must change, router/storage/styles changes appear necessary, Presentation filter behavior cannot be preserved, Method metadata is needed for the library, or any other PP consumer must be migrated to make this slice work.
