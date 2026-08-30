import { getLibraryActionsByExerciseId } from '../content'
import { exerciseDisplayCategoryLabels, getExercise, type Exercise } from '../exercises'
import type { Count, ExercisePrescription, NumericRange } from '../programming/types'
import type {
  Female111TemplateAction,
  Female111TemplatePrep,
  Female111TemplateRampUp,
  Female111TemplateRole,
} from './templateTypes'

type Female111DisplayAction = Female111TemplatePrep | Female111TemplateRampUp | Female111TemplateAction

const countText = (value: Count | undefined): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value === 'number') return String(value)
  return value.min === value.max ? String(value.min) : `${value.min}-${value.max}`
}

export const formatFemale111Range = (value: NumericRange, unit = ''): string => {
  const min = Number.isInteger(value.min) ? String(value.min) : value.min.toFixed(1)
  const max = Number.isInteger(value.max) ? String(value.max) : value.max.toFixed(1)
  return value.min === value.max ? `${min}${unit}` : `${min}-${max}${unit}`
}

export const formatFemale111Prescription = (prescription: ExercisePrescription & { tempo?: string; rom?: string }): string => {
  const workDose = [
    countText(prescription.reps) ? `${countText(prescription.reps)} 次` : undefined,
    countText(prescription.durationSeconds) ? `${countText(prescription.durationSeconds)} 秒` : undefined,
    countText(prescription.distanceMeters) ? `${countText(prescription.distanceMeters)} 米` : undefined,
  ].filter(Boolean).join(' / ')

  return [
    countText(prescription.sets) && workDose ? `${countText(prescription.sets)} 组 x ${workDose}` : undefined,
    countText(prescription.sets) && !workDose ? `${countText(prescription.sets)} 组` : undefined,
    !countText(prescription.sets) && workDose ? workDose : undefined,
    countText(prescription.rir) ? `RIR ${countText(prescription.rir)}` : undefined,
    countText(prescription.rpe) ? `RPE ${countText(prescription.rpe)}` : undefined,
    prescription.tempo ? `节奏 ${prescription.tempo}` : undefined,
    prescription.rom ? `范围 ${prescription.rom}` : undefined,
  ].filter(Boolean).join(' · ')
}

export const getFemale111ExerciseDisplay = (exerciseId: string): {
  exercise?: Exercise
  name: string
  category: string
  equipment: string
  techniqueLevel: string
  libraryHref: string
} => {
  const exercise = getExercise(exerciseId)
  if (!exercise) {
    return {
      name: '动作不存在',
      category: '未知分类',
      equipment: '未知器械',
      techniqueLevel: '未知技术等级',
      libraryHref: '#/library',
    }
  }

  const libraryAction = getLibraryActionsByExerciseId(exercise.id)[0]
  return {
    exercise,
    name: exercise.name,
    category: exerciseDisplayCategoryLabels[exercise.displayCategoryId],
    equipment: exercise.equipment.join(' / '),
    techniqueLevel: exercise.techniqueLevel.toUpperCase(),
    libraryHref: libraryAction ? `#/library/action/${libraryAction.id}` : `#/library/${exercise.displayCategoryId}`,
  }
}

export const getFemale111TemplateRoleLabel = (role: Female111TemplateRole): string => ({
  PRIMARY: '主训练',
  SUPPORT: '支持',
  CORE: '核心控制',
  ACCESSORY: '辅助',
})[role]

export const getFemale111LateralityLabel = (laterality: Female111DisplayAction['laterality']): string => (
  laterality === 'unilateral' ? '单侧' : '双侧'
)

export const formatFemale111Rest = (seconds: Count | undefined): string => (
  seconds === undefined ? '无固定休息' : `${countText(seconds)} 秒休息`
)

export const formatFemale111ActionPrescription = (action: Female111DisplayAction): string => [
  formatFemale111Prescription(action.prescription),
  getFemale111LateralityLabel(action.laterality),
  formatFemale111Rest(action.restSeconds),
].filter(Boolean).join(' · ')
