import { describe, expect, it } from 'vitest'
import type { Exercise } from '../src/data/exercises/types'
import { buildExerciseNameIndex, exercises, getExercise, resolveExerciseId } from '../src/data/exercises'
import { bodyTemplates } from '../src/data/programming/bodyTemplates'
import { conditioningTemplates } from '../src/data/programming/conditioningTemplates'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import {
  createProgrammingExerciseLookup,
  programmingIdentityDecisions,
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
    expect([...lookup.values()].filter((id) => id === 'glute-bridge')).toHaveLength(3)
    expect([...lookup.values()].filter((id) => id === 'hack-squat')).toHaveLength(2)
  })

  it('resolves all formal Programming keys to reviewed canonical Exercises', () => {
    const lookup = createProgrammingExerciseLookup(programmingExerciseMappings)
    const canonicalIds = new Set(exercises.map((exercise) => exercise.id))

    expect(lookup.size).toBe(176)
    expect(new Set(lookup.values())).toEqual(canonicalIds)
    for (const canonicalId of lookup.values()) expect(canonicalIds.has(canonicalId)).toBe(true)
  })

  it('keeps reviewed identity-family decisions explicit', () => {
    const lookup = createProgrammingExerciseLookup(programmingExerciseMappings)
    const decisionByFamily = new Map(programmingIdentityDecisions.map((decision) => [decision.family, decision]))

    expect(lookup.get('kb-deadlift')).toBe(lookup.get('kettlebell-deadlift'))
    expect(lookup.get('kb-rdl')).toBe(lookup.get('kettlebell-rdl'))
    expect(lookup.get('farmer-carry')).toBe(lookup.get('bilateral-farmer-carry'))
    expect(lookup.get('band-face-pull')).toBe(lookup.get('face-pull'))
    expect(lookup.get('lat-pulldown')).toBe(lookup.get('seated-lat-pulldown'))
    expect(lookup.get('seated-lat-pulldown')).toBe(lookup.get('neutral-grip-lat-pulldown'))
    expect(lookup.get('straight-arm-pulldown')).toBe(lookup.get('band-straight-arm-pulldown'))
    expect(lookup.get('band-straight-arm-pulldown')).toBe(lookup.get('cable-pullover'))
    expect(lookup.get('thoracic-rotation')).toBe(lookup.get('chest-rotation'))
    expect(lookup.get('chest-rotation')).toBe(lookup.get('chest-t-spine-rotation'))
    expect(lookup.get('side-lying-open-book')).not.toBe(lookup.get('supine-open-book'))

    expect(decisionByFamily.get('kettlebell-deadlift-abbreviation')?.decision).toBe('same-canonical-exercise')
    expect(decisionByFamily.get('open-book-position')?.decision).toBe('distinct-canonical-exercise-variant')
  })

  it('requires reviewed canonical metadata and canonical-only references', () => {
    const canonicalIds = new Set(exercises.map((exercise) => exercise.id))
    const validPatterns = new Set([
      'squat', 'hinge', 'hip', 'single', 'adduction', 'hpush', 'vpush',
      'hpull', 'vpull', 'core', 'carry', 'rotation',
    ])

    for (const exercise of exercises) {
      expect(exercise.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(exercise.name.trim()).not.toBe('')
      expect(exercise.englishName.trim()).not.toBe('')
      expect(exercise.aliases).toEqual(expect.any(Array))
      expect(exercise.patternIds.length).toBeGreaterThan(0)
      expect(exercise.patternIds.every((pattern) => validPatterns.has(pattern))).toBe(true)
      expect(exercise.equipment.length).toBeGreaterThan(0)
      expect(exercise.techniqueLevel).toMatch(/^tl[0-4]$/)
      for (const referencedId of [...exercise.regressions, ...exercise.progressions]) {
        expect(canonicalIds.has(referencedId)).toBe(true)
      }
    }
  })

  it.each([
    ['canonical name', (exercise: Exercise) => exercise.name],
    ['English name', (exercise: Exercise) => exercise.englishName],
    ['alias', (exercise: Exercise) => exercise.aliases[0]],
  ])('rejects normalized %s collisions', (_label, conflictingName) => {
    const minimalExercise = (id: string, name: string): Exercise => ({
      id,
      name,
      englishName: `${name} English`,
      aliases: [],
      patternIds: ['core'],
      bodyRegions: [],
      primaryMuscles: [],
      secondaryMuscles: [],
      equipment: ['自重'],
      techniqueLevel: 'tl0',
      goals: [],
      coachCues: [],
      commonErrors: [],
      regressions: [],
      progressions: [],
      contraindications: [],
      riskNotes: [],
    })

    const first = minimalExercise('first', 'Shared Name')
    first.aliases = ['First Alias']
    const second = minimalExercise('second', 'Other Name')
    second.aliases = ['Second Alias']

    if (_label === 'canonical name') second.name = conflictingName(first)
    if (_label === 'English name') second.englishName = conflictingName(first)
    if (_label === 'alias') second.aliases = [conflictingName(first)]

    expect(() => buildExerciseNameIndex([first, second])).toThrow(/Exercise name collision/i)
  })

  it('maps every sled-push context key to one canonical sled-push id', () => {
    const lookup = createProgrammingExerciseLookup(programmingExerciseMappings)
    const sledKeys = [
      'sled-push',
      'sled-push-build',
      'light-sled-push',
      'moderate-sled-push',
      'moderate-high-sled-push',
      'high-control-sled-push',
    ]

    expect(new Set(sledKeys.map((key) => lookup.get(key)))).toEqual(new Set(['sled-push']))
  })

  it('reports duplicate source keys as mapping collisions', () => {
    const duplicate = [
      { exerciseKey: 'row-erg', classification: 'canonical' as const, canonicalExerciseId: 'row-erg' },
      { exerciseKey: 'row-erg', classification: 'programming-context-variant' as const, canonicalExerciseId: 'other-row-erg' },
    ]

    expect(validateProgrammingExerciseMappings(duplicate, new Set(['row-erg', 'other-row-erg']))).toEqual([
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
