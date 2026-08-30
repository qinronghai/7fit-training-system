import { describe, expect, it } from 'vitest'
import { getExercise } from '../src/data/exercises'
import {
  female111ProgressionFamilies,
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

  it('keeps the public accessor stable while publishing estimator-derived minutes', () => {
    for (const recipe of female111RecipeFamilies) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const selected = getFemale111Template(recipe.id, level)!
        expect(selected.recipeId).toBe(recipe.id)
        expect(selected.level.level).toBe(level)
        expect(selected.level.estimatedMinutes).toEqual(selected.level.timeEstimate.totalMinutes)
        expect(selected.level.estimatedMinutes.max).toBeLessThanOrEqual(60)
      }
    }
  })

  it('records primary exercise replacements through the Female111 progression graph', () => {
    for (const recipe of female111RecipeFamilies) {
      let previousPrimary = getFemale111Template(recipe.id, 'l1')!.level.mainSequence.find((item) => item.role === 'PRIMARY')!
      for (const level of ['l2', 'l3', 'l4'] as const) {
        const current = getFemale111Template(recipe.id, level)!.level
        const currentPrimary = current.mainSequence.find((item) => item.role === 'PRIMARY')!
        const linkage = current.exerciseProgressionFromPrevious
        expect(linkage).toMatchObject({
          family: recipe.primaryFamily,
          direction: 'PROGRESSION',
          fromExerciseId: previousPrimary.exerciseId,
          toExerciseId: currentPrimary.exerciseId,
        })
        expect(getExercise(linkage!.fromExerciseId)).toBeTruthy()
        expect(getExercise(linkage!.toExerciseId)).toBeTruthy()

        const family = female111ProgressionFamilies.find((item) => item.slot === 'PRIMARY' && item.family === linkage!.family)
        expect(family).toBeDefined()

        const sourceNodes = linkage!.sourceNodeIds.map((nodeId) => family!.nodes.find((node) => node.id === nodeId))
        expect(sourceNodes.every(Boolean)).toBe(true)
        expect(sourceNodes[0]?.exerciseId).toBe(linkage!.fromExerciseId)
        expect(sourceNodes.at(-1)?.exerciseId).toBe(linkage!.toExerciseId)

        if (linkage!.fromExerciseId !== linkage!.toExerciseId) expect(linkage!.sourceEdgeIds.length).toBeGreaterThan(0)
        for (const edgeId of linkage!.sourceEdgeIds) {
          const [from, to] = edgeId.split('->')
          expect(family!.edges).toContainEqual(expect.objectContaining({
            direction: linkage!.direction,
            from,
            to,
          }))
        }
        previousPrimary = currentPrimary
      }
    }
  })

  it('projects the legacy single prep card from the template-specific P phase', () => {
    for (const templateEntry of female111TemplateCatalog) {
      const l1Prime = templateEntry.levels.l1.prep.find((item) => item.phase === 'P')!
      expect(templateEntry.prep.exerciseId).toBe(l1Prime.exerciseId)
      expect(templateEntry.prep.rationale).toBe(l1Prime.reason)

      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const selected = getFemale111Template(templateEntry.recipeId, level)!
        const prime = selected.level.prep.find((item) => item.phase === 'P')!
        expect(selected.prep.exerciseId).toBe(prime.exerciseId)
        expect(selected.prep.rationale).toBe(prime.reason)
      }
    }
  })
})
