# PP-F2A｜Female 1+1+1 Template Contract + Reference Catalog

## Scope

PP-F2A turns the frozen PP-F1 policy into a small, deterministic catalog of
coach-usable Female Method Programming blocks. It defines a PP-specific
template contract and eight reference templates as architecture proof. It
does not generate complete workouts, assign members, or integrate runtime.

Base: `0eb2ca341d6f7030a8078a5e09ba2014c740a8b0`.

Implementation branch: `codex/pp-f2-female-1plus1plus1-templates`.

## Layer boundary

PP-F2A owns template identity, intent, explicit HIP/SUPPORT/CORE selections,
conditional prerequisites, catalog validation, and the finite reference
catalog. It delegates block legality to PP-F1.

PP-F2A does not own canonical Exercise identity, Method progression,
A/B/C classification, demand or slot rules, breathing strategy, member
readiness, population modifiers, UI, runtime resolution, storage, deployment,
push, PR, merge, or release.

The template contract must not duplicate demand, eligibility, capabilities,
P-Level, breathing, or canonical `exerciseId` data. It reuses the PP-F1
`PPFemaleBlockSelection` shape.

## Contract

`PPFemaleTemplate` contains:

- stable template `id` and display `code`;
- a non-empty programming `intent`;
- a `selection` with exactly HIP, SUPPORT, and CORE;
- `requiredConditionalNodeIds`, explicitly listing every B node selected;
- an optional coach note.

Template IDs are separate from Method nodes: `fit-f01`…`fit-f08`, with display
codes `FIT-F01`…`FIT-F08`. No Female L1–L4 taxonomy is introduced.

Pure read/validation APIs:

- `getFemaleProgrammingTemplate(id)`;
- `validateFemaleProgrammingTemplate(template)`;
- `validateFemaleProgrammingTemplates(templates)`;
- `getFemaleTemplateRequiredConditionalNodes(template)`.

Template validation delegates the selection to PP-F1 and additionally rejects
missing, unused, unknown, or duplicate conditional declarations. Catalog
validation rejects duplicate template IDs/codes and validates every template.

## Reference catalog

The catalog contains exactly eight explicit templates:

| ID | Shape | Purpose |
| --- | --- | --- |
| fit-f01 | A-only, HIP primary | Foundation hip control |
| fit-f02 | A-only, SUPPORT primary | Foundation support stability |
| fit-f03 | A-only, CORE primary | Foundation anti-extension core |
| fit-f04 | A-only, HIP primary | Moderate hip-dominant control |
| fit-f05 | A-only, SUPPORT primary | Moderate support stability |
| fit-f06 | A-only, CORE primary | Moderate anti-extension core |
| fit-f07 | B-conditional, HIP primary | Advanced integrated hip control |
| fit-f08 | B-conditional, SUPPORT primary | Advanced support stability |

Every template must have one primary challenge, two supporting selections, at
most one HIGH demand node, total demand at most 6, no duplicate node, and no
C_METHOD_ONLY occupant. Every selected B node must be declared explicitly in
`requiredConditionalNodeIds`. The A-only foundation subset must validate with
no readiness context.

Template rationales belong in the catalog data or this plan, not in a new
runtime taxonomy. The combinations are selected from PP-F1 slot, role, demand,
Method pathway, and quality-gate semantics; legacy `content.ts` and Technique
Level are not sources of truth.

## Authorized files

Production files:

- `src/data/pp/femaleProgrammingTemplates.ts`;
- `src/data/pp/femaleProgrammingTemplateRules.ts`;
- `src/data/pp/index.ts` (exports only).

Verification and governance files:

- `tests/pp-female-programming-templates.test.ts`;
- this plan document.

The following remain frozen: PP-F1 files, Method types/nodes/graph, Exercise
Database, generic Programming, App/UI, PP-G1, PP-G2, and release artifacts.

## TDD and gates

RED must cover catalog cardinality, ID/code uniqueness, exact slots, F1
delegation, primary/high/budget rules, explicit conditional declarations,
C exclusion, identity separation, primary-role coverage, A-only foundation,
and failure when required readiness is removed.

GREEN implements types/catalog, F1-delegating validator, retrieval helpers,
and index exports in that order. Final gates are focused PP-F2A tests, PP-F1
14/14, PP Method regression, full tests, build, Vite SSR invariants, diff
check, clean status, and exact scope review.

Success state:

```text
PP-F2A FINAL_VERDICT: PASS
PP-F2A STATUS: COMPLETE
Female 1+1+1 Template Contract: FROZEN
```

PP-F2B, PP-G1, PP-G2, push, PR, merge, and release require a later decision or
separate authorization.
