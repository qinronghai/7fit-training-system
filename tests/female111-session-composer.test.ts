import { describe, expect, it } from 'vitest'
import {
  composeFemale111Session,
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

describe('PP-F111-C2 Session Composer', () => {
  it('assembles two resolved Blocks without flattening their identities', () => {
    const prep = [{ methodNodeId: 'exp-supported-90-90', kind: 'PREP' as const }]
    const accessory = [{ methodNodeId: 'exp-basic-hip-abduction', purpose: 'supplemental volume' }]
    const input = {
      id: 'female111-session-01',
      prep,
      blockA: { id: 'block-a', resolution: blockAResolution },
      blockB: { id: 'block-b', resolution: blockBResolution },
      accessory,
      recovery: { recordRequired: true },
    }

    const result = composeFemale111Session(input)

    expect(result.issues).toEqual([])
    expect(result.session).toBeDefined()
    expect(result.session!.id).toBe(input.id)
    expect(result.session!.prep).toBe(prep)
    expect(result.session!.accessory).toBe(accessory)
    expect(result.session!.recovery).toBe(input.recovery)
    expect(result.session!.blockA).not.toBe(result.session!.blockB)
    expect(result.session!.blockA.id).toBe('block-a')
    expect(result.session!.blockB.id).toBe('block-b')
    expect(result.session!.blockA.resolved).toBe(blockAResolution.resolved)
    expect(result.session!.blockB.resolved).toBe(blockBResolution.resolved)
  })

  it('rejects duplicate Block IDs while preserving A/B as separate input concerns', () => {
    const result = composeFemale111Session({
      id: 'female111-session-duplicate',
      prep: [],
      blockA: { id: 'same-id', resolution: blockAResolution },
      blockB: { id: 'same-id', resolution: blockBResolution },
      recovery: { recordRequired: false },
    })

    expect(result.session).toBeUndefined()
    expect(result.issues.map((issue) => issue.code)).toEqual(['DUPLICATE_BLOCK_ID'])
  })

  it('fails closed when either C1 resolution contains issues', () => {
    const invalidBlock = resolveFemale111Block({
      recipeId: 'F111-01',
      selection: {
        PRIMARY: { methodNodeId: 'pp02', challengeRole: 'PRIMARY_CHALLENGE' },
        SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
        CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
      },
    })

    const result = composeFemale111Session({
      id: 'female111-session-invalid',
      prep: [],
      blockA: { id: 'block-a', resolution: invalidBlock },
      blockB: { id: 'block-b', resolution: blockBResolution },
      recovery: { recordRequired: false },
    })

    expect(result.session).toBeUndefined()
    expect(result.issues.map((issue) => issue.code)).toEqual(['BLOCK_A_INVALID'])
    expect(result.issues[0].resolutionIssues?.map((issue) => issue.code)).toContain('RECIPE_FAMILY_MISMATCH')
  })
})
