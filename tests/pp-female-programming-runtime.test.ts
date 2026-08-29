import { describe, expect, it } from 'vitest'
import {
  PPFemaleRuntimeResolutionError,
  resolveFemaleProgrammingTemplate,
  resolveFemaleProgrammingTemplates,
} from '../src/data/pp/femaleProgrammingRuntime'
import { exercises } from '../src/data/exercises/exercises'
import { ppFemaleProgrammingPolicy } from '../src/data/pp/femaleProgrammingPolicy'
import { ppMethodNodeById } from '../src/data/pp/methodNodes'
import {
  ppFemaleProgrammingTemplates,
} from '../src/data/pp/femaleProgrammingTemplates'
import type { PPFemaleTemplate } from '../src/data/pp/femaleProgrammingTemplates'

describe('PP-G1A female programming runtime adapter', () => {
  it('resolves the frozen catalog into eight templates and 24 explicit slots', () => {
    const resolved = resolveFemaleProgrammingTemplates()

    expect(resolved).toHaveLength(8)
    expect(resolved.flatMap((template) => Object.values(template.slots))).toHaveLength(24)
    expect(resolved.map((template) => template.id)).toEqual([
      'fit-f01', 'fit-f02', 'fit-f03', 'fit-f04',
      'fit-f05', 'fit-f06', 'fit-f07', 'fit-f08',
    ])
  })

  it('preserves stable template identity and resolves exactly HIP, SUPPORT, CORE', () => {
    const resolved = resolveFemaleProgrammingTemplates()

    for (const template of resolved) {
      expect(Object.keys(template.slots).sort()).toEqual(['CORE', 'HIP', 'SUPPORT'])
      expect(template.slots.HIP.slot).toBe('HIP')
      expect(template.slots.SUPPORT.slot).toBe('SUPPORT')
      expect(template.slots.CORE.slot).toBe('CORE')
      expect(template.requiredConditionalNodeIds).toEqual(
        ppFemaleProgrammingTemplates.find((item) => item.id === template.id)!.requiredConditionalNodeIds,
      )
    }
  })

  it('keeps Method, policy, and Exercise identity as references rather than inferred copies', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]))

    for (const template of resolved) {
      for (const slot of Object.values(template.slots)) {
        expect(slot.methodNode).toBe(ppMethodNodeById.get(slot.methodNode.id))
        expect(slot.policy).toBe(ppFemaleProgrammingPolicy.find((entry) => entry.nodeId === slot.methodNode.id))
        expect(slot.canonicalExercise).toBe(exerciseById.get(slot.canonicalExerciseId))
        expect(slot.breathing).toBe(slot.methodNode.breathing)
        expect(slot.qualityGate).toBe(slot.methodNode.qualityGate)
        expect(slot.commonCompensations).toBe(slot.methodNode.commonCompensations)
        expect(slot.eligibility).toBe(slot.policy.eligibility)
        expect(slot.demand).toBe(slot.policy.demand)
      }
    }
  })

  it('resolves mapped nodes to their canonical Exercise records', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const mapped = resolved.flatMap((template) => Object.values(template.slots))
      .filter((slot) => slot.mappingStatus === 'mapped')

    expect(mapped.length).toBeGreaterThan(0)
    for (const slot of mapped) {
      const node = slot.methodNode
      expect(node.mapping.status).toBe('mapped')
      if (node.mapping.status === 'mapped') {
        expect(slot.canonicalExerciseId).toBe(node.mapping.exerciseId)
        expect(slot.variantId).toBeUndefined()
      }
    }
  })

  it('resolves variant nodes to the canonical host and explicit variant ID', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const variants = resolved.flatMap((template) => Object.values(template.slots))
      .filter((slot) => slot.mappingStatus === 'variant')

    expect(variants.length).toBeGreaterThan(0)
    for (const slot of variants) {
      const node = slot.methodNode
      expect(node.mapping.status).toBe('variant')
      if (node.mapping.status === 'variant') {
        expect(slot.canonicalExerciseId).toBe(node.mapping.exerciseId)
        expect(slot.variantId).toBe(node.mapping.variantId)
      }
    }
  })

  it('surfaces challenge role and the explicit conditional readiness contract', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const advanced = resolved.find((template) => template.id === 'fit-f07')!

    expect(advanced.slots.HIP.challengeRole).toBe('PRIMARY_CHALLENGE')
    expect(advanced.slots.SUPPORT.challengeRole).toBe('SUPPORTING')
    expect(advanced.requiredConditionalNodeIds).toEqual([
      'exp-single-leg-glute-bridge',
      'exp-quadruped-single-limb-lift',
    ])
  })

  it('hard-fails invalid template contracts before executable resolution', () => {
    const invalid = {
      ...ppFemaleProgrammingTemplates[0],
      selection: {
        ...ppFemaleProgrammingTemplates[0].selection,
        CORE: { nodeId: 'pp17', challengeRole: 'SUPPORTING' as const },
      },
    } satisfies PPFemaleTemplate

    expect(() => resolveFemaleProgrammingTemplate(invalid)).toThrow(PPFemaleRuntimeResolutionError)
  })

  it('hard-fails method-only, verify, and add-candidate mappings without inference', () => {
    const base = ppFemaleProgrammingTemplates[0]
    const cases = [
      ['pp17', 'METHOD_ONLY_NOT_EXECUTABLE'],
      ['pp06', 'METHOD_ONLY_NOT_EXECUTABLE'],
    ] as const

    for (const [nodeId, code] of cases) {
      const invalid = {
        ...base,
        selection: { ...base.selection, CORE: { nodeId, challengeRole: 'SUPPORTING' as const } },
        requiredConditionalNodeIds: [],
      } satisfies PPFemaleTemplate
      try {
        resolveFemaleProgrammingTemplate(invalid)
        throw new Error('expected runtime resolution to fail')
      } catch (error) {
        expect(error).toBeInstanceOf(PPFemaleRuntimeResolutionError)
        expect((error as PPFemaleRuntimeResolutionError).code).toBe(code)
      }
    }
  })

  it('is pure and deterministic across repeated resolutions', () => {
    expect(resolveFemaleProgrammingTemplates()).toEqual(resolveFemaleProgrammingTemplates())
  })

  it('does not add BREATH slots, Female levels, prescriptions, or recommendation fields', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    for (const template of resolved) {
      expect(Object.keys(template.slots)).not.toContain('BREATH')
      expect(template).not.toHaveProperty('level')
      expect(template).not.toHaveProperty('recommendation')
      for (const slot of Object.values(template.slots)) {
        expect(slot).not.toHaveProperty('sets')
        expect(slot).not.toHaveProperty('reps')
        expect(slot).not.toHaveProperty('femaleLevel')
      }
    }
  })
})
