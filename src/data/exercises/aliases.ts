import type { Exercise } from './types'
import { exercises } from './exercises'

export const normalizeExerciseName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

export const buildExerciseNameIndex = (exerciseList: readonly Exercise[]) => {
  const index = new Map<string, string>()

  const addName = (name: string, exerciseId: string) => {
    const normalizedName = normalizeExerciseName(name)
    const existingId = index.get(normalizedName)

    if (existingId && existingId !== exerciseId) {
      throw new Error(
        `Exercise name collision for "${normalizedName}": ${existingId} vs ${exerciseId}`,
      )
    }

    index.set(normalizedName, exerciseId)
  }

  for (const exercise of exerciseList) {
    addName(exercise.name, exercise.id)
    addName(exercise.englishName, exercise.id)
    for (const alias of exercise.aliases) addName(alias, exercise.id)
  }

  return index
}

const exerciseNameIndex = buildExerciseNameIndex(exercises)

export const resolveExerciseId = (name: string) => exerciseNameIndex.get(normalizeExerciseName(name))
