import { describe, expect, it } from 'vitest'
import type { Exercise } from '../src/data/exercises/types'
import { isSelectableExerciseSlot } from '../src/data/programming/types'
import type { ProgrammingTemplate } from '../src/data/programming/types'
import {
  buildExerciseNameIndex,
  createProgrammingExerciseResolver,
  exercises,
  exerciseDisplayCategoryLabels,
  getExercise,
  resolveExerciseId,
  resolveProgrammingExercise,
  resolveProgrammingExerciseId,
} from '../src/data/exercises'
import { bodyTemplates } from '../src/data/programming/bodyTemplates'
import { conditioningTemplates } from '../src/data/programming/conditioningTemplates'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import {
  createProgrammingExerciseLookup,
  programmingIdentityDecisions,
  programmingExerciseMappings,
  validateProgrammingExerciseMappings,
} from '../src/data/exercises/programmingMap'
import {
  buildBodyScenarioSet,
  getProgrammingExerciseUsages,
  getProgrammingExerciseUsagesByScenario,
  programmingExerciseUsages,
  programmingUsageScenarios,
} from '../src/data/exercises/programmingUsage'
import { resolveProgrammingLevel } from '../src/data/programming/rules'

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
    expect(resolveExerciseId('低位鸭步')).toBe('duck-walk')
    expect(resolveExerciseId('Side Plank')).toBe('side-plank')
    expect(resolveExerciseId('Pilates Criss-Cross')).toBe('pilates-criss-cross')
  })

  it('keeps load descriptors out of canonical kettlebell halo identity', () => {
    expect(getExercise('kettlebell-halo')).toMatchObject({
      id: 'kettlebell-halo',
      name: '壶铃绕头',
      englishName: 'Kettlebell Halo',
    })
    expect(getExercise('light-kettlebell-halo')).toBeUndefined()
    expect(resolveProgrammingExerciseId('light-kettlebell-halo')).toBe('kettlebell-halo')
  })

  it('assigns every canonical Exercise an explicit display taxonomy category', () => {
    const resolvedCanonicalExpectations = [
      ['duck-walk', '低位鸭步', 'Duck Walk', 'lower'],
      ['side-lying-hip-adduction', '侧卧髋内收', 'Side-Lying Hip Adduction', 'lower'],
      ['high-plank-step-through', '高位平板前跨步', 'High Plank Step-Through', 'core'],
      ['side-plank', '侧平板支撑', 'Side Plank', 'core'],
      ['pilates-single-leg-stretch', '普拉提单腿伸展', 'Pilates Single-Leg Stretch', 'core'],
      ['pilates-double-leg-stretch', '普拉提双腿伸展', 'Pilates Double-Leg Stretch', 'core'],
      ['pilates-criss-cross', '普拉提十字交叉', 'Pilates Criss-Cross', 'core'],
      ['single-leg-glute-bridge', '单腿臀桥', 'Single-Leg Glute Bridge', 'glute'],
      ['standing-march', '站立抬膝', 'Standing March', 'lower'],
    ] as const

    expect(exercises).toHaveLength(104)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(104)
    for (const [id, name, englishName, displayCategoryId] of resolvedCanonicalExpectations) {
      const exercise = exercises.find((candidate) => candidate.id === id)
      expect(exercise).toMatchObject({
        id,
        name,
        englishName,
        displayCategoryId,
      })
      expect(resolveExerciseId(name)).toBe(id)
      expect(resolveExerciseId(englishName)).toBe(id)
      expect(exercise?.patternIds.length).toBeGreaterThan(0)
      expect(exercise?.equipment.length).toBeGreaterThan(0)
      expect(exercise?.techniqueLevel).toMatch(/^tl[0-4]$/)
    }
    for (const exercise of exercises) {
      expect(exercise.displayCategoryId).toBeDefined()
      expect(exerciseDisplayCategoryLabels[exercise.displayCategoryId]).toBeTruthy()
    }
  })

  it('adds the three frozen E4C canonical exercises with stable names and metadata', () => {
    const frozenE4CExercises = [
      ['deadlift-to-overhead-press', '硬拉推肩', 'Deadlift to Overhead Press', 'shoulder', ['hinge', 'vpush']],
      ['shin-box-hip-lift', '胫骨箱顶髋', 'Shin Box Hip Lift', 'mobility', ['hip', 'rotation']],
      ['cross-body-plank-knee-drive', '高位平板对侧提膝', 'Cross-Body Plank Knee Drive', 'core', ['core', 'rotation']],
    ] as const

    expect(exercises).toHaveLength(104)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(104)

    for (const [id, name, englishName, displayCategoryId, patternIds] of frozenE4CExercises) {
      const exercise = getExercise(id)

      expect(exercise).toMatchObject({
        id,
        name,
        englishName,
        displayCategoryId,
        patternIds,
      })
      expect(resolveExerciseId(name)).toBe(id)
      expect(resolveExerciseId(englishName)).toBe(id)
    }
  })

  it('keeps canonical display taxonomy independent from contextual movement patterns', () => {
    expect(getExercise('sled-push')).toMatchObject({
      id: 'sled-push',
      displayCategoryId: 'conditioning',
      patternIds: ['hpush'],
    })
  })
})

describe('V6.1 Programming exercise mapping contract', () => {
  it('inventories the complete formal Programming key scope', () => {
    const keys = formalProgrammingExerciseKeys()

    expect(keys.size).toBe(176)
    expect(new Set([...keys].filter((key) => key.startsWith('action-')))).toEqual(new Set())
    expect(programmingExerciseMappings).toHaveLength(176)
    expect(programmingExerciseUsages).toHaveLength(832)
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
      displayCategoryId: 'core',
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

  it('resolves every formal Programming key through the production resolver', () => {
    for (const exerciseKey of formalProgrammingExerciseKeys()) {
      const exerciseId = resolveProgrammingExerciseId(exerciseKey)
      expect(resolveProgrammingExercise(exerciseKey).id).toBe(exerciseId)
    }
  })

  it('hard-fails for an unknown Programming key', () => {
    expect(() => resolveProgrammingExerciseId('not-a-formal-programming-key')).toThrow(
      'Unknown Programming exerciseKey: not-a-formal-programming-key',
    )
  })

  it('hard-fails a resolver whose mapping targets an unknown canonical Exercise', () => {
    expect(() => createProgrammingExerciseResolver(exercises, [
      { exerciseKey: 'row-erg', classification: 'canonical', canonicalExerciseId: 'missing-exercise' },
    ])).toThrow('Invalid Programming exercise mapping')
  })

  it('does not use display names, aliases, or registry order for identity resolution', () => {
    const renamedRegistry = exercises.map((exercise) => ({
      ...exercise,
      name: exercise.id === 'row-erg' ? '已改名的划船器械' : exercise.name,
      aliases: exercise.id === 'row-erg' ? [] : exercise.aliases,
    }))
    const resolver = createProgrammingExerciseResolver([...renamedRegistry].reverse())

    expect(resolver.resolveId('row-erg')).toBe('row-erg')
    expect(resolver.resolve('row-erg').name).toBe('已改名的划船器械')
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

describe('V6.1 non-lossy Programming Usage index', () => {
  const expectedScenarioIds = [
    ...['3c1', '3c2', '3c3', '3c4', '3c5', '3c6'].flatMap((templateId) => (
      ['l1', 'l2', 'l3', 'l4'].map((level) => `${templateId}/${level}/default`)
    )),
    ...['body1', 'body2', 'body3', 'body4'].flatMap((templateId) => (
      ['l1', 'l2', 'l3', 'l4'].map((level) => `${templateId}/${level}/default`)
    )),
    ...['l1', 'l2', 'l3', 'l4'].flatMap((level) => [
      `body5/${level}/default`,
      `body5/${level}/rope-triceps-pressdown`,
      `body5/${level}/default-with-complementary`,
      `body5/${level}/rope-triceps-pressdown-with-complementary`,
    ]),
    ...['con1', 'con2', 'con4'].flatMap((templateId) => (
      ['l1', 'l2', 'l3', 'l4'].map((level) => `${templateId}/${level}/default`)
    )),
    'con5/l1/default',
    'con5/l2/default',
    'con5/l4/default',
    'con3/l1/default',
    'con3/l2/default',
    'con3/l3/medicine-ball',
    'con3/l3/swing',
    'con3/l4/foundation',
    'con3/l4/swing',
    'con3/l4/rotational',
    'con5/l3/standard-3',
    'con5/l3/conditional-4',
  ]

  it('indexes exactly 80 deterministic legal scenarios', () => {
    expect(programmingUsageScenarios).toHaveLength(80)
    expect(new Set(programmingUsageScenarios.map((scenario) => scenario.scenarioId)).size).toBe(80)
    expect(new Set(programmingUsageScenarios.map((scenario) => scenario.scenarioId)).size).toBe(expectedScenarioIds.length)
    expect(new Set(programmingUsageScenarios.map((scenario) => scenario.scenarioId))).toEqual(new Set(expectedScenarioIds))
  })

  it('indexes only valid canonical identities and preserves scenario membership', () => {
    const canonicalIds = new Set(exercises.map((exercise) => exercise.id))
    const scenarioIds = new Set(programmingUsageScenarios.map((scenario) => scenario.scenarioId))

    expect(programmingExerciseUsages.length).toBeGreaterThan(0)
    for (const usage of programmingExerciseUsages) {
      expect(canonicalIds.has(usage.exerciseId)).toBe(true)
      expect(scenarioIds.has(usage.scenarioId)).toBe(true)
      expect(usage.exerciseKey).toMatch(/^(?!action-\d+$).+/)
    }
  })

  it('accounts for every resolved prep, build-up, ramp-up, and training action', () => {
    const templates = [...threeCTemplates, ...bodyTemplates, ...conditioningTemplates]
    for (const scenario of programmingUsageScenarios) {
      const template = templates.find((candidate) => candidate.id === scenario.templateId)!
      const level = template.levels[scenario.programLevel]
      const resolved = resolveProgrammingLevel(level, scenario.selection)
      const actual = [
        ...resolved.prep.map((item) => ({ kind: 'prep', exerciseKey: item.exerciseKey, prescription: item.prescription })),
        ...(resolved.specificBuildUp ?? []).map((item) => ({ kind: 'specific-build-up', exerciseKey: item.exerciseKey, prescription: item.prescription })),
        ...resolved.rampUp.map((item) => ({ kind: 'ramp-up', exerciseKey: item.exerciseKey, prescription: { reps: item.reps } })),
        ...resolved.blocks.flatMap((block) => block.exercises.map((item) => ({ kind: 'training', exerciseKey: item.exerciseKey, prescription: item.prescription }))),
      ]
      const indexed = getProgrammingExerciseUsagesByScenario(scenario.scenarioId)
        .map((item) => ({
          kind: item.kind,
          exerciseKey: item.exerciseKey,
          prescription: item.kind === 'ramp-up' ? { reps: item.reps } : item.prescription,
        }))

      expect(indexed).toEqual(actual)
    }
  })

  it('preserves Programming roles, preparation phases, and structured prescriptions', () => {
    const training = programmingExerciseUsages.filter((usage) => usage.kind === 'training')
    expect(new Set(training.map((usage) => usage.programmingRole))).toEqual(new Set([
      'PRIMARY', 'SECONDARY', 'UNILATERAL', 'ACCESSORY', 'CORE', 'CARRY', 'POWER', 'CONDITIONING',
    ]))
    expect(new Set(programmingExerciseUsages.filter((usage) => usage.kind === 'prep').map((usage) => usage.phase))).toEqual(new Set(['R', 'M', 'A', 'P']))
    expect(programmingExerciseUsages.some((usage) => usage.kind === 'specific-build-up')).toBe(true)
    expect(programmingExerciseUsages.some((usage) => usage.kind === 'ramp-up')).toBe(true)
    expect(training.some((usage) => usage.prescription.sets !== undefined || usage.prescription.reps !== undefined || usage.prescription.distanceMeters !== undefined)).toBe(true)
    expect(training.every((usage) => !('role' in usage))).toBe(true)
  })

  it('preserves BODY selectable and complementary scenarios', () => {
    for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
      const defaultScenario = getProgrammingExerciseUsagesByScenario(`body5/${level}/default`)
      const complementaryScenario = getProgrammingExerciseUsagesByScenario(`body5/${level}/default-with-complementary`)
      expect(defaultScenario.filter((usage) => usage.kind === 'training')).toHaveLength(5)
      expect(complementaryScenario.filter((usage) => usage.kind === 'training')).toHaveLength(6)
      expect(complementaryScenario.some((usage) => usage.exerciseKey === 'rope-triceps-pressdown')).toBe(true)
    }
  })

  it('preserves all CON03 Power paths and CON05 L3 round paths', () => {
    expect(getProgrammingExerciseUsagesByScenario('con3/l3/medicine-ball').some((usage) => usage.exerciseKey === 'medicine-ball-slam')).toBe(true)
    expect(getProgrammingExerciseUsagesByScenario('con3/l3/swing').some((usage) => usage.exerciseKey === 'kb-swing')).toBe(true)
    expect(getProgrammingExerciseUsagesByScenario('con3/l4/foundation').some((usage) => usage.exerciseKey === 'medicine-ball-slam')).toBe(true)
    expect(getProgrammingExerciseUsagesByScenario('con3/l4/swing').some((usage) => usage.exerciseKey === 'kb-swing')).toBe(true)
    expect(getProgrammingExerciseUsagesByScenario('con3/l4/rotational').some((usage) => usage.exerciseKey === 'rotational-throw')).toBe(true)

    const standard = getProgrammingExerciseUsagesByScenario('con5/l3/standard-3')
    const conditional = getProgrammingExerciseUsagesByScenario('con5/l3/conditional-4')
    expect(new Set(standard.filter((usage) => usage.kind === 'training').map((usage) => usage.rounds))).toEqual(new Set([3]))
    expect(new Set(conditional.filter((usage) => usage.kind === 'training').map((usage) => usage.rounds))).toEqual(new Set([4]))
  })

  it('preserves sled-push contextual Programming semantics under one canonical identity', () => {
    const sledUsages = getProgrammingExerciseUsages('sled-push')
    expect(sledUsages.length).toBeGreaterThan(0)
    expect(sledUsages.every((usage) => usage.exerciseId === 'sled-push')).toBe(true)
    expect(sledUsages.some((usage) => usage.kind === 'training' && usage.templateId === '3c4' && usage.movementPattern === 'hinge')).toBe(true)
    expect(sledUsages.some((usage) => usage.kind === 'training' && usage.templateId === 'con2' && usage.movementPattern === 'hpush')).toBe(true)
  })

  it('keeps selectable scenario identities stable when slot order changes', () => {
    const body5 = bodyTemplates.find((template) => template.id === 'body5')!
    const baseBlock = body5.levels.l1.blocks[0]
    const selectableSlots = baseBlock.exercises.filter(isSelectableExerciseSlot)
    expect(selectableSlots).toHaveLength(1)
    const firstSlot = selectableSlots[0]
    const secondSlot = {
      ...firstSlot,
      id: 'body5-arm-secondary',
    }
    const templateWithOrderedSlots = {
      ...body5,
      levels: {
        ...body5.levels,
        l1: {
          ...body5.levels.l1,
          blocks: [{ ...baseBlock, exercises: [firstSlot, secondSlot] }],
        },
      },
    } as ProgrammingTemplate
    const templateWithReorderedSlots = {
      ...templateWithOrderedSlots,
      levels: {
        ...templateWithOrderedSlots.levels,
        l1: {
          ...templateWithOrderedSlots.levels.l1,
          blocks: [{ ...baseBlock, exercises: [secondSlot, firstSlot] }],
        },
      },
    } as ProgrammingTemplate

    const ordered = buildBodyScenarioSet(templateWithOrderedSlots, 'l1').map((scenario) => scenario.scenarioId)
    const reordered = buildBodyScenarioSet(templateWithReorderedSlots, 'l1').map((scenario) => scenario.scenarioId)

    expect(reordered).toEqual(ordered)
  })
})
