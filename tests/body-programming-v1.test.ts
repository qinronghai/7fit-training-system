import { describe, expect, it } from 'vitest'
import {
  isSelectableExerciseSlot,
  isTrainingExercise,
  type SelectableExerciseOption,
  type SelectableExerciseSlot,
  type TrainingExercise,
} from '../src/data/programming/types'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import {
  auditTemplateLevel,
  resolveProgrammingLevel,
} from '../src/data/programming/rules'

const accessoryOption: SelectableExerciseOption = {
  exerciseKey: 'cable-curl',
  displayName: '绳索弯举',
  role: 'ACCESSORY',
  movementPattern: 'hpush',
  laterality: 'bilateral',
  fatigueRisk: 'low',
  prescription: { sets: 2, reps: { min: 10, max: 15 } },
}

const fixedExercise: TrainingExercise = {
  exerciseKey: 'hip-thrust',
  displayName: '臀推',
  role: 'PRIMARY',
  movementPattern: 'hip',
  laterality: 'bilateral',
  fatigueRisk: 'moderate',
  prescription: { sets: 4, reps: { min: 8, max: 10 } },
}

const selectableSlot: SelectableExerciseSlot = {
  kind: 'selectable',
  id: 'body05-arm',
  required: true,
  selectCount: 1,
  defaultOptionKey: accessoryOption.exerciseKey,
  options: [accessoryOption],
}

const secondAccessoryOption: SelectableExerciseOption = {
  exerciseKey: 'cable-triceps-extension',
  displayName: '绳索三头下压',
  role: 'ACCESSORY',
  movementPattern: 'hpush',
  laterality: 'bilateral',
  fatigueRisk: 'low',
  prescription: { sets: 2, reps: { min: 10, max: 15 } },
}

const armSlotWithTwoOptions: SelectableExerciseSlot = {
  ...selectableSlot,
  options: [accessoryOption, secondAccessoryOption],
  allowComplementaryOption: true,
}

const makeSelectableLevel = (
  slot: SelectableExerciseSlot,
): Parameters<typeof auditTemplateLevel>[0] => {
  const source = threeCTemplates.find((template) => template.id === '3c1')!.levels.l3
  return {
    ...source,
    blocks: source.blocks.map((block, blockIndex) => blockIndex === 0
      ? { ...block, exercises: [...block.exercises.slice(0, 2), slot] }
      : block),
  }
}

describe('BODY shared Programming type guards', () => {
  it('distinguishes selectable slots from real TrainingExercise entries', () => {
    expect(isSelectableExerciseSlot(selectableSlot)).toBe(true)
    expect(isSelectableExerciseSlot(fixedExercise)).toBe(false)
    expect(isTrainingExercise(fixedExercise)).toBe(true)
    expect(isTrainingExercise(selectableSlot)).toBe(false)
  })
})

describe('Programming level resolver', () => {
  it('preserves the complete Circuit block shape while resolving exercises', () => {
    const source = threeCTemplates.find((template) => template.id === '3c3')!.levels.l4
    const resolved = resolveProgrammingLevel(source)
    const sourceCircuit = source.blocks[1]
    const resolvedCircuit = resolved.blocks[1]

    expect(resolvedCircuit).toMatchObject({
      id: sourceCircuit.id,
      kind: sourceCircuit.kind,
      label: sourceCircuit.label,
      rounds: sourceCircuit.rounds,
      restBetweenRoundsSeconds: sourceCircuit.restBetweenRoundsSeconds,
      transitionSeconds: sourceCircuit.transitionSeconds,
    })
    expect(resolvedCircuit.exercises.map((exercise) => exercise.exerciseKey)).toEqual(
      sourceCircuit.exercises.map((exercise) => ('exerciseKey' in exercise ? exercise.exerciseKey : 'slot')),
    )
    expect(resolved.exercises.map((exercise) => exercise.exerciseKey)).toEqual(
      source.blocks.flatMap((block) => block.exercises)
        .filter((entry): entry is TrainingExercise => 'exerciseKey' in entry)
        .map((exercise) => exercise.exerciseKey),
    )
  })

  it('resolves the default and explicit selectable option without silent fallback', () => {
    const source = makeSelectableLevel(armSlotWithTwoOptions)
    const defaultResolved = resolveProgrammingLevel(source)
    const explicitResolved = resolveProgrammingLevel(source, {
      selectable: { [armSlotWithTwoOptions.id]: secondAccessoryOption.exerciseKey },
    })

    expect(defaultResolved.selections[armSlotWithTwoOptions.id]).toBe(accessoryOption.exerciseKey)
    expect(defaultResolved.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toContain(accessoryOption.exerciseKey)
    expect(explicitResolved.selections[armSlotWithTwoOptions.id]).toBe(secondAccessoryOption.exerciseKey)
    expect(explicitResolved.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toContain(secondAccessoryOption.exerciseKey)
    expect(() => resolveProgrammingLevel(source, {
      selectable: { [armSlotWithTwoOptions.id]: 'not-approved' },
    })).toThrow(/not-approved/)
  })

  it('appends the unique complementary option in either selection direction', () => {
    const source = makeSelectableLevel(armSlotWithTwoOptions)
    const selectedA = resolveProgrammingLevel(source, {
      includeComplementaryOption: true,
      selectable: { [armSlotWithTwoOptions.id]: accessoryOption.exerciseKey },
    })
    const selectedB = resolveProgrammingLevel(source, {
      includeComplementaryOption: true,
      selectable: { [armSlotWithTwoOptions.id]: secondAccessoryOption.exerciseKey },
    })

    expect(selectedA.complementaryIncluded).toBe(true)
    expect(selectedA.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toEqual(expect.arrayContaining([
      accessoryOption.exerciseKey,
      secondAccessoryOption.exerciseKey,
    ]))
    expect(selectedB.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toEqual(expect.arrayContaining([
      accessoryOption.exerciseKey,
      secondAccessoryOption.exerciseKey,
    ]))
  })
})

describe('Selectable/complementary slot invariants', () => {
  it.each([
    ['one option', [accessoryOption]],
    ['three options', [accessoryOption, secondAccessoryOption, { ...accessoryOption, exerciseKey: 'cable-lateral-raise' }]],
    ['duplicate exercise keys', [accessoryOption, { ...secondAccessoryOption, exerciseKey: accessoryOption.exerciseKey }]],
  ])('hard-fails a complementary slot with %s', (_label, options) => {
    const slot: SelectableExerciseSlot = { ...armSlotWithTwoOptions, options }
    expect(auditTemplateLevel(makeSelectableLevel(slot))).toContainEqual(
      expect.objectContaining({ code: 'COMPLEMENTARY_SLOT_INVALID' }),
    )
  })
})
