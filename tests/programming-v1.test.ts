import { describe, expect, it } from 'vitest'
import type {
  AlternativeExercise,
  ExercisePrescription,
  ProgramLevel,
  ProgrammingTemplateLevel,
  TrainingBlock,
} from '../src/data/programming/types'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'

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
