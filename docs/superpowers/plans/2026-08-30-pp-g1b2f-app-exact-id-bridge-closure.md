# PP-G1B2F｜App Exact-ID Bridge Lookup Closure Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with TDD and stop at every scope gate. This phase is independently reviewed after validation and must not begin any later phase.

**Goal:** Replace the last App-level PP exact-ID reads with the frozen bridge lookup while preserving stored-ID ordering, template fallback, empty states, and Presentation-only UI.

**Architecture:** Resolve known PP IDs through `getPostpartumPresentationBridgeRecord(id)?.presentation`; leave generic storage and `content.ts` compatibility exports unchanged. This closes App's runtime dependency on legacy PP APIs without rebuilding any Presentation↔Method join or exposing Method metadata in Home/Pattern surfaces.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Vite SSR.

## Global Constraints

- Base SHA: `7099a72e26549323bd9ed2b7ce2db5d855faff7d` (PP-G1B2E independently frozen).
- Branch: `codex/pp-g1b2f-app-exact-id-bridge-closure`.
- Exact cumulative tracked scope: `src/App.tsx`, `tests/v6.acceptance.test.tsx`, and this plan document.
- No changes to `src/lib/storage.ts`, `content.ts`, bridge/data files, router, styles, Method data, Exercise data, or Programming data.
- No removal of compatibility exports, no fallback by name/sourceId/order, and no Method UI expansion.
- No push, PR, merge, release, F2B, or G2.

## Contract

- Home recent maps PP IDs through the bridge and keeps `getTemplate(id)` as the fallback for generic template IDs; unknown IDs remain omitted and valid item order remains unchanged.
- Home favorites maps PP IDs through bridge Presentation records; unknown IDs remain omitted, cards retain existing favorite controls, Presentation labels, and `#/postpartum/:id` links.
- PatternDetailPage maps `pattern.postpartumIds` through exact bridge lookup; link order, hrefs, and the empty state for patterns without PP links remain unchanged.
- After this phase `App.tsx` has no runtime `postpartumMovements` or `getPostpartumMovement` dependency. `content.ts` retains those compatibility APIs for non-App consumers and regression contracts.

## TDD and Validation

1. Baseline: exact branch/base, clean tracked tree, only `.c2c.json` untracked, and G1B2E frozen suite 297/297.
2. RED: add acceptance tests for mixed recent IDs, favorites, PatternDetailPage linked and empty states, and App source closure; confirm the closure assertion fails before the production edit.
3. GREEN: change only the three exact-ID resolver call sites and remove the now-unused legacy App import; update the existing bridge occurrence-count assertion to reflect the three new call sites.
4. Validate focused acceptance, G1B2B/G1B2C/G1B2D/G1B2E/G1B1/G1A/F2A/F1/PP Method regressions, full tests, build, SSR bridge/pattern/route invariants, diff check, exact three-file scope, and final status.
5. Commit the three tracked files, record execution evidence, and request ChatGPT independent Final Review in the existing normal chat.

## Stop Conditions

Stop and return for review if G1B2E is not frozen at the exact base, a fourth tracked file is required, storage/content/bridge/router/style changes appear necessary, any PP ID cannot resolve through the frozen bridge, a name/source/order fallback is needed, or any Method metadata/readiness/recommendation logic is required.

## Implementation Checklist

- [x] Add failing acceptance coverage derived from bridge exact-ID records.
- [x] Confirm genuine RED before production changes.
- [x] Migrate Home recent, Home favorites, and PatternDetailPage PP lookups.
- [x] Remove the unused App legacy PP resolver import and update the structural occurrence assertion.
- [x] Run the complete validation gates and inspect scope.
- [x] Commit exactly the three approved tracked files.
- [x] Send EXECUTED and wait for independent Final Review.
