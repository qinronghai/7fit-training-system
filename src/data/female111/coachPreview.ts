import { composeFemale111Session } from './sessionComposer'
import { buildFemale111SelectionEvidence } from './selectionEvidence'
import { buildFemale111CoachViewModel } from './coachViewModel'
import { evaluateFemale111PopulationOverlay } from './populationOverlay'
import { resolveFemale111Block } from './blockResolver'
import { evaluateFemale111Venue } from './venueRules'

const blockAResolution = resolveFemale111Block({
  recipeId: 'F111-01',
  selection: {
    PRIMARY: { methodNodeId: 'pp01', challengeRole: 'PRIMARY_CHALLENGE' },
    SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
    CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
  },
})

const blockBResolution = resolveFemale111Block(
  {
    recipeId: 'F111-07',
    selection: {
      PRIMARY: { methodNodeId: 'exp-half-squat-low-locomotion', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { methodNodeId: 'exp-basic-hip-abduction', challengeRole: 'SUPPORTING' },
      CORE: { methodNodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
    },
  },
  { readyConditionalMethodNodeIds: ['exp-half-squat-low-locomotion'] },
)

const sessionResult = composeFemale111Session({
  id: 'female111-coach-preview-01',
  prep: [{ methodNodeId: 'exp-supported-90-90', kind: 'PREP' }],
  blockA: { id: 'block-a', resolution: blockAResolution },
  blockB: { id: 'block-b', resolution: blockBResolution },
  recovery: { recordRequired: true },
})

if (!sessionResult.session) throw new Error('Female111 coach preview session failed to compose')

const populationOverlay = evaluateFemale111PopulationOverlay(sessionResult.session, {
  population: 'GENERAL',
  coachConfirmed: true,
  readinessConfirmedMethodNodeIds: ['exp-half-squat-low-locomotion'],
})

const venue = evaluateFemale111Venue(sessionResult.session, {
  venue: {
    venueConfirmed: true,
    availableEquipment: ['barbell', 'box', 'mini-band'],
    availableTrainingZones: ['floor'],
    nearbyMatSpaceAvailable: true,
    maxSetupCost: 3,
    maxTransitionCost: 2,
    unavailableContentionGroups: [],
  },
  requirementsByMethodNodeId: {
    pp01: { equipment: ['barbell'], trainingZone: 'floor', setupCost: 1, transitionCost: 1 },
    'exp-incline-plank': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
    pp26: { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
    'exp-half-squat-low-locomotion': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 1 },
    'exp-basic-hip-abduction': { equipment: ['mini-band'], trainingZone: 'floor', setupCost: 1, transitionCost: 0 },
    'exp-open-book': { equipment: [], trainingZone: 'floor', setupCost: 0, transitionCost: 0 },
  },
})

export const female111CoachPreviewViewModel = buildFemale111CoachViewModel(
  buildFemale111SelectionEvidence(sessionResult.session, { populationOverlay, venue }),
)
