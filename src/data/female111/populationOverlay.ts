import { ppFemaleProgrammingPolicy } from '../pp/femaleProgrammingPolicy'
import { female111Slots, type Female111ComposedSession, type Female111PopulationOverlayInput, type Female111PopulationOverlayIssue, type Female111PopulationOverlayResult } from './types'
import { evaluateFemale111Readiness } from './readiness'

const policyByMethodNodeId = new Map(ppFemaleProgrammingPolicy.map((entry) => [entry.nodeId, entry]))

const readinessIds = (input: Female111PopulationOverlayInput): ReadonlySet<string> =>
  input.readinessConfirmedMethodNodeIds instanceof Set
    ? input.readinessConfirmedMethodNodeIds
    : new Set(input.readinessConfirmedMethodNodeIds ?? [])

export const evaluateFemale111PopulationOverlay = (
  session: Female111ComposedSession,
  input: Female111PopulationOverlayInput,
): Female111PopulationOverlayResult => {
  const issues: Female111PopulationOverlayIssue[] = []
  const confirmedReadiness = readinessIds(input)
  const readiness = input.readiness ? evaluateFemale111Readiness(input.readiness) : undefined

  if (!input.coachConfirmed) {
    issues.push({
      code: 'COACH_CONFIRMATION_REQUIRED',
      message: `Coach confirmation is required before evaluating Female111 Session: ${session.id}`,
    })
  }

  if (readiness && !readiness.allowed) {
    issues.push({
      code: 'READINESS_RED_BLOCK',
      message: readiness.reasons.join(' '),
      action: readiness.action,
      reason: readiness.reasons.join(' '),
    })
  }

  const blocks = [
    { label: 'A' as const, block: session.blockA },
    { label: 'B' as const, block: session.blockB },
  ]

  for (const { label, block } of blocks) {
    for (const slot of female111Slots) {
      const methodNodeId = block.resolved.slots[slot].methodNode.id
      const policy = policyByMethodNodeId.get(methodNodeId)

      if (policy?.eligibility === 'B_CONDITIONAL' && !confirmedReadiness.has(methodNodeId)) {
        issues.push({
          code: 'READINESS_NOT_CONFIRMED',
          message: `conditional readiness is not confirmed for ${methodNodeId}`,
          block: label,
          slot,
          methodNodeId,
        })
      }

      if (input.population === 'GENERAL') continue

      const decision = input.decisionsByMethodNodeId?.[methodNodeId]
      if (!decision) {
        issues.push({
          code: 'POPULATION_DECISION_REQUIRED',
          message: `explicit ${input.population} overlay decision is required for ${methodNodeId}`,
          block: label,
          slot,
          methodNodeId,
        })
        continue
      }
      if (decision.action !== 'ALLOW') {
        issues.push({
          code: 'POPULATION_OVERLAY_VETO',
          message: `${input.population} overlay vetoes ${methodNodeId} with ${decision.action}`,
          block: label,
          slot,
          methodNodeId,
          action: decision.action,
          reason: decision.reason,
        })
      }
    }
  }

  return readiness
    ? { allowed: issues.length === 0, issues, readiness }
    : { allowed: issues.length === 0, issues }
}
