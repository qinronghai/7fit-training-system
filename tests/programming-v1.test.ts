import { describe, expect, it } from 'vitest'
import type {
  AlternativeExercise,
  ExercisePrescription,
  ProgramLevel,
  ProgrammingTemplateLevel,
  TrainingBlock,
} from '../src/data/programming/types'

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
