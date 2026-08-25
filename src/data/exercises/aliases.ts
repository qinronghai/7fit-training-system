import { exercises } from './exercises'

const normalizeExerciseName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
const exerciseNameIndex = new Map<string, string>()

for (const exercise of exercises) {
  exerciseNameIndex.set(normalizeExerciseName(exercise.name), exercise.id)
  exerciseNameIndex.set(normalizeExerciseName(exercise.englishName), exercise.id)
  for (const alias of exercise.aliases) exerciseNameIndex.set(normalizeExerciseName(alias), exercise.id)
}

export const resolveExerciseId = (name: string) => exerciseNameIndex.get(normalizeExerciseName(name))
