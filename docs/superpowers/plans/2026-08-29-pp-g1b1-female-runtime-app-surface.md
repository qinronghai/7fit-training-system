# PP-G1B1 Female Runtime App Surface Contract

## Scope

PP-G1B1 is limited to a read-only App surface for the frozen PP-G1A runtime.
It adds a dedicated `#/female/:templateId` route, a separate Female section on
the existing Templates page, and a Female detail page that reads directly from
the resolved runtime output.

Base: `ec126d8f29024ac296b23e3f1772c59074fd2ce7`.

Implementation branch: `codex/pp-g1b1-female-runtime-app-surface`.

## Authorized files

Production files:

1. `src/App.tsx`
2. `src/lib/router.ts`

Verification and governance files:

3. `tests/v6.acceptance.test.tsx`
4. this plan document

No other file is in scope for PP-G1B1.

## Contract

- Keep generic Programming routes, `templates`, `allRoutes`, and `content.ts`
  unchanged.
- Add a dedicated route `{ name: 'female-template-detail', id: string }` for
  `#/female/fit-f01` style hashes, with no Female `level` field and no Female
  L1-L4 semantics.
- Keep the generic Templates filters and 16-card grid unchanged, then render a
  separate `女性 1+1+1` section with exactly 8 `FIT-F01` to `FIT-F08` cards.
- Source the Female section and detail page only from
  `resolveFemaleProgrammingTemplates()`. App code may read
  `resolved.template`, `slot.methodNode`, `slot.policy`, `slot.canonical`, and
  `slot.requiresConditionalReadiness`, but may not rebuild joins or create a
  duplicate Female catalog.
- The Female detail page renders exactly `HIP`, `SUPPORT`, and `CORE`, with no
  `BREATH` slot and no generic template level tabs.
- Unknown Female IDs fail safely through the existing EmptyRoute pattern and
  return to `#/templates`.
- The bottom navigation keeps `模板` active on `female-template-detail`.
- Existing CSS classes are reused as-is; `src/styles.css` remains frozen.

## Invariants

- Female runtime display is additive only; legacy `PP01` to `PP26` and generic
  Programming detail pages must keep existing behavior.
- Mapped versus variant canonical semantics are displayed from the runtime
  mapping object. Variant IDs are shown only for `status === 'variant'`.
- Conditional readiness is displayed read-only as runtime state. No member
  readiness evaluation, recommendation logic, or policy reconstruction is
  introduced.
- Breathing, quality-gate, and compensation content comes from Method metadata.
- Eligibility and demand content comes from PP-F1 policy metadata.

## TDD and verification

RED starts in `tests/v6.acceptance.test.tsx` and must fail for the missing
Female route and App surface before any implementation edits. GREEN is limited
to the router and App integration needed to satisfy those acceptance tests.

Final verification runs:

- focused `tests/v6.acceptance.test.tsx`
- PP-G1A runtime tests
- PP-F2A tests
- PP-F1 tests
- PP Method tests
- full `npm test`
- `npm run build`
- Vite SSR import/invariant check
- `git diff --check`
- exact four-file scope audit

Success state:

```text
PP-G1B1 FINAL_VERDICT: PASS
PP-G1B1 STATUS: COMPLETE
Female Runtime App Surface: FROZEN
```
