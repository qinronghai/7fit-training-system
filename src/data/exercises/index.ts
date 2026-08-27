import type { ExerciseDisplayCategoryId } from './types'

export * from './types'
export * from './exercises'
export * from './aliases'
export * from './programmingMap'

export const exerciseDisplayCategoryLabels: Record<ExerciseDisplayCategoryId, string> = {
  lower: '下肢',
  glute: '臀部',
  pull: '上肢拉',
  push: '上肢推',
  shoulder: '肩部',
  arms: '手臂',
  core: '核心',
  carry: '负重移动',
  power: '爆发力',
  conditioning: '体能',
  mobility: '活动度 / 准备',
}

import { exercises } from './exercises'
import { createProgrammingExerciseResolver } from './programmingMap'

const programmingExerciseResolver = createProgrammingExerciseResolver(exercises)

export const getExercise = (id: string) => exercises.find((exercise) => exercise.id === id)

export const resolveProgrammingExerciseId = programmingExerciseResolver.resolveId
export const resolveProgrammingExercise = programmingExerciseResolver.resolve
