import { describe, expect, it } from 'vitest'
import {
  composeFemale111Session,
  evaluateFemale111Venue,
  getFemale111VenueRouteSummary,
  resolveFemale111Block,
} from '../src/data/female111'

const sessionResult = composeFemale111Session({
  id: 'female111-session-venue-v2',
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
  'exp-box-squat': { equipment: ['box'], trainingZone: 'floor', floor: 'north', nearbyEquipment: ['mat'], setupCost: 1, transitionCost: 1 },
  'exp-incline-plank': { equipment: [], trainingZone: 'floor', floor: 'north', setupCost: 0, transitionCost: 0 },
  pp26: { equipment: [], trainingZone: 'floor', floor: 'north', setupCost: 0, transitionCost: 0 },
  'exp-half-squat-low-locomotion': { equipment: [], trainingZone: 'floor', floor: 'north', setupCost: 0, transitionCost: 1 },
  'exp-basic-hip-abduction': { equipment: ['mini-band'], trainingZone: 'floor', floor: 'north', setupCost: 1, transitionCost: 0 },
  'exp-open-book': { equipment: [], trainingZone: 'floor', floor: 'north', setupCost: 0, transitionCost: 0, requiresNearbyMatSpace: true },
}

const venue = {
  venueConfirmed: true,
  availableEquipment: ['box', 'mini-band'],
  availableTrainingZones: ['floor'],
  availableFloors: ['north'],
  nearbyAvailableEquipment: ['mat'],
  nearbyMatSpaceAvailable: true,
  maxSetupCost: 3,
  maxTransitionCost: 2,
  unavailableContentionGroups: [],
}

describe('PP-F111 Stage 4 venue and training-flow engine', () => {
  it('accepts explicit floor and nearby-equipment compatibility', () => {
    expect(sessionResult.session).toBeDefined()
    const result = evaluateFemale111Venue(sessionResult.session!, { venue, requirementsByMethodNodeId: requirements })
    expect(result).toEqual({ allowed: true, issues: [] })
    expect(getFemale111VenueRouteSummary(sessionResult.session!, { venue, requirementsByMethodNodeId: requirements }))
      .toContain('north')
  })

  it('fails closed when floor or nearby equipment is unavailable', () => {
    const result = evaluateFemale111Venue(sessionResult.session!, {
      venue: { ...venue, availableFloors: ['south'], nearbyAvailableEquipment: [] },
      requirementsByMethodNodeId: requirements,
    })
    expect(result.allowed).toBe(false)
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'FLOOR_UNAVAILABLE',
      'NEARBY_EQUIPMENT_UNAVAILABLE',
    ]))
  })

  it('requires explicit venue metadata before applying route assumptions', () => {
    const { 'exp-box-squat': _box, ...incomplete } = requirements
    const result = evaluateFemale111Venue(sessionResult.session!, {
      venue,
      requirementsByMethodNodeId: incomplete,
    })
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'VENUE_METADATA_REQUIRED',
      methodNodeId: 'exp-box-squat',
    }))
  })
})
