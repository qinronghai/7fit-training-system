import { female111Slots, type Female111ComposedSession, type Female111VenueEvaluationInput, type Female111VenueEvaluationResult, type Female111VenueIssue } from './types'

export const evaluateFemale111Venue = (
  session: Female111ComposedSession,
  input: Female111VenueEvaluationInput,
): Female111VenueEvaluationResult => {
  const issues: Female111VenueIssue[] = []
  const availableEquipment = new Set(input.venue.availableEquipment)
  const availableZones = new Set(input.venue.availableTrainingZones)
  const availableFloors = new Set(input.venue.availableFloors ?? [])
  const nearbyAvailableEquipment = new Set(input.venue.nearbyAvailableEquipment ?? input.venue.availableEquipment)
  const unavailableContentionGroups = new Set(input.venue.unavailableContentionGroups)
  let setupCost = 0
  let transitionCost = 0
  let setupBudgetOwner: { block: 'A' | 'B'; slot: typeof female111Slots[number]; methodNodeId: string } | undefined
  let transitionBudgetOwner: { block: 'A' | 'B'; slot: typeof female111Slots[number]; methodNodeId: string } | undefined

  if (!input.venue.venueConfirmed) {
    issues.push({
      code: 'VENUE_CONFIRMATION_REQUIRED',
      message: `Venue profile must be explicitly confirmed for Female111 Session: ${session.id}`,
    })
  }

  for (const { label, block } of [
    { label: 'A' as const, block: session.blockA },
    { label: 'B' as const, block: session.blockB },
  ]) {
    for (const slot of female111Slots) {
      const methodNodeId = block.resolved.slots[slot].methodNode.id
      const requirement = input.requirementsByMethodNodeId[methodNodeId]
      if (!requirement) {
        issues.push({
          code: 'VENUE_METADATA_REQUIRED',
          message: `explicit venue requirement is missing for ${methodNodeId}`,
          block: label,
          slot,
          methodNodeId,
        })
        continue
      }

      for (const equipment of requirement.equipment) {
        if (!availableEquipment.has(equipment)) {
          issues.push({
            code: 'EQUIPMENT_UNAVAILABLE',
            message: `${methodNodeId} requires unavailable equipment: ${equipment}`,
            block: label,
            slot,
            methodNodeId,
            equipment,
          })
        }
      }

      if (!availableZones.has(requirement.trainingZone)) {
        issues.push({
          code: 'TRAINING_ZONE_UNAVAILABLE',
          message: `${methodNodeId} requires unavailable training zone: ${requirement.trainingZone}`,
          block: label,
          slot,
          methodNodeId,
          trainingZone: requirement.trainingZone,
        })
      }

      if (requirement.floor && input.venue.availableFloors && !availableFloors.has(requirement.floor)) {
        issues.push({
          code: 'FLOOR_UNAVAILABLE',
          message: `${methodNodeId} requires unavailable floor: ${requirement.floor}`,
          block: label,
          slot,
          methodNodeId,
        })
      }

      for (const equipment of requirement.nearbyEquipment ?? []) {
        if (!nearbyAvailableEquipment.has(equipment)) {
          issues.push({
            code: 'NEARBY_EQUIPMENT_UNAVAILABLE',
            message: `${methodNodeId} requires nearby equipment: ${equipment}`,
            block: label,
            slot,
            methodNodeId,
            equipment,
          })
        }
      }

      if (requirement.requiresNearbyMatSpace && !input.venue.nearbyMatSpaceAvailable) {
        issues.push({
          code: 'MAT_SPACE_UNAVAILABLE',
          message: `${methodNodeId} requires nearby mat space`,
          block: label,
          slot,
          methodNodeId,
        })
      }

      if (requirement.contentionGroup && unavailableContentionGroups.has(requirement.contentionGroup)) {
        issues.push({
          code: 'EQUIPMENT_CONTENTION',
          message: `${methodNodeId} requires unavailable contention group: ${requirement.contentionGroup}`,
          block: label,
          slot,
          methodNodeId,
          contentionGroup: requirement.contentionGroup,
        })
      }

      setupCost += requirement.setupCost
      transitionCost += requirement.transitionCost
      const owner = { block: label, slot, methodNodeId }
      if (!setupBudgetOwner && setupCost > input.venue.maxSetupCost) setupBudgetOwner = owner
      if (!transitionBudgetOwner && transitionCost > input.venue.maxTransitionCost) transitionBudgetOwner = owner
    }
  }

  if (setupBudgetOwner) {
    issues.push({
      code: 'SETUP_BUDGET_EXCEEDED',
      message: `Female111 Session setup cost ${setupCost} exceeds venue budget ${input.venue.maxSetupCost}`,
      ...setupBudgetOwner,
    })
  }
  if (transitionBudgetOwner) {
    issues.push({
      code: 'TRANSITION_BUDGET_EXCEEDED',
      message: `Female111 Session transition cost ${transitionCost} exceeds venue budget ${input.venue.maxTransitionCost}`,
      ...transitionBudgetOwner,
    })
  }

  return { allowed: issues.length === 0, issues }
}

export const getFemale111VenueRouteSummary = (
  session: Female111ComposedSession,
  input: Female111VenueEvaluationInput,
): string => {
  const floors = new Set<string>()
  const zones = new Set<string>()
  let setupCost = 0
  let transitionCost = 0
  for (const block of [session.blockA, session.blockB]) {
    for (const slot of female111Slots) {
      const requirement = input.requirementsByMethodNodeId[block.resolved.slots[slot].methodNode.id]
      if (!requirement) continue
      if (requirement.floor) floors.add(requirement.floor)
      zones.add(requirement.trainingZone)
      setupCost += requirement.setupCost
      transitionCost += requirement.transitionCost
    }
  }
  return `训练动线：${[...floors].join('、') || '楼层待确认'} · ${[...zones].join('、') || '区域待确认'}；布置成本 ${setupCost}，转换成本 ${transitionCost}。`
}
