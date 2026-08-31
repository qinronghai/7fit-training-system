import { exercises } from '../exercises/exercises'
import { ppMethodNodeById } from '../pp/methodNodes'
import type {
  Female111ChallengeComplexity,
  Female111Demand,
  Female111ProgressionFamily,
  Female111RoleEntry,
  Female111Slot,
} from './types'

const challengeComplexityFor = (methodNodeId: string): Female111ChallengeComplexity => {
  const level = ppMethodNodeById.get(methodNodeId)?.progressionLevel
  if (level === 'P4') return 'INTEGRATION'
  if (level === 'P2' || level === 'P3') return 'DEVELOPMENT'
  return 'FOUNDATION'
}

const role = (
  methodNodeId: string,
  defaultSessionRole: Female111Slot,
  allowedSessionRoles: readonly Female111Slot[],
  progressionFamily: Female111ProgressionFamily,
  sessionDemand: Female111Demand,
  coachRationale: string,
): Female111RoleEntry => ({
  methodNodeId,
  defaultSessionRole,
  allowedSessionRoles,
  progressionFamily,
  sessionDemand,
  standaloneStatus: 'STANDALONE',
  challengeComplexity: challengeComplexityFor(methodNodeId),
  capabilityRequirements: ppMethodNodeById.get(methodNodeId)?.capabilities ?? [],
  readinessRequirements: ppMethodNodeById.get(methodNodeId)?.readinessProfile
    ? [ppMethodNodeById.get(methodNodeId)!.readinessProfile]
    : [],
  populationApplicability: { GENERAL: 'ALLOW', PREGNANCY: 'REVIEW', POSTPARTUM: 'REVIEW' },
  venueRequirementId: `female111:${methodNodeId}`,
  coachRationale,
})

const primary = (
  methodNodeId: string,
  progressionFamily: Female111ProgressionFamily,
  sessionDemand: Female111Demand,
  coachRationale: string,
  allowedSessionRoles: readonly Female111Slot[] = ['PRIMARY'],
) => role(methodNodeId, 'PRIMARY', allowedSessionRoles, progressionFamily, sessionDemand, coachRationale)

const support = (
  methodNodeId: string,
  progressionFamily: Female111ProgressionFamily,
  sessionDemand: Female111Demand,
  coachRationale: string,
  allowedSessionRoles: readonly Female111Slot[] = ['SUPPORT'],
) => role(methodNodeId, 'SUPPORT', allowedSessionRoles, progressionFamily, sessionDemand, coachRationale)

const core = (
  methodNodeId: string,
  progressionFamily: Female111ProgressionFamily,
  sessionDemand: Female111Demand,
  coachRationale: string,
) => role(methodNodeId, 'CORE', ['CORE'], progressionFamily, sessionDemand, coachRationale)

export const female111RoleEntries: readonly Female111RoleEntry[] = [
  primary('pp01', 'SQUAT', 'MODERATE', 'Use as the principal squat-pattern stimulus when the member can control the supported variant.'),
  primary('pp02', 'HINGE', 'MODERATE', 'Use as the principal hinge-pattern stimulus while preserving rib-pelvis control.'),
  primary('pp03', 'INTEGRATED_COMPOUND', 'HIGH', 'Use only as a coach-confirmed integrated hinge and press challenge with external pressing readiness.', ['PRIMARY']),
  support('pp04', 'HIP_ROTATION', 'LOW', 'Use as a low-demand hip-rotation support resource.'),
  support('pp05', 'HIP_ROTATION', 'MODERATE', 'Use conservatively as hip-rotation support; primary use remains under review.'),
  primary('pp07', 'LOCOMOTION', 'MODERATE', 'Use as a locomotion challenge when weight shift and squat control are ready.', ['PRIMARY', 'SUPPORT']),
  support('pp08', 'FRONTAL_PLANE', 'LOW', 'Use to support pelvic control and frontal-plane capacity.'),
  support('pp09', 'FRONTAL_PLANE', 'MODERATE', 'Use as frontal-plane and weight-shift support; primary use remains under review.'),
  primary('pp10', 'HIP_EXTENSION', 'MODERATE', 'Use as the principal basic hip-extension stimulus.'),
  support('pp11', 'DYNAMIC_SUPPORT', 'HIGH', 'Use as a high-demand support challenge only when contralateral control is established.'),
  core('pp12', 'ROTATION_CONTROL', 'HIGH', 'Use as a core rotation-control resource with shoulder-support readiness.'),
  primary('pp13', 'INTEGRATED_COMPOUND', 'HIGH', 'Use as an integrated primary only when support, locomotion and rotation prerequisites are confirmed.', ['PRIMARY', 'SUPPORT']),
  support('pp14', 'DYNAMIC_SUPPORT', 'HIGH', 'Use as a dynamic support challenge with explicit readiness confirmation.'),
  support('pp15', 'DYNAMIC_SUPPORT', 'HIGH', 'Use as support or core control; do not allow it to create a second primary challenge.', ['SUPPORT', 'CORE']),
  support('pp16', 'ANTERIOR_SUPPORT', 'MODERATE', 'Use as a stable anterior-support resource.'),
  support('pp18', 'LATERAL_SUPPORT', 'HIGH', 'Use as a high-demand lateral-support challenge, optionally primary only after review.', ['PRIMARY', 'SUPPORT']),
  support('pp19', 'LATERAL_SUPPORT', 'MODERATE', 'Use to build lateral support and pelvic control.'),
  core('pp23', 'DYNAMIC_CORE', 'HIGH', 'Use as a high-demand dynamic core challenge after breathing and trunk control are confirmed.'),
  core('pp24', 'ANTI_EXTENSION', 'HIGH', 'Use as a high-demand anti-extension challenge with pressure control.'),
  core('pp25', 'ROTATION_CONTROL', 'HIGH', 'Use as a high-demand rotational core challenge with coach-confirmed readiness.'),
  core('pp26', 'ANTI_EXTENSION', 'MODERATE', 'Use as a repeatable anti-extension core resource.'),
  support('exp-quadruped-single-limb-lift', 'QUADRUPED_SUPPORT', 'LOW', 'Use to develop contralateral quadruped support.'),
  support('exp-incline-plank', 'ANTERIOR_SUPPORT', 'LOW', 'Use as a low-demand anterior-support foundation.'),
  support('exp-incline-support-weight-shift', 'DYNAMIC_SUPPORT', 'MODERATE', 'Use to develop supported weight shift and coordination.'),
  support('exp-plank-march', 'DYNAMIC_SUPPORT', 'HIGH', 'Use as a high-demand dynamic support or core resource with one clear challenge.', ['SUPPORT', 'CORE']),
  support('exp-short-forward-step-high-plank', 'DYNAMIC_SUPPORT', 'HIGH', 'Use as a high-demand support transition, not as an unreviewed primary.', ['SUPPORT']),
  support('exp-knee-side-plank', 'LATERAL_SUPPORT', 'MODERATE', 'Use as a controlled lateral-support foundation.'),
  support('exp-standard-side-plank', 'LATERAL_SUPPORT', 'HIGH', 'Use as the single high-demand lateral-support challenge.', ['SUPPORT']),
  support('exp-side-plank-reach', 'LATERAL_SUPPORT', 'HIGH', 'Use to add reach and rotation only after lateral support is stable.', ['SUPPORT', 'CORE']),
  support('exp-partial-side-plank-rotation', 'LATERAL_SUPPORT', 'HIGH', 'Use as a progressive lateral-support and rotation-control resource.', ['SUPPORT', 'CORE']),
  primary('exp-glute-bridge-march', 'HIP_EXTENSION', 'MODERATE', 'Use as a progressive hip-extension and single-side control primary.'),
  primary('exp-single-leg-glute-bridge', 'SINGLE_LEG', 'HIGH', 'Use as a high-demand single-side hip-extension primary after pelvic control is confirmed.'),
  primary('exp-wall-touch-hinge', 'HINGE', 'LOW', 'Use as a low-demand hinge-pattern primary when learning the movement.'),
  primary('exp-dowel-three-point-hinge', 'HINGE', 'MODERATE', 'Use to reinforce hinge position and repeatability.', ['PRIMARY']),
  primary('exp-assisted-sit-to-stand', 'SQUAT', 'LOW', 'Use as a supported squat-pattern primary for learning and control.'),
  primary('exp-box-squat', 'SQUAT', 'MODERATE', 'Use as a repeatable squat-pattern primary with a clear position target.'),
  support('exp-supported-90-90', 'HIP_ROTATION', 'LOW', 'Use as a low-demand hip-rotation support resource.'),
  support('exp-static-90-90', 'HIP_ROTATION', 'LOW', 'Use as a stable hip-rotation position support.'),
  support('exp-long-lever-side-lying-adduction', 'FRONTAL_PLANE', 'MODERATE', 'Use to build frontal-plane and adduction capacity with controlled lever demand.'),
  support('exp-short-lever-copenhagen', 'LATERAL_SUPPORT', 'HIGH', 'Use as a high-demand lateral-support and adduction resource.'),
  support('exp-full-copenhagen', 'LATERAL_SUPPORT', 'HIGH', 'Use as an integrated lateral-support and adduction resource.'),
  support('exp-basic-hip-abduction', 'FRONTAL_PLANE', 'LOW', 'Use as a low-demand frontal-plane support resource.'),
  support('exp-standing-march', 'LOCOMOTION', 'LOW', 'Use to build single-side weight shift and locomotion support.', ['PRIMARY', 'SUPPORT']),
  core('exp-open-book', 'ROTATION_CONTROL', 'LOW', 'Use as a low-demand thoracic rotation and breathing-support core resource.'),
  primary('exp-half-squat-low-locomotion', 'LOCOMOTION', 'MODERATE', 'Use as an integrated locomotion and squat-pattern primary after readiness is confirmed.', ['PRIMARY', 'SUPPORT']),
]

const canonicalExerciseIds = new Set(exercises.map((exercise) => exercise.id))
const roleByMethodNodeId = new Map(female111RoleEntries.map((entry) => [entry.methodNodeId, entry]))

if (roleByMethodNodeId.size !== female111RoleEntries.length) {
  throw new Error('Female111 role metadata contains duplicate Method node IDs')
}

for (const entry of female111RoleEntries) {
  const node = ppMethodNodeById.get(entry.methodNodeId)
  if (!node) throw new Error(`Female111 role metadata references an unknown Method node: ${entry.methodNodeId}`)
  if (node.mapping.status !== 'mapped' && node.mapping.status !== 'variant') {
    throw new Error(`Female111 role metadata references a non-executable Method node: ${entry.methodNodeId}`)
  }
  if (!canonicalExerciseIds.has(node.mapping.exerciseId)) {
    throw new Error(`Female111 role metadata references a missing canonical Exercise: ${entry.methodNodeId}`)
  }
}

export const female111RoleByMethodNodeId: ReadonlyMap<string, Female111RoleEntry> = new Map(roleByMethodNodeId)

export const getFemale111RoleEntry = (methodNodeId: string): Female111RoleEntry | undefined =>
  female111RoleByMethodNodeId.get(methodNodeId)
