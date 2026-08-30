import { describe, expect, it } from 'vitest'
import {
  buildFemale111SelectionEvidence,
  composeFemale111Session,
  evaluateFemale111PopulationOverlay,
  evaluateFemale111Venue,
  resolveFemale111Block,
} from '../src/data/female111'

const sessionResult = composeFemale111Session({
  id: 'female111-session-evidence',
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

const allowedOverlay = evaluateFemale111PopulationOverlay(sessionResult.session!, {
  population: 'GENERAL',
  coachConfirmed: true,
  readinessConfirmedMethodNodeIds: ['exp-half-squat-low-locomotion'],
})

const allowedVenue = evaluateFemale111Venue(sessionResult.session!, {
  venue: {
    venueConfirmed: true,
    availableEquipment: ['box', 'mini-band'],
    availableTrainingZones: ['floor'],
    nearbyMatSpaceAvailable: true,
    maxSetupCost: 3,
    maxTransitionCost: 2,
    unavailableContentionGroups: [],
  },
  requirementsByMethodNodeId: {
    'exp-box-squat': { equipment: ['box'], trainingZone: 'floor', setupCost: 1, transitionCost: 1 },
    'exp-incline-plank': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
    pp26: { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
    'exp-half-squat-low-locomotion': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 1 },
    'exp-basic-hip-abduction': { equipment: ['mini-band'], trainingZone: 'floor', setupCost: 1, transitionCost: 0 },
    'exp-open-book': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  },
})

describe('PP-F111-C5 Coach-facing Selection Evidence', () => {
  it('summarizes clear checks while preserving exact session, recipe, role, and Method references', () => {
    expect(sessionResult.session).toBeDefined()

    const evidence = buildFemale111SelectionEvidence(sessionResult.session!, {
      populationOverlay: allowedOverlay,
      venue: allowedVenue,
    })

    expect(evidence.allowed).toBe(true)
    expect(evidence.session).toBe(sessionResult.session)
    expect(evidence.populationOverlay).toBe(allowedOverlay)
    expect(evidence.venue).toBe(allowedVenue)
    expect(evidence.blocks.A.id).toBe('block-a')
    expect(evidence.blocks.B.id).toBe('block-b')
    expect(evidence.blocks.A.recipe).toBe(sessionResult.session!.blockA.resolved.recipe)
    expect(evidence.blocks.A.slots.PRIMARY.methodNode).toBe(sessionResult.session!.blockA.resolved.slots.PRIMARY.methodNode)
    expect(evidence.blocks.A.slots.PRIMARY.role).toBe(sessionResult.session!.blockA.resolved.slots.PRIMARY.role)
    expect(evidence.blocks.A.slots.PRIMARY.selection).toBe(sessionResult.session!.blockA.resolved.slots.PRIMARY.selection)
    expect(evidence.blocks.A.slots.PRIMARY.readiness).toBe('NOT_REQUIRED')
    expect(evidence.blocks.B.slots.PRIMARY.readiness).toBe('CONFIRMED')
    expect(evidence.blocks.A.slots.PRIMARY.population).toBe('CLEAR')
    expect(evidence.blocks.A.slots.PRIMARY.venue).toBe('CLEAR')
    expect(evidence).not.toHaveProperty('template')
  })

  it('returns coach-readable reasons and blocks the session when either check fails', () => {
    const blockedOverlay = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'POSTPARTUM',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: ['exp-half-squat-low-locomotion'],
      decisionsByMethodNodeId: {
        'exp-box-squat': { action: 'ALLOW', reason: 'approved' },
        'exp-incline-plank': { action: 'ALLOW', reason: 'approved' },
        pp26: { action: 'ALLOW', reason: 'approved' },
        'exp-half-squat-low-locomotion': { action: 'REFER', reason: 'professional review required' },
        'exp-basic-hip-abduction': { action: 'ALLOW', reason: 'approved' },
        'exp-open-book': { action: 'ALLOW', reason: 'approved' },
      },
    })
    const blockedVenue = evaluateFemale111Venue(sessionResult.session!, {
      venue: {
        venueConfirmed: true,
        availableEquipment: [],
        availableTrainingZones: ['floor'],
        nearbyMatSpaceAvailable: true,
        maxSetupCost: 3,
        maxTransitionCost: 2,
        unavailableContentionGroups: [],
      },
      requirementsByMethodNodeId: {
        'exp-box-squat': { equipment: ['box'], trainingZone: 'floor', setupCost: 1, transitionCost: 1 },
        'exp-incline-plank': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
        pp26: { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
        'exp-half-squat-low-locomotion': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 1 },
        'exp-basic-hip-abduction': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
        'exp-open-book': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
      },
    })

    const evidence = buildFemale111SelectionEvidence(sessionResult.session!, {
      populationOverlay: blockedOverlay,
      venue: blockedVenue,
    })

    expect(evidence.allowed).toBe(false)
    expect(evidence.populationOverlay).toBe(blockedOverlay)
    expect(evidence.venue).toBe(blockedVenue)
    expect(evidence.blocks.B.slots.PRIMARY.population).toBe('VETOED')
    expect(evidence.blocks.A.slots.PRIMARY.venue).toBe('VETOED')
    expect(evidence.blocks.B.slots.PRIMARY.reasons).toContain('POSTPARTUM overlay vetoes exp-half-squat-low-locomotion with REFER')
    expect(evidence.sessionReasons).toEqual(expect.arrayContaining([
      'POSTPARTUM overlay vetoes exp-half-squat-low-locomotion with REFER',
      'exp-box-squat requires unavailable equipment: box',
    ]))
  })
})
