import { describe, expect, it } from 'vitest'
import { getExercise } from '../src/data/exercises'
import {
  female111RecipeFamilies,
  female111TemplateCatalog,
  getFemale111Template,
} from '../src/data/female111'

describe('PP-F111 template level catalog', () => {
  it('exposes 8 recipe families with four complete levels each', () => {
    expect(female111TemplateCatalog).toHaveLength(8)
    for (const recipe of female111RecipeFamilies) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const template = getFemale111Template(recipe.id, level)
        expect(template?.recipeId).toBe(recipe.id)
        expect(template?.level.level).toBe(level)
        expect(template?.level.prep.map((item) => item.phase)).toEqual(['R', 'M', 'A', 'P'])
        expect(template?.level.rampUp.length).toBeGreaterThanOrEqual(2)
        expect(template?.level.mainSequence.length).toBeGreaterThanOrEqual(5)
        expect(template?.level.mainSequence.map((item) => item.role)).toEqual(
          expect.arrayContaining(['PRIMARY', 'SUPPORT', 'CORE']),
        )
      }
    }
  })

  it('keeps every PPF111 action tied to a canonical Exercise identity', () => {
    for (const recipe of female111RecipeFamilies) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const current = getFemale111Template(recipe.id, level)!.level
        const actions = [...current.prep, ...current.rampUp, ...current.mainSequence, ...current.optionalAccessory]
        expect(actions.every((item) => getExercise(item.exerciseId))).toBe(true)
      }
    }
  })

  it('keeps level prescriptions structured and ramp-up order explicit', () => {
    for (const recipe of female111RecipeFamilies) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const current = getFemale111Template(recipe.id, level)!.level
        const actions = [...current.prep, ...current.rampUp, ...current.mainSequence, ...current.optionalAccessory]
        expect(actions.every((item) => typeof item.prescription === 'object' && item.prescription !== null)).toBe(true)
        expect(current.rampUp.map((item) => item.order)).toEqual([...current.rampUp]
          .map((item) => item.order)
          .sort((left, right) => left - right))
      }
    }
  })

  it('keeps one primary challenge and explicit L2-L4 progression evidence', () => {
    for (const recipe of female111RecipeFamilies) {
      expect(getFemale111Template(recipe.id)?.level.level).toBe('l1')
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const current = getFemale111Template(recipe.id, level)!.level
        expect(current.mainSequence.filter((item) => item.role === 'PRIMARY')).toHaveLength(1)
        if (level === 'l1') {
          expect(current.progressionFromPrevious).toBeUndefined()
        } else {
          expect(current.progressionFromPrevious?.variables.length).toBeGreaterThanOrEqual(1)
          expect(current.progressionFromPrevious?.variables.length).toBeLessThanOrEqual(2)
          expect(current.progressionFromPrevious?.note).toMatch(/changed fields:/)
        }
      }
    }
  })
})
