import type { PPMethodNodeId } from './types'

export type PPFemaleEligibility = 'A_DIRECT' | 'B_CONDITIONAL' | 'C_METHOD_ONLY'
export type PPFemaleSlot = 'HIP' | 'SUPPORT' | 'CORE'
export type PPFemaleChallengeRole = 'PRIMARY_CHALLENGE' | 'SUPPORTING'
export type PPFemaleDemand = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH'

export type PPFemalePolicyEntry = {
  nodeId: PPMethodNodeId
  eligibility: PPFemaleEligibility
  allowedSlots: readonly PPFemaleSlot[]
  allowedChallengeRoles: readonly PPFemaleChallengeRole[]
  demand: PPFemaleDemand
}

export type PPFemaleProgrammingContext = {
  readyConditionalNodeIds?: ReadonlySet<PPMethodNodeId> | readonly PPMethodNodeId[]
}

export type PPFemaleBlockSelection = {
  HIP: { nodeId: PPMethodNodeId; challengeRole: PPFemaleChallengeRole }
  SUPPORT: { nodeId: PPMethodNodeId; challengeRole: PPFemaleChallengeRole }
  CORE: { nodeId: PPMethodNodeId; challengeRole: PPFemaleChallengeRole }
}

export type PPFemaleValidationIssueCode =
  | 'POLICY_COVERAGE'
  | 'ELIGIBILITY_FORBIDDEN'
  | 'CONDITIONAL_NOT_READY'
  | 'SLOT_NOT_ALLOWED'
  | 'UNKNOWN_NODE'
  | 'DUPLICATE_NODE'
  | 'CHALLENGE_ROLE_NOT_ALLOWED'
  | 'PRIMARY_CHALLENGE_COUNT'
  | 'HIGH_DEMAND_NOT_PRIMARY'
  | 'HIGH_DEMAND_LIMIT'
  | 'DEMAND_BUDGET_EXCEEDED'

export type PPFemaleValidationIssue = {
  code: PPFemaleValidationIssueCode
  message: string
  nodeId?: PPMethodNodeId
  slot?: PPFemaleSlot
}

export const ppFemaleEligibilities = [
  'A_DIRECT',
  'B_CONDITIONAL',
  'C_METHOD_ONLY',
] as const satisfies readonly PPFemaleEligibility[]

export const ppFemaleSlots = ['HIP', 'SUPPORT', 'CORE'] as const satisfies readonly PPFemaleSlot[]

export const ppFemaleChallengeRoles = [
  'PRIMARY_CHALLENGE',
  'SUPPORTING',
] as const satisfies readonly PPFemaleChallengeRole[]

export const ppFemaleDemands = ['NONE', 'LOW', 'MODERATE', 'HIGH'] as const satisfies readonly PPFemaleDemand[]

export const ppFemaleDemandScores: Readonly<Record<PPFemaleDemand, number>> = {
  NONE: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
}

const entry = (
  nodeId: PPMethodNodeId,
  eligibility: PPFemaleEligibility,
  allowedSlots: readonly PPFemaleSlot[],
  allowedChallengeRoles: readonly PPFemaleChallengeRole[],
  demand: PPFemaleDemand,
): PPFemalePolicyEntry => ({
  nodeId,
  eligibility,
  allowedSlots,
  allowedChallengeRoles,
  demand,
})

const rolesForDemand = (
  demand: PPFemaleDemand,
  roles?: readonly PPFemaleChallengeRole[],
): readonly PPFemaleChallengeRole[] => roles ?? (demand === 'HIGH' ? ['PRIMARY_CHALLENGE'] : ppFemaleChallengeRoles)

const direct = (
  nodeId: PPMethodNodeId,
  slots: readonly PPFemaleSlot[],
  demand: PPFemaleDemand,
  roles?: readonly PPFemaleChallengeRole[],
) => entry(nodeId, 'A_DIRECT', slots, rolesForDemand(demand, roles), demand)

const conditional = (
  nodeId: PPMethodNodeId,
  slots: readonly PPFemaleSlot[],
  demand: PPFemaleDemand,
  roles?: readonly PPFemaleChallengeRole[],
) => entry(nodeId, 'B_CONDITIONAL', slots, rolesForDemand(demand, roles), demand)

const methodOnly = (nodeId: PPMethodNodeId) => entry(
  nodeId,
  'C_METHOD_ONLY',
  [],
  [],
  'NONE',
)

/**
 * Explicit PP-E5 A/B/C audit classification plus PP-F1 programming policy.
 * This matrix is intentionally separate from canonical identity and Method metadata.
 */
export const ppFemaleProgrammingPolicy: readonly PPFemalePolicyEntry[] = [
  direct('pp01', ['HIP'], 'MODERATE'),
  direct('pp02', ['HIP'], 'MODERATE'),
  conditional('pp03', ['HIP'], 'HIGH'),
  direct('pp04', ['HIP'], 'LOW'),
  conditional('pp05', ['HIP'], 'MODERATE'),
  methodOnly('pp06'),
  conditional('pp07', ['HIP'], 'MODERATE', ['SUPPORTING']),
  direct('pp08', ['HIP'], 'LOW'),
  conditional('pp09', ['SUPPORT', 'HIP'], 'MODERATE', ['SUPPORTING']),
  direct('pp10', ['HIP'], 'MODERATE'),
  conditional('pp11', ['SUPPORT'], 'HIGH'),
  conditional('pp12', ['CORE'], 'HIGH'),
  conditional('pp13', ['SUPPORT', 'CORE'], 'HIGH'),
  conditional('pp14', ['SUPPORT'], 'HIGH'),
  conditional('pp15', ['SUPPORT', 'CORE'], 'HIGH'),
  direct('pp16', ['SUPPORT'], 'MODERATE'),
  methodOnly('pp17'),
  conditional('pp18', ['SUPPORT'], 'HIGH'),
  conditional('pp19', ['SUPPORT'], 'MODERATE'),
  methodOnly('pp20'),
  methodOnly('pp21'),
  methodOnly('pp22'),
  conditional('pp23', ['CORE'], 'HIGH'),
  conditional('pp24', ['CORE'], 'HIGH'),
  conditional('pp25', ['CORE'], 'HIGH'),
  direct('pp26', ['CORE'], 'MODERATE'),
  direct('exp-incline-plank', ['SUPPORT'], 'LOW'),
  direct('exp-knee-side-plank', ['SUPPORT'], 'MODERATE'),
  direct('exp-standard-side-plank', ['SUPPORT'], 'HIGH'),
  direct('exp-assisted-sit-to-stand', ['HIP'], 'LOW'),
  direct('exp-box-squat', ['HIP'], 'MODERATE'),
  direct('exp-supported-90-90', ['HIP'], 'LOW'),
  direct('exp-static-90-90', ['HIP'], 'LOW'),
  conditional('exp-quadruped-single-limb-lift', ['SUPPORT'], 'LOW', ['SUPPORTING']),
  conditional('exp-incline-support-weight-shift', ['SUPPORT'], 'MODERATE'),
  conditional('exp-plank-march', ['SUPPORT', 'CORE'], 'HIGH'),
  conditional('exp-short-forward-step-high-plank', ['SUPPORT', 'HIP'], 'HIGH'),
  conditional('exp-side-plank-reach', ['SUPPORT'], 'HIGH'),
  conditional('exp-partial-side-plank-rotation', ['SUPPORT', 'CORE'], 'HIGH'),
  conditional('exp-glute-bridge-march', ['HIP'], 'MODERATE'),
  conditional('exp-single-leg-glute-bridge', ['HIP'], 'HIGH'),
  conditional('exp-wall-touch-hinge', ['HIP'], 'LOW'),
  conditional('exp-dowel-three-point-hinge', ['HIP'], 'MODERATE'),
  conditional('exp-long-lever-side-lying-adduction', ['HIP'], 'MODERATE'),
  conditional('exp-short-lever-copenhagen', ['SUPPORT'], 'HIGH'),
  conditional('exp-full-copenhagen', ['SUPPORT'], 'HIGH'),
  conditional('exp-half-squat-low-locomotion', ['HIP'], 'MODERATE'),
  direct('exp-basic-hip-abduction', ['HIP'], 'LOW'),
  direct('exp-standing-march', ['HIP'], 'LOW'),
  methodOnly('exp-supine-90-90-breathing'),
  methodOnly('exp-side-lying-breathing'),
  methodOnly('exp-standing-lateral-weight-shift'),
  direct('exp-open-book', ['CORE'], 'LOW'),
]

export const ppFemaleEligibilityCounts: Readonly<Record<PPFemaleEligibility, number>> =
  ppFemaleProgrammingPolicy.reduce<Record<PPFemaleEligibility, number>>((counts, item) => {
    counts[item.eligibility] += 1
    return counts
  }, { A_DIRECT: 0, B_CONDITIONAL: 0, C_METHOD_ONLY: 0 })
