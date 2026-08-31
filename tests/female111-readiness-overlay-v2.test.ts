import { describe, expect, it } from 'vitest'
import {
  evaluateFemale111PopulationOverlay,
  evaluateFemale111Readiness,
  resolveFemale111Block,
  composeFemale111Session,
} from '../src/data/female111'

const sessionResult = composeFemale111Session({
  id: 'female111-readiness-session',
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

const allowAll = {
  'exp-box-squat': { action: 'ALLOW' as const, reason: '教练确认' },
  'exp-incline-plank': { action: 'ALLOW' as const, reason: '教练确认' },
  pp26: { action: 'ALLOW' as const, reason: '教练确认' },
  'exp-half-squat-low-locomotion': { action: 'ALLOW' as const, reason: '教练确认' },
  'exp-basic-hip-abduction': { action: 'ALLOW' as const, reason: '教练确认' },
  'exp-open-book': { action: 'ALLOW' as const, reason: '教练确认' },
}

describe('PP-F111 Stage 5 readiness and population overlay', () => {
  it('allows GREEN readiness without adjustments', () => {
    const result = evaluateFemale111Readiness({ status: 'GREEN' })
    expect(result.allowed).toBe(true)
    expect(result.action).toBe('ALLOW')
    expect(result.adjustments).toEqual([])
  })

  it('allows YELLOW readiness but requires lower training variables', () => {
    const result = evaluateFemale111Readiness({ status: 'YELLOW', fatigue: 'high', sleepQuality: 'poor', qualityDegraded: true })
    expect(result.allowed).toBe(true)
    expect(result.action).toBe('REGRESS')
    expect(result.adjustments).toEqual(expect.arrayContaining(['volume', 'demand', 'complexity', 'load']))
  })

  it('blocks RED readiness and distinguishes stop from referral signals', () => {
    expect(evaluateFemale111Readiness({ status: 'RED' }).action).toBe('STOP')
    const referral = evaluateFemale111Readiness({ status: 'RED', safetySignals: ['疼痛'] })
    expect(referral.allowed).toBe(false)
    expect(referral.action).toBe('REFER')
  })

  it('lets readiness veto a base-valid session before population selection is used', () => {
    expect(sessionResult.session).toBeDefined()
    const result = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'GENERAL',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: ['exp-half-squat-low-locomotion'],
      readiness: { status: 'RED', safetySignals: ['症状加重'] },
    })
    expect(result.allowed).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'READINESS_RED_BLOCK', action: 'REFER' }))
  })

  it('keeps a YELLOW overlay executable while exposing the regression decision', () => {
    expect(sessionResult.session).toBeDefined()
    const result = evaluateFemale111PopulationOverlay(sessionResult.session!, {
      population: 'POSTPARTUM',
      coachConfirmed: true,
      readinessConfirmedMethodNodeIds: ['exp-half-squat-low-locomotion'],
      readiness: { status: 'YELLOW', discomfort: true },
      decisionsByMethodNodeId: allowAll,
    })
    expect(result.allowed).toBe(true)
    expect(result.readiness?.action).toBe('REGRESS')
    expect(result.readiness?.adjustments).toContain('volume')
  })
})
