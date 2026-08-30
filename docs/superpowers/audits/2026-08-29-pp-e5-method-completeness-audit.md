# PP-E5｜Method Completeness Audit

审计日期：2026-08-29
审计模式：AUDIT ONLY；不实施 findings
Repository：qinronghai/7fit-training-system
审计 checkout：/Users/ronny/Documents/ChatGPT/7fitwebos-pp-e5
Audit branch：codex/pp-e5-method-completeness-audit
Authoritative base：639e80ee380f18e553e54cc76a39a5d374d840f6

## Executive verdict

PATCH REQUIRED

这是 PP-E5 Method Layer 的实质审计结论，不是 environment gate 结论。本次新 checkout 已通过 environment gate 和 baseline gate；旧 dirty checkout 未被修改或清理。

Final Review disposition：

1. 53 个节点都继承同一套泛化 quality gate，不能回答具体的“什么时候可以从 from 进阶到 to”；common compensation 也全部是同一条泛化描述。这是可通过复用的 method-specific profiles 和少量 override 修复的 metadata 缺口。
2. programming eligibility、需求/负荷/疲劳预算和 block-level 组合风险属于未来 PP-F Programming Policy，不应反向塞入 PP Method Node contract。

PP05/PP03 的图谱缺口及 capability delta 漂移是额外 Important findings。

当前 Method contract 已经能表达 breathing、qualityGate、commonCompensations、capabilities、progressionLevel、role、kind、pathway 和 progression edges；本次不是架构表达能力失败，而是 method metadata 过于 generic。因此不需要 Architecture Review，正式 verdict 为 PATCH REQUIRED。

## Evidence and method

结论直接从当前 639e80ee checkout 的 production source 独立推导：

- src/data/pp/methodNodes.ts
- src/data/pp/progressionGraph.ts
- src/data/pp/types.ts
- src/data/pp/index.ts
- src/data/exercises/exercises.ts

独立 source parser 重新计数 node、mapping、exercise registry、edge、pathway、capability 和 graph topology；随后运行现有测试与 build 作为辅助验证。测试没有被当作 Method Completeness 的充分证明。

## 0. Environment and baseline gates

### Environment gate

| Check | Result |
|---|---|
| Current branch | PASS: codex/pp-e5-method-completeness-audit |
| HEAD | PASS: 639e80ee380f18e553e54cc76a39a5d374d840f6 |
| Worktree clean before audit | PASS |
| Old dirty checkout changed | NO |

### Baseline gate

| Invariant | Independently derived result | Status |
|---|---:|---|
| Exercise registry | 104 unique IDs | PASS |
| PP Method Nodes | 53 | PASS |
| Source / expansion nodes | 26 / 27 | PASS |
| Unique node IDs | 53 | PASS |
| Source IDs | PP01–PP26, each once | PASS |
| Progression Graph | 44 edges | PASS |
| mapped / variant / method-only | 19 / 26 / 8 | PASS |
| add-candidate / verify | 0 / 0 | PASS |
| Verification Ledger | 0 | PASS |
| PP17 | drill; method-only; hostExerciseId plank | PASS |

所有 mapped/variant target 都存在于 104-entry canonical Exercise registry；method-only 节点没有伪造 canonical identity；44 条 edge 的 endpoint 全部有效。

## Finding summary

| Severity | Count | IDs |
|---|---:|---|
| Critical | 0 | — |
| Important | 4 | I-01, I-02, I-03, I-04 |
| Minor | 0 | — |

### I-04 — Method quality metadata is overly generic

Category：Quality Gate、Common Compensations、Method Semantics。

PPMethodNode 已经暴露 pathway、P-level、role、capabilities、breathing、quality gate 和 compensation（src/data/pp/types.ts:108-124）。问题不是 contract 无法表达这些概念，而是当前 53 个节点没有用 method-specific metadata 填充它们。

node() 对全部节点应用同一个 defaultQualityGate 和同一个 default commonCompensations，且没有 per-node qualityGate/commonCompensations override（src/data/pp/methodNodes.ts:40-48、67-78）。三个 gate criteria 只有泛化的 breathing、position、control 描述，没有 node-specific 的 repetition、duration、tolerance、range、load 或 from-to transition threshold。

所以当前 metadata 不能可靠回答：

- from 完成到什么程度才允许进入 to；
- 动作特异的质量 gate 和失败语义是什么。

建议的 E5B 修复是建立可复用的 method-specific profiles，例如 Breath Foundation、Rib-Pelvis Control、Hinge Control、Squat Control、Anterior Support、Lateral Support、Dynamic Support、Anti-Extension Core、Rotation Integration 和 Locomotion/Weight Shift；节点按需复用 profile，并对少数节点 override，不需要为 53 个动作创建 53 套完全独立规则。

这是 Important 的 metadata 工程，不是 PP architecture failure。

### PP-F boundary note — eligibility and demand policy are not an E5 blocker

未来 PP-F 必须实现独立的 Programming Policy：由 Method Layer 提供 pathway、capability、P-level、role 和 method gate，再由 PP-F selector 处理 HIP/SUPPORT/CORE eligibility、demand budget、疲劳/组合 guardrail 和 triple-high risk。该边界不应把 femaleSlotType、blockDemandBudget 或 maxHighDemandPeers 反向加入 PP Method Node。

例如 PP03 + PP18 + PP24 的三高组合风险是真实的 PP-F 必须实现条件，但不是 PP-E Method Architecture 的 Critical Failure。

### I-01 — PP05 is resolved but graph-disconnected; PP03 is an unsupported P4 root

Category：Progression Graph、pathway coverage。

独立 topology 检查得到两个完全没有 incoming/outgoing edge 的节点：

- pp05：P2 / hip-rotation / bridge，canonical identity 已 resolved 为 shin-box-hip-lift，但没有任何图边。虽然存在 exp-supported-90-90 → exp-static-90-90 → pp04 链，PP05 没有进入该链，形成真实 progression gap。
- pp03：P4 / integration / integration，没有 incoming 或 outgoing edge，是不可从当前图谱到达的 advanced root。

这是对图谱事实的记录，不是重新打开 identity，也不新增 edge。

### I-02 — Level direction and capabilityDelta contract drift

Category：Progression Graph、Capability Consistency、P-Level semantics。

- pp06(P1) → exp-standing-lateral-weight-shift(P0) 被标为 progression，但 P-level 下降（src/data/pp/progressionGraph.ts:271-276）。它可能代表坐姿控制转向站立重新建位，但当前 edge type 与 P-level direction 不一致。
- capabilityDelta 类型是普通 readonly string[]，不是 PPCapability[]（src/data/pp/types.ts:120-124）。实际 graph 使用 taxonomy 中不存在的 hip-flexion，出现在 exp-plank-march → pp15 和 exp-incline-support-weight-shift → exp-short-forward-step-high-plank（src/data/pp/progressionGraph.ts:75-93）。
- 44 条 edge 中有 10 条 delta 没有表达 target 相对 source 的新增 capability identity，例如 exp-incline-plank → pp16、exp-short-forward-step-high-plank → pp14、exp-short-lever-copenhagen → exp-full-copenhagen。动作难度变化可能真实存在，但当前 delta 只能依赖自然语言 reason 表达。

未把 pp16 → pp17 的 P2→P1 作为 progression finding，因为它显式是 optional method drill handoff；但这说明 P-level 不能单独作为 technique gate。

### I-03 — Breathing metadata is structurally present but partly shallow

Category：Breathing Completeness。

53/53 节点有 breathing strategy、pressure intent 和 failure signs；43 个节点继承 continuousBreathing，3 个使用 phaseCuedBreathing，7 个使用 resetBreathing（src/data/pp/methodNodes.ts:15-38、76-78）。这足够证明 breathing 作为 cross-cutting execution layer 存在，但不是动作特异的 prescription。

commonCompensations 的统一 placeholder 另列为 I-04。呼吸方面的问题主要是 43 个节点继承同一个 continuous template，无法充分表达某些关键动作的动作特异呼吸失败模式。

该 finding 严重度保持 Important，但不要求所有 mobility/simple locomotion 节点都写复杂吸呼节奏；E5B 应优先覆盖 breath foundation、core anti-extension、high plank/side plank、PP03 integration 和 PP23–25 Pilates。

## A. Inventory Integrity

Result：PASS。

独立推导得到 53/53 unique node IDs、26/26 source IDs、27 expansion nodes、19 mapped、26 variant、8 method-only、0 add-candidate、0 verify、empty ledger。所有 mapped/variant target 存在于 104-entry registry；所有 graph endpoints 有效。

## B. Kind Semantics

| Kind | Count | Result |
|---|---:|---|
| exercise | 19 | mapped canonical identities |
| variant | 26 | canonical host identity plus variantId |
| drill | 4 | method-only; perception/positioning/control semantics plausible |
| breathing | 4 | method-only; breathing/pressure/rib-pelvis semantics explicit |

重点节点：

- PP06 是 locomotion/pelvic-control drill，不因 breathing-control capability 被误归类为 breathing。
- PP17 是 drill + method-only + hostExerciseId=plank，并有 coach note，不是假装成 plank variant。
- PP20 是 quadruped support drill。
- PP21、PP22 及两个 expansion breathing nodes 是 breathing kind。
- exp-standing-lateral-weight-shift 是 frontal-plane drill，breathing 仅为执行层。

未发现明显 kind mismatch。

## C. Pathway Coverage

下表以 primaryPathway 计 node；incoming/outgoing 以 edge endpoint 落在该 pathway 的节点计数；secondary pathway 用于解释跨 pathway handoff，不重复计 node。

| Pathway | Nodes | P0 | P1 | P2 | P3 | P4 | Foundation/Base | Bridge | Integration | In | Out | Terminal |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| breath | 4 | 3 | 1 | 0 | 0 | 0 | 3 | 1 | 0 | 3 | 5 | none; hands off |
| core | 4 | 0 | 0 | 1 | 1 | 2 | 1 | 0 | 3 | 4 | 3 | pp25(P4) |
| support | 11 | 1 | 3 | 4 | 3 | 0 | 3 | 6 | 1 | 10 | 12 | pp11, pp15, pp17 |
| lateral-support | 8 | 0 | 1 | 2 | 4 | 1 | 2 | 4 | 2 | 9 | 7 | pp18, pp19, exp-full-copenhagen |
| hip-extension | 3 | 0 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 2 | 2 | exp-single-leg-glute-bridge |
| hinge | 3 | 1 | 2 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 2 | pp02 |
| squat | 3 | 1 | 2 | 0 | 0 | 0 | 3 | 0 | 0 | 2 | 3 | none; hands off |
| hip-rotation | 4 | 1 | 2 | 1 | 0 | 0 | 3 | 1 | 0 | 2 | 2 | pp04, pp05 |
| frontal-plane | 5 | 1 | 2 | 2 | 0 | 0 | 2 | 2 | 0 | 4 | 5 | pp09 |
| thoracic-rotation | 2 | 1 | 0 | 1 | 0 | 0 | 1 | 1 | 0 | 1 | 1 | pp12 |
| locomotion | 4 | 0 | 2 | 0 | 2 | 0 | 1 | 0 | 1 | 3 | 2 | pp07, exp-standing-march |
| integration | 2 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 2 | 2 | 0 | pp03, pp13 |

Coverage interpretation：

- 每个 legal pathway 都有节点或跨 pathway handoff；没有整个 pathway 完全 orphan。
- core 没有 primary P0/P1，但 breath → core 提供合法 foundation route，不制造机械 missing-level finding。
- integration sparse，但 pp03 同时孤立且 P4；pp13 可从 support path 到达。
- hip-rotation expansion chain 存在，PP05 的孤立单独记录为 I-01。

## D. Progression Graph

| Check | Result |
|---|---:|
| Edge count | 44 |
| progression / branch / optional | 35 / 7 / 2 |
| Invalid endpoint | 0 |
| Self-loop | 0 |
| Duplicate edge key | 0 |
| Cycle | 0 |
| Required frozen critical pairs missing | 0 |
| Completely isolated nodes | pp03, pp05 |
| Advanced roots without incoming edge | pp03(P4) |

所有冻结 critical pairs 均存在，包括 breath/core、support、lateral-support、hinge、hip-extension、squat、hip-rotation、adduction/lateral、frontal-plane、thoracic-rotation 和 locomotion 路径。

图谱结构无 cycle，但 graph validity 不等于 progression completeness；I-01、I-02 仍成立。

## E. Capability Consistency

| Capability | Node count |
|---|---:|
| breathing-control | 14 |
| rib-pelvis-control | 14 |
| pelvic-control | 23 |
| shoulder-support | 20 |
| anti-extension | 9 |
| anti-rotation | 7 |
| anti-lateral-flexion | 9 |
| hip-hinge | 5 |
| hip-extension | 9 |
| hip-rotation | 4 |
| hip-abduction | 7 |
| hip-adduction | 4 |
| weight-shift | 15 |
| contralateral-control | 4 |
| rotation | 7 |
| locomotion | 7 |
| force-transfer | 6 |

整体 capability coverage 存在：support 有 shoulder-support foundation 和 weight-shift/anti-rotation 路线；core 有 anti-extension/contralateral control；hip-extension、hinge、squat、hip-rotation、frontal-plane、locomotion 均有可用节点。

但 capabilityDelta 不是可靠的 machine-readable difference set：存在未声明的 hip-flexion，多个 delta 重复 source/target 已有 capability，且 range、leverage、support surface、simultaneous limb demand 和 load/intensity 只在 reason 或动作语义中隐含。未把每个重复 delta 判为 anatomy 错误；finding 是当前字段无法独立表达新增 capability 与既有 capability 的更高 dosage。

## F. Breathing Completeness

| Mode | Nodes |
|---|---:|
| continuous default | 43 |
| reset | 7 |
| phase-cued | 3 |

Structural result：PASS。53/53 有 pressureIntent、mustMaintainBreathing 和 failureSigns。

Semantic result：CONDITIONAL。Breathing 正确作为 cross-cutting execution layer，不是第四个 Programming bucket。PP06、PP17、PP20 为 reset drill；PP21 为 P0 breathing foundation；PP22 为 P1 breathing bridge；两个 expansion breathing nodes 为 method-only breathing；exp-standing-lateral-weight-shift 为 frontal-plane drill。未发现 kind mismatch；动作特异性不足见 I-03。

## G. Quality Gate Completeness

Structural result：53/53 populated。PPQualityGate 支持 criteria 与 all passRule（src/data/pp/types.ts:92-103），validator 只检查非空 criteria 与 passRule=all（src/data/pp/index.ts:50-52）。

Method completeness result：PATCH REQUIRED / I-04。全部节点只有：

1. 规定重复或停留期间保持连续呼吸；
2. 保持起始位与目标躯干、骨盆位置；
3. 动作范围内无明显代偿或惯性。

没有 node-specific threshold、minimum repetitions/seconds、tolerance boundary 或 from-to transition rule，不能回答何时从 from 进入 to；这需要 E5B 的可复用 method-specific profiles。

## H. Common Compensations / Failure Semantics

Structural result：non-empty but insufficient。每个节点都得到同一条 common compensation：屏气或用惯性完成动作（src/data/pp/methodNodes.ts:76-78）。

它不能区分 rib flare/extension、shoulder-support collapse、pelvic rotation、frontal-plane sway 或 contralateral timing loss，因此不能支撑可靠的 conditional bridge 或退阶判断。

## I. Method Role Semantics

| Role | Count |
|---|---:|
| foundation | 13 |
| base | 8 |
| bridge | 16 |
| integration | 10 |
| drill | 5 |
| optional | 1 |

Role 与 kind/pathway 整体相容：drill 用于 PP06、PP17、PP20、站立重心转移和 hinge 教学 expansion；integration 用于 PP03、PP11、PP13、PP18、PP23–PP25 及 single-leg/full expansion；PP07 明确 optional。

未发现需要另立 finding 的 role/kind mismatch。role 仍是 descriptive field，不是 executable eligibility contract。

## J. Programming Eligibility

为使分类可复核，采用以下审计规则：

- A Direct：canonical mapped 或 variant，kind 为 exercise/variant，role 为 foundation/base。
- B Conditional / Bridge：canonical mapped 或 variant，kind 为 exercise/variant，但 role 为 bridge/integration/optional。
- C Method Layer Only：method-only mapping，包括 drills 与 breathing nodes。

| Class | Count |
|---|---:|
| A Direct Programming Eligible | 17 |
| B Conditional / Bridge | 28 |
| C Method Layer Only | 8 |

A：pp01、pp02、pp04、pp08、pp10、pp16、pp26、exp-incline-plank、exp-knee-side-plank、exp-standard-side-plank、exp-assisted-sit-to-stand、exp-box-squat、exp-supported-90-90、exp-static-90-90、exp-basic-hip-abduction、exp-standing-march、exp-open-book。

B：pp03、pp05、pp07、pp09、pp11、pp12、pp13、pp14、pp15、pp18、pp19、pp23、pp24、pp25、exp-quadruped-single-limb-lift、exp-incline-support-weight-shift、exp-plank-march、exp-short-forward-step-high-plank、exp-side-plank-reach、exp-partial-side-plank-rotation、exp-glute-bridge-march、exp-single-leg-glute-bridge、exp-wall-touch-hinge、exp-dowel-three-point-hinge、exp-long-lever-side-lying-adduction、exp-short-lever-copenhagen、exp-full-copenhagen、exp-half-squat-low-locomotion。

C：pp06、pp17、pp20、pp21、pp22、exp-supine-90-90-breathing、exp-side-lying-breathing、exp-standing-lateral-weight-shift。

这是审计分类，不是 production selector；Method Layer 的 A/B 结果仍需要 PP-F Policy 依据 demand budget、组合 guardrail 和 PP-F-specific 规则进一步筛选。

## K. HIP / SUPPORT / CORE 1+1+1 Readiness

已准备好的部分：

- 45 个 exercise/variant 节点 canonical mapping complete。
- support 有 PP20/exp-incline-plank route；core 有 breath-to-PP26 route；hip 有 hip-extension、hinge、squat、hip-rotation、frontal-plane、locomotion routes。
- breathing 可作为跨三 bucket execution layer。
- frozen graph 所有 required handoff pair 存在且无 cycle。

PP-F dependency：Method Layer 本身没有 machine-readable demand aggregation 或 conflict rule；这属于 PP-F Policy 必须补齐的职责。当前数据不会拒绝以下组合：

- pp03：P4，force-transfer、shoulder-support、hip-hinge、hip-extension；
- pp18：P4，anti-lateral-flexion、shoulder-support、rotation、force-transfer；
- pp24：P4，anti-extension、breathing-control、force-transfer。

这三个高需求节点可以分别充当 HIP/support integration、SUPPORT、CORE 选择，但没有字段规定它们不能共存、如何累加需求或哪个必须降级。因此 PP-F 不能跳过 demand budget/combination guardrail；这不是 PP Method Architecture 的 Critical finding。

## P-Level vs Technique-Level separation

Result：PASS with caveat。

PP 使用 PPProgressionLevel=P0|P1|P2|P3|P4（src/data/pp/types.ts:78-79）；canonical Exercise domain 单独使用 TechniqueLevel=tl0|tl1|tl2|tl3|tl4（src/data/exercises/types.ts:1）。没有发现 PP node 把 Programming L1–L4 写进 progressionLevel，也没有把 P-level 直接等同 Programming level。

Caveat：edge direction、technique drill attachment 和 capability delta 不能完全由 P-level 独立解释，见 I-02。

## Remaining E5B method debt and PP-F dependency

没有修复 findings。剩余债务：

1. 定义 node-specific quality gates，回答 from-to transition，并在适用时加入 repetition/duration/tolerance。
2. 将单一 compensation placeholder 替换为 node/pathway-specific failure semantics。
3. PP-F 必须在独立 Programming Policy 中实现 programming eligibility、demand budget 和 combination-risk semantics；不要把这些规则塞回 PP Method Node。
4. 处理 PP05 graph gap，并为 PP03 建立经审查的 prerequisite path；本次 E5 不新增 edge。
5. 将 capabilityDelta 与声明的 capability taxonomy 对齐，区分新 capability 和既有 capability 的更高 demand。

## Final validation

| Validation | Result |
|---|---|
| npm test | PASS — 6 files, 209 tests |
| npm run build | PASS — TypeScript and Vite build |
| git diff --check | PASS after creating this document |
| Tracked changed files | exactly this audit document |
| Production code/tests/data modified | none; only this audit document was revised |

## Final Review status matrix

| Area | Status |
|---|---|
| Identity Integrity | PASS |
| Pathway Inventory | PASS |
| Graph Structural Safety | PASS |
| Method Semantics | PATCH REQUIRED |
| Quality Gate Readiness | PATCH REQUIRED |
| Compensation Semantics | PATCH REQUIRED |
| Breathing Architecture | PASS WITH PATCH |
| Programming Readiness | NOT READY pending PP-E5B and PP-F policy |
| Architecture Review | NOT REQUIRED |

等待 PP-E5 Final Review。
