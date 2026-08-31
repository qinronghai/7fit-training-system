import type { PPMethodNode, PPMethodNodeId, PPCapability, PPMethodReadinessProfileId } from '../pp/types'
import type { Female111ProgressionNode } from './progression'

export const female111Slots = ['PRIMARY', 'SUPPORT', 'CORE'] as const
export type Female111Slot = (typeof female111Slots)[number]

export const female111ChallengeRoles = ['PRIMARY_CHALLENGE', 'SUPPORTING'] as const
export type Female111ChallengeRole = (typeof female111ChallengeRoles)[number]

export const female111Demands = ['NONE', 'LOW', 'MODERATE', 'HIGH'] as const
export type Female111Demand = (typeof female111Demands)[number]

export const female111DemandScores: Readonly<Record<Female111Demand, number>> = {
  NONE: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
}

export type Female111StandaloneStatus = 'STANDALONE'

export type Female111ChallengeComplexity = 'FOUNDATION' | 'DEVELOPMENT' | 'INTEGRATION'
export type Female111PopulationApplicabilityAction = 'ALLOW' | 'REVIEW' | 'VETO'

export type Female111ProgressionFamily =
  | 'SQUAT'
  | 'HINGE'
  | 'HIP_EXTENSION'
  | 'SINGLE_LEG'
  | 'HORIZONTAL_PULL'
  | 'VERTICAL_PULL'
  | 'HORIZONTAL_PUSH'
  | 'VERTICAL_PUSH'
  | 'CARRY'
  | 'INTEGRATED_COMPOUND'
  | 'LOCOMOTION'
  | 'HIP_ROTATION'
  | 'FRONTAL_PLANE'
  | 'ANTERIOR_SUPPORT'
  | 'QUADRUPED_SUPPORT'
  | 'DYNAMIC_SUPPORT'
  | 'LATERAL_SUPPORT'
  | 'BREATHING_POSITION'
  | 'ANTI_EXTENSION'
  | 'ANTI_ROTATION'
  | 'ANTI_LATERAL_FLEXION'
  | 'ROTATION_CONTROL'
  | 'DYNAMIC_CORE'

export type Female111RoleEntry = {
  methodNodeId: PPMethodNodeId
  defaultSessionRole: Female111Slot
  allowedSessionRoles: readonly Female111Slot[]
  progressionFamily: Female111ProgressionFamily
  sessionDemand: Female111Demand
  standaloneStatus: Female111StandaloneStatus
  challengeComplexity: Female111ChallengeComplexity
  capabilityRequirements: readonly PPCapability[]
  readinessRequirements: readonly PPMethodReadinessProfileId[]
  populationApplicability: Readonly<Record<Female111Population, Female111PopulationApplicabilityAction>>
  venueRequirementId: string
  coachRationale: string
}

export type Female111SlotSelection = {
  methodNodeId: PPMethodNodeId
  challengeRole: Female111ChallengeRole
}

export type Female111BlockSelection = Readonly<Record<Female111Slot, Female111SlotSelection>>

export type Female111Block = {
  id: string
  selection: Female111BlockSelection
}

export type Female111PrepReference = {
  methodNodeId: PPMethodNodeId
  kind: 'PREP' | 'ATTACHED_DRILL' | 'BREATHING'
}

export type Female111Accessory = {
  methodNodeId: PPMethodNodeId
  purpose: string
}

export type Female111Session = {
  id: string
  prep: readonly Female111PrepReference[]
  blockA: Female111Block
  blockB: Female111Block
  accessory?: readonly Female111Accessory[]
  stage?: Female111ProgrammingStage
  target?: string
  timeBudgetMinutes?: number
  estimatedMinutes?: number
  recovery: {
    recordRequired: boolean
  }
}

export type Female111ProgrammingStage = 'L1' | 'L2' | 'L3' | 'L4'

export type Female111RecipeFamily = {
  id: `F111-${string}`
  name: string
  primaryFamily: Female111ProgressionFamily
  supportFamily: Female111ProgressionFamily
  coreFamily: Female111ProgressionFamily
  rationale: string
}

export type Female111ValidationIssueCode =
  | 'UNKNOWN_METHOD_NODE'
  | 'UNKNOWN_ROLE_METADATA'
  | 'METHOD_ONLY_NOT_STANDALONE'
  | 'SESSION_ROLE_NOT_ALLOWED'
  | 'CONDITIONAL_NOT_READY'
  | 'DUPLICATE_METHOD_NODE'
  | 'PRIMARY_CHALLENGE_COUNT'
  | 'HIGH_DEMAND_LIMIT'
  | 'DEMAND_BUDGET_EXCEEDED'
  | 'LIMITING_CAPABILITY_OVERLOAD'
  | 'MULTIPLE_COMPLEXITY_CHALLENGES'

export type Female111ValidationIssue = {
  code: Female111ValidationIssueCode
  message: string
  methodNodeId?: PPMethodNodeId
  slot?: Female111Slot
}

export type Female111ValidationContext = {
  readyConditionalMethodNodeIds?: ReadonlySet<PPMethodNodeId> | readonly PPMethodNodeId[]
  maxSharedCapabilityCount?: number
  sessionDemandBudget?: number
}

export type Female111SessionValidationIssueCode =
  | 'DUPLICATE_BLOCK_ID'
  | 'BLOCK_A_INVALID'
  | 'BLOCK_B_INVALID'
  | 'REPEATED_PRIMARY_FAMILY'
  | 'REPEATED_FATIGUE_SOURCE'
  | 'SESSION_DEMAND_EXCEEDED'
  | 'SESSION_CAPABILITY_OVERLOAD'
  | 'SESSION_TIME_BUDGET_EXCEEDED'

export type Female111SessionValidationIssue = {
  code: Female111SessionValidationIssueCode
  message: string
  capability?: string
}

export type Female111ResolvedSlot = {
  slot: Female111Slot
  selection: Female111SlotSelection
  role: Female111RoleEntry
  methodNode: PPMethodNode
  progression?: Female111ProgressionNode
}

export type Female111ResolvedBlock = {
  recipe: Female111RecipeFamily
  selection: Female111BlockSelection
  slots: Readonly<Record<Female111Slot, Female111ResolvedSlot>>
}

export type Female111BlockResolutionInput = {
  recipeId: string
  selection: Female111BlockSelection
}

export type Female111BlockResolutionIssueCode =
  | 'RECIPE_NOT_FOUND'
  | 'BLOCK_INVALID'
  | 'RECIPE_FAMILY_MISMATCH'

export type Female111BlockResolutionIssue = {
  code: Female111BlockResolutionIssueCode
  message: string
  slot?: Female111Slot
  methodNodeId?: PPMethodNodeId
  blockIssues?: readonly Female111ValidationIssue[]
}

export type Female111BlockResolutionResult = {
  resolved?: Female111ResolvedBlock
  issues: readonly Female111BlockResolutionIssue[]
}

export type Female111SessionBlockInput = {
  id: string
  resolution: Female111BlockResolutionResult
}

export type Female111ComposedSessionBlock = {
  id: string
  resolved: Female111ResolvedBlock
}

export type Female111SessionCompositionInput = {
  id: string
  prep: readonly Female111PrepReference[]
  blockA: Female111SessionBlockInput
  blockB: Female111SessionBlockInput
  accessory?: readonly Female111Accessory[]
  stage?: Female111ProgrammingStage
  target?: string
  timeBudgetMinutes?: number
  estimatedMinutes?: number
  recovery: {
    recordRequired: boolean
  }
}

export type Female111ComposedSession = {
  id: string
  prep: readonly Female111PrepReference[]
  blockA: Female111ComposedSessionBlock
  blockB: Female111ComposedSessionBlock
  accessory?: readonly Female111Accessory[]
  stage?: Female111ProgrammingStage
  target?: string
  timeBudgetMinutes?: number
  estimatedMinutes?: number
  recovery: {
    recordRequired: boolean
  }
}

export type Female111SessionBlockCandidate = {
  id: string
  resolution: Female111BlockResolutionResult
  targetFit: number
  venueCost: number
}

export type Female111SessionDraft = {
  id: string
  stage: Female111ProgrammingStage
  target: string
  timeBudgetMinutes: number
  prep: readonly Female111PrepReference[]
  blockA: readonly Female111SessionBlockCandidate[]
  blockB: readonly Female111SessionBlockCandidate[]
  accessory?: readonly Female111Accessory[]
  estimatedMinutes?: number
  recovery: {
    recordRequired: boolean
  }
}

export type Female111SessionCandidate = {
  blockAId: string
  blockBId: string
  score: number
  rationale: string
}

export type Female111SessionBuildIssueCode =
  | Female111SessionValidationIssueCode
  | 'NO_LEGAL_CANDIDATE'
  | 'CANDIDATES_REQUIRE_REVIEW'

export type Female111SessionBuildIssue = {
  code: Female111SessionBuildIssueCode
  message: string
  capability?: string
}

export type Female111SessionBuildResult = {
  session?: Female111ComposedSession
  candidates: readonly Female111SessionCandidate[]
  issues: readonly Female111SessionBuildIssue[]
  requiresCoachReview: boolean
}

export type Female111SessionCompositionIssueCode =
  | 'DUPLICATE_BLOCK_ID'
  | 'BLOCK_A_INVALID'
  | 'BLOCK_B_INVALID'
  | 'BLOCK_A_NOT_RESOLVED'
  | 'BLOCK_B_NOT_RESOLVED'

export type Female111SessionCompositionIssue = {
  code: Female111SessionCompositionIssueCode
  message: string
  resolutionIssues?: readonly Female111BlockResolutionIssue[]
}

export type Female111SessionCompositionResult = {
  session?: Female111ComposedSession
  issues: readonly Female111SessionCompositionIssue[]
}

export const female111Populations = ['GENERAL', 'PREGNANCY', 'POSTPARTUM'] as const
export type Female111Population = (typeof female111Populations)[number]

export const female111PopulationActions = ['ALLOW', 'REGRESS', 'STOP', 'REFER'] as const
export type Female111PopulationAction = (typeof female111PopulationActions)[number]

export type Female111ReadinessStatus = 'GREEN' | 'YELLOW' | 'RED'
export type Female111ReadinessAdjustment = 'volume' | 'demand' | 'complexity' | 'load'

export type Female111ReadinessInput = {
  status: Female111ReadinessStatus
  fatigue?: 'none' | 'low' | 'high'
  sleepQuality?: 'good' | 'fair' | 'poor'
  discomfort?: boolean
  qualityDegraded?: boolean
  safetySignals?: readonly string[]
}

export type Female111ReadinessEvaluation = {
  status: Female111ReadinessStatus
  allowed: boolean
  action: Female111PopulationAction
  adjustments: readonly Female111ReadinessAdjustment[]
  reasons: readonly string[]
}

export type Female111PopulationDecision = {
  action: Female111PopulationAction
  reason: string
}

export type Female111PopulationOverlayInput = {
  population: Female111Population
  coachConfirmed: boolean
  readiness?: Female111ReadinessInput
  readinessConfirmedMethodNodeIds?: ReadonlySet<PPMethodNodeId> | readonly PPMethodNodeId[]
  decisionsByMethodNodeId?: Readonly<Record<PPMethodNodeId, Female111PopulationDecision>>
}

export type Female111PopulationOverlayIssueCode =
  | 'COACH_CONFIRMATION_REQUIRED'
  | 'READINESS_NOT_CONFIRMED'
  | 'READINESS_RED_BLOCK'
  | 'POPULATION_DECISION_REQUIRED'
  | 'POPULATION_OVERLAY_VETO'

export type Female111PopulationOverlayIssue = {
  code: Female111PopulationOverlayIssueCode
  message: string
  block?: 'A' | 'B'
  slot?: Female111Slot
  methodNodeId?: PPMethodNodeId
  action?: Female111PopulationAction
  reason?: string
}

export type Female111PopulationOverlayResult = {
  allowed: boolean
  issues: readonly Female111PopulationOverlayIssue[]
  readiness?: Female111ReadinessEvaluation
}

export type Female111VenueRequirement = {
  equipment: readonly string[]
  trainingZone: string
  floor?: string
  nearbyEquipment?: readonly string[]
  setupCost: number
  transitionCost: number
  requiresNearbyMatSpace?: boolean
  contentionGroup?: string
}

export type Female111VenueProfile = {
  venueConfirmed: boolean
  availableEquipment: readonly string[]
  availableTrainingZones: readonly string[]
  availableFloors?: readonly string[]
  nearbyAvailableEquipment?: readonly string[]
  nearbyMatSpaceAvailable: boolean
  maxSetupCost: number
  maxTransitionCost: number
  unavailableContentionGroups: readonly string[]
}

export type Female111VenueEvaluationInput = {
  venue: Female111VenueProfile
  requirementsByMethodNodeId: Readonly<Record<PPMethodNodeId, Female111VenueRequirement>>
}

export type Female111VenueIssueCode =
  | 'VENUE_CONFIRMATION_REQUIRED'
  | 'VENUE_METADATA_REQUIRED'
  | 'EQUIPMENT_UNAVAILABLE'
  | 'TRAINING_ZONE_UNAVAILABLE'
  | 'MAT_SPACE_UNAVAILABLE'
  | 'EQUIPMENT_CONTENTION'
  | 'FLOOR_UNAVAILABLE'
  | 'NEARBY_EQUIPMENT_UNAVAILABLE'
  | 'SETUP_BUDGET_EXCEEDED'
  | 'TRANSITION_BUDGET_EXCEEDED'

export type Female111VenueIssue = {
  code: Female111VenueIssueCode
  message: string
  block?: 'A' | 'B'
  slot?: Female111Slot
  methodNodeId?: PPMethodNodeId
  equipment?: string
  trainingZone?: string
  contentionGroup?: string
}

export type Female111VenueEvaluationResult = {
  allowed: boolean
  issues: readonly Female111VenueIssue[]
}

export type Female111EvidenceCheckStatus = 'CLEAR' | 'REVIEW_REQUIRED' | 'VETOED'
export type Female111EvidenceReadinessStatus = 'NOT_REQUIRED' | 'CONFIRMED' | 'NOT_CONFIRMED'

export type Female111SelectionEvidenceSlot = {
  block: 'A' | 'B'
  slot: Female111Slot
  recipe: Female111RecipeFamily
  selection: Female111SlotSelection
  role: Female111RoleEntry
  methodNode: PPMethodNode
  progression?: Female111ProgressionNode
  expectedFamily: Female111ProgressionFamily
  demand: Female111Demand
  readiness: Female111EvidenceReadinessStatus
  population: Female111EvidenceCheckStatus
  venue: Female111EvidenceCheckStatus
  reasons: readonly string[]
}

export type Female111SelectionEvidenceBlock = {
  id: string
  recipe: Female111RecipeFamily
  slots: Readonly<Record<Female111Slot, Female111SelectionEvidenceSlot>>
}

export type Female111SelectionEvidenceInput = {
  populationOverlay: Female111PopulationOverlayResult
  venue: Female111VenueEvaluationResult
}

export type Female111SelectionEvidence = {
  session: Female111ComposedSession
  populationOverlay: Female111PopulationOverlayResult
  venue: Female111VenueEvaluationResult
  allowed: boolean
  blocks: Readonly<Record<'A' | 'B', Female111SelectionEvidenceBlock>>
  sessionReasons: readonly string[]
}

export type Female111CoachConfirmationStatus = 'CONFIRMED' | 'REQUIRED'

export type Female111CoachRecipeViewModel = {
  id: string
  name: string
  rationale: string
}

export type Female111CoachSlotViewModel = {
  block: 'A' | 'B'
  slot: Female111Slot
  methodNodeId: PPMethodNodeId
  displayName: string
  challengeRole: Female111ChallengeRole
  progressionFamily: Female111ProgressionFamily
  expectedFamily: Female111ProgressionFamily
  demand: Female111Demand
  readiness: Female111EvidenceReadinessStatus
  population: Female111EvidenceCheckStatus
  venue: Female111EvidenceCheckStatus
  coachRationale: string
  reasons: readonly string[]
  progression?: Female111ProgressionNode
}

export type Female111CoachBlockViewModel = {
  id: string
  recipe: Female111CoachRecipeViewModel
  slots: Readonly<Record<Female111Slot, Female111CoachSlotViewModel>>
}

export type Female111CoachViewModel = {
  sessionId: string
  allowed: boolean
  coachConfirmation: Female111CoachConfirmationStatus
  blocks: Readonly<Record<'A' | 'B', Female111CoachBlockViewModel>>
  sessionReasons: readonly string[]
}

export const female111ProgressionDecisions = ['KEEP', 'PROGRESS', 'REGRESS', 'SWAP'] as const
export type Female111ProgressionDecision = (typeof female111ProgressionDecisions)[number]

export type Female111ExecutionQuality = 'GOOD' | 'DEGRADED' | 'FAILED'

export type Female111ExecutionRecordBase = {
  methodNodeId: PPMethodNodeId
  quality: Female111ExecutionQuality
  symptoms: readonly string[]
}

export type Female111PrimaryExecutionRecord = Female111ExecutionRecordBase & {
  exerciseId: string
  loadKg?: number
  sets?: number
  reps?: number
  rir?: number
  nextStep: Female111ProgressionDecision
}

export type Female111SupportExecutionRecord = Female111ExecutionRecordBase & {
  version: string
  reps?: number
  durationSeconds?: number
  decision: Female111ProgressionDecision
}

export type Female111CoachDecisionOverride = {
  block?: 'A' | 'B'
  slot: Female111Slot
  from: Female111ProgressionDecision
  to: Female111ProgressionDecision
  reason: string
}

export type Female111BlockExecutionResult = {
  primary: Female111PrimaryExecutionRecord
  support: Female111SupportExecutionRecord
  core: Female111SupportExecutionRecord
}

export type Female111SessionResult = {
  id: string
  sessionId: string
  recordedAt: string
  memberName?: string
  coachId?: string
  readiness: Female111ReadinessStatus
  primary: Female111PrimaryExecutionRecord
  support: Female111SupportExecutionRecord
  core: Female111SupportExecutionRecord
  blockResults?: Readonly<Record<'A' | 'B', Female111BlockExecutionResult>>
  notes?: string
  coachDecisionOverrides?: readonly Female111CoachDecisionOverride[]
}

export type Female111NextStepInput = {
  quality: Female111ExecutionQuality
  rir?: number
  symptoms: readonly string[]
  progressionAvailable?: boolean
}
