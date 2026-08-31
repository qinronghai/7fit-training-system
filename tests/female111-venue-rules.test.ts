import { describe, expect, it } from 'vitest'
import {
  composeFemale111Session,
  evaluateFemale111Venue,
  resolveFemale111Block,
} from '../src/data/female111'

const sessionResult = composeFemale111Session({
  id: 'female111-session-venue',
  prep: [],
  blockA: {
    id: 'block-a',
    resolution: resolveFemale111Block({
      recipeId: 'F111-01',
      selection: {
        PRIMARY: { methodNodeId: 'exp-box-squat', challengeRole: 'PRIMARY_CHALLENGE' },
        SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
        CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
      },
    }),
  },
  blockB: {
    id: 'block-b',
    resolution: resolveFemale111Block(
      {
        recipeId: 'F111-07',
        selection: {
          PRIMARY: { methodNodeId: 'exp-half-squat-low-locomotion', challengeRole: 'PRIMARY_CHALLENGE' },
          SUPPORT: { methodNodeId: 'exp-basic-hip-abduction', challengeRole: 'SUPPORTING' },
          CORE: { methodNodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
        },
      },
      { readyConditionalMethodNodeIds: ['exp-half-squat-low-locomotion'] },
    ),
  },
  recovery: { recordRequired: true },
})

const requirements = {
  'exp-box-squat': { equipment: ['box'], trainingZone: 'floor', setupCost: 1, transitionCost: 1 },
  'exp-incline-plank': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  pp26: { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  'exp-half-squat-low-locomotion': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 1 },
  'exp-basic-hip-abduction': { equipment: ['mini-band'], trainingZone: 'floor', setupCost: 1, transitionCost: 0 },
  'exp-open-book': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0, requiresNearbyMatSpace: true },
}

const venue = {
  venueConfirmed: true,
  availableEquipment: ['box', 'mini-band'],
  availableTrainingZones: ['floor'],
  nearbyMatSpaceAvailable: true,
  maxSetupCost: 3,
  maxTransitionCost: 2,
  unavailableContentionGroups: [],
}

describe('PP-F111-C4 Venue Rules', () => {
  it('allows a composed Session when explicit requirements fit the venue profile', () => {
    expect(sessionResult.session).toBeDefined()

    const result = evaluateFemale111Venue(sessionResult.session!, { venue, requirementsByMethodNodeId: requirements })

    expect(result).toEqual({ allowed: true, issues: [] })
  })

  it('fails closed when a selected node has no explicit venue metadata', () => {
    const { 'exp-open-book': _openBook, ...incompleteRequirements } = requirements
    const result = evaluateFemale111Venue(sessionResult.session!, {
      venue,
      requirementsByMethodNodeId: incompleteRequirements,
    })

    expect(result.allowed).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'VENUE_METADATA_REQUIRED',
      methodNodeId: 'exp-open-book',
      block: 'B',
      slot: 'CORE',
    }))
  })

  it('rejects unavailable equipment, zones, mat space, and explicit contention', () => {
    const result = evaluateFemale111Venue(sessionResult.session!, {
      venue: {
        ...venue,
        availableEquipment: ['mini-band'],
        availableTrainingZones: ['strength-zone'],
        nearbyMatSpaceAvailable: false,
        unavailableContentionGroups: ['box-station'],
      },
      requirementsByMethodNodeId: {
        ...requirements,
        'exp-box-squat': { ...requirements['exp-box-squat'], contentionGroup: 'box-station' },
      },
    })

    expect(result.allowed).toBe(false)
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'EQUIPMENT_UNAVAILABLE',
      'TRAINING_ZONE_UNAVAILABLE',
      'MAT_SPACE_UNAVAILABLE',
      'EQUIPMENT_CONTENTION',
    ]))
    expect(result.issues.some((issue) => issue.methodNodeId === 'exp-box-squat')).toBe(true)
  })

  it('rejects a venue budget overrun without substituting another exercise', () => {
    const result = evaluateFemale111Venue(sessionResult.session!, {
      venue: { ...venue, maxSetupCost: 0, maxTransitionCost: 0 },
      requirementsByMethodNodeId: requirements,
    })

    expect(result.allowed).toBe(false)
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'SETUP_BUDGET_EXCEEDED',
      'TRANSITION_BUDGET_EXCEEDED',
    ]))
    expect(result.issues.some((issue) => issue.methodNodeId === 'exp-box-squat')).toBe(true)
  })

  it('requires explicit venue confirmation', () => {
    const result = evaluateFemale111Venue(sessionResult.session!, {
      venue: { ...venue, venueConfirmed: false },
      requirementsByMethodNodeId: requirements,
    })

    expect(result.allowed).toBe(false)
    expect(result.issues.map((issue) => issue.code)).toContain('VENUE_CONFIRMATION_REQUIRED')
  })
})
