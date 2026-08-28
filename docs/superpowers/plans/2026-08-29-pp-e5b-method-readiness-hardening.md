# PP-E5B｜Method Readiness Hardening Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

Goal: 将 PP Method metadata 从结构完整加固为可解释的 progression readiness 输入，同时保持 PP architecture、canonical identity 和 PP-F boundary 不变。

Architecture: 在现有 PPMethodNode 上增加一个 method-level readinessProfile 标识，由 12 个可复用 profile 提供 qualityGate 与 compensation 默认值，再对 12 个关键节点做 targeted override。Progression graph 只修两个已确认的语义债务：补齐 PP04→PP05，并将 PP06→standing lateral weight shift 改为 branch；PP03 保持无 graph incoming 的 intentional advanced root，由现有 coachNotes 与 node-specific quality gate 表达外部一般训练前置能力。PP-F 的 eligibility、demand budget 和组合 guardrail 不进入本计划。

Tech Stack: TypeScript、Vitest、Vite、现有 src/data/pp production data。

Spec: docs/superpowers/audits/2026-08-29-pp-e5-method-completeness-audit.md

## Global Constraints

- Authoritative audited production base remains 639e80ee380f18e553e54cc76a39a5d374d840f6.
- 104 canonical Exercises remains unchanged.
- 53 PP Method Nodes remains unchanged.
- Mapping remains 19 mapped, 26 variant, 8 method-only, 0 add-candidate, 0 verify.
- Verification Ledger remains empty.
- PP17 remains drill, method-only, hostExerciseId=plank.
- PP P0–P4 remains separate from Programming L1–L4.
- Breathing remains a cross-cutting execution layer, not a fourth Programming bucket.
- Do not implement A/B/C Programming eligibility, HIP/SUPPORT/CORE bucket fields, demand budget, high-demand score, max peer demand, triple-high guardrail, block generator, 1+1+1 templates, Female Programming, or postpartum programming policy.
- Do not modify Exercise Database, Programming, BODY, 3C, CON, UI, App, canonical mappings, or source PP identity.
- Do not add a PP03→PP02 edge or invent a vertical-push progression tree.
- Do not hard-code graph edge count as 44; after the approved PP05 edge, expected count is 45.
- Every behavior change follows RED → GREEN: write a failing test, run it and observe the intended failure, implement the minimum change, then rerun focused and full validation.
- Do not clean, reset, stash, checkout, delete, overwrite, or remove any old dirty checkout.

---

## 1. Problem Statement

The frozen audit found four Important method debts and no Critical architecture failure:

1. All 53 nodes inherit one generic quality gate and one generic compensation placeholder.
2. PP05 is canonical and P2/hip-rotation/bridge but is graph-isolated.
3. PP06(P1) → exp-standing-lateral-weight-shift(P0) is labeled progression although the P-level moves downward.
4. capabilityDelta is typed as readonly string[], and the graph uses undeclared hip-flexion.

The E5B implementation must repair method metadata and explicit graph/type drift without moving PP-F policy into PP Method.

The current contract already has breathing, qualityGate, commonCompensations, capabilities, progressionLevel, role, kind, pathway and progression edges. The plan therefore uses a small, auditable readiness-profile layer rather than introducing Programming policy fields.

## 2. Frozen Scope

### 2.1 Reusable readiness profiles

Create exactly 12 reusable PP Method readiness profiles. A profile supplies:

- qualityGate with semantic criterion codes and domains;
- profile-specific commonCompensations;
- a stable profile ID stored on each PPMethodNode.

The profiles are:

| Profile ID | Quality criterion domains | Intended nodes |
|---|---|---|
| breath-rib-pelvis-foundation | breathing, position, control | pp17, pp20, pp21, pp22, exp-supine-90-90-breathing, exp-side-lying-breathing |
| hinge-control | position, control, coordination, repetition | pp02, exp-wall-touch-hinge, exp-dowel-three-point-hinge |
| squat-control | position, control, coordination, repetition | pp01, exp-assisted-sit-to-stand, exp-box-squat |
| hip-rotation-control | position, control, coordination, tolerance | pp04, pp05, exp-supported-90-90, exp-static-90-90 |
| hip-extension-control | position, control, coordination, repetition | pp10, exp-glute-bridge-march, exp-single-leg-glute-bridge |
| frontal-plane-weight-shift | position, control, coordination, tolerance | pp08, pp09, exp-long-lever-side-lying-adduction, exp-standing-lateral-weight-shift, exp-basic-hip-abduction |
| anterior-support | breathing, position, control, duration | pp16, exp-incline-plank |
| dynamic-support | breathing, position, control, coordination | pp11, pp14, pp15, exp-quadruped-single-limb-lift, exp-incline-support-weight-shift, exp-plank-march, exp-short-forward-step-high-plank |
| lateral-support | breathing, position, control, coordination, duration | pp18, pp19, exp-knee-side-plank, exp-standard-side-plank, exp-side-plank-reach, exp-partial-side-plank-rotation, exp-short-lever-copenhagen, exp-full-copenhagen |
| anti-extension-core | breathing, position, control, coordination, duration | pp23, pp24, pp26 |
| rotation-integration | breathing, position, control, coordination, tolerance | pp03, pp12, pp13, pp25, exp-open-book |
| locomotion | breathing, position, control, coordination, tolerance | pp06, pp07, exp-standing-march, exp-half-squat-low-locomotion |

The assignment above covers all 53 nodes exactly once. It is intentionally not a one-profile-per-pathway symmetry rule; it follows the current node semantics.

### 2.2 Targeted node overrides

Use 12 targeted overrides on top of the reusable profiles:

- pp03: advanced loaded hinge plus overhead-press integration; require external general strength readiness in coachNotes and gate semantics.
- pp05: hip-rotation bridge with explicit hip-extension transition criterion.
- pp11: contralateral support and breathing under limb separation.
- pp13: dynamic high-plank rotation and force-transfer control.
- pp15: cross-body knee drive, supported hip flexion, anti-extension and weight-shift.
- pp16: anterior support duration and rib-pelvis control.
- pp18: lateral support with rotation and force transfer.
- pp19: lateral support with hip abduction and pelvic control.
- pp23: anti-extension core with unilateral breathing and contralateral control.
- pp24: anti-extension core at the highest bilateral extension demand.
- pp25: rotation integration without lumbar-driven rotation.
- pp26: anti-extension core foundation and repeatable rib-pelvis position.

A targeted override changes only criteria or compensation content that the profile cannot express. It does not create a new architecture layer.

### 2.3 Targeted breathing hardening

Keep the existing strategy architecture and modes. Reuse existing strategy objects rather than creating 53 unique definitions.

Retain the current reset nodes and the existing phase-cued strategies for PP03, PP10 and PP22. Add explicit phase-cued strategy reuse to PP16, PP18, PP19, PP23, PP24, PP25 and PP26. The resulting expected distribution is:

- continuous default: 36;
- reset: 7;
- phase-cued: 10.

Do not add complex inhale/exhale timing to ordinary mobility or simple locomotion nodes. Tests assert mode and semantic presence, not full prose equality.

### 2.4 PP05 decision

Add exactly one progression edge:

- from exp-supported-90-90;
- through exp-static-90-90;
- through pp04;
- to pp05;
- type progression;
- capabilityDelta: hip-extension;
- reason explains that controlled 90/90 switching is followed by the shin-box hip-lift bridge.

This yields expected graph count 45. Before freezing the edge, the implementation must verify pp04 has hip-rotation/pelvic-control and pp05 has hip-rotation/hip-extension/pelvic-control. No other PP05 edge is added.

### 2.5 PP03 decision

Keep PP03 as an intentional advanced root:

- no PP02→PP03 edge;
- no new vertical-push tree;
- no new PP Method prerequisite schema;
- retain integration/P4/hinge+support metadata;
- add a precise coachNote stating that general loaded overhead-press capacity is an external training prerequisite not represented by the PP Method graph;
- use the rotation-integration profile with a targeted quality gate for breathing, trunk/pelvis position, coordination and tolerance.

This resolves the accidental-looking semantics without pretending that PP Method owns general strength progression.

### 2.6 P1→P0 decision

Change only the edge type for pp06 → exp-standing-lateral-weight-shift from progression to branch. Keep both node P-levels unchanged. The reason states that a seated pelvic locomotion drill branches to a standing foundation for weight-shift, rather than claiming a strict P-level advancement.

### 2.7 Capability contract decision

Make capabilityDelta a readonly PPCapability[].

Add hip-flexion to the declared Method capability taxonomy with this meaning:

> controlled hip flexion under trunk and pelvic control in a supported or cross-body task.

Add hip-flexion to the node metadata for:

- exp-plank-march;
- exp-short-forward-step-high-plank;
- pp13;
- pp14;
- pp15.

This is deliberately narrower than adding hip-flexion to every upright locomotion action. It directly covers the supported forward-step and cross-body knee-drive semantics that caused the current delta drift.

The delta meaning is:

> a capability newly introduced or materially increased in demand from the source node to the target node.

Therefore capabilityDelta must be a declared capability, but it does not need to be a strict set difference or a strict subset of to.capabilities. Existing repeated deltas can describe a materially harder dosage, leverage, support surface, range or coordination demand. The validator must reject undeclared capability strings, but must not reject a valid delta merely because the same capability is already present on the source or target.

## 3. Explicit Non-Goals

- No PP-F Programming Policy.
- No A/B/C eligibility field.
- No demand score, demand budget, fatigue budget or peer-conflict field.
- No high-demand combination guardrail.
- No femaleSlotType, block generator, 1+1+1 template or Female Programming.
- No medical symptom or postpartum red-flag encoding in commonCompensations.
- No reclassification of PP17.
- No canonical mapping change.
- No redesign of the 12-pathway architecture.
- No repair of unrelated UI, app, Programming, BODY, 3C or CON code.
- No graph edge added solely to make P0–P4 numbers symmetrical.

## 4. Current Data Evidence

The PP-E5 audit was performed from the authoritative production base 639e80ee380f18e553e54cc76a39a5d374d840f6; its audit document is the current planning branch's starting commit 07418a9ccfb7e02bebbcc5a5d0150f46dd0867ba. The audited production data contains:

| Evidence | Current result |
|---|---:|
| Exercise registry | 104 |
| PP Method Nodes | 53 |
| Source / expansion | 26 / 27 |
| mapped / variant / method-only | 19 / 26 / 8 |
| add-candidate / verify | 0 / 0 |
| Verification Ledger | 0 |
| Progression edges | 44 |
| Current qualityGate overrides | 0 |
| Current commonCompensations overrides | 0 |
| Current explicit breathing overrides | 10 |
| Isolated nodes | pp03, pp05 |
| Unknown delta capability | hip-flexion |
| P1→P0 progression edge | pp06 → exp-standing-lateral-weight-shift |

The audit run already passed npm test with 209 tests and npm run build. E5B must preserve those baseline invariants.

## 5. Proposed Quality Gate Architecture

### 5.1 Type and registry

Add to src/data/pp/types.ts:

~~~ts
export const ppMethodReadinessProfileIds = [
  'breath-rib-pelvis-foundation',
  'hinge-control',
  'squat-control',
  'hip-rotation-control',
  'hip-extension-control',
  'frontal-plane-weight-shift',
  'anterior-support',
  'dynamic-support',
  'lateral-support',
  'anti-extension-core',
  'rotation-integration',
  'locomotion',
] as const

export type PPMethodReadinessProfileId =
  (typeof ppMethodReadinessProfileIds)[number]

export type PPMethodReadinessProfile = {
  qualityGate: PPQualityGate
  commonCompensations: readonly string[]
}
~~~

Add readinessProfile: PPMethodReadinessProfileId to PPMethodNode. This is method metadata, not Programming policy. It makes profile provenance testable and prevents a future generic fallback from being invisible.

Change PPProgressionEdge.capabilityDelta from readonly string[] to readonly PPCapability[].

### 5.2 Profile registry

Add to src/data/pp/methodNodes.ts:

~~~ts
export const ppMethodReadinessProfiles:
  Readonly<Record<PPMethodReadinessProfileId, PPMethodReadinessProfile>>
~~~

Each profile must have semantic criterion codes, not only prose. Use the existing PPQualityCriterion domains and stable codes such as:

- BREATH;
- RIB_PELVIS;
- POSITION;
- CONTROL;
- COORDINATION;
- TOLERANCE;
- REPETITION;
- DURATION;
- RANGE.

The profile registry must contain specific compensation strings for its movement family. Preserve commonCompensations as the existing readonly string[] API so no unrelated consumer contract changes are required. The readinessProfile ID is the semantic test anchor; tests must not assert full copy text.

### 5.3 Node construction

Change node() so readinessProfile is required in NodeOptions and the profile supplies defaults:

~~~ts
const node = (options: NodeOptions): PPMethodNode => {
  const profile = ppMethodReadinessProfiles[options.readinessProfile]
  return {
    ...options,
    readinessProfile: options.readinessProfile,
    breathing: options.breathing ?? continuousBreathing,
    qualityGate: options.qualityGate ?? profile.qualityGate,
    commonCompensations:
      options.commonCompensations ?? profile.commonCompensations,
  }
}
~~~

There must be no fallback to defaultQualityGate or the generic one-line compensation. Delete those generic defaults only after the new profile-backed tests are RED and the profile registry is ready.

## 6. Proposed Compensation Architecture

Use the same 12 profile IDs as the compensation profile family to avoid a second parallel lookup table. Each profile has at least two movement-relevant compensation semantics, except the breathing foundation profile which has breathing and rib-pelvis semantics.

Required semantic coverage:

| Profile | Compensation semantics |
|---|---|
| breath-rib-pelvis-foundation | breath holding; rib flare/loss of stack |
| hinge-control | lumbar extension; loss of hip hinge |
| squat-control | pelvic tuck/shift; knee or trunk control loss |
| hip-rotation-control | pelvic rotation; loss of controlled hip rotation |
| hip-extension-control | lumbar extension; pelvic rotation or hamstring takeover |
| frontal-plane-weight-shift | trunk sway; pelvic drop or uncontrolled weight shift |
| anterior-support | scapular collapse; rib flare/lumbar extension |
| dynamic-support | support collapse; uncontrolled weight shift/contralateral timing |
| lateral-support | trunk sag; shoulder elevation or pelvic drop |
| anti-extension-core | rib flare; lumbar extension or breath loss |
| rotation-integration | lumbar-driven rotation; loss of pelvic/trunk separation |
| locomotion | uncontrolled step/weight transfer; breath hold or trunk sway |

Do not encode symptom/medical red flags in these strings. Existing safety messaging remains outside this Method metadata scope.

## 7. Breathing Targeted Overrides

Retain:

- resetBreathing for PP06, PP17, PP20, PP21, exp-supine-90-90-breathing, exp-side-lying-breathing and exp-standing-lateral-weight-shift;
- phaseCuedBreathing for PP03, PP10 and PP22;
- continuous default for ordinary nodes unless a targeted override is listed.

Add phaseCuedBreathing reuse for PP16, PP18, PP19, PP23, PP24, PP25 and PP26. The profile quality gates must still include BREATH where breathing is a progression requirement.

Tests must verify:

~~~ts
expect(ppMethodNodeById.get('pp21')?.breathing.mode).toBe('reset')
expect(ppMethodNodeById.get('pp22')?.breathing.mode).toBe('phase-cued')
expect(ppMethodNodeById.get('pp16')?.breathing.mode).toBe('phase-cued')
expect(ppMethodNodeById.get('pp18')?.breathing.mode).toBe('phase-cued')
expect(ppMethodNodeById.get('pp25')?.breathing.mode).toBe('phase-cued')
~~~

Tests must also verify PP06, PP17 and PP20 remain drills and PP21/PP22 remain breathing kind.

## 8. PP05 Graph Resolution

Modify only src/data/pp/progressionGraph.ts for the new edge:

~~~ts
{
  from: 'pp04',
  to: 'pp05',
  type: 'progression',
  capabilityDelta: ['hip-extension'],
  reason: '在受控 90/90 髋转换后进入胫骨箱顶髋，增加髋伸展要求并保持骨盆控制。',
}
~~~

Before implementing, the test must fail because the edge is absent. After implementation, tests must verify:

~~~ts
expect(ppProgressionEdges).toEqual(expect.arrayContaining([
  expect.objectContaining({
    from: 'pp04',
    to: 'pp05',
    type: 'progression',
    capabilityDelta: ['hip-extension'],
  }),
]))
expect(ppMethodNodeById.get('pp04')?.progressionLevel).toBe('P1')
expect(ppMethodNodeById.get('pp05')?.progressionLevel).toBe('P2')
expect(ppProgressionEdges).toHaveLength(45)
~~~

The test must also verify no additional PP05 edge was invented.

## 9. PP03 Intentional Advanced-Root Resolution

Do not add a graph edge for PP03.

Add a targeted PP03 gate and coachNote using existing fields:

- profile: rotation-integration;
- criteria domains: breathing, position, control, coordination, tolerance;
- semantic codes include BREATH, POSITION, CONTROL, COORDINATION and TOLERANCE;
- coachNote explicitly states that general loaded overhead-press capacity is an external training prerequisite not modeled by PP Method Graph.

Tests must verify:

~~~ts
const pp03 = ppMethodNodeById.get('pp03')
expect(pp03?.progressionLevel).toBe('P4')
expect(pp03?.role).toBe('integration')
expect(pp03?.primaryPathway).toBe('integration')
expect(pp03?.secondaryPathways).toEqual(['hinge', 'support'])
expect(pp03?.coachNotes?.some(note =>
  note.includes('外部') && note.includes('推举'),
)).toBe(true)
expect(ppProgressionEdges.some(edge =>
  edge.from === 'pp02' && edge.to === 'pp03',
)).toBe(false)
~~~

If coachNotes plus qualityGate cannot make the external prerequisite clear without a new schema field, stop for review; do not invent a prerequisite schema in E5B.

## 10. P1→P0 Graph Correction

Change the existing edge only:

~~~ts
{
  from: 'pp06',
  to: 'exp-standing-lateral-weight-shift',
  type: 'branch',
  capabilityDelta: ['weight-shift', 'locomotion'],
  reason: '从坐姿骨盆髋走分支到站立重心转移基础，而非声明 P-Level 严格进阶。',
}
~~~

Keep pp06 at P1 and exp-standing-lateral-weight-shift at P0. Tests must verify the exact pair is branch and that no broad P-level reordering occurs.

## 11. Capability Contract Hardening

### 11.1 Type-level contract

Add hip-flexion to PPCapability and change capabilityDelta to readonly PPCapability[].

Expose a runtime list or Set derived from the capability taxonomy so validatePPProgressionGraph can reject unknown runtime data. The validator error must identify the edge and unknown capability.

Add a type-level negative fixture in tests:

~~~ts
// @ts-expect-error unknown capability must not compile
const invalidCapabilityEdge: PPProgressionEdge = {
  from: 'pp20',
  to: 'pp21',
  type: 'progression',
  capabilityDelta: ['unknown-capability'],
  reason: 'type contract fixture',
}
~~~

Because Vitest transpilation alone is not a type checker, npm run build is the required proof for this fixture.

Add a runtime validator test using an intentionally cast fixture to prove the validator remains defensive at runtime:

~~~ts
expect(validatePPProgressionGraph(ppMethodNodes, [
  {
    from: 'pp20',
    to: 'pp21',
    type: 'progression',
    capabilityDelta: ['unknown-capability'] as unknown as PPCapability[],
    reason: 'runtime contract fixture',
  },
])).toContain('progression edge capabilityDelta is not declared: unknown-capability')
~~~

### 11.2 Node metadata

Add hip-flexion to:

- exp-plank-march;
- exp-short-forward-step-high-plank;
- pp13;
- pp14;
- pp15.

Do not add it to every locomotion node. The adopted definition is supported/cross-body hip flexion under trunk and pelvic control.

### 11.3 Delta semantics

Do not impose capabilityDelta ⊆ to.capabilities. The 44-edge audit contains valid increased-demand deltas that are not strict set differences. Preserve those deltas after making every string a declared PPCapability.

The final validator invariants are:

- every edge endpoint exists;
- no self-loop;
- no duplicate edge key;
- no cycle;
- every capabilityDelta entry is in the declared PPCapability taxonomy;
- every edge has a non-empty reason;
- no strict subset requirement.

## 12. 44-Edge Reconciliation Matrix

This matrix is the pre-patch production evidence. Abbreviations:

- BC = breathing-control
- RPC = rib-pelvis-control
- PC = pelvic-control
- SS = shoulder-support
- AE = anti-extension
- AR = anti-rotation
- ALF = anti-lateral-flexion
- CC = contralateral-control
- HH = hip-hinge
- HE = hip-extension
- HR = hip-rotation
- HA = hip-abduction
- HAD = hip-adduction
- WS = weight-shift
- ROT = rotation
- LOCO = locomotion
- FT = force-transfer
- HF = hip-flexion after E5B declaration

Status means the proposed E5B result. Repeated deltas are valid when they describe increased demand; they do not require a target metadata patch solely because they are already present.

| # | Edge | From capabilities | To capabilities | Declared delta | Type | Status / required patch |
|---:|---|---|---|---|---|---|
| 1 | pp21 → pp22 | BC, RPC | BC, RPC, FT | FT | progression | VALID; increased integration demand |
| 2 | pp21 → exp-supine-90-90-breathing | BC, RPC | BC, RPC | BC, RPC | branch | VALID; low-load branch |
| 3 | exp-supine-90-90-breathing → pp22 | BC, RPC | BC, RPC, FT | FT | progression | VALID |
| 4 | pp22 → pp26 | BC, RPC, FT | AE, RPC, CC, BC | AE, CC | progression | VALID |
| 5 | pp26 → pp23 | AE, RPC, CC, BC | AE, BC, CC | FT | progression | VALID; FT is increased demand, not a new target tag |
| 6 | pp20 → exp-quadruped-single-limb-lift | SS, RPC, BC | SS, AR, WS, RPC | WS, AR | progression | VALID |
| 7 | pp20 → exp-incline-plank | SS, RPC, BC | SS, AE, RPC | SS, AE | branch | VALID; lower-load support branch |
| 8 | exp-quadruped-single-limb-lift → pp11 | SS, AR, WS, RPC | CC, AR, RPC, BC | CC | progression | VALID |
| 9 | exp-incline-plank → pp16 | SS, AE, RPC | SS, AE, RPC | AE, SS | progression | VALID; higher support dosage |
| 10 | pp16 → exp-plank-march | SS, AE, RPC | SS, AR, WS, LOCO, HF | WS, AR | progression | VALID |
| 11 | exp-plank-march → pp15 | SS, AR, WS, LOCO, HF | SS, AE, WS, HF | HF, FT | branch | PATCH: declare HF and retain it on pp15 |
| 12 | exp-incline-plank → exp-incline-support-weight-shift | SS, AE, RPC | SS, WS, AR | WS, AR | progression | VALID |
| 13 | exp-incline-support-weight-shift → exp-short-forward-step-high-plank | SS, WS, AR | SS, AE, WS, LOCO, HF | LOCO, HF | progression | PATCH: declare HF and add it to target |
| 14 | exp-short-forward-step-high-plank → pp14 | SS, AE, WS, LOCO, HF | SS, AE, WS, LOCO, HF | SS, LOCO | progression | VALID; same capability at larger task demand |
| 15 | pp16 → pp17 | SS, AE, RPC | RPC, PC, BC | PC, BC | optional | VALID optional drill handoff |
| 16 | pp10 → exp-glute-bridge-march | HE, PC | HE, PC, AR, WS | AR, WS | progression | VALID |
| 17 | exp-glute-bridge-march → exp-single-leg-glute-bridge | HE, PC, AR, WS | HE, PC, AR | HE, AR | progression | VALID; increased unilateral demand |
| 18 | exp-assisted-sit-to-stand → exp-box-squat | WS, PC, HE | PC, HE, WS | WS, HE | progression | VALID |
| 19 | exp-box-squat → pp01 | PC, HE, WS | HH, PC, RPC | PC, HH | progression | VALID |
| 20 | exp-supported-90-90 → exp-static-90-90 | HR, PC | HR, PC, BC | HR, BC | progression | VALID |
| 21 | exp-static-90-90 → pp04 | HR, PC, BC | HR, PC | WS, HR | progression | VALID; WS is increased transition demand |
| 22 | exp-knee-side-plank → exp-standard-side-plank | ALF, SS, PC | ALF, SS, PC | ALF | progression | VALID; increased leverage |
| 23 | exp-side-lying-breathing → exp-knee-side-plank | BC, RPC | ALF, SS, PC | ALF, SS | progression | VALID |
| 24 | exp-standard-side-plank → pp19 | ALF, SS, PC | ALF, SS, HA, PC | HA, PC | branch | VALID |
| 25 | exp-standard-side-plank → pp18 | ALF, SS, PC | ALF, SS, ROT, FT | ROT | branch | VALID |
| 26 | exp-standard-side-plank → exp-side-plank-reach | ALF, SS, PC | ALF, SS, ROT, FT | ROT, FT | progression | VALID |
| 27 | exp-side-plank-reach → exp-partial-side-plank-rotation | ALF, SS, ROT, FT | ALF, SS, ROT | ROT | progression | VALID; changed reach/rotation dosage |
| 28 | exp-partial-side-plank-rotation → pp18 | ALF, SS, ROT | ALF, SS, ROT, FT | ROT, FT | progression | VALID |
| 29 | exp-short-forward-step-high-plank → pp13 | SS, AE, WS, LOCO, HF | SS, AR, ROT, LOCO, FT, HF | ROT, FT | progression | VALID |
| 30 | pp14 → pp13 | SS, AE, WS, LOCO, HF | SS, AR, ROT, LOCO, FT, HF | ROT | branch | VALID |
| 31 | exp-wall-touch-hinge → exp-dowel-three-point-hinge | HH, HE, PC | HH, RPC, PC | HH, RPC | progression | VALID |
| 32 | exp-dowel-three-point-hinge → pp02 | HH, RPC, PC | HH, HE, RPC | HE | progression | VALID |
| 33 | pp08 → exp-long-lever-side-lying-adduction | HAD, PC | HAD, PC, ALF | HAD, ALF | progression | VALID |
| 34 | exp-long-lever-side-lying-adduction → exp-short-lever-copenhagen | HAD, PC, ALF | HAD, ALF, SS | SS, ALF | progression | VALID |
| 35 | exp-short-lever-copenhagen → exp-full-copenhagen | HAD, ALF, SS | HAD, ALF, SS | HAD, SS | progression | VALID; increased leverage |
| 36 | exp-standing-lateral-weight-shift → exp-basic-hip-abduction | WS, HA, PC | HA, PC | HA, PC | progression | VALID |
| 37 | exp-basic-hip-abduction → pp09 | HA, PC | HA, WS, PC, LOCO | LOCO, WS | progression | VALID |
| 38 | exp-open-book → pp12 | ROT, BC | ROT, SS, PC | SS, ROT | progression | VALID |
| 39 | pp06 → exp-standing-lateral-weight-shift | PC, WS, BC | WS, HA, PC | WS, LOCO | progression | PATCH: change type to branch; retain delta as standing locomotion demand |
| 40 | exp-standing-lateral-weight-shift → exp-standing-march | WS, HA, PC | WS, CC, HA | CC, LOCO | progression | VALID; LOCO is increased task demand |
| 41 | pp01 → exp-half-squat-low-locomotion | HH, PC, RPC | LOCO, WS, HA | LOCO, WS | branch | VALID |
| 42 | exp-half-squat-low-locomotion → pp07 | LOCO, WS, HA | LOCO, WS, HA | LOCO, HA | optional | VALID optional capacity branch |
| 43 | pp23 → pp24 | AE, BC, CC | AE, BC, FT | AE, FT | progression | VALID |
| 44 | pp24 → pp25 | AE, BC, FT | AE, ROT, BC | ROT | progression | VALID |

New edge 45 reconciliation:

| # | Edge | From capabilities | To capabilities | Declared delta | Type | Status / required patch |
|---:|---|---|---|---|---|---|
| 45 | pp04 → pp05 | HR, PC | HR, HE, PC | HE | progression | PATCH: add evidence-backed PP05 progression edge |

The matrix is a required review artifact. The implementer must update it only if a RED test proves that a proposed type or node metadata decision is inconsistent with the production source; no silent edge deletion is allowed.

## 13. Exact Files to Modify

Production files:

- Modify src/data/pp/types.ts: readinessProfile ID/type, PPCapability/ppCapabilities, typed capabilityDelta.
- Modify src/data/pp/methodNodes.ts: 12 profile definitions, all 53 profile assignments, 12 targeted overrides, seven breathing strategy overrides, five hip-flexion node tags, PP03 coachNote.
- Modify src/data/pp/progressionGraph.ts: PP04→PP05 edge, pp06 edge type/reason, capabilityDelta runtime validation.
- Modify src/data/pp/index.ts: validate readinessProfile IDs only if the profile registry cannot be checked in progressionGraph; preserve all existing inventory/mapping/ledger checks. The preferred implementation is a minimal profile validity check here because this function validates PP Method Node contracts.
- Do not modify any other production file.

Test file:

- Modify tests/pp-method.test.ts only.

Documentation:

- This plan file is the only new file in the planning branch.
- Do not modify the frozen audit document in the planning branch.

## 14. Exact Tests to Write

Add tests before each corresponding production behavior.

### Inventory preservation

~~~ts
it('preserves the frozen PP inventory after readiness hardening', () => {
  expect(ppMethodNodes).toHaveLength(53)
  expect(exercises).toHaveLength(104)
  expect(countMappings(ppMethodNodes)).toEqual({
    mapped: 19,
    variant: 26,
    'method-only': 8,
    'add-candidate': 0,
    verify: 0,
  })
  expect(ppVerificationLedger).toEqual([])
  expect(ppMethodNodeById.get('pp17')).toMatchObject({
    kind: 'drill',
    mapping: { status: 'method-only' },
    hostExerciseId: 'plank',
  })
})
~~~

### Profile coverage

~~~ts
it('assigns every node to one of the 12 reusable readiness profiles', () => {
  expect(new Set(ppMethodNodes.map(node => node.readinessProfile)).size).toBe(12)
  for (const methodNode of ppMethodNodes) {
    expect(ppMethodReadinessProfiles[methodNode.readinessProfile]).toBeDefined()
    expect(methodNode.qualityGate.passRule).toBe('all')
    expect(methodNode.qualityGate.criteria.length).toBeGreaterThan(0)
    expect(methodNode.commonCompensations.length).toBeGreaterThan(0)
  }
})
~~~

### Non-generic critical metadata

~~~ts
it('gives critical nodes profile-specific semantic gates and compensations', () => {
  const criticalIds = [
    'pp03', 'pp05', 'pp11', 'pp13', 'pp15',
    'pp18', 'pp19', 'pp23', 'pp24', 'pp25', 'pp26',
  ]
  for (const id of criticalIds) {
    const methodNode = ppMethodNodeById.get(id)
    expect(methodNode?.qualityGate.criteria.map(item => item.code)).toContain('CONTROL')
    expect(methodNode?.commonCompensations).not.toEqual(['屏气或用惯性完成动作。'])
  }
  expect(ppMethodNodeById.get('pp03')?.qualityGate.criteria.map(item => item.code))
    .toEqual(expect.arrayContaining(['COORDINATION', 'TOLERANCE']))
})
~~~

### Breathing modes

~~~ts
it('keeps breathing cross-cutting and applies only targeted strategy overrides', () => {
  expect(ppMethodNodeById.get('pp06')?.kind).toBe('drill')
  expect(ppMethodNodeById.get('pp17')?.kind).toBe('drill')
  expect(ppMethodNodeById.get('pp20')?.kind).toBe('drill')
  expect(ppMethodNodeById.get('pp21')?.kind).toBe('breathing')
  expect(ppMethodNodeById.get('pp22')?.kind).toBe('breathing')
  expect(ppMethodNodeById.get('pp16')?.breathing.mode).toBe('phase-cued')
  expect(ppMethodNodeById.get('pp18')?.breathing.mode).toBe('phase-cued')
  expect(ppMethodNodeById.get('pp25')?.breathing.mode).toBe('phase-cued')
})
~~~

### PP05 and PP03

~~~ts
it('connects PP05 without fabricating a PP03 prerequisite edge', () => {
  expect(ppProgressionEdges).toEqual(expect.arrayContaining([
    expect.objectContaining({
      from: 'pp04',
      to: 'pp05',
      type: 'progression',
      capabilityDelta: ['hip-extension'],
    }),
  ]))
  expect(ppProgressionEdges.some(edge =>
    edge.from === 'pp02' && edge.to === 'pp03',
  )).toBe(false)
  expect(ppMethodNodeById.get('pp03')?.coachNotes?.some(note =>
    note.includes('外部') && note.includes('推举'),
  )).toBe(true)
  expect(ppProgressionEdges).toHaveLength(45)
})
~~~

### P1→P0 semantics

~~~ts
it('models the seated-to-standing handoff as a branch', () => {
  const edge = ppProgressionEdges.find(item =>
    item.from === 'pp06' &&
    item.to === 'exp-standing-lateral-weight-shift',
  )
  expect(edge).toMatchObject({
    type: 'branch',
    capabilityDelta: ['weight-shift', 'locomotion'],
  })
  expect(ppMethodNodeById.get('pp06')?.progressionLevel).toBe('P1')
  expect(ppMethodNodeById.get('exp-standing-lateral-weight-shift')?.progressionLevel).toBe('P0')
})
~~~

### Capability contract

~~~ts
it('accepts declared hip-flexion and rejects runtime unknown capability drift', () => {
  expect(ppMethodNodeById.get('pp15')?.capabilities).toContain('hip-flexion')
  expect(ppMethodNodeById.get('exp-short-forward-step-high-plank')?.capabilities)
    .toContain('hip-flexion')

  expect(validatePPProgressionGraph(ppMethodNodes, [
    {
      from: 'pp20',
      to: 'pp21',
      type: 'progression',
      capabilityDelta: ['unknown-capability'] as unknown as PPCapability[],
      reason: 'runtime contract fixture',
    },
  ])).toContain('progression edge capabilityDelta is not declared: unknown-capability')
})
~~~

### Graph invariants

Retain and extend the existing tests for:

- valid endpoints;
- no self-loop;
- no duplicate edge;
- acyclic graph;
- all frozen critical path pairs;
- 45 final edges;
- all edge deltas declared in PPCapability;
- no strict delta subset assertion.

## 15. RED Sequence

### Task 1 RED

Add the profile coverage and non-generic critical metadata tests. Run:

~~~bash
npm test -- --run tests/pp-method.test.ts
~~~

Expected failure: PPMethodNode has no readinessProfile/profile registry and critical nodes still use the generic default gate/compensation.

### Task 2 RED

Add targeted breathing and critical override assertions. Run the same focused command.

Expected failure: the new phase-cued modes and profile-specific criterion/compensation semantics are absent.

### Task 3 RED

Add PP05, PP03 and pp06 edge tests.

Expected failure: pp04→pp05 is absent, pp06 edge is still progression, and PP03 has no explicit external-prerequisite coachNote.

### Task 4 RED

Add capability type and runtime validator tests. Run:

~~~bash
npm test -- --run tests/pp-method.test.ts
npm run build
~~~

Expected failure: unknown capability fixture is not rejected by the type/validator contract and hip-flexion is absent from the declared taxonomy.

### Task 5 RED

Run the full existing suite after all focused tests are present:

~~~bash
npm test
~~~

Expected result before implementation is failure only in the new tests, not unrelated baseline tests. Any unrelated failure is a stop condition for plan execution.

## 16. GREEN Implementation Sequence

### Task 1: Profile contract and 12-profile registry

Files:

- Modify src/data/pp/types.ts.
- Modify src/data/pp/methodNodes.ts.
- Test tests/pp-method.test.ts.

Steps:

- [ ] Write the profile coverage and inventory-preservation tests.
- [ ] Run the focused PP test and observe the expected missing-profile failure.
- [ ] Add PPMethodReadinessProfileId, PPMethodReadinessProfile and required readinessProfile to PPMethodNode/NodeOptions.
- [ ] Add the 12-profile registry with semantic criterion codes/domains and profile-specific compensation strings.
- [ ] Assign every one of the 53 nodes exactly one profile.
- [ ] Replace generic quality/compensation defaults with profile-backed defaults.
- [ ] Run npm test -- --run tests/pp-method.test.ts.
- [ ] Run npm run build.
- [ ] Commit only the task files with message feat(pp): add reusable method readiness profiles.

### Task 2: Targeted quality, compensation and breathing hardening

Files:

- Modify src/data/pp/methodNodes.ts.
- Test tests/pp-method.test.ts.

Steps:

- [ ] Write targeted critical-node and breathing-mode tests.
- [ ] Run the focused PP test and observe failure for missing overrides.
- [ ] Add exactly 12 targeted quality/compensation overrides listed in Section 2.2.
- [ ] Add the seven phase-cued breathing strategy overrides listed in Section 2.3.
- [ ] Keep ordinary mobility/simple locomotion on continuous default.
- [ ] Verify PP06, PP17 and PP20 remain drill kind and PP21/PP22 remain breathing kind.
- [ ] Run the focused PP test.
- [ ] Run npm run build.
- [ ] Commit only the task files with message feat(pp): harden method readiness metadata.

### Task 3: Graph semantics and PP05/PP03 resolution

Files:

- Modify src/data/pp/progressionGraph.ts.
- Modify src/data/pp/methodNodes.ts for PP03 coachNote/profile override.
- Test tests/pp-method.test.ts.

Steps:

- [ ] Write tests for pp04→pp05, PP03 intentional root and pp06 branch semantics.
- [ ] Run the focused PP test and observe the expected graph failures.
- [ ] Add exactly pp04→pp05 with capabilityDelta hip-extension.
- [ ] Change only pp06→exp-standing-lateral-weight-shift from progression to branch.
- [ ] Add the PP03 external general-strength prerequisite coachNote and targeted gate.
- [ ] Do not add PP02→PP03 or any shoulder progression edge.
- [ ] Run the focused PP test and verify the graph count is 45.
- [ ] Run npm run build.
- [ ] Commit only the task files with message fix(pp): resolve method progression semantics.

### Task 4: Capability contract and reconciliation enforcement

Files:

- Modify src/data/pp/types.ts.
- Modify src/data/pp/methodNodes.ts.
- Modify src/data/pp/progressionGraph.ts.
- Modify src/data/pp/index.ts only for profile/capability contract validation if needed.
- Test tests/pp-method.test.ts.

Steps:

- [ ] Write the declared hip-flexion and runtime unknown-delta tests, including the type-level negative fixture.
- [ ] Run the focused test and npm run build to observe the expected failure.
- [ ] Add hip-flexion to PPCapability and the runtime capability list.
- [ ] Change capabilityDelta to readonly PPCapability[].
- [ ] Add hip-flexion to exp-plank-march, exp-short-forward-step-high-plank, pp13, pp14 and pp15.
- [ ] Add runtime validation for every capabilityDelta entry.
- [ ] Reconcile all 44 existing edges using the matrix in Section 12.
- [ ] Preserve valid repeated/increased-demand deltas and do not impose subset validation.
- [ ] Verify the new PP05 edge is included as edge 45.
- [ ] Run the focused PP test.
- [ ] Run npm run build.
- [ ] Commit only the task files with message feat(pp): harden capability delta contract.

### Task 5: Full verification and scope audit

Files:

- No new production files.
- Test tests/pp-method.test.ts if a final invariant assertion is required.

Steps:

- [ ] Run npm test.
- [ ] Run npm run build.
- [ ] Run git diff --check.
- [ ] Confirm changed production paths are limited to src/data/pp/types.ts, src/data/pp/methodNodes.ts, src/data/pp/progressionGraph.ts and optionally src/data/pp/index.ts.
- [ ] Confirm the only test path changed is tests/pp-method.test.ts.
- [ ] Confirm Exercise Database, Programming, BODY, 3C, CON, UI and App paths have no changes.
- [ ] Confirm counts are 104 Exercises, 53 PP nodes, 19/26/8 mappings, 0 add-candidate, 0 verify, empty ledger and 45 graph edges.
- [ ] Confirm PP17, P-level separation and breathing cross-cutting semantics remain unchanged.
- [ ] Confirm git status contains only the intended plan/implementation files in the planning branch.
- [ ] Do not push or merge.

## 17. Final Expected Invariants

After E5B implementation, the following must hold:

| Invariant | Expected |
|---|---:|
| Exercise registry | 104 |
| PP Method Nodes | 53 |
| Source / expansion | 26 / 27 |
| mapped / variant / method-only | 19 / 26 / 8 |
| add-candidate / verify | 0 / 0 |
| Verification Ledger | 0 |
| Progression edges | 45 |
| Readiness profiles | 12 |
| Targeted node overrides | 12 |
| Unknown capabilityDelta strings | 0 |
| Graph endpoints invalid | 0 |
| Self-loops | 0 |
| Duplicate edges | 0 |
| Cycles | 0 |
| PP17 | drill / method-only / plank |
| P-level vs Programming L-level conflation | 0 |
| PP-F policy fields in PP Method | 0 |

The resulting Method Layer may be labeled method-readiness hardened, but overall Programming Readiness remains pending the separate PP-F Programming Policy implementation.

## 18. Scope Audit

Allowed production scope:

- src/data/pp/types.ts
- src/data/pp/methodNodes.ts
- src/data/pp/progressionGraph.ts
- src/data/pp/index.ts only when validator hardening requires it

Allowed test scope:

- tests/pp-method.test.ts

Allowed documentation scope:

- docs/superpowers/plans/2026-08-29-pp-e5b-method-readiness-hardening.md

Forbidden changes:

- src/data/exercises/**
- src/data/programming/**
- BODY, 3C, CON, UI, App
- canonical mapping/status
- PP source IDs
- PP17 identity/kind/host
- old dirty checkout contents
- any PP-F or Female Programming artifact

Any changed path outside the allowed list is a scope failure and must stop execution.

## 19. Rollback and Failure Conditions

Stop without broadening scope when:

- the baseline no longer has 104/53/19/26/8/0/0/0 invariants;
- the audit commit is not the planning branch base;
- a profile assignment leaves a node without a profile or assigns a node more than once;
- pp04→pp05 creates a cycle or invalid endpoint;
- PP03 can only be represented by inventing a new prerequisite schema;
- hip-flexion cannot be supported by the targeted supported/cross-body node semantics;
- the 44-edge matrix requires deleting or redesigning an edge outside the two approved semantic changes;
- any unrelated test, build, or TypeScript failure appears;
- any forbidden path changes.

For a task already committed on the E5B branch, revert that task commit with git revert after recording the failure. Do not use git reset --hard, checkout, clean or stash. Preserve the audit commit and the planning worktree.

## 20. Review Handoff

The plan is complete and plan-only. It deliberately leaves PP-F Programming Policy out of scope.

Expected planning-branch deliverables:

1. authoritative audited production base SHA: 639e80ee380f18e553e54cc76a39a5d374d840f6;
2. current planning-branch starting HEAD (PP-E5 audit commit): 07418a9ccfb7e02bebbcc5a5d0150f46dd0867ba;
3. planning branch: codex/pp-e5b-method-readiness-hardening;
4. this plan document;
5. 12 reusable Quality/Compensation profiles;
6. 12 targeted node overrides;
7. PP05 edge decision: add pp04→pp05;
8. PP03 decision: intentional advanced root, no graph edge;
9. P1→P0 decision: pp06 edge becomes branch;
10. hip-flexion decision: add declared capability and targeted node tags;
11. capabilityDelta decision: readonly PPCapability[] plus runtime validation, no strict subset invariant;
12. expected graph edge count: 45;
13. expected production files: the four listed PP files at most;
14. expected test file: tests/pp-method.test.ts;
15. unresolved E5B blockers: none; PP-F policy remains an explicit downstream dependency;
16. final status: plan document only, no production implementation;
17. final validation: git diff --check and git status after plan creation.

等待 Final Plan Review。
