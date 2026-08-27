import { describe, expect, it } from 'vitest'
import { exercises, getExercise, resolveExerciseId } from '../src/data/exercises'
import { bodyTemplates } from '../src/data/programming/bodyTemplates'
import { conditioningTemplates } from '../src/data/programming/conditioningTemplates'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import {
  createProgrammingExerciseLookup,
  programmingExerciseMappings,
  validateProgrammingExerciseMappings,
} from '../src/data/exercises/programmingMap'

const PROGRAMMING_KEY_FIELDS = new Set(['exerciseKey', 'optionKey', 'fallbackOptionKey', 'defaultSelection'])

const collectProgrammingExerciseKeys = (value: unknown, keys: Set<string>) => {
  if (Array.isArray(value)) {
    for (const item of value) collectProgrammingExerciseKeys(item, keys)
    return
  }

  if (!value || typeof value !== 'object') return

  const record = value as Record<string, unknown>
  for (const [field, child] of Object.entries(record)) {
    if (
      typeof child === 'string'
      && PROGRAMMING_KEY_FIELDS.has(field)
      && !(field === 'defaultSelection' && child === 'foundation-regression')
      && !(field === 'exerciseKey' && record.kind === 'power-track')
    ) {
      keys.add(child)
    }
    collectProgrammingExerciseKeys(child, keys)
  }
}

const formalProgrammingExerciseKeys = () => {
  const keys = new Set<string>()
  collectProgrammingExerciseKeys([threeCTemplates, bodyTemplates, conditioningTemplates], keys)
  return keys
}

describe('V6.1 exercise domain', () => {
  it('uses stable unique exercise slugs', () => {
    const ids = exercises.map((exercise) => exercise.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(id).not.toMatch(/^action-\d+$/)
    }
  })

  it('resolves canonical exercise names to stable ids', () => {
    expect(resolveExerciseId('哈克深蹲')).toBe('hack-squat')
    expect(getExercise('hack-squat')?.name).toBe('哈克深蹲')
  })

  it('resolves aliases to the same canonical exercise', () => {
    expect(resolveExerciseId('臀桥')).toBe('glute-bridge')
    expect(resolveExerciseId('徒手臀桥')).toBe('glute-bridge')
  })
})

describe('V6.1 Programming exercise mapping contract', () => {
  it('inventories the complete formal Programming key scope', () => {
    const keys = formalProgrammingExerciseKeys()

    expect(keys.size).toBe(176)
    expect(new Set([...keys].filter((key) => key.startsWith('action-')))).toEqual(new Set())
  })

  it('has one explicit mapping entry for every formal Programming key', () => {
    const keys = formalProgrammingExerciseKeys()
    const mappingKeys = programmingExerciseMappings.map((entry) => entry.exerciseKey)

    expect(new Set(mappingKeys)).toEqual(keys)
    expect(mappingKeys).toHaveLength(keys.size)
  })

  it('accepts only reviewed canonical targets and rejects unresolved completeness', () => {
    const canonicalIds = new Set(exercises.map((exercise) => exercise.id))
    expect(validateProgrammingExerciseMappings(programmingExerciseMappings, canonicalIds)).toEqual([])

    const unresolved = programmingExerciseMappings.filter((entry) => !entry.canonicalExerciseId)
    expect(unresolved).toEqual([])
  })

  it('allows reviewed Programming variants to converge on one canonical Exercise', () => {
    const lookup = createProgrammingExerciseLookup(programmingExerciseMappings)

    expect(lookup.get('floor-glute-bridge')).toBe('glute-bridge')
    expect(lookup.get('heavy-hack-squat')).toBe('hack-squat')
    expect([...lookup.values()].filter((id) => id === 'glute-bridge')).toHaveLength(2)
    expect([...lookup.values()].filter((id) => id === 'hack-squat')).toHaveLength(2)
  })

  it('reports duplicate source keys as mapping collisions', () => {
    const duplicate = [
      { exerciseKey: 'row-erg', classification: 'canonical' as const, canonicalExerciseId: 'row-erg' },
      { exerciseKey: 'row-erg', classification: 'programming-context-variant' as const, canonicalExerciseId: 'row-erg' },
    ]

    expect(validateProgrammingExerciseMappings(duplicate, new Set(['row-erg']))).toEqual([
      { code: 'DUPLICATE_SOURCE_KEY', exerciseKey: 'row-erg' },
    ])
    expect(() => createProgrammingExerciseLookup(duplicate)).toThrow('Duplicate Programming exerciseKey: row-erg')
  })

  it('rejects missing targets and action-style canonical ids', () => {
    const invalid = [
      { exerciseKey: 'missing-target', classification: 'canonical' as const, canonicalExerciseId: 'not-in-registry' },
      { exerciseKey: 'action-key', classification: 'canonical' as const, canonicalExerciseId: 'action-001' },
    ]

    expect(validateProgrammingExerciseMappings(invalid, new Set(['action-001']))).toEqual([
      { code: 'ACTION_STYLE_CANONICAL_ID', exerciseKey: 'action-key', canonicalExerciseId: 'action-001' },
      { code: 'UNKNOWN_CANONICAL_TARGET', exerciseKey: 'missing-target', canonicalExerciseId: 'not-in-registry' },
    ])
  })
})
