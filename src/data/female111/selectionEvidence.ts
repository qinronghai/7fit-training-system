import { ppFemaleProgrammingPolicy } from '../pp/femaleProgrammingPolicy'
import { female111Slots, type Female111ComposedSession, type Female111EvidenceCheckStatus, type Female111EvidenceReadinessStatus, type Female111PopulationOverlayIssue, type Female111SelectionEvidence, type Female111SelectionEvidenceBlock, type Female111SelectionEvidenceInput, type Female111SelectionEvidenceSlot, type Female111Slot, type Female111VenueIssue } from './types'

const policyByMethodNodeId = new Map(ppFemaleProgrammingPolicy.map((entry) => [entry.nodeId, entry]))

const issueMatches = (
  issue: { block?: 'A' | 'B'; slot?: Female111Slot; methodNodeId?: string },
  block: 'A' | 'B',
  slot: Female111Slot,
  methodNodeId: string,
) => issue.block === block && issue.slot === slot && issue.methodNodeId === methodNodeId

const populationStatus = (
  issues: readonly Female111PopulationOverlayIssue[],
  allowed: boolean,
): Female111EvidenceCheckStatus => {
  if (issues.some((issue) => issue.code === 'POPULATION_OVERLAY_VETO')) return 'VETOED'
  if (issues.length > 0 || !allowed) return 'REVIEW_REQUIRED'
  return 'CLEAR'
}

const venueStatus = (issues: readonly Female111VenueIssue[], allowed: boolean): Female111EvidenceCheckStatus => {
  if (issues.some((issue) => issue.code !== 'VENUE_METADATA_REQUIRED')) return 'VETOED'
  if (issues.length > 0 || !allowed) return 'REVIEW_REQUIRED'
  return 'CLEAR'
}

const readinessStatus = (
  methodNodeId: string,
  issues: readonly Female111PopulationOverlayIssue[],
  block: 'A' | 'B',
  slot: Female111Slot,
): Female111EvidenceReadinessStatus => {
  if (policyByMethodNodeId.get(methodNodeId)?.eligibility !== 'B_CONDITIONAL') return 'NOT_REQUIRED'
  return issues.some((issue) => issue.code === 'READINESS_NOT_CONFIRMED' && issueMatches(issue, block, slot, methodNodeId))
    ? 'NOT_CONFIRMED'
    : 'CONFIRMED'
}

const buildBlockEvidence = (
  block: 'A' | 'B',
  sessionBlock: Female111ComposedSession['blockA'],
  input: Female111SelectionEvidenceInput,
): Female111SelectionEvidenceBlock => {
  const recipe = sessionBlock.resolved.recipe
  const slots = {} as Record<Female111Slot, Female111SelectionEvidenceSlot>

  for (const slot of female111Slots) {
    const resolvedSlot = sessionBlock.resolved.slots[slot]
    const methodNodeId = resolvedSlot.methodNode.id
    const populationIssues = input.populationOverlay.issues.filter((issue) => issueMatches(issue, block, slot, methodNodeId))
    const venueIssues = input.venue.issues.filter((issue) => issueMatches(issue, block, slot, methodNodeId))
    const reasons = [
      ...populationIssues.map((issue) => issue.message),
      ...venueIssues.map((issue) => issue.message),
    ]

    slots[slot] = {
      block,
      slot,
      recipe,
      selection: resolvedSlot.selection,
      role: resolvedSlot.role,
      methodNode: resolvedSlot.methodNode,
      progression: resolvedSlot.progression,
      expectedFamily: slot === 'PRIMARY' ? recipe.primaryFamily : slot === 'SUPPORT' ? recipe.supportFamily : recipe.coreFamily,
      demand: resolvedSlot.role.sessionDemand,
      readiness: readinessStatus(methodNodeId, input.populationOverlay.issues, block, slot),
      population: populationStatus(populationIssues, input.populationOverlay.allowed),
      venue: venueStatus(venueIssues, input.venue.allowed),
      reasons,
    }
  }

  return { id: sessionBlock.id, recipe, slots }
}

export const buildFemale111SelectionEvidence = (
  session: Female111ComposedSession,
  input: Female111SelectionEvidenceInput,
): Female111SelectionEvidence => ({
  session,
  populationOverlay: input.populationOverlay,
  venue: input.venue,
  allowed: input.populationOverlay.allowed && input.venue.allowed,
  blocks: {
    A: buildBlockEvidence('A', session.blockA, input),
    B: buildBlockEvidence('B', session.blockB, input),
  },
  sessionReasons: [
    ...input.populationOverlay.issues.map((issue) => issue.message),
    ...input.venue.issues.map((issue) => issue.message),
  ],
})
