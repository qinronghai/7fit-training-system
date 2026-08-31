import { describe, expect, it } from 'vitest'
import {
  buildFemale111Session,
  resolveFemale111Block,
  validateFemale111Session,
} from '../src/data/female111'

const blockA = resolveFemale111Block({
  recipeId: 'F111-01',
  selection: {
    PRIMARY: { methodNodeId: 'pp01', challengeRole: 'PRIMARY_CHALLENGE' },
    SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
    CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
  },
})

const blockB = resolveFemale111Block(
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

describe('PP-F111 Stage 3 session engine', () => {
  it('builds a structured session from ranked legal Block candidates', () => {
    const result = buildFemale111Session({
      id: 'female111-session-engine',
      stage: 'L4',
      target: '下肢控制与移动',
      timeBudgetMinutes: 45,
      prep: [],
      blockA: [{ id: 'block-a', resolution: blockA, targetFit: 8, venueCost: 2 }],
      blockB: [{ id: 'block-b', resolution: blockB, targetFit: 7, venueCost: 1 }],
      recovery: { recordRequired: true },
    })
    expect(result.session?.blockA.id).toBe('block-a')
    expect(result.session?.blockB.id).toBe('block-b')
    expect(result.session?.stage).toBe('L4')
    expect(result.session?.target).toBe('下肢控制与移动')
    expect(result.candidates[0]?.score).toBeGreaterThan(0)
    expect(result.requiresCoachReview).toBe(false)
  })

  it('does not silently choose between tied legal candidates', () => {
    const result = buildFemale111Session({
      id: 'female111-session-tie',
      stage: 'L2',
      target: '控制',
      timeBudgetMinutes: 45,
      prep: [],
      blockA: [
        { id: 'block-a1', resolution: blockA, targetFit: 8, venueCost: 1 },
        { id: 'block-a2', resolution: blockA, targetFit: 8, venueCost: 1 },
      ],
      blockB: [{ id: 'block-b', resolution: blockB, targetFit: 7, venueCost: 1 }],
      recovery: { recordRequired: true },
    })
    expect(result.session).toBeUndefined()
    expect(result.requiresCoachReview).toBe(true)
    expect(result.issues.map((issue) => issue.code)).toContain('CANDIDATES_REQUIRE_REVIEW')
  })

  it('rejects repeated primary families and an over-budget session', () => {
    const repeated = {
      id: 'block-b-repeat',
      resolution: blockA,
    }
    const composed = buildFemale111Session({
      id: 'female111-session-invalid-pair',
      stage: 'L3',
      target: '下肢力量',
      timeBudgetMinutes: 20,
      prep: [],
      blockA: [{ id: 'block-a', resolution: blockA, targetFit: 8, venueCost: 0 }],
      blockB: [{ ...repeated, targetFit: 7, venueCost: 0 }],
      recovery: { recordRequired: true },
    })
    expect(composed.session).toBeUndefined()
    expect(composed.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'REPEATED_PRIMARY_FAMILY',
      'SESSION_TIME_BUDGET_EXCEEDED',
    ]))
  })

  it('keeps an accessory outside the two-block structure', () => {
    const result = buildFemale111Session({
      id: 'female111-session-accessory',
      stage: 'L3',
      target: '全身训练',
      timeBudgetMinutes: 50,
      prep: [],
      blockA: [{ id: 'block-a', resolution: blockA, targetFit: 8, venueCost: 0 }],
      blockB: [{ id: 'block-b', resolution: blockB, targetFit: 7, venueCost: 0 }],
      accessory: [{ methodNodeId: 'pp10', purpose: '臀部补量' }],
      recovery: { recordRequired: true },
    })
    expect(result.session?.accessory).toHaveLength(1)
    expect(result.session?.blockA.resolved.slots).not.toHaveProperty('ACCESSORY')
  })

  it('keeps direct session validation available for composed sessions', () => {
    const result = buildFemale111Session({
      id: 'female111-session-direct-validation',
      stage: 'L4',
      target: '移动',
      timeBudgetMinutes: 45,
      prep: [],
      blockA: [{ id: 'block-a', resolution: blockA, targetFit: 8, venueCost: 0 }],
      blockB: [{ id: 'block-b', resolution: blockB, targetFit: 7, venueCost: 0 }],
      recovery: { recordRequired: true },
    })
    expect(result.session).toBeDefined()
    expect(validateFemale111Session(result.session!)).toEqual([])
  })
})
