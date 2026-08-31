import { describe, expect, it } from 'vitest'
import {
  getFemale111ProgressionNode,
  getFemale111RoleEntry,
  resolveFemale111Block,
  validateFemale111Block,
} from '../src/data/female111'
import { ppMethodNodeById } from '../src/data/pp/methodNodes'

const validBlock = {
  PRIMARY: { methodNodeId: 'exp-box-squat', challengeRole: 'PRIMARY_CHALLENGE' as const },
  SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' as const },
  CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' as const },
}

describe('PP-F111 Stage 2 executable Block engine', () => {
  it('derives programming metadata from existing PP Method identity', () => {
    const role = getFemale111RoleEntry('pp26')!
    const method = ppMethodNodeById.get('pp26')!
    expect(role.capabilityRequirements).toEqual(method.capabilities)
    expect(role.readinessRequirements).toEqual([method.readinessProfile])
    expect(role.populationApplicability).toEqual({ GENERAL: 'ALLOW', PREGNANCY: 'REVIEW', POSTPARTUM: 'REVIEW' })
    expect(role.venueRequirementId).toBe('female111:pp26')
    expect(role.challengeComplexity).toBe('DEVELOPMENT')
  })

  it('attaches a progression node to every resolved executable slot', () => {
    const result = resolveFemale111Block({ recipeId: 'F111-01', selection: validBlock })
    expect(result.resolved?.slots.PRIMARY.progression).toBe(getFemale111ProgressionNode('exp-box-squat'))
    expect(result.resolved?.slots.PRIMARY.progression?.exerciseId).toBe('box-squat')
  })

  it('rejects concentration of one limiting capability beyond the configured budget', () => {
    const issues = validateFemale111Block({
      PRIMARY: { methodNodeId: 'pp01', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { methodNodeId: 'pp19', challengeRole: 'SUPPORTING' },
      CORE: validBlock.CORE,
    }, { maxSharedCapabilityCount: 1 })
    expect(issues.map((issue) => issue.code)).toContain('LIMITING_CAPABILITY_OVERLOAD')
  })

  it('rejects more than one integration-complexity challenge in a Block', () => {
    const issues = validateFemale111Block({
      PRIMARY: { methodNodeId: 'pp03', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { methodNodeId: 'pp18', challengeRole: 'SUPPORTING' },
      CORE: { methodNodeId: 'pp25', challengeRole: 'SUPPORTING' },
    }, { readyConditionalMethodNodeIds: ['pp03', 'pp18', 'pp25'] })
    expect(issues.map((issue) => issue.code)).toContain('MULTIPLE_COMPLEXITY_CHALLENGES')
  })
})
