import { ppFemaleProgrammingPolicy } from '../pp/femaleProgrammingPolicy'
import { ppMethodNodeById } from '../pp/methodNodes'
import {
  female111DemandScores,
  female111Slots,
  type Female111BlockSelection,
  type Female111ValidationContext,
  type Female111ValidationIssue,
  type Female111Slot,
} from './types'
import { female111RoleByMethodNodeId } from './exerciseRoles'

const policyByMethodNodeId = new Map(ppFemaleProgrammingPolicy.map((entry) => [entry.nodeId, entry]))

const readyIds = (context: Female111ValidationContext = {}): ReadonlySet<string> =>
  context.readyConditionalMethodNodeIds instanceof Set
    ? context.readyConditionalMethodNodeIds
    : new Set(context.readyConditionalMethodNodeIds ?? [])

const issue = (
  code: Female111ValidationIssue['code'],
  message: string,
  methodNodeId?: string,
  slot?: Female111Slot,
): Female111ValidationIssue => ({ code, message, methodNodeId, slot })

export const validateFemale111Block = (
  block: Female111BlockSelection,
  context: Female111ValidationContext = {},
): readonly Female111ValidationIssue[] => {
  const issues: Female111ValidationIssue[] = []
  const ready = readyIds(context)
  const seen = new Set<string>()
  let primaryChallengeCount = 0
  let highDemandCount = 0
  let totalDemand = 0
  let integrationComplexityCount = 0
  const capabilityCounts = new Map<string, number>()

  for (const slot of female111Slots) {
    const selection = block[slot]
    const node = ppMethodNodeById.get(selection.methodNodeId)
    if (!node) {
      issues.push(issue('UNKNOWN_METHOD_NODE', `unknown Method node: ${selection.methodNodeId}`, selection.methodNodeId, slot))
      continue
    }
    if (node.mapping.status === 'method-only' || node.mapping.status === 'add-candidate' || node.mapping.status === 'verify') {
      issues.push(issue('METHOD_ONLY_NOT_STANDALONE', `Method-only or unresolved node cannot occupy a standalone slot: ${selection.methodNodeId}`, selection.methodNodeId, slot))
      continue
    }

    const entry = female111RoleByMethodNodeId.get(selection.methodNodeId)
    if (!entry) {
      issues.push(issue('UNKNOWN_ROLE_METADATA', `Female111 role metadata does not exist: ${selection.methodNodeId}`, selection.methodNodeId, slot))
      continue
    }
    if (seen.has(selection.methodNodeId)) {
      issues.push(issue('DUPLICATE_METHOD_NODE', `Method node used more than once: ${selection.methodNodeId}`, selection.methodNodeId, slot))
    }
    seen.add(selection.methodNodeId)
    if (!entry.allowedSessionRoles.includes(slot)) {
      issues.push(issue('SESSION_ROLE_NOT_ALLOWED', `${selection.methodNodeId} is not allowed in ${slot}`, selection.methodNodeId, slot))
    }

    const policy = policyByMethodNodeId.get(selection.methodNodeId)
    if (policy?.eligibility === 'B_CONDITIONAL' && !ready.has(selection.methodNodeId)) {
      issues.push(issue('CONDITIONAL_NOT_READY', `conditional Method node is not ready: ${selection.methodNodeId}`, selection.methodNodeId, slot))
    }

    if (selection.challengeRole === 'PRIMARY_CHALLENGE') primaryChallengeCount += 1
    if (entry.sessionDemand === 'HIGH') highDemandCount += 1
    if (entry.challengeComplexity === 'INTEGRATION') integrationComplexityCount += 1
    for (const capability of entry.capabilityRequirements) {
      capabilityCounts.set(capability, (capabilityCounts.get(capability) ?? 0) + 1)
    }
    totalDemand += female111DemandScores[entry.sessionDemand]
  }

  if (primaryChallengeCount !== 1) {
    issues.push(issue('PRIMARY_CHALLENGE_COUNT', `expected exactly one primary challenge, got ${primaryChallengeCount}`))
  }
  if (highDemandCount > 1) {
    issues.push(issue('HIGH_DEMAND_LIMIT', `expected at most one HIGH-demand item, got ${highDemandCount}`))
  }
  if (totalDemand > 6) {
    issues.push(issue('DEMAND_BUDGET_EXCEEDED', `default Block demand budget is 6, got ${totalDemand}`))
  }
  if (integrationComplexityCount > 1) {
    issues.push(issue('MULTIPLE_COMPLEXITY_CHALLENGES', `expected at most one integration-complexity challenge, got ${integrationComplexityCount}`))
  }
  const maxSharedCapabilityCount = context.maxSharedCapabilityCount ?? 3
  for (const [capability, count] of capabilityCounts) {
    if (count > maxSharedCapabilityCount) {
      issues.push(issue('LIMITING_CAPABILITY_OVERLOAD', `limiting capability ${capability} is used by ${count} slots; maximum is ${maxSharedCapabilityCount}`))
    }
  }
  return issues
}
