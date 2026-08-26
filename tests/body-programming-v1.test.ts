import { describe, expect, it } from 'vitest'
import {
  isSelectableExerciseSlot,
  isTrainingExercise,
  type SelectableExerciseOption,
  type SelectableExerciseSlot,
  type TrainingExercise,
} from '../src/data/programming/types'

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

describe('BODY shared Programming type guards', () => {
  it('distinguishes selectable slots from real TrainingExercise entries', () => {
    expect(isSelectableExerciseSlot(selectableSlot)).toBe(true)
    expect(isSelectableExerciseSlot(fixedExercise)).toBe(false)
    expect(isTrainingExercise(fixedExercise)).toBe(true)
    expect(isTrainingExercise(selectableSlot)).toBe(false)
  })
})

