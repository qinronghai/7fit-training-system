import { describe, expect, it } from 'vitest'
import {
  PPFemaleRuntimeResolutionError,
  resolveFemaleRuntimeCanonicalBinding,
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
import type { PPCanonicalMapping } from '../src/data/pp/types'

describe('PP-G1A female programming runtime adapter', () => {
  it('resolves the frozen catalog into eight templates and 24 explicit slots', () => {
    const resolved = resolveFemaleProgrammingTemplates()

    expect(resolved).toHaveLength(8)
    expect(resolved.flatMap((template) => Object.values(template.slots))).toHaveLength(24)
    expect(resolved.map((template) => template.template.id)).toEqual([
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
      expect(template.template).toBe(ppFemaleProgrammingTemplates.find((item) => item.id === template.template.id))
    }
  })

  it('keeps Method, policy, and Exercise identity as references rather than inferred copies', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]))

    for (const template of resolved) {
      for (const slot of Object.values(template.slots)) {
        expect(slot.methodNode).toBe(ppMethodNodeById.get(slot.methodNode.id))
        expect(slot.policy).toBe(ppFemaleProgrammingPolicy.find((entry) => entry.nodeId === slot.methodNode.id))
        expect(slot.canonical.exercise).toBe(exerciseById.get(slot.canonical.mapping.exerciseId))
        expect(slot.canonical.mapping).toBe(slot.methodNode.mapping)
        expect(slot).not.toHaveProperty('canonicalExerciseId')
        expect(slot).not.toHaveProperty('mappingStatus')
        expect(slot).not.toHaveProperty('variantId')
        expect(slot).not.toHaveProperty('eligibility')
        expect(slot).not.toHaveProperty('demand')
        expect(slot).not.toHaveProperty('breathing')
        expect(slot).not.toHaveProperty('qualityGate')
        expect(slot).not.toHaveProperty('commonCompensations')
      }
    }
  })

  it('resolves mapped nodes to their canonical Exercise records', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const slot = resolved.find((template) => template.template.id === 'fit-f04')!.slots.HIP
    expect(slot.methodNode.id).toBe('pp10')
    expect(slot.canonical.mapping.status).toBe('mapped')
    expect(slot.canonical.mapping).toBe(slot.methodNode.mapping)
    expect(slot.canonical.mapping.exerciseId).toBe('glute-bridge')
    expect(slot.canonical.exercise.id).toBe('glute-bridge')
  })

  it('resolves variant nodes to the canonical host and explicit variant ID', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const slot = resolved.find((template) => template.template.id === 'fit-f05')!.slots.HIP
    const mapping = slot.canonical.mapping
    expect(slot.methodNode.id).toBe('pp01')
    expect(mapping.status).toBe('variant')
    expect(mapping).toBe(slot.methodNode.mapping)
    expect(mapping.exerciseId).toBe('squat')
    if (mapping.status === 'variant') {
      expect(mapping.variantId).toBe('pp01-hip-dominant-squat')
    }
    expect(slot.canonical.exercise.id).toBe('squat')
  })

  it('surfaces challenge role and the explicit conditional readiness contract', () => {
    const resolved = resolveFemaleProgrammingTemplates()
    const advanced = resolved.find((template) => template.template.id === 'fit-f07')!

    expect(advanced.slots.HIP.challengeRole).toBe('PRIMARY_CHALLENGE')
    expect(advanced.slots.SUPPORT.challengeRole).toBe('SUPPORTING')
    expect(advanced.template.requiredConditionalNodeIds).toEqual([
      'exp-single-leg-glute-bridge',
      'exp-quadruped-single-limb-lift',
    ])
    expect(advanced.slots.HIP.requiresConditionalReadiness).toBe(true)
    expect(advanced.slots.SUPPORT.requiresConditionalReadiness).toBe(true)
    expect(advanced.slots.CORE.requiresConditionalReadiness).toBe(false)
    expect(resolveFemaleProgrammingTemplates()[0].slots.HIP.requiresConditionalReadiness).toBe(false)
  })

  it('hard-fails invalid template contracts before executable resolution', () => {
    const invalid = {
      ...ppFemaleProgrammingTemplates[0],
      selection: {
        ...ppFemaleProgrammingTemplates[0].selection,
        CORE: { nodeId: 'pp17', challengeRole: 'SUPPORTING' as const },
      },
    } satisfies PPFemaleTemplate

    try {
      resolveFemaleProgrammingTemplate(invalid)
      throw new Error('expected runtime resolution to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(PPFemaleRuntimeResolutionError)
      expect((error as PPFemaleRuntimeResolutionError).code).toBe('TEMPLATE_CONTRACT_INVALID')
    }
  })

  it('hard-fails each non-executable canonical mapping with exact codes', () => {
    const cases: readonly [PPCanonicalMapping, string][] = [
      [ppMethodNodeById.get('pp17')!.mapping, 'METHOD_ONLY_NOT_EXECUTABLE'],
      [{ status: 'add-candidate', proposedExerciseId: 'synthetic-candidate' }, 'ADD_CANDIDATE_NOT_EXECUTABLE'],
      [{ status: 'verify', reason: 'synthetic verification case' }, 'VERIFY_NOT_EXECUTABLE'],
      [{ status: 'mapped', exerciseId: 'missing-canonical-exercise' }, 'CANONICAL_EXERCISE_NOT_FOUND'],
    ]

    for (const [mapping, code] of cases) {
      try {
        resolveFemaleRuntimeCanonicalBinding(mapping, { templateId: 'synthetic', nodeId: 'synthetic-node' })
        throw new Error('expected canonical binding to fail')
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
      expect(template.template).not.toHaveProperty('level')
      expect(template.template).not.toHaveProperty('recommendation')
      for (const slot of Object.values(template.slots)) {
        expect(slot).not.toHaveProperty('sets')
        expect(slot).not.toHaveProperty('reps')
        expect(slot).not.toHaveProperty('femaleLevel')
      }
    }
  })
})
