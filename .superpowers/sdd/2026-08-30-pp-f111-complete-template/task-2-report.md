# Task 2 Report

Date: 2026-08-31

## Changed Files

- `src/data/female111/templateTypes.ts`
- `src/data/female111/templateRules.ts`
- `src/data/female111/templateCatalog.ts`
- `src/data/female111/index.ts`
- `tests/female111-template-level.test.ts`
- `tests/female111-template-rules.test.ts`

## Implementation Decisions

- Added a standalone `templateRules.ts` module so prescription validation and session-time estimation stay independent of React, the app shell, and router code.
- Replaced the catalog’s local hand-authored minute rollup with `estimateFemale111TemplateMinutes(..., { includeOptional: true })`, and publish `level.estimatedMinutes` from that estimator result.
- Extended template types with inspectable time components, explicit validation issue codes, and `recoveryRecord.durationSeconds` so recovery time is part of the auditable estimate rather than an implicit assumption.
- Kept the Task 1 accessor contract stable: `getFemale111Template(recipeId, level?)` still returns the selected recipe and selected level, returns `undefined` only for unknown recipe/level, and now throws a descriptive catalog-contract error if a known level fails validation.
- Enforced the 60-minute gate from calculated optional-inclusive time, plus checks for prep phase coverage, structured prescriptions, role coverage, regression/quality boundaries, and bounded progression metadata.
- Reused the existing adjacent high-fatigue same-pattern rule shape for template validation, with explicit high-fatigue markers because the template action model does not carry a dedicated `fatigueRisk` field.

## RED

Command:

```bash
npm test -- --run tests/female111-template-rules.test.ts
```

Output:

```text
❯ tests/female111-template-rules.test.ts (3 tests | 3 failed)
FAIL returns inspectable components whose ranges add to the total
TypeError: estimateFemale111TemplateMinutes is not a function

FAIL rejects missing phases, missing prescription, missing role coverage, and over-budget optional work
TypeError: validateFemale111TemplateLevel is not a function

FAIL limits a level-to-level prescription progression to two variables
TypeError: validateFemale111TemplateLevel is not a function
```

## GREEN

Command:

```bash
npm test -- --run tests/female111-template-level.test.ts tests/female111-template-rules.test.ts
```

Output:

```text
Test Files  2 passed (2)
Tests       10 passed (10)
Duration    913ms
```

## Build

Command:

```bash
npm run build
```

Output:

```text
vite build completed successfully
dist/assets/index-UUeNUs5o.js   647.41 kB | gzip: 153.34 kB
Warning: some chunks are larger than 500 kB after minification

```

## Concerns

- Non-blocking build warning: Vite reported a pre-existing large-chunk warning for the production bundle after minification.

---

## Fix Round 1

Date: 2026-08-31

### Review Finding

- Important: `validateFemale111TemplateLevel(level, previousLevel)` did not compare the real adjacent-level progression against `previousLevel`, so a stale short metadata annotation could understate the actual primary prescription delta and still pass validation.

### Round 1 Changes

- Added a regression test that mutates the adjacent primary delta across sets, reps, RIR, and rest while leaving `progressionFromPrevious` short, and now expects both `PROGRESSION_METADATA_MISMATCH` and `PROGRESSION_TOO_MANY_VARIABLES`.
- Added tracked adjacent-level progression comparison in `templateRules.ts` for major primary prescription variables and exact changed-field note matching.
- Updated the frozen catalog’s `progressionFromPrevious` metadata so the declared changed fields and declared variables match the real tracked delta already present between neighboring levels.
- Left the deferred Minor fatigue allowlist concern unchanged in this round.

### RED Round

Command:

```bash
npm test -- --run tests/female111-template-rules.test.ts
```

Output:

```text
❯ tests/female111-template-rules.test.ts (4 tests | 1 failed)
FAIL rejects short progression metadata when the real adjacent delta changes three major fields
AssertionError: expected [] to deeply equal ArrayContaining{...}
```

### GREEN Round

Command:

```bash
npm test -- --run tests/female111-template-level.test.ts tests/female111-template-rules.test.ts
```

Output:

```text
Test Files  2 passed (2)
Tests       11 passed (11)
Duration    880ms
```

### Build Round

Command:

```bash
npm run build
```

Output:

```text
vite build completed successfully
dist/assets/index-LBenptwH.js   649.25 kB | gzip: 153.79 kB
Warning: some chunks are larger than 500 kB after minification
```

---

## Fix Round 2

Date: 2026-08-31

### Review Findings

- Important: session set rest was counted once per action instead of once between sets.
- Important: adjacent primary progression comparison omitted prescription `tempo` and `rom`.

### Changes

- Added `estimateSetRest`, calculating `max(sets - 1, 0) * restSeconds` for each work item. One-set prep and ramp actions therefore contribute zero set-rest seconds, while the component remains inspectable and the optional 60-minute gate continues to use the same estimator.
- Tracked `primary.prescription.tempo` as `control` and `primary.prescription.rom` as `range` in adjacent-level deltas, including both fields in exact metadata matching and the two-major-variable limit.
- Added regressions for one-set prep/ramp rest handling and a same-exercise F111-06 L3-to-L4 mutation that changes tempo and ROM while retaining stale metadata.
- Corrected the catalog progression annotations for all 8 recipes to declare the actual ROM and tempo fields. Adjusted the shared L3/L4 primary prescriptions so each adjacent transition remains within two major variables; kept L4 primary rest at 60 seconds so the corrected estimator remains truthful under the 60-minute gate.
- Left the deferred Minor fatigue allowlist concern unchanged.

### RED Round

Command:

```bash
npm test -- --run tests/female111-template-rules.test.ts
```

Output before implementation:

```text
Test Files  1 failed (1)
Tests       2 failed | 4 passed (6)
FAIL counts only between-set rest ... expected { min: 752, max: 752 } to deeply equal { min: 120, max: 120 }
FAIL tracks tempo and ROM changes ... expected [] to include 'PROGRESSION_METADATA_MISMATCH'
```

### GREEN Focused Round

Command:

```bash
npm test -- --run tests/female111-template-rules.test.ts tests/female111-progression.test.ts tests/female111-template-level.test.ts
```

Output:

```text
Test Files  3 passed (3)
Tests       16 passed (16)
```

### Full Test Round

Command:

```bash
npm test -- --run
```

Output:

```text
Test Files  30 passed (30)
Tests       400 passed (400)
```

### Build and Diff Checks

Commands:

```bash
npm run build
git diff --check
```

Results:

```text
vite build completed successfully
dist/assets/index-ByrJKVV7.js   658.04 kB | gzip: 155.84 kB
git diff --check: clean
```

Concern:

- Non-blocking Vite warning remains for a production chunk larger than 500 kB after minification.
