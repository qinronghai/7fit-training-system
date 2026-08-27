import { bodyTemplates } from '../programming/bodyTemplates'
import { conditioningTemplates } from '../programming/conditioningTemplates'
import { resolveProgrammingLevel } from '../programming/rules'
import { threeCTemplates } from '../programming/threeCTemplates'
import type {
  Count,
  ExercisePrescription,
  ExerciseRole,
  Laterality,
  NumericRange,
} from '../programming/types'
import type { MovementPatternId } from './types'
import type {
  PrepPhase,
  ProgramLevel,
  ProgrammingSelection,
  ProgrammingTemplate,
  ResolvedProgrammingLevel,
  TrainingBlock,
  TrainingExercise,
} from '../programming/types'
import { isSelectableExerciseSlot } from '../programming/types'
import { exercises } from './exercises'
import { createProgrammingExerciseResolver } from './programmingMap'

type UsageIdentity = {
  exerciseId: string
  exerciseKey: string
  templateId: string
  system: ProgrammingTemplate['system']
  programLevel: ProgramLevel
  scenarioId: string
}

type UsageLaterality = {
  laterality?: Laterality
  sideRestSeconds?: Count
  sideExecution?: 'alternating' | 'one-side-then-opposite'
  startingSidePolicy?: 'alternate-between-sets' | 'coach-directed'
}

export type PrepUsage = UsageIdentity & UsageLaterality & {
  kind: 'prep'
  phase: PrepPhase
  prescription: ExercisePrescription
  planningExecutionSeconds?: NumericRange
  reason: string
}

export type RampUpUsage = UsageIdentity & UsageLaterality & {
  kind: 'ramp-up'
  order: number
  targetRole: 'PRIMARY' | 'SECONDARY'
  reps: Count
  loadGuidance: string
  restSeconds?: Count
}

export type SpecificBuildUpUsage = UsageIdentity & UsageLaterality & {
  kind: 'specific-build-up'
  id: string
  order: number
  prescription: ExercisePrescription
  planningExecutionSeconds: NumericRange
  restAfterSeconds?: Count
  transitionAfterSeconds?: Count
  coachNote?: string
}

export type TrainingUsage = UsageIdentity & UsageLaterality & {
  kind: 'training'
  blockId: string
  blockKind: TrainingBlock['kind']
  programmingRole: ExerciseRole
  movementPattern: MovementPatternId
  prescription: ExercisePrescription
  planningExecutionSeconds?: NumericRange
  restSeconds?: Count
  optional?: boolean
  optionalCondition?: TrainingExercise['optionalCondition']
  coachNote?: string
  rounds?: Count
  restBetweenSetsSeconds?: Count
  restBetweenRoundsSeconds?: Count
  transitionSeconds?: Count
  transitionBetweenRoundsSeconds?: Count
  transitionAfterSeconds?: Count
}

export type ProgrammingExerciseUsage = PrepUsage | RampUpUsage | SpecificBuildUpUsage | TrainingUsage

export type ProgrammingUsageScenario = {
  scenarioId: string
  templateId: string
  programLevel: ProgramLevel
  selection: ProgrammingSelection
}

const templates: readonly ProgrammingTemplate[] = [
  ...threeCTemplates,
  ...bodyTemplates,
  ...conditioningTemplates,
]

const templateById = new Map(templates.map((template) => [template.id, template]))
const canonicalIds = new Set(exercises.map((exercise) => exercise.id))
const programmingExerciseResolver = createProgrammingExerciseResolver(exercises)

const canonicalExerciseId = (exerciseKey: string): string => {
  const exerciseId = programmingExerciseResolver.resolveId(exerciseKey)
  if (!canonicalIds.has(exerciseId)) {
    throw new Error(`Programming Usage resolved to unknown canonical Exercise: ${exerciseKey} -> ${exerciseId}`)
  }
  return exerciseId
}

const identity = (
  scenario: ProgrammingUsageScenario,
  template: ProgrammingTemplate,
  exerciseKey: string,
): UsageIdentity => ({
  exerciseId: canonicalExerciseId(exerciseKey),
  exerciseKey,
  templateId: template.id,
  system: template.system,
  programLevel: scenario.programLevel,
  scenarioId: scenario.scenarioId,
})

const toPrepUsage = (
  item: ResolvedProgrammingLevel['prep'][number],
  scenario: ProgrammingUsageScenario,
  template: ProgrammingTemplate,
): PrepUsage => ({
  ...identity(scenario, template, item.exerciseKey),
  kind: 'prep',
  phase: item.phase,
  prescription: item.prescription,
  laterality: item.laterality,
  sideRestSeconds: item.sideRestSeconds,
  sideExecution: item.sideExecution,
  startingSidePolicy: item.startingSidePolicy,
  planningExecutionSeconds: item.planningExecutionSeconds,
  reason: item.reason,
})

const toRampUpUsage = (
  item: ResolvedProgrammingLevel['rampUp'][number],
  scenario: ProgrammingUsageScenario,
  template: ProgrammingTemplate,
): RampUpUsage => ({
  ...identity(scenario, template, item.exerciseKey),
  kind: 'ramp-up',
  order: item.order,
  targetRole: item.targetRole,
  reps: item.reps,
  loadGuidance: item.loadGuidance,
  restSeconds: item.restSeconds,
  laterality: item.laterality,
  sideRestSeconds: item.sideRestSeconds,
  sideExecution: item.sideExecution,
  startingSidePolicy: item.startingSidePolicy,
})

const toSpecificBuildUpUsage = (
  item: NonNullable<ResolvedProgrammingLevel['specificBuildUp']>[number],
  scenario: ProgrammingUsageScenario,
  template: ProgrammingTemplate,
): SpecificBuildUpUsage => ({
  ...identity(scenario, template, item.exerciseKey),
  kind: 'specific-build-up',
  id: item.id,
  order: item.order,
  prescription: item.prescription,
  planningExecutionSeconds: item.planningExecutionSeconds,
  laterality: item.laterality,
  sideRestSeconds: item.sideRestSeconds,
  sideExecution: item.sideExecution,
  startingSidePolicy: item.startingSidePolicy,
  restAfterSeconds: item.restAfterSeconds,
  transitionAfterSeconds: item.transitionAfterSeconds,
  coachNote: item.coachNote,
})

const toTrainingUsage = (
  item: TrainingExercise,
  block: ResolvedProgrammingLevel['blocks'][number],
  scenario: ProgrammingUsageScenario,
  template: ProgrammingTemplate,
): TrainingUsage => ({
  ...identity(scenario, template, item.exerciseKey),
  kind: 'training',
  blockId: block.id,
  blockKind: block.kind,
  programmingRole: item.role,
  movementPattern: item.movementPattern,
  prescription: item.prescription,
  planningExecutionSeconds: item.planningExecutionSeconds,
  restSeconds: item.restSeconds,
  laterality: item.laterality,
  sideRestSeconds: item.sideRestSeconds,
  sideExecution: item.sideExecution,
  startingSidePolicy: item.startingSidePolicy,
  optional: item.optional,
  optionalCondition: item.optionalCondition,
  coachNote: item.coachNote,
  rounds: block.rounds,
  restBetweenSetsSeconds: block.restBetweenSetsSeconds,
  restBetweenRoundsSeconds: block.restBetweenRoundsSeconds,
  transitionSeconds: block.transitionSeconds,
  transitionBetweenRoundsSeconds: block.transitionBetweenRoundsSeconds,
  transitionAfterSeconds: block.transitionAfterSeconds,
})

export const buildBodyScenarioSet = (template: ProgrammingTemplate, programLevel: ProgramLevel): ProgrammingUsageScenario[] => {
  const level = template.levels[programLevel]
  const selectableSlots = level.blocks.flatMap((block) => block.exercises)
    .filter(isSelectableExerciseSlot)
    .sort((left, right) => left.id.localeCompare(right.id))
  if (selectableSlots.length === 0) {
    return [{ scenarioId: `${template.id}/${programLevel}/default`, templateId: template.id, programLevel, selection: {} }]
  }

  const selections = selectableSlots.reduce<ProgrammingSelection[]>((current, slot) => (
    current.flatMap((selection) => slot.options.map((option) => ({
      ...selection,
      selectable: { ...(selection.selectable ?? {}), [slot.id]: option.exerciseKey },
    })))
  ), [{}])
  const defaultSelection: ProgrammingUsageScenario = {
    scenarioId: `${template.id}/${programLevel}/default`,
    templateId: template.id,
    programLevel,
    selection: {},
  }
  const explicitSelections = selections
    .filter((selection) => selectableSlots.some((slot) => {
      const selectedKey = selection.selectable?.[slot.id]
      return selectedKey !== undefined && selectedKey !== slot.defaultOptionKey
    }))
    .map((selection) => {
      const selectedKey = Object.entries(selection.selectable ?? {})
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, key]) => key)
        .join('-')
      return {
        scenarioId: `${template.id}/${programLevel}/${selectedKey}`,
        templateId: template.id,
        programLevel,
        selection,
      }
    })
  const baseSelections = [defaultSelection, ...explicitSelections]
  if (!selectableSlots.some((slot) => slot.allowComplementaryOption === true)) return baseSelections
  return [
    ...baseSelections,
    ...baseSelections.map((scenario) => ({
      ...scenario,
      scenarioId: `${scenario.scenarioId}-with-complementary`,
      selection: { ...scenario.selection, includeComplementaryOption: true },
    })),
  ]
}

const conditioningScenarios = (template: ProgrammingTemplate, programLevel: ProgramLevel): ProgrammingUsageScenario[] => {
  const base = {
    templateId: template.id,
    programLevel,
  }
  if (template.id === 'con3' && programLevel === 'l3') {
    return [
      { ...base, scenarioId: 'con3/l3/medicine-ball', selection: {} },
      { ...base, scenarioId: 'con3/l3/swing', selection: { powerTracks: { 'con3-l3-power': { optionKey: 'kb-swing', techniqueReady: true } } } },
    ]
  }
  if (template.id === 'con3' && programLevel === 'l4') {
    return [
      { ...base, scenarioId: 'con3/l4/foundation', selection: {} },
      { ...base, scenarioId: 'con3/l4/swing', selection: { powerTracks: { 'con3-l4-power': { optionKey: 'kb-swing', techniqueReady: true } } } },
      { ...base, scenarioId: 'con3/l4/rotational', selection: { powerTracks: { 'con3-l4-power': { optionKey: 'rotational-throw', techniqueReady: true } } } },
    ]
  }
  if (template.id === 'con5' && programLevel === 'l3') {
    return [
      { ...base, scenarioId: 'con5/l3/standard-3', selection: {} },
      { ...base, scenarioId: 'con5/l3/conditional-4', selection: { conditioningRounds: { 'conditioning-main': 4 } } },
    ]
  }
  return [{ ...base, scenarioId: `${template.id}/${programLevel}/default`, selection: {} }]
}

const buildScenarios = (): ProgrammingUsageScenario[] => {
  const scenarios: ProgrammingUsageScenario[] = []
  for (const template of templates) {
    for (const programLevel of ['l1', 'l2', 'l3', 'l4'] as const) {
      if (template.system === 'body') scenarios.push(...buildBodyScenarioSet(template, programLevel))
      else if (template.system === 'conditioning') scenarios.push(...conditioningScenarios(template, programLevel))
      else scenarios.push({
        scenarioId: `${template.id}/${programLevel}/default`,
        templateId: template.id,
        programLevel,
        selection: {},
      })
    }
  }
  return scenarios
}

export const programmingUsageScenarios: readonly ProgrammingUsageScenario[] = buildScenarios()

const usagesForScenario = (
  scenario: ProgrammingUsageScenario,
): ProgrammingExerciseUsage[] => {
  const template = templateById.get(scenario.templateId)
  if (!template) throw new Error(`Unknown Programming Usage template: ${scenario.templateId}`)
  const level = template.levels[scenario.programLevel]
  const resolved = resolveProgrammingLevel(level, scenario.selection)
  return [
    ...resolved.prep.map((item) => toPrepUsage(item, scenario, template)),
    ...(resolved.specificBuildUp ?? []).map((item) => toSpecificBuildUpUsage(item, scenario, template)),
    ...resolved.rampUp.map((item) => toRampUpUsage(item, scenario, template)),
    ...resolved.blocks.flatMap((block) => block.exercises.map((item) => toTrainingUsage(item, block, scenario, template))),
  ]
}

export const programmingExerciseUsages: readonly ProgrammingExerciseUsage[] = programmingUsageScenarios.flatMap(usagesForScenario)

export const getProgrammingExerciseUsages = (exerciseId: string): readonly ProgrammingExerciseUsage[] => (
  programmingExerciseUsages.filter((usage) => usage.exerciseId === exerciseId)
)

export const getProgrammingExerciseUsagesByTemplate = (templateId: string): readonly ProgrammingExerciseUsage[] => (
  programmingExerciseUsages.filter((usage) => usage.templateId === templateId)
)

export const getProgrammingExerciseUsagesByScenario = (scenarioId: string): readonly ProgrammingExerciseUsage[] => (
  programmingExerciseUsages.filter((usage) => usage.scenarioId === scenarioId)
)
