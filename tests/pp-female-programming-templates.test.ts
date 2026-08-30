import { describe, expect, it } from 'vitest'
import {
  ppFemaleProgrammingTemplates,
} from '../src/data/pp/femaleProgrammingTemplates'
import {
  getFemaleProgrammingTemplate,
  getFemaleTemplateRequiredConditionalNodes,
  validateFemaleProgrammingTemplate,
  validateFemaleProgrammingTemplates,
} from '../src/data/pp/femaleProgrammingTemplateRules'
import { ppFemaleProgrammingPolicy } from '../src/data/pp/femaleProgrammingPolicy'
import type { PPFemaleTemplate } from '../src/data/pp/femaleProgrammingTemplates'

describe('PP-F2A female 1+1+1 template contract', () => {
  it('contains exactly eight templates with unique stable IDs and codes', () => {
    expect(ppFemaleProgrammingTemplates).toHaveLength(8)
    expect(new Set(ppFemaleProgrammingTemplates.map((template) => template.id)).size).toBe(8)
    expect(new Set(ppFemaleProgrammingTemplates.map((template) => template.code)).size).toBe(8)
    expect(ppFemaleProgrammingTemplates.map((template) => template.id)).toEqual([
      'fit-f01', 'fit-f02', 'fit-f03', 'fit-f04',
      'fit-f05', 'fit-f06', 'fit-f07', 'fit-f08',
    ])
  })

  it('uses exactly HIP, SUPPORT, and CORE once per template', () => {
    for (const template of ppFemaleProgrammingTemplates) {
      expect(Object.keys(template.selection).sort()).toEqual(['CORE', 'HIP', 'SUPPORT'])
      expect(new Set(Object.values(template.selection).map((selection) => selection.nodeId)).size).toBe(3)
    }
  })

  it('validates every reference template through the PP-F1 block contract', () => {
    expect(validateFemaleProgrammingTemplates(ppFemaleProgrammingTemplates)).toEqual([])
    for (const template of ppFemaleProgrammingTemplates) {
      expect(validateFemaleProgrammingTemplate(template)).toEqual([])
    }
  })

  it('keeps every conditional selection explicitly declared', () => {
    for (const template of ppFemaleProgrammingTemplates) {
      const selectedConditionalIds = Object.values(template.selection)
        .map((selection) => ppFemaleProgrammingPolicy.find((entry) => entry.nodeId === selection.nodeId))
        .filter((entry) => entry?.eligibility === 'B_CONDITIONAL')
        .map((entry) => entry!.nodeId)
      expect(template.requiredConditionalNodeIds).toEqual(selectedConditionalIds)
      expect(getFemaleTemplateRequiredConditionalNodes(template)).toEqual(selectedConditionalIds)
    }
  })

  it('includes an A-only foundation subset and covers every primary role', () => {
    const foundation = ppFemaleProgrammingTemplates.slice(0, 3)
    expect(foundation.every((template) => template.requiredConditionalNodeIds.length === 0)).toBe(true)
    for (const template of ppFemaleProgrammingTemplates) {
      const roles = Object.values(template.selection).map((selection) => selection.challengeRole)
      expect(roles.filter((role) => role === 'PRIMARY_CHALLENGE')).toHaveLength(1)
      expect(roles.filter((role) => role === 'SUPPORTING')).toHaveLength(2)
    }
    expect(ppFemaleProgrammingTemplates.some((template) => template.selection.HIP.challengeRole === 'PRIMARY_CHALLENGE')).toBe(true)
    expect(ppFemaleProgrammingTemplates.some((template) => template.selection.SUPPORT.challengeRole === 'PRIMARY_CHALLENGE')).toBe(true)
    expect(ppFemaleProgrammingTemplates.some((template) => template.selection.CORE.challengeRole === 'PRIMARY_CHALLENGE')).toBe(true)
  })

  it('rejects a template with a missing conditional requirement', () => {
    const advanced = ppFemaleProgrammingTemplates.find((template) => template.id === 'fit-f07')!
    const invalid = { ...advanced, requiredConditionalNodeIds: [] }
    expect(validateFemaleProgrammingTemplate(invalid).map((issue) => issue.code))
      .toContain('CONDITIONAL_REQUIREMENT_MISSING')
  })

  it('rejects an unused conditional requirement', () => {
    const foundation = ppFemaleProgrammingTemplates.find((template) => template.id === 'fit-f01')!
    const invalid = { ...foundation, requiredConditionalNodeIds: ['pp03'] as const }
    expect(validateFemaleProgrammingTemplate(invalid).map((issue) => issue.code))
      .toContain('UNUSED_CONDITIONAL_REQUIREMENT')
  })

  it('rejects an advanced template when its readiness is removed', () => {
    const advanced = ppFemaleProgrammingTemplates.find((template) => template.id === 'fit-f07')!
    const invalid = { ...advanced, requiredConditionalNodeIds: [] }
    expect(validateFemaleProgrammingTemplate(invalid).length).toBeGreaterThan(0)
  })

  it('rejects duplicate template IDs and codes in the catalog', () => {
    const duplicateId = { ...ppFemaleProgrammingTemplates[1], id: ppFemaleProgrammingTemplates[0].id }
    const duplicateCode = { ...ppFemaleProgrammingTemplates[2], code: ppFemaleProgrammingTemplates[0].code }
    const issues = validateFemaleProgrammingTemplates([
      ppFemaleProgrammingTemplates[0], duplicateId, duplicateCode,
      ...ppFemaleProgrammingTemplates.slice(3),
    ])
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'DUPLICATE_TEMPLATE_ID',
      'DUPLICATE_TEMPLATE_CODE',
    ]))
  })

  it('rejects template metadata that duplicates Method or Exercise identity', () => {
    for (const template of ppFemaleProgrammingTemplates as readonly PPFemaleTemplate[]) {
      expect(template).not.toHaveProperty('breathing')
      expect(template).not.toHaveProperty('progressionLevel')
      expect(template).not.toHaveProperty('exerciseId')
      expect(template).not.toHaveProperty('sets')
      expect(template).not.toHaveProperty('reps')
    }
  })

  it('retrieves templates by stable ID without inventing a recommendation API', () => {
    expect(getFemaleProgrammingTemplate('fit-f01')).toEqual(ppFemaleProgrammingTemplates[0])
    expect(getFemaleProgrammingTemplate('missing-template')).toBeUndefined()
  })
})
