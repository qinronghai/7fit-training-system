# PP-G1B2E｜Home Catalog Bridge Consumers Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with TDD and stop at every scope gate. The dependent PP-G1B2F phase must not start from this plan.

**Goal:** Migrate only Home's postpartum search results and first-four common-action cards from legacy collection data to the frozen `postpartumPresentationBridgeCatalog`.

**Architecture:** Use the existing bridge catalog as the sole App-level PP collection source, then project each bridge record to `record.presentation` for unchanged coach-facing behavior. Keep exact-ID consumers (`recent`, `favorites`, and `PatternDetailPage`) on their existing resolver until the separately reviewed PP-G1B2F phase.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Vite SSR.

## Global Constraints

- Base SHA: `f90aa429d4042f63b50aa14df9b999f7c73b4c98` (PP-G1B2D frozen).
- Branch: `codex/pp-g1b2e-home-catalog-bridge-consumers`.
- Exact cumulative tracked scope: `src/App.tsx`, `tests/v6.acceptance.test.tsx`, and this plan document.
- No changes to `content.ts`, `postpartumPresentationData.ts`, `postpartumPresentationBridge.ts`, Method data, Exercise data, Programming data, router, storage, styles, or exact-ID consumers.
- No push, PR, merge, release, PP-G1B2F, F2B, or G2.

## Contract

- Home PP search reads only `record.presentation.id`, `name`, and `category` from `postpartumPresentationBridgeCatalog`.
- Search preserves case-insensitive matching, PP result title/meta, `#/postpartum/:id` links, result-domain order, global `.slice(0, 8)`, and `addRecent(result.id)`.
- Home common actions use `postpartumPresentationBridgeCatalog.slice(0, 4).map(record => record.presentation)` and preserve card order, favorite behavior, Presentation L-level/category, and detail links.
- After this phase, `App.tsx` has no runtime `postpartumMovements` dependency; `getPostpartumMovement` remains for recent, favorites, and PatternDetailPage.

## TDD and Validation

1. Baseline: exact branch/base, clean tracked tree, only `.c2c.json` untracked, and frozen suite 293/293.
2. RED: add Home search, mixed-order, common-action, and App collection-boundary acceptance tests; confirm the boundary test fails before the production edit.
3. GREEN: change only the PP collection source in `App.tsx`.
4. Validate focused acceptance, G1B2B/G1B2C/G1B2D/G1B1/G1A/F2A/F1/PP Method regressions, full tests, build, SSR bridge invariants, diff check, and exact three-file scope.
5. Commit the three tracked files, record execution evidence, and request ChatGPT independent Final Review in the existing normal chat.

## Stop Conditions

Stop and return for review if a fourth tracked file is required, any bridge/data/router/storage/style file must change, exact-ID consumers must migrate, Presentation semantics cannot be preserved, or any next phase becomes necessary to complete this slice.

## Implementation Checklist

- [x] Add failing acceptance coverage derived from the frozen bridge catalog.
- [x] Confirm genuine RED before production changes.
- [x] Switch Home PP search to bridge `record.presentation`.
- [x] Switch Home common actions to bridge `record.presentation`.
- [x] Run the complete validation gates and inspect scope.
- [x] Commit exactly the three approved tracked files.
- [x] Send EXECUTED and wait for independent Final Review.
