export * from './types'
export * from './exercises'
export * from './aliases'

import { exercises } from './exercises'

export const getExercise = (id: string) => exercises.find((exercise) => exercise.id === id)
