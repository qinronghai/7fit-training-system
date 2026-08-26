import { describe, expect, it } from 'vitest'
import {
  isSelectableExerciseSlot,
  isTrainingExercise,
  type Count,
  type ExercisePrescription,
  type ProgrammingTemplateLevel,
  type SelectableExerciseOption,
  type SelectableExerciseSlot,
  type TrainingExercise,
} from '../src/data/programming/types'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import {
  audit3CTemplateLevel,
  audit3CTemplateSet,
  auditBodyTemplateLevel,
  auditProgrammingTemplateSet,
  auditSharedTemplateLevel,
  auditTemplateSet,
  auditTemplateLevel,
  calculateWorkingSetEstimate,
  estimateSessionMinutes,
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

const bodyExercise = (
  exerciseKey: string,
  role: TrainingExercise['role'],
  sets: Count,
  prescription: ExercisePrescription = { reps: 10 },
): TrainingExercise => ({
  exerciseKey,
  displayName: exerciseKey,
  role,
  movementPattern: role === 'PRIMARY' ? 'squat' : 'hpull',
  laterality: 'bilateral',
  fatigueRisk: role === 'PRIMARY' ? 'high' : 'low',
  prescription: { ...prescription, sets },
})

const bodyFixtureLevel: ProgrammingTemplateLevel = {
  programLevel: 'l2',
  primaryGoal: 'BODY working set fixture',
  prep: [
    {
      exerciseKey: 'body-prep-raise',
      displayName: 'Body Prep Raise',
      phase: 'R',
      prescription: { durationSeconds: 60 },
      reason: 'fixture',
    },
    {
      exerciseKey: 'body-prep-pattern',
      displayName: 'Body Prep Pattern',
      phase: 'P',
      prescription: { reps: 5 },
      reason: 'fixture',
    },
  ],
  rampUp: [{
    exerciseKey: 'body-primary',
    displayName: 'body-primary',
    order: 1,
    reps: 5,
    loadGuidance: 'light',
    restSeconds: 30,
    targetRole: 'PRIMARY',
  }],
  blocks: [{
    id: 'strength',
    kind: 'strength',
    label: 'Strength / Volume',
    restBetweenSetsSeconds: 90,
    exercises: [
      bodyExercise('body-primary', 'PRIMARY', 4, { reps: 8 }),
      bodyExercise('body-secondary', 'SECONDARY', 3),
      bodyExercise('body-accessory', 'ACCESSORY', 3),
      {
        kind: 'selectable',
        id: 'body-arm',
        required: true,
        selectCount: 1,
        defaultOptionKey: accessoryOption.exerciseKey,
        options: [
          { ...accessoryOption, prescription: { sets: 2, reps: 12 } },
          { ...secondAccessoryOption, prescription: { sets: 2, reps: 12 } },
        ],
        allowComplementaryOption: true,
        complementaryCondition: {
          maxTotalWorkingSets: 16,
          maxCalculatedSessionMinutes: 60,
          coachCondition: 'readiness-permits',
          coachNote: 'Only add the complementary arm exercise when recovery permits.',
        },
      },
    ],
  }],
  estimatedMinutes: { min: 40, max: 45 },
  coachNote: 'fixture',
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

describe('Programming audit scope separation', () => {
  it('keeps the legacy 3C level audit API as the 3C-specific audit', () => {
    const source = threeCTemplates.find((template) => template.id === '3c1')!.levels.l1
    expect(auditTemplateLevel(source)).toEqual(audit3CTemplateLevel(source))
  })

  it('keeps the legacy 3C set audit API as the 3C-specific audit', () => {
    expect(auditTemplateSet(threeCTemplates)).toEqual(audit3CTemplateSet(threeCTemplates))
  })

  it('dispatches the shared Programming set audit by system', () => {
    expect(auditProgrammingTemplateSet(threeCTemplates)).toEqual(audit3CTemplateSet(threeCTemplates))
  })

  it('accepts a Primary-targeted ramp-up as Pattern preparation', () => {
    const source = threeCTemplates.find((template) => template.id === '3c1')!.levels.l1
    const withoutPatternPrep = {
      ...source,
      prep: source.prep.filter((item) => item.phase !== 'P'),
    }

    expect(auditSharedTemplateLevel(withoutPatternPrep)).not.toContainEqual(
      expect.objectContaining({ code: 'PATTERN_PREP_REQUIRED' }),
    )
  })
})

describe('BODY working-set audit', () => {
  it('preserves min/max when a prescription uses a set range', () => {
    const ranged = {
      ...bodyFixtureLevel,
      blocks: bodyFixtureLevel.blocks.map((block) => ({
        ...block,
        exercises: block.exercises.map((entry) => (
          'exerciseKey' in entry && entry.role === 'PRIMARY'
            ? { ...entry, prescription: { ...entry.prescription, sets: { min: 3, max: 4 } } }
            : entry
        )),
      })),
    }

    expect(calculateWorkingSetEstimate(ranged)).toEqual({ min: 11, max: 12 })
  })

  it('resolves selectable scenarios before calculating session time', () => {
    const selected = estimateSessionMinutes(bodyFixtureLevel, {
      selectable: { 'body-arm': accessoryOption.exerciseKey },
    })
    const withComplementary = estimateSessionMinutes(bodyFixtureLevel, {
      selectable: { 'body-arm': accessoryOption.exerciseKey },
      includeComplementaryOption: true,
    })

    expect(withComplementary.equipmentBufferMinutes).toBeGreaterThan(selected.equipmentBufferMinutes)
    expect(withComplementary.strengthExecutionMinutes).toBeGreaterThan(selected.strengthExecutionMinutes)
    expect(withComplementary.totalMinutes.max).toBeGreaterThanOrEqual(selected.totalMinutes.max)
  })

  it('calculates total working sets from the resolved selection as a NumericRange', () => {
    const selected = calculateWorkingSetEstimate(bodyFixtureLevel, {
      selectable: { 'body-arm': accessoryOption.exerciseKey },
    })
    const withComplementary = calculateWorkingSetEstimate(bodyFixtureLevel, {
      selectable: { 'body-arm': accessoryOption.exerciseKey },
      includeComplementaryOption: true,
    })

    expect(selected).toEqual({ min: 12, max: 12 })
    expect(withComplementary).toEqual({ min: 14, max: 14 })
  })

  it('audits BODY structure and resolved selectable scenarios', () => {
    expect(auditBodyTemplateLevel(bodyFixtureLevel)).toEqual([])
  })

  it('hard-fails a BODY level outside the 12–16 total working-set range', () => {
    const tooMuch = {
      ...bodyFixtureLevel,
      blocks: bodyFixtureLevel.blocks.map((block) => ({
        ...block,
        exercises: block.exercises.map((entry) => (
          'exerciseKey' in entry && entry.role !== 'PRIMARY'
            ? { ...entry, prescription: { ...entry.prescription, sets: 5 } }
            : entry
        )),
      })),
    }

    expect(auditBodyTemplateLevel(tooMuch)).toContainEqual(
      expect.objectContaining({ code: 'WORKING_SET_RANGE' }),
    )
  })

  it('rejects Circuit blocks in BODY', () => {
    const circuitBody = {
      ...bodyFixtureLevel,
      blocks: bodyFixtureLevel.blocks.map((block) => ({ ...block, kind: 'circuit' as const })),
    }

    expect(auditBodyTemplateLevel(circuitBody)).toContainEqual(
      expect.objectContaining({ code: 'BODY_CIRCUIT_FORBIDDEN' }),
    )
  })
})
