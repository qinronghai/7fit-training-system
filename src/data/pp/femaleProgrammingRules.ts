import { ppMethodNodes } from './methodNodes'
import {
  ppFemaleDemandScores,
  ppFemaleDemands,
  ppFemaleEligibilityCounts,
  ppFemaleEligibilities,
  ppFemaleProgrammingPolicy,
  ppFemaleSlots,
} from './femaleProgrammingPolicy'
import type {
  PPFemaleBlockSelection,
  PPFemaleProgrammingContext,
  PPFemalePolicyEntry,
  PPFemaleSlot,
  PPFemaleValidationIssue,
} from './femaleProgrammingPolicy'

const frozenEligibilityCounts = { A_DIRECT: 17, B_CONDITIONAL: 28, C_METHOD_ONLY: 8 } as const

const readyIds = (context?: PPFemaleProgrammingContext): ReadonlySet<string> =>
  context?.readyConditionalNodeIds instanceof Set
    ? context.readyConditionalNodeIds
    : new Set(context?.readyConditionalNodeIds ?? [])

const issue = (
  code: PPFemaleValidationIssue['code'],
  message: string,
  nodeId?: string,
  slot?: PPFemaleSlot,
): PPFemaleValidationIssue => ({ code, message, nodeId, slot })

const policyById = new Map(ppFemaleProgrammingPolicy.map((entry) => [entry.nodeId, entry]))

export const validateFemaleProgrammingPolicy = (
  policy: readonly PPFemalePolicyEntry[] = ppFemaleProgrammingPolicy,
  nodes = ppMethodNodes,
): readonly PPFemaleValidationIssue[] => {
  const issues: PPFemaleValidationIssue[] = []
  const nodeIds = new Set(nodes.map((node) => node.id))
  const seen = new Set<string>()
  const counts = { A_DIRECT: 0, B_CONDITIONAL: 0, C_METHOD_ONLY: 0 }

  if (policy.length !== nodes.length) {
    issues.push(issue('POLICY_COVERAGE', `expected ${nodes.length} policy entries, got ${policy.length}`))
  }

  for (const entry of policy) {
    if (seen.has(entry.nodeId)) issues.push(issue('POLICY_COVERAGE', `duplicate policy node: ${entry.nodeId}`, entry.nodeId))
    seen.add(entry.nodeId)
    counts[entry.eligibility] += 1
    if (!nodeIds.has(entry.nodeId)) issues.push(issue('POLICY_COVERAGE', `unknown policy node: ${entry.nodeId}`, entry.nodeId))
    if (new Set(entry.allowedSlots).size !== entry.allowedSlots.length) {
      issues.push(issue('POLICY_COVERAGE', `duplicate policy slot: ${entry.nodeId}`, entry.nodeId))
    }
    if (entry.allowedSlots.some((slot) => !ppFemaleSlots.includes(slot))) {
      issues.push(issue('POLICY_COVERAGE', `invalid policy slot: ${entry.nodeId}`, entry.nodeId))
    }
    if (!ppFemaleEligibilities.includes(entry.eligibility) || !ppFemaleDemands.includes(entry.demand)) {
      issues.push(issue('POLICY_COVERAGE', `invalid policy enum: ${entry.nodeId}`, entry.nodeId))
    }
    if (entry.demand === 'HIGH' && (
      entry.allowedChallengeRoles.length !== 1
      || !entry.allowedChallengeRoles.includes('PRIMARY_CHALLENGE')
      || entry.allowedChallengeRoles.includes('SUPPORTING')
    )) {
      issues.push(issue('POLICY_COVERAGE', `high-demand policy must allow only PRIMARY_CHALLENGE: ${entry.nodeId}`, entry.nodeId))
    }
    if (entry.eligibility === 'C_METHOD_ONLY') {
      if (entry.allowedSlots.length || entry.allowedChallengeRoles.length || entry.demand !== 'NONE') {
        issues.push(issue('POLICY_COVERAGE', `method-only policy is selectable: ${entry.nodeId}`, entry.nodeId))
      }
    } else if (!entry.allowedSlots.length || !entry.allowedChallengeRoles.length || entry.demand === 'NONE') {
      issues.push(issue('POLICY_COVERAGE', `selectable policy is incomplete: ${entry.nodeId}`, entry.nodeId))
    }
  }

  for (const node of nodes) {
    if (!seen.has(node.id)) issues.push(issue('POLICY_COVERAGE', `missing policy node: ${node.id}`, node.id))
  }
  for (const eligibility of ppFemaleEligibilities) {
    if (counts[eligibility] !== frozenEligibilityCounts[eligibility]) {
      issues.push(issue('POLICY_COVERAGE', `${eligibility} expected ${frozenEligibilityCounts[eligibility]}, got ${counts[eligibility]}`))
    }
  }
  if (JSON.stringify(ppFemaleEligibilityCounts) !== JSON.stringify(frozenEligibilityCounts)) {
    issues.push(issue('POLICY_COVERAGE', 'frozen eligibility counts do not match the explicit matrix'))
  }
  return issues
}

export const getFemaleProgrammingCandidates = (
  slot: PPFemaleSlot,
  context: PPFemaleProgrammingContext = {},
): readonly PPFemalePolicyEntry[] => {
  const ready = readyIds(context)
  return ppFemaleProgrammingPolicy.filter((entry) => {
    if (!entry.allowedSlots.includes(slot)) return false
    if (entry.eligibility === 'A_DIRECT') return true
    return entry.eligibility === 'B_CONDITIONAL' && ready.has(entry.nodeId)
  })
}

export const validateFemaleProgrammingBlock = (
  block: PPFemaleBlockSelection,
  context: PPFemaleProgrammingContext = {},
): readonly PPFemaleValidationIssue[] => {
  const issues: PPFemaleValidationIssue[] = []
  const ready = readyIds(context)
  const selections = ppFemaleSlots.map((slot) => ({ slot, selection: block[slot] }))
  const seen = new Set<string>()
  let primaryCount = 0
  let highCount = 0
  let totalDemand = 0

  for (const { slot, selection } of selections) {
    const entry = policyById.get(selection.nodeId)
    if (!entry) {
      issues.push(issue('UNKNOWN_NODE', `unknown policy node: ${selection.nodeId}`, selection.nodeId, slot))
      continue
    }
    if (seen.has(selection.nodeId)) issues.push(issue('DUPLICATE_NODE', `node used more than once: ${selection.nodeId}`, selection.nodeId, slot))
    seen.add(selection.nodeId)
    if (entry.eligibility === 'C_METHOD_ONLY') {
      issues.push(issue('ELIGIBILITY_FORBIDDEN', `method-only node cannot enter a block: ${selection.nodeId}`, selection.nodeId, slot))
    } else if (entry.eligibility === 'B_CONDITIONAL' && !ready.has(selection.nodeId)) {
      issues.push(issue('CONDITIONAL_NOT_READY', `conditional node is not ready: ${selection.nodeId}`, selection.nodeId, slot))
    }
    if (!entry.allowedSlots.includes(slot)) {
      issues.push(issue('SLOT_NOT_ALLOWED', `${selection.nodeId} is not allowed in ${slot}`, selection.nodeId, slot))
    }
    if (!entry.allowedChallengeRoles.includes(selection.challengeRole)) {
      issues.push(issue('CHALLENGE_ROLE_NOT_ALLOWED', `${selection.nodeId} cannot be ${selection.challengeRole}`, selection.nodeId, slot))
    }
    if (selection.challengeRole === 'PRIMARY_CHALLENGE') primaryCount += 1
    if (entry.demand === 'HIGH') {
      highCount += 1
      if (selection.challengeRole !== 'PRIMARY_CHALLENGE') {
        issues.push(issue('HIGH_DEMAND_NOT_PRIMARY', `high-demand node must be primary: ${selection.nodeId}`, selection.nodeId, slot))
      }
    }
    totalDemand += ppFemaleDemandScores[entry.demand]
  }

  if (primaryCount !== 1) issues.push(issue('PRIMARY_CHALLENGE_COUNT', `expected exactly one primary challenge, got ${primaryCount}`))
  if (highCount > 1) issues.push(issue('HIGH_DEMAND_LIMIT', `expected at most one high-demand node, got ${highCount}`))
  if (totalDemand > 6) issues.push(issue('DEMAND_BUDGET_EXCEEDED', `demand budget is 6, got ${totalDemand}`))
  return issues
}
