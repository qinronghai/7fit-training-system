import { describe, expect, it } from 'vitest'
import {
  female111RecipeFamilies,
  getFemale111RoleEntry,
  resolveFemale111Block,
} from '../src/data/female111'
import { ppMethodNodeById } from '../src/data/pp/methodNodes'

const squatBlock = {
  PRIMARY: { methodNodeId: 'exp-box-squat', challengeRole: 'PRIMARY_CHALLENGE' as const },
  SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' as const },
  CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' as const },
}

describe('PP-F111-C1 Recipe to Block Resolver', () => {
  it('resolves a coach-confirmed block against the recipe families', () => {
    const result = resolveFemale111Block({ recipeId: 'F111-01', selection: squatBlock })

    expect(result.issues).toEqual([])
    expect(result.resolved).toBeDefined()
    expect(result.resolved!.recipe).toBe(female111RecipeFamilies[0])
    expect(result.resolved!.selection).toBe(squatBlock)
    expect(result.resolved!.slots.PRIMARY.selection).toBe(squatBlock.PRIMARY)
    expect(result.resolved!.slots.PRIMARY.role).toBe(getFemale111RoleEntry('exp-box-squat'))
    expect(result.resolved!.slots.PRIMARY.methodNode).toBe(ppMethodNodeById.get('exp-box-squat'))
  })

  it('resolves a conditional selection only when readiness is explicitly confirmed', () => {
    const conditionalBlock = {
      PRIMARY: { methodNodeId: 'exp-glute-bridge-march', challengeRole: 'PRIMARY_CHALLENGE' as const },
      SUPPORT: { methodNodeId: 'exp-knee-side-plank', challengeRole: 'SUPPORTING' as const },
      CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' as const },
    }

    const notReady = resolveFemale111Block({ recipeId: 'F111-04', selection: conditionalBlock })
    expect(notReady.resolved).toBeUndefined()
    expect(notReady.issues.map((issue) => issue.code)).toContain('BLOCK_INVALID')
    expect(notReady.issues.flatMap((issue) => issue.blockIssues ?? []).map((issue) => issue.code)).toContain('CONDITIONAL_NOT_READY')

    const ready = resolveFemale111Block(
      { recipeId: 'F111-04', selection: conditionalBlock },
      { readyConditionalMethodNodeIds: ['exp-glute-bridge-march'] },
    )
    expect(ready.issues).toEqual([])
    expect(ready.resolved).toBeDefined()
  })

  it('rejects a family mismatch without substituting another candidate', () => {
    const result = resolveFemale111Block({
      recipeId: 'F111-01',
      selection: { ...squatBlock, PRIMARY: { methodNodeId: 'pp02', challengeRole: 'PRIMARY_CHALLENGE' } },
    })

    expect(result.resolved).toBeUndefined()
    expect(result.issues.map((issue) => issue.code)).toContain('RECIPE_FAMILY_MISMATCH')
    expect(result.issues.some((issue) => issue.methodNodeId === 'pp02')).toBe(true)
  })

  it('fails closed for unknown Recipe, method-only nodes, and disallowed selections', () => {
    const unknownRecipe = resolveFemale111Block({ recipeId: 'F111-99', selection: squatBlock })
    expect(unknownRecipe.resolved).toBeUndefined()
    expect(unknownRecipe.issues.map((issue) => issue.code)).toEqual(['RECIPE_NOT_FOUND'])

    const methodOnly = resolveFemale111Block({
      recipeId: 'F111-01',
      selection: { ...squatBlock, PRIMARY: { methodNodeId: 'pp17', challengeRole: 'PRIMARY_CHALLENGE' } },
    })
    expect(methodOnly.resolved).toBeUndefined()
    expect(methodOnly.issues.map((issue) => issue.code)).toContain('BLOCK_INVALID')
    expect(methodOnly.issues.flatMap((issue) => issue.blockIssues ?? []).map((issue) => issue.code)).toContain('METHOD_ONLY_NOT_STANDALONE')

    const disallowed = resolveFemale111Block({
      recipeId: 'F111-01',
      selection: { ...squatBlock, PRIMARY: { methodNodeId: 'exp-incline-plank', challengeRole: 'PRIMARY_CHALLENGE' } },
    })
    expect(disallowed.resolved).toBeUndefined()
    expect(disallowed.issues.map((issue) => issue.code)).toContain('BLOCK_INVALID')
    expect(disallowed.issues.flatMap((issue) => issue.blockIssues ?? []).map((issue) => issue.code)).toContain('SESSION_ROLE_NOT_ALLOWED')
  })
})
