import { describe, expect, it } from 'vitest'
import type {
  AlternativeExercise,
  ExercisePrescription,
  ProgramLevel,
  ProgrammingTemplateLevel,
  TrainingBlock,
} from '../src/data/programming/types'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import {
  auditTemplateLevel,
  auditTemplateSet,
  estimateSessionMinutes,
} from '../src/data/programming/rules'

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
      ...level.blocks.flatMap((block) => block.exercises.flatMap((item) => [
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

describe('3C Programming V1 static time estimate', () => {
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
      + estimate.equipmentBufferMinutes,
      10,
    )
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
      exercises: block.exercises.map((item, index) => index === 0
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
      exercises: block.exercises.map((item) => ({
        ...item,
        prescription: { ...item.prescription, sets: 2 },
      })),
    }
    : block),
})

const withHighRiskL3CircuitAction = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  blocks: source.blocks.map((block, blockIndex) => blockIndex === 1 && block.kind === 'circuit'
    ? {
      ...block,
      exercises: block.exercises.map((item) => ({ ...item, fatigueRisk: 'high' as const })),
    }
    : block),
})

const withHighRiskL1CircuitAction = (source: ProgrammingTemplateLevel): ProgrammingTemplateLevel => ({
  ...source,
  blocks: source.blocks.map((block) => block.kind === 'circuit'
    ? {
      ...block,
      exercises: block.exercises.map((item) => ({ ...item, fatigueRisk: 'high' as const })),
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

  it('rejects high-risk actions only in the second L3 Circuit Block', () => {
    const mutated = withHighRiskL3CircuitAction(validLevel)
    expect(mutated.blocks[0].exercises.map((item) => item.fatigueRisk)).toEqual(
      validLevel.blocks[0].exercises.map((item) => item.fatigueRisk),
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
    expect(getLevel('3c3', 'l1').blocks[0].exercises.map((item) => item.exerciseKey)).not.toContain('low-box-step')
    expect(getLevel('3c3', 'l4').blocks[1].exercises.every((item) => item.prescription.sets === undefined)).toBe(true)
    expect(getLevel('3c6', 'l4').blocks.flatMap((block) => block.exercises).some((item) => /barbell|杠铃/i.test(item.displayName))).toBe(false)
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
