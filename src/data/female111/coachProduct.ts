import { buildFemale111SelectionEvidence } from './selectionEvidence'
import { buildFemale111CoachViewModel } from './coachViewModel'
import { buildFemale111Session } from './sessionBuilder'
import { evaluateFemale111PopulationOverlay } from './populationOverlay'
import { resolveFemale111Block } from './blockResolver'
import { resolveFemale111TemplateSelectionRequest, type Female111TemplateSelectionIssue } from './templateSelection'
import { evaluateFemale111Venue } from './venueRules'
import type {
  Female111CoachViewModel,
  Female111ComposedSession,
  Female111BlockSelection,
  Female111Population,
  Female111ReadinessStatus,
  Female111SelectionEvidence,
  Female111ProgrammingStage,
  Female111SessionBuildIssue,
} from './types'
import type { Female111Template, Female111TemplateLevelId } from './templateTypes'

export type Female111CoachProductInput = {
  id: string
  memberName?: string
  planId?: Female111CoachPlanId
  target: string
  stage: Female111ProgrammingStage
  population: Female111Population
  readiness: Female111ReadinessStatus
  safetySignal?: boolean
  coachConfirmed: boolean
  venueConfirmed: boolean
  availableEquipment: readonly string[]
  templateRecipeId?: string
  templateLevel?: Female111TemplateLevelId
}

export type Female111CoachPlanId = 'SQUAT_AND_LOCOMOTION' | 'HIP_EXTENSION_AND_LOCOMOTION'

export type Female111CoachPlanOption = {
  id: Female111CoachPlanId
  label: string
  rationale: string
}

export const female111CoachPlanOptions: readonly Female111CoachPlanOption[] = [
  { id: 'SQUAT_AND_LOCOMOTION', label: '深蹲控制 + 移动稳定', rationale: '先建立可重复的深蹲控制，再把能力带入低复杂度移动。' },
  { id: 'HIP_EXTENSION_AND_LOCOMOTION', label: '髋伸展 + 侧向控制 + 移动', rationale: '先用髋伸展建立输出，再用侧向支撑和移动完成能力转移。' },
]

export type Female111CoachProductResult = {
  selectedPlanId: Female111CoachPlanId
  session?: Female111ComposedSession
  evidence?: Female111SelectionEvidence
  model?: Female111CoachViewModel
  template?: Female111Template
  templateSelectionIssues?: readonly Female111TemplateSelectionIssue[]
  buildIssues: readonly Female111SessionBuildIssue[]
}

const allSelections = [
  'pp01',
  'pp10',
  'exp-incline-plank',
  'exp-knee-side-plank',
  'pp26',
  'exp-half-squat-low-locomotion',
  'exp-basic-hip-abduction',
  'exp-open-book',
] as const

const requirementsByMethodNodeId = {
  pp01: { equipment: ['barbell', 'box'], trainingZone: 'floor', setupCost: 1, transitionCost: 1 },
  pp10: { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  'exp-incline-plank': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  'exp-knee-side-plank': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  pp26: { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  'exp-half-squat-low-locomotion': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 1 },
  'exp-basic-hip-abduction': { equipment: ['mini-band'], trainingZone: 'floor', setupCost: 1, transitionCost: 0 },
  'exp-open-book': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
} as const

type CoachPlanDefinition = {
  id: Female111CoachPlanId
  blockA: { recipeId: string; selection: Female111BlockSelection }
  blockB: { recipeId: string; selection: Female111BlockSelection }
  readyConditionalMethodNodeIds: readonly string[]
}

const locomotionBlock: CoachPlanDefinition['blockB'] = {
  recipeId: 'F111-07',
  selection: {
    PRIMARY: { methodNodeId: 'exp-half-squat-low-locomotion', challengeRole: 'PRIMARY_CHALLENGE' },
    SUPPORT: { methodNodeId: 'exp-basic-hip-abduction', challengeRole: 'SUPPORTING' },
    CORE: { methodNodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
  },
}

const coachPlanDefinitions: Readonly<Record<Female111CoachPlanId, CoachPlanDefinition>> = {
  SQUAT_AND_LOCOMOTION: {
    id: 'SQUAT_AND_LOCOMOTION',
    blockA: {
      recipeId: 'F111-01',
      selection: {
        PRIMARY: { methodNodeId: 'pp01', challengeRole: 'PRIMARY_CHALLENGE' },
        SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
        CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
      },
    },
    blockB: locomotionBlock,
    readyConditionalMethodNodeIds: ['exp-half-squat-low-locomotion'],
  },
  HIP_EXTENSION_AND_LOCOMOTION: {
    id: 'HIP_EXTENSION_AND_LOCOMOTION',
    blockA: {
      recipeId: 'F111-04',
      selection: {
        PRIMARY: { methodNodeId: 'pp10', challengeRole: 'PRIMARY_CHALLENGE' },
        SUPPORT: { methodNodeId: 'exp-knee-side-plank', challengeRole: 'SUPPORTING' },
        CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
      },
    },
    blockB: locomotionBlock,
    readyConditionalMethodNodeIds: ['exp-half-squat-low-locomotion'],
  },
}

export const buildFemale111CoachProduct = (
  input: Female111CoachProductInput,
): Female111CoachProductResult => {
  const templateSelection = resolveFemale111TemplateSelectionRequest({
    templateRecipeId: input.templateRecipeId,
    templateLevel: input.templateLevel,
  })
  const planId = input.planId ?? 'SQUAT_AND_LOCOMOTION'
  const plan = coachPlanDefinitions[planId]
  const blockAResolution = resolveFemale111Block(plan.blockA, {
    readyConditionalMethodNodeIds: plan.readyConditionalMethodNodeIds,
  })
  const blockBResolution = resolveFemale111Block(plan.blockB, {
    readyConditionalMethodNodeIds: plan.readyConditionalMethodNodeIds,
  })
  const built = buildFemale111Session({
    id: input.id,
    stage: input.stage,
    target: input.target,
    timeBudgetMinutes: 45,
    prep: [{ methodNodeId: 'exp-supported-90-90', kind: 'PREP' }],
    blockA: [{ id: 'block-a', resolution: blockAResolution, targetFit: 3, venueCost: 1 }],
    blockB: [{ id: 'block-b', resolution: blockBResolution, targetFit: 2, venueCost: 1 }],
    recovery: { recordRequired: true },
    estimatedMinutes: 32,
  })
  if (!built.session) {
    return {
      selectedPlanId: planId,
      template: templateSelection.template,
      templateSelectionIssues: templateSelection.issues,
      buildIssues: built.issues,
    }
  }

  const decisionsByMethodNodeId = input.coachConfirmed && input.population !== 'GENERAL'
    ? Object.fromEntries(allSelections.map((methodNodeId) => [methodNodeId, { action: 'ALLOW' as const, reason: '教练已检查当前人群边界' }]))
    : undefined
  const populationOverlay = evaluateFemale111PopulationOverlay(built.session, {
    population: input.population,
    coachConfirmed: input.coachConfirmed,
    readiness: {
      status: input.readiness,
      safetySignals: input.safetySignal ? ['疼痛或症状加重'] : [],
    },
    readinessConfirmedMethodNodeIds: plan.readyConditionalMethodNodeIds,
    decisionsByMethodNodeId,
  })
  const venue = evaluateFemale111Venue(built.session, {
    venue: {
      venueConfirmed: input.venueConfirmed,
      availableEquipment: input.availableEquipment,
      availableTrainingZones: ['floor'],
      availableFloors: ['rubber'],
      nearbyAvailableEquipment: input.availableEquipment,
      nearbyMatSpaceAvailable: true,
      maxSetupCost: 4,
      maxTransitionCost: 3,
      unavailableContentionGroups: [],
    },
    requirementsByMethodNodeId,
  })
  const evidence = buildFemale111SelectionEvidence(built.session, { populationOverlay, venue })
  return {
    selectedPlanId: planId,
    session: built.session,
    evidence,
    model: buildFemale111CoachViewModel(evidence),
    template: templateSelection.template,
    templateSelectionIssues: templateSelection.issues,
    buildIssues: [],
  }
}
