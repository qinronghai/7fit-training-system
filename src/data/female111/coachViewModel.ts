import type {
  Female111CoachBlockViewModel,
  Female111CoachSlotViewModel,
  Female111CoachViewModel,
  Female111SelectionEvidence,
  Female111SelectionEvidenceBlock,
  Female111Slot,
} from './types'

const buildBlock = (
  block: 'A' | 'B',
  source: Female111SelectionEvidenceBlock,
): Female111CoachBlockViewModel => {
  const slots = {} as Record<Female111Slot, Female111CoachSlotViewModel>

  for (const slot of ['PRIMARY', 'SUPPORT', 'CORE'] as const) {
    const sourceSlot = source.slots[slot]
    slots[slot] = {
      block,
      slot,
      methodNodeId: sourceSlot.methodNode.id,
      displayName: sourceSlot.methodNode.source?.sourceName ?? sourceSlot.methodNode.id,
      challengeRole: sourceSlot.selection.challengeRole,
      progressionFamily: sourceSlot.role.progressionFamily,
      expectedFamily: sourceSlot.expectedFamily,
      demand: sourceSlot.demand,
      readiness: sourceSlot.readiness,
      population: sourceSlot.population,
      venue: sourceSlot.venue,
      coachRationale: sourceSlot.role.coachRationale,
      reasons: sourceSlot.reasons,
      progression: sourceSlot.progression,
    }
  }

  return {
    id: source.id,
    recipe: {
      id: source.recipe.id,
      name: source.recipe.name,
      rationale: source.recipe.rationale,
    },
    slots,
  }
}

export const buildFemale111CoachViewModel = (
  evidence: Female111SelectionEvidence,
): Female111CoachViewModel => ({
  sessionId: evidence.session.id,
  allowed: evidence.allowed,
  coachConfirmation: evidence.populationOverlay.issues.some((issue) => issue.code === 'COACH_CONFIRMATION_REQUIRED')
    ? 'REQUIRED'
    : 'CONFIRMED',
  blocks: {
    A: buildBlock('A', evidence.blocks.A),
    B: buildBlock('B', evidence.blocks.B),
  },
  sessionReasons: evidence.sessionReasons,
})
