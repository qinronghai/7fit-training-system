import { describe, expect, it } from 'vitest'
import {
  female111RecipeFamilies,
  female111RoleEntries,
  female111Slots,
  getFemale111RoleEntry,
  validateFemale111Session,
  validateFemale111Block,
} from '../src/data/female111'
import { ppMethodNodeById } from '../src/data/pp/methodNodes'

const validBlock = {
  PRIMARY: { methodNodeId: 'exp-box-squat', challengeRole: 'PRIMARY_CHALLENGE' as const },
  SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' as const },
  CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' as const },
}

describe('PP-F111 Female111 domain contract', () => {
  it('defines the new PRIMARY/SUPPORT/CORE slot vocabulary', () => {
    expect(female111Slots).toEqual(['PRIMARY', 'SUPPORT', 'CORE'])
    expect(Object.keys(validBlock)).toEqual(['PRIMARY', 'SUPPORT', 'CORE'])
  })

  it('keeps role metadata separate from Method and prescription identity', () => {
    for (const entry of female111RoleEntries) {
      expect(entry).toHaveProperty('methodNodeId')
      expect(entry).toHaveProperty('defaultSessionRole')
      expect(entry).toHaveProperty('allowedSessionRoles')
      expect(entry).toHaveProperty('progressionFamily')
      expect(entry).toHaveProperty('sessionDemand')
      expect(entry).not.toHaveProperty('progressionLevel')
      expect(entry).not.toHaveProperty('breathing')
      expect(entry).not.toHaveProperty('mapping')
      expect(entry).not.toHaveProperty('sets')
      expect(entry).not.toHaveProperty('reps')
    }
  })

  it('contains the 45 standalone executable role records from the B audit', () => {
    expect(female111RoleEntries).toHaveLength(45)
    expect(new Set(female111RoleEntries.map((entry) => entry.methodNodeId)).size).toBe(45)
    expect(female111RoleEntries.every((entry) => entry.standaloneStatus === 'STANDALONE')).toBe(true)

    for (const entry of female111RoleEntries) {
      const node = ppMethodNodeById.get(entry.methodNodeId)
      expect(node).toBeDefined()
      expect(['mapped', 'variant']).toContain(node!.mapping.status)
      expect(entry.allowedSessionRoles).toContain(entry.defaultSessionRole)
    }

    expect(getFemale111RoleEntry('pp17')).toBeUndefined()
    expect(getFemale111RoleEntry('pp21')).toBeUndefined()
    expect(getFemale111RoleEntry('pp05')!.allowedSessionRoles).toEqual(['SUPPORT'])
    expect(getFemale111RoleEntry('pp09')!.allowedSessionRoles).toEqual(['SUPPORT'])
  })

  it('keeps Recipe as family/rationale metadata rather than a fixed exercise triple', () => {
    expect(female111RecipeFamilies).toHaveLength(8)
    expect(new Set(female111RecipeFamilies.map((recipe) => recipe.id)).size).toBe(8)
    for (const recipe of female111RecipeFamilies) {
      expect(recipe.primaryFamily).toBeTruthy()
      expect(recipe.supportFamily).toBeTruthy()
      expect(recipe.coreFamily).toBeTruthy()
      expect(recipe.rationale).toBeTruthy()
      expect(recipe).not.toHaveProperty('selection')
      expect(recipe).not.toHaveProperty('exerciseIds')
    }
  })

  it('accepts a legal block with one primary challenge and demand budget within six', () => {
    expect(validateFemale111Block(validBlock)).toEqual([])
  })

  it('rejects duplicate nodes, method-only nodes, and disallowed roles', () => {
    const duplicate = validateFemale111Block({
      PRIMARY: validBlock.PRIMARY,
      SUPPORT: { methodNodeId: 'exp-box-squat', challengeRole: 'SUPPORTING' },
      CORE: validBlock.CORE,
    })
    expect(duplicate.map((issue) => issue.code)).toContain('DUPLICATE_METHOD_NODE')

    const methodOnly = validateFemale111Block({
      PRIMARY: { methodNodeId: 'pp17', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: validBlock.SUPPORT,
      CORE: validBlock.CORE,
    })
    expect(methodOnly.map((issue) => issue.code)).toContain('METHOD_ONLY_NOT_STANDALONE')

    const wrongRole = validateFemale111Block({
      PRIMARY: { methodNodeId: 'exp-incline-plank', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: validBlock.SUPPORT,
      CORE: validBlock.CORE,
    })
    expect(wrongRole.map((issue) => issue.code)).toContain('SESSION_ROLE_NOT_ALLOWED')
  })

  it('requires conditional readiness before using a conditional Method node', () => {
    const issues = validateFemale111Block({
      PRIMARY: { methodNodeId: 'exp-single-leg-glute-bridge', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: validBlock.SUPPORT,
      CORE: validBlock.CORE,
    })
    expect(issues.map((issue) => issue.code)).toContain('CONDITIONAL_NOT_READY')
    expect(validateFemale111Block({
      PRIMARY: { methodNodeId: 'exp-single-leg-glute-bridge', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: validBlock.SUPPORT,
      CORE: validBlock.CORE,
    }, { readyConditionalMethodNodeIds: ['exp-single-leg-glute-bridge'] })).not.toContainEqual(expect.objectContaining({ code: 'CONDITIONAL_NOT_READY' }))
  })

  it('enforces one primary challenge, one HIGH item, and total demand of six', () => {
    const multipleChallenges = validateFemale111Block({
      PRIMARY: validBlock.PRIMARY,
      SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'PRIMARY_CHALLENGE' },
      CORE: validBlock.CORE,
    })
    expect(multipleChallenges.map((issue) => issue.code)).toContain('PRIMARY_CHALLENGE_COUNT')

    const tooDemanding = validateFemale111Block({
      PRIMARY: { methodNodeId: 'pp03', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { methodNodeId: 'exp-standard-side-plank', challengeRole: 'SUPPORTING' },
      CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
    }, { readyConditionalMethodNodeIds: ['pp03'] })
    expect(tooDemanding.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'HIGH_DEMAND_LIMIT',
      'DEMAND_BUDGET_EXCEEDED',
    ]))
  })

  it('keeps Block A and Block B structurally separate and keeps Accessory outside 1+1+1', () => {
    const session = {
      id: 'female111-session-01',
      prep: [],
      blockA: {
        id: 'block-a',
        selection: validBlock,
      },
      blockB: {
        id: 'block-b',
        selection: {
          PRIMARY: { methodNodeId: 'pp10', challengeRole: 'PRIMARY_CHALLENGE' as const },
          SUPPORT: { methodNodeId: 'pp16', challengeRole: 'SUPPORTING' as const },
          CORE: { methodNodeId: 'exp-open-book', challengeRole: 'SUPPORTING' as const },
        },
      },
      accessory: [{ methodNodeId: 'exp-basic-hip-abduction', purpose: 'supplemental volume' }],
      recovery: { recordRequired: true },
    }
    expect(validateFemale111Session(session)).toEqual([])

    const duplicateBlockIds = validateFemale111Session({ ...session, blockB: { ...session.blockB, id: 'block-a' } })
    expect(duplicateBlockIds.map((issue) => issue.code)).toContain('DUPLICATE_BLOCK_ID')

    const invalidBlock = validateFemale111Session({
      ...session,
      blockB: { ...session.blockB, selection: { ...session.blockB.selection, CORE: validBlock.SUPPORT } },
    })
    expect(invalidBlock.map((issue) => issue.code)).toContain('BLOCK_B_INVALID')
  })
})
