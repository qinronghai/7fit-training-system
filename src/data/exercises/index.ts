export * from './types'
export * from './exercises'
export * from './aliases'
export * from './programmingMap'

import { exercises } from './exercises'
import { createProgrammingExerciseResolver } from './programmingMap'

const programmingExerciseResolver = createProgrammingExerciseResolver(exercises)

export const getExercise = (id: string) => exercises.find((exercise) => exercise.id === id)

export const resolveProgrammingExerciseId = programmingExerciseResolver.resolveId
export const resolveProgrammingExercise = programmingExerciseResolver.resolve
