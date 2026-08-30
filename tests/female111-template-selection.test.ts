import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Female111TemplateLevelId } from '../src/data/female111'
import * as templateCatalog from '../src/data/female111/templateCatalog'
import {
  buildFemale111CoachProduct,
  resolveFemale111TemplateSelection,
} from '../src/data/female111'

const defaultInput = {
  id: 'female111-template-selection',
  target: '力量基础',
  stage: 'L1' as const,
  population: 'GENERAL' as const,
  readiness: 'GREEN' as const,
  coachConfirmed: true,
  venueConfirmed: true,
  availableEquipment: ['barbell', 'box', 'mini-band'],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PP-F111 complete template runtime adapter', () => {
  it('resolves a selected template level from the authoritative catalog', () => {
    const result = resolveFemale111TemplateSelection({ recipeId: 'F111-03', level: 'l3' })

    expect(result.template).toMatchObject({
      recipeId: 'F111-03',
      level: { level: 'l3' },
    })
    expect(result.issues).toEqual([])
  })

  it('returns a typed issue when the requested template selection is unknown', () => {
    const result = resolveFemale111TemplateSelection({
      recipeId: 'F111-99',
      level: 'l4' as Female111TemplateLevelId,
    })

    expect(result.template).toBeUndefined()
    expect(result.issues).toEqual([{
      code: 'TEMPLATE_SELECTION_NOT_FOUND',
      message: 'Unknown Female111 template selection: F111-99/l4',
      recipeId: 'F111-99',
      level: 'l4',
    }])
  })

  it('returns a typed issue when only templateRecipeId is provided and preserves the current coach product path', () => {
    const result = buildFemale111CoachProduct({
      ...defaultInput,
      templateRecipeId: 'F111-03',
    })

    expect(result.template).toBeUndefined()
    expect(result.templateSelectionIssues).toEqual([{
      code: 'TEMPLATE_SELECTION_INCOMPLETE',
      message: 'Female111 template selection requires both templateRecipeId and templateLevel.',
      recipeId: 'F111-03',
      missingFields: ['templateLevel'],
    }])
    expect(result.session).toBeDefined()
    expect(result.evidence).toBeDefined()
    expect(result.model).toBeDefined()
    expect(result.session?.blockA.resolved.recipe.id).toBe('F111-01')
    expect(result.session?.blockB.resolved.recipe.id).toBe('F111-07')
  })

  it('returns a typed issue when only templateLevel is provided and preserves the current coach product path', () => {
    const result = buildFemale111CoachProduct({
      ...defaultInput,
      templateLevel: 'l3',
    })

    expect(result.template).toBeUndefined()
    expect(result.templateSelectionIssues).toEqual([{
      code: 'TEMPLATE_SELECTION_INCOMPLETE',
      message: 'Female111 template selection requires both templateRecipeId and templateLevel.',
      level: 'l3',
      missingFields: ['templateRecipeId'],
    }])
    expect(result.session).toBeDefined()
    expect(result.evidence).toBeDefined()
    expect(result.model).toBeDefined()
    expect(result.session?.blockA.resolved.recipe.id).toBe('F111-01')
    expect(result.session?.blockB.resolved.recipe.id).toBe('F111-07')
  })

  it('returns a typed issue for an invalid selection through the coach product boundary without blocking the existing runtime path', () => {
    const result = buildFemale111CoachProduct({
      ...defaultInput,
      templateRecipeId: 'F111-99',
      templateLevel: 'l4',
    })

    expect(result.template).toBeUndefined()
    expect(result.templateSelectionIssues).toEqual([{
      code: 'TEMPLATE_SELECTION_NOT_FOUND',
      message: 'Unknown Female111 template selection: F111-99/l4',
      recipeId: 'F111-99',
      level: 'l4',
    }])
    expect(result.session).toBeDefined()
    expect(result.evidence).toBeDefined()
    expect(result.model).toBeDefined()
  })

  it('converts template catalog resolution failures into explicit invalid-selection issues without blocking coach product generation', () => {
    vi.spyOn(templateCatalog, 'getFemale111Template').mockImplementation(() => {
      throw new Error('catalog resolution failed')
    })

    const result = buildFemale111CoachProduct({
      ...defaultInput,
      templateRecipeId: 'F111-03',
      templateLevel: 'l3',
    })

    expect(result.template).toBeUndefined()
    expect(result.templateSelectionIssues).toEqual([{
      code: 'TEMPLATE_SELECTION_INVALID',
      message: 'Invalid Female111 template selection: F111-03/l3',
      recipeId: 'F111-03',
      level: 'l3',
      cause: 'catalog resolution failed',
    }])
    expect(result.session).toBeDefined()
    expect(result.evidence).toBeDefined()
    expect(result.model).toBeDefined()
  })

  it('carries the selected PPF111 level as candidate content without replacing Block A or Block B', () => {
    const result = buildFemale111CoachProduct({
      ...defaultInput,
      templateRecipeId: 'F111-03',
      templateLevel: 'l3',
    })

    expect(result.template).toMatchObject({
      recipeId: 'F111-03',
      level: { level: 'l3' },
    })
    expect(result.session?.blockA.resolved.recipe.id).toBe('F111-01')
    expect(result.session?.blockB.resolved.recipe.id).toBe('F111-07')
  })

  it('keeps omitted selection backward compatible with the current coach plan', () => {
    const result = buildFemale111CoachProduct(defaultInput)

    expect(result.template).toBeUndefined()
    expect(result.templateSelectionIssues).toEqual([])
    expect(result.session?.blockA.resolved.recipe.id).toBe('F111-01')
    expect(result.session?.blockB.resolved.recipe.id).toBe('F111-07')
  })

  it('keeps readiness, venue, population, and coach confirmation gates authoritative', () => {
    const result = buildFemale111CoachProduct({
      ...defaultInput,
      templateRecipeId: 'F111-03',
      templateLevel: 'l4',
      readiness: 'RED',
      coachConfirmed: false,
      venueConfirmed: false,
      availableEquipment: [],
    })

    expect(result.template?.level.level).toBe('l4')
    const evidenceSlots = Object.values(result.evidence!.blocks).flatMap((block) => Object.values(block.slots))
    expect(evidenceSlots.some((slot) =>
      slot.population === 'VETOED'
      || slot.population === 'REVIEW_REQUIRED'
      || slot.venue === 'VETOED'
      || slot.venue === 'REVIEW_REQUIRED')).toBe(true)
    expect(result.session).toBeDefined()
    expect(result.session?.blockA.resolved.recipe.id).toBe('F111-01')
    expect(result.session?.blockB.resolved.recipe.id).toBe('F111-07')
  })
})
