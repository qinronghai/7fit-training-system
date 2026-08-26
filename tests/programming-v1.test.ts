import { describe, expect, it } from 'vitest'
import type {
  AlternativeExercise,
  ExercisePrescription,
  Laterality,
  ProgramLevel,
  TrainingExercise,
  ProgrammingTemplateLevel,
  TrainingBlock,
} from '../src/data/programming/types'
import { getTrainingExercises } from '../src/data/programming/types'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import {
  auditTemplateLevel,
  auditTemplateSet,
  estimateSessionMinutes,
} from '../src/data/programming/rules'
import { getTemplate } from '../src/data/content'

const typeContractLevel: ProgramLevel = 'l3'

const typeContractPrescription: ExercisePrescription = {
  reps: { min: 6, max: 8 },
  rir: 2,
}

const typeContractAlternative: AlternativeExercise = {
  exerciseKey: 'goblet-squat',
  displayName: '高脚杯深蹲',
  reason: 'member-fit',
  preserves: { primaryGoal: true, movementPattern: true, stimulus: false },
}

const typeContractBlock: TrainingBlock = {
  id: 'strength',
  kind: 'strength',
  label: 'Strength Block',
  exercises: [],
  restBetweenSetsSeconds: 120,
}

const typeContractLevelShape: Pick<ProgrammingTemplateLevel, 'programLevel' | 'primaryGoal'> = {
  programLevel: typeContractLevel,
  primaryGoal: 'type contract',
}

describe('3C Programming V1 type contract', () => {
  it('represents local exercise references and prescription fields', () => {
    expect(typeContractAlternative.exerciseKey).toBe('goblet-squat')
    expect(typeContractPrescription.reps).toEqual({ min: 6, max: 8 })
    expect(typeContractBlock.restBetweenSetsSeconds).toBe(120)
    expect(typeContractLevelShape.programLevel).toBe('l3')
  })
})

describe('3C Programming V1 source shape', () => {
  it('contains exactly the six 3C templates and four levels each', () => {
    expect(threeCTemplates.map((template) => template.id)).toEqual([
      '3c1',
      '3c2',
      '3c3',
      '3c4',
      '3c5',
      '3c6',
    ])
    expect(threeCTemplates.every((template) => Object.keys(template.levels).length === 4)).toBe(true)
  })

  it('uses Programming-local exercise keys instead of generated IDs', () => {
    const keys = threeCTemplates.flatMap((template) => Object.values(template.levels).flatMap((level) => [
      ...level.prep.map((item) => item.exerciseKey),
      ...level.rampUp.map((item) => item.exerciseKey),
      ...level.blocks.flatMap((block) => getTrainingExercises(block).flatMap((item) => [
        item.exerciseKey,
        ...(item.alternatives ?? []).map((alternative) => alternative.exerciseKey),
      ])),
    ]))

    expect(keys.every((key) => key.length > 0 && !/^action-\d+$/.test(key))).toBe(true)
  })
})

const fixtureLevel: ProgrammingTemplateLevel = {
  programLevel: 'l3',
  primaryGoal: 'time estimator fixture',
  prep: [{
    exerciseKey: 'fixture-prep',
    displayName: 'Fixture Prep',
    phase: 'R',
    prescription: { durationSeconds: 60 },
    reason: 'fixture',
  }],
  rampUp: [
    {
      exerciseKey: 'fixture-primary',
      displayName: 'Fixture Primary',
      order: 1,
      reps: 5,
      loadGuidance: 'light',
      restSeconds: 30,
      targetRole: 'PRIMARY',
    },
    {
      exerciseKey: 'fixture-primary',
      displayName: 'Fixture Primary',
      order: 2,
      reps: 3,
      loadGuidance: 'moderate',
      restSeconds: 60,
      targetRole: 'PRIMARY',
    },
  ],
  blocks: [
    {
      id: 'strength',
      kind: 'strength',
      label: 'Strength Block',
      restBetweenSetsSeconds: 120,
      exercises: [{
        exerciseKey: 'fixture-primary',
        displayName: 'Fixture Primary',
        role: 'PRIMARY',
        movementPattern: 'squat',
        fatigueRisk: 'high',
        laterality: 'bilateral',
        restSeconds: 45,
        prescription: { sets: 3, reps: 5, rir: 2 },
      }],
    },
    {
      id: 'circuit',
      kind: 'circuit',
      label: '3C Block',
      rounds: 2,
      restBetweenRoundsSeconds: 90,
      transitionSeconds: 20,
      exercises: [{
        exerciseKey: 'fixture-carry',
        displayName: 'Fixture Carry',
        role: 'CARRY',
        movementPattern: 'carry',
        fatigueRisk: 'moderate',
        laterality: 'unilateral',
        prescription: { distanceMeters: 10 },
      }, {
        exerciseKey: 'fixture-row',
        displayName: 'Fixture Row',
        role: 'SECONDARY',
        movementPattern: 'hpull',
        fatigueRisk: 'low',
        laterality: 'bilateral',
        prescription: { reps: 5 },
      }],
    },
  ],
  estimatedMinutes: { min: 45, max: 55 },
  coachNote: 'fixture',
}

const makeRampTimingLevel = (laterality: Laterality): ProgrammingTemplateLevel => ({
  ...fixtureLevel,
  prep: [],
  rampUp: [{
    exerciseKey: 'fixture-ramp',
    displayName: 'Fixture Ramp',
    order: 1,
    reps: 6,
    loadGuidance: 'light',
    restSeconds: 0,
    targetRole: 'PRIMARY',
    laterality,
  }],
  blocks: [{
    id: 'circuit',
    kind: 'circuit',
    label: 'Circuit Anchor',
    rounds: 1,
    restBetweenRoundsSeconds: 0,
    transitionSeconds: 0,
    exercises: [{
      exerciseKey: 'fixture-anchor',
      displayName: 'Fixture Anchor',
      role: 'SECONDARY',
      movementPattern: 'core',
      laterality: 'bilateral',
      fatigueRisk: 'low',
      prescription: { durationSeconds: 3000 },
    }],
  }],
})

describe('3C Programming V1 static time estimate', () => {
  it('counts unilateral Ramp-up reps on both sides plus a separate reset buffer', () => {
    const bilateral = estimateSessionMinutes(makeRampTimingLevel('bilateral'))
    const unilateral = estimateSessionMinutes(makeRampTimingLevel('unilateral'))

    expect(bilateral.rampUpMinutes).toBeCloseTo((6 * 4 + 15) / 60)
    expect(unilateral.rampUpMinutes).toBeCloseTo((6 * 4 * 2 + 15) / 60)
    expect(unilateral.unilateralAdjustmentMinutes - bilateral.unilateralAdjustmentMinutes).toBeCloseTo(10 / 60)
    expect(unilateral.totalMinutes.max - bilateral.totalMinutes.max).toBeCloseTo((6 * 4 + 10) / 60)
  })

  it('uses action rest before the Strength Block default', () => {
    const estimate = estimateSessionMinutes(fixtureLevel)
    expect(estimate.strengthRestMinutes).toBe(1.5)
  })

  it('counts prep, ramp-up, strength and circuit work separately', () => {
    const estimate = estimateSessionMinutes(fixtureLevel)
    expect(estimate.prepMinutes).toBe(1.25)
    expect(estimate.rampUpMinutes).toBeGreaterThan(0)
    expect(estimate.strengthExecutionMinutes).toBe(1)
    expect(estimate.circuitWorkMinutes).toBeGreaterThan(0)
  })

  it('counts unilateral work for both sides and includes buffers', () => {
    const estimate = estimateSessionMinutes(fixtureLevel)
    expect(estimate.unilateralAdjustmentMinutes).toBeGreaterThan(0)
    expect(estimate.transitionMinutes).toBeGreaterThan(0)
    expect(estimate.roundRestMinutes).toBe(1.5)
    expect(estimate.equipmentBufferMinutes).toBeGreaterThan(0)
    expect(estimate.totalMinutes.max).toBeGreaterThanOrEqual(estimate.totalMinutes.min)
    expect(estimate.totalMinutes.max).toBeCloseTo(
      estimate.prepMinutes
      + estimate.rampUpMinutes
      + estimate.strengthExecutionMinutes
      + estimate.strengthRestMinutes
      + estimate.circuitWorkMinutes
      + estimate.transitionMinutes
      + estimate.roundRestMinutes
      + estimate.unilateralAdjustmentMinutes
      + estimate.equipmentBufferMinutes
      + estimate.planningOverheadMinutes,
      10,
    )
  })

  it('keeps equipment setup separate from private-coaching planning overhead', () => {
    const estimate = estimateSessionMinutes(fixtureLevel)

    expect(estimate.equipmentBufferMinutes).toBeCloseTo((2 * 45 + 3 * 15) / 60)
    expect(estimate.planningOverheadMinutes).toBeGreaterThan(0)
  })
})

const getLevel = (templateId: string, programLevel: ProgramLevel): ProgrammingTemplateLevel => (
  threeCTemplates.find((template) => template.id === templateId)!.levels[programLevel]
)

const validLevel = getLevel('3c1', 'l3')

const withoutPrimary = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  blocks: source.blocks.map((block, blockIndex) => blockIndex === 0
    ? {
      ...block,
      exercises: getTrainingExercises(block).map((item, index) => index === 0
        ? { ...item, role: 'SECONDARY' as const }
        : item),
    }
    : block),
})

const withTooManyPrep = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  prep: [...source.prep, ...source.prep.slice(0, 2)],
})

const withCircuitSets = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  blocks: source.blocks.map((block) => block.kind === 'circuit'
    ? {
      ...block,
      exercises: getTrainingExercises(block).map((item) => ({
        ...item,
        prescription: { ...item.prescription, sets: 2 },
      })),
    }
    : block),
})

const withoutStrengthSets = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  blocks: source.blocks.map((block, blockIndex) => blockIndex === 0
    ? {
      ...block,
      exercises: getTrainingExercises(block).map((item, index) => index === 0
        ? { ...item, prescription: { ...item.prescription, sets: undefined } }
        : item),
    }
    : block),
})

const withHighRiskL3CircuitAction = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  blocks: source.blocks.map((block, blockIndex) => blockIndex === 1 && block.kind === 'circuit'
    ? {
      ...block,
      exercises: getTrainingExercises(block).map((item) => ({ ...item, fatigueRisk: 'high' as const })),
    }
    : block),
})

const withHighRiskL1CircuitAction = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  blocks: source.blocks.map((block) => block.kind === 'circuit'
    ? {
      ...block,
      exercises: getTrainingExercises(block).map((item) => ({ ...item, fatigueRisk: 'high' as const })),
    }
    : block),
})

const withEstimatedMinutes = (
  source: ProgrammingTemplateLevel,
  estimatedMinutes: ProgrammingTemplateLevel['estimatedMinutes'],
): ProgrammingTemplateLevel => ({
  ...source,
  estimatedMinutes,
})

const mutateExercise = (
  templateId: string,
  programLevel: ProgramLevel,
  blockIndex: number,
  exerciseKey: string,
  mutate: (exercise: TrainingExercise) => void,
) => {
  const copy = structuredClone(threeCTemplates)
  const exercise = copy
    .find((template) => template.id === templateId)!
    .levels[programLevel]
    .blocks[blockIndex]
    .exercises
    .filter((item): item is TrainingExercise => 'exerciseKey' in item)
    .find((item) => item.exerciseKey === exerciseKey)!
  mutate(exercise)
  return copy
}

describe('3C Programming V1 audit rules', () => {
  it('accepts all 24 frozen source levels', () => {
    expect(auditTemplateSet(threeCTemplates)).toEqual([])
  })

  it('reports a missing primary exercise', () => {
    expect(auditTemplateLevel(withoutPrimary(validLevel))).toContainEqual(
      expect.objectContaining({ code: 'PRIMARY_COUNT' }),
    )
  })

  it('reports more than four prep items', () => {
    expect(auditTemplateLevel(withTooManyPrep(validLevel))).toContainEqual(
      expect.objectContaining({ code: 'PREP_COUNT' }),
    )
  })

  it('rejects sets on a Circuit exercise', () => {
    expect(auditTemplateLevel(withCircuitSets(validLevel))).toContainEqual(
      expect.objectContaining({ code: 'CIRCUIT_SETS_FORBIDDEN' }),
    )
  })

  it('reports missing sets on a Strength exercise', () => {
    expect(auditTemplateLevel(withoutStrengthSets(validLevel))).toContainEqual(
      expect.objectContaining({ code: 'STRENGTH_SETS_REQUIRED' }),
    )
  })

  it('rejects high-risk actions only in the second L3 Circuit Block', () => {
    const mutated = withHighRiskL3CircuitAction(validLevel)
    expect(getTrainingExercises(mutated.blocks[0]).map((item) => item.fatigueRisk)).toEqual(
      getTrainingExercises(validLevel.blocks[0]).map((item) => item.fatigueRisk),
    )
    expect(auditTemplateLevel(mutated)).toContainEqual(
      expect.objectContaining({ code: 'HIGH_RISK_IN_CIRCUIT' }),
    )
  })

  it('does not ban high-risk actions in an L1 Circuit', () => {
    expect(auditTemplateLevel(withHighRiskL1CircuitAction(getLevel('3c1', 'l1')))).not.toContainEqual(
      expect.objectContaining({ code: 'HIGH_RISK_IN_CIRCUIT' }),
    )
  })

  it('enforces the three frozen special cases', () => {
    expect(getTrainingExercises(getLevel('3c3', 'l1').blocks[0]).map((item) => item.exerciseKey)).not.toContain('low-box-step')
    expect(getTrainingExercises(getLevel('3c3', 'l4').blocks[1]).every((item) => item.prescription.sets === undefined)).toBe(true)
    expect(getLevel('3c6', 'l4').blocks.flatMap(getTrainingExercises).some((item) => /barbell|杠铃/i.test(item.displayName))).toBe(false)
  })

  it('rejects a 3C03 L1 Farmer Carry laterality mutation', () => {
    const mutated = mutateExercise('3c3', 'l1', 0, 'bilateral-farmer-carry', (exercise) => {
      exercise.laterality = 'unilateral'
    })
    expect(auditTemplateSet(mutated)).toContainEqual(expect.objectContaining({
      code: 'SPECIAL_CASE',
      path: expect.stringContaining('3c3/l1'),
    }))
  })

  it('rejects 3C03 L4 Circuit prescription mutations', () => {
    const rdlMutation = mutateExercise('3c3', 'l4', 1, 'double-dumbbell-rdl', (exercise) => {
      exercise.prescription.reps = 20
    })
    const carryMutation = mutateExercise('3c3', 'l4', 1, 'suitcase-carry', (exercise) => {
      exercise.prescription.distanceMeters = 40
    })

    expect(auditTemplateSet(rdlMutation)).toContainEqual(expect.objectContaining({
      code: 'SPECIAL_CASE',
      path: expect.stringContaining('3c3/l4'),
    }))
    expect(auditTemplateSet(carryMutation)).toContainEqual(expect.objectContaining({
      code: 'SPECIAL_CASE',
      path: expect.stringContaining('3c3/l4'),
    }))
  })

  it('rejects 3C06 L4 Strength and Circuit mutations', () => {
    const frontSquatMutation = mutateExercise('3c6', 'l4', 1, 'double-dumbbell-front-squat', (exercise) => {
      exercise.prescription.reps = 20
    })
    const rowRoleMutation = mutateExercise('3c6', 'l4', 0, 'dumbbell-chest-supported-row', (exercise) => {
      exercise.role = 'CARRY'
    })
    const carryLateralityMutation = mutateExercise('3c6', 'l4', 1, 'bilateral-farmer-carry', (exercise) => {
      exercise.laterality = 'unilateral'
    })

    for (const mutated of [frontSquatMutation, rowRoleMutation, carryLateralityMutation]) {
      expect(auditTemplateSet(mutated)).toContainEqual(expect.objectContaining({
        code: 'SPECIAL_CASE',
        path: expect.stringContaining('3c6/l4'),
      }))
    }
  })

  it('uses only the maximum estimate mismatch gates', () => {
    const calculatedMax = estimateSessionMinutes(validLevel).totalMinutes.max
    const maxTooLow = Math.max(0, calculatedMax - 1)
    const maxTooHigh = calculatedMax + 11

    expect(auditTemplateLevel(withEstimatedMinutes(validLevel, {
      min: Math.min(45, maxTooLow),
      max: maxTooLow,
    }))).toContainEqual(expect.objectContaining({ code: 'ESTIMATE_MISMATCH' }))

    expect(auditTemplateLevel(withEstimatedMinutes(validLevel, {
      min: validLevel.estimatedMinutes.min,
      max: maxTooHigh,
    }))).toContainEqual(expect.objectContaining({ code: 'ESTIMATE_MISMATCH' }))

    expect(auditTemplateLevel(withEstimatedMinutes(validLevel, {
      min: 0,
      max: validLevel.estimatedMinutes.max,
    })).filter((issue) => issue.code === 'ESTIMATE_MISMATCH')).toEqual([])
  })
})

describe('3C Programming V1 compatibility adapter', () => {
  it('adapts the new 3C source into the existing App shape', () => {
    const level = getTemplate('3c3')!.levels.l1
    expect(level.warmup.length).toBeGreaterThan(0)
    expect(level.exercises.map((item) => item.name)).toContain('双侧 Farmer Carry')
    expect(level.exercises.map((item) => item.name)).not.toContain('低箱台阶上步')
  })

  it('flattens Strength then 3C in order for the unchanged App', () => {
    const level = getTemplate('3c6')!.levels.l4
    expect(level.exercises[0].name).toContain('双哑铃')
    expect(level.exercises.map((item) => item.name)).toContain('哑铃胸托划船')
  })
})
