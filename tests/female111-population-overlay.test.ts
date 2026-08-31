import { describe, expect, it } from 'vitest'
import {
  composeFemale111Session,
  evaluateFemale111PopulationOverlay,
  resolveFemale111Block,
} from '../src/data/female111'

const blockAResolution = resolveFemale111Block({
  recipeId: 'F111-01',
  selection: {
    PRIMARY: { methodNodeId: 'exp-box-squat', challengeRole: 'PRIMARY_CHALLENGE' },
    SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
    CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
  },
})

const blockBResolution = resolveFemale111Block(
  {
    recipeId: 'F111-07',
    selection: {
      PRIMARY: { methodNodeId: 'exp-half-squat-low-locomotion', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { methodNodeId: 'exp-basic-hip-abduction', challengeRole: 'SUPPORTING' },
      CORE: { methodNodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
    },
  },
  { readyConditionalMethodNodeIds: ['exp-half-squat-low-locomotion'] },
)

const sessionResult = composeFemale111Session({
  id: 'female111-session-overlay',
  prep: [],
  blockA: { id: 'block-a', resolution: blockAResolution },
  blockB: { id: 'block-b', resolution: blockBResolution },
  recovery: { recordRequired: true },
})

const readinessConfirmed = ['exp-half-squat-low-locomotion']

const allowAll = {
  'exp-box-squat': { action: 'ALLOW' as const, reason: 'coach-confirmed base selection' },
  'exp-incline-plank': { action: 'ALLOW' as const, reason: 'coach-confirmed support selection' },
  pp26: { action: 'ALLOW' as const, reason: 'coach-confirmed core selection' },
  'exp-half-squat-low-locomotion': { action: 'ALLOW' as const, reason: 'coach-confirmed locomotion selection' },
  'exp-basic-hip-abduction': { action: 'ALLOW' as const, reason: 'coach-confirmed support selection' },
  'exp-open-book': { action: 'ALLOW' as const, reason: 'coach-confirmed core selection' },
}

describe('PP-F111-C3 readiness and population overlay', () => {
  it('allows a base session only with coach confirmation and explicit conditional readiness', () => {
    expect(sessionResult.session).toBeDefined()

    const result = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'GENERAL',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: readinessConfirmed,
    })

    expect(result).toEqual({ allowed: true, issues: [] })
  })

  it('fails closed when coach confirmation or conditional readiness is missing', () => {
    const noCoach = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'GENERAL',
      coachConfirmed: false,
      readinessConfirmedMethodNodeIds: readinessConfirmed,
    })
    expect(noCoach.allowed).toBe(false)
    expect(noCoach.issues.map((issue) => issue.code)).toContain('COACH_CONFIRMATION_REQUIRED')

    const noReadiness = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'GENERAL',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: [],
    })
    expect(noReadiness.allowed).toBe(false)
    expect(noReadiness.issues).toContainEqual(expect.objectContaining({
      code: 'READINESS_NOT_CONFIRMED',
      methodNodeId: 'exp-half-squat-low-locomotion',
      block: 'B',
      slot: 'PRIMARY',
    }))
  })

  it('requires explicit per-node overlay decisions for pregnancy and postpartum populations', () => {
    const missingDecision = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'POSTPARTUM',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: readinessConfirmed,
    })
    expect(missingDecision.allowed).toBe(false)
    expect(missingDecision.issues.map((issue) => issue.code)).toContain('POPULATION_DECISION_REQUIRED')

    const allowed = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'PREGNANCY',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: readinessConfirmed,
      decisionsByMethodNodeId: allowAll,
    })
    expect(allowed).toEqual({ allowed: true, issues: [] })
  })

  it('vetoes a base-valid selection when the explicit overlay action is not ALLOW', () => {
    const result = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'POSTPARTUM',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: readinessConfirmed,
      decisionsByMethodNodeId: {
        ...allowAll,
        'exp-half-squat-low-locomotion': {
          action: 'REFER',
          reason: 'professional review required before this selection',
        },
      },
    })

    expect(result.allowed).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'POPULATION_OVERLAY_VETO',
      methodNodeId: 'exp-half-squat-low-locomotion',
      block: 'B',
      slot: 'PRIMARY',
      action: 'REFER',
    }))
  })
})
