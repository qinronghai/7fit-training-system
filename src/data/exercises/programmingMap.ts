import type { ExerciseKey } from '../programming/types'

export type ProgrammingExerciseKeyClassification = 'canonical' | 'programming-context-variant'

export type ProgrammingExerciseMappingEntry = {
  readonly exerciseKey: ExerciseKey
  readonly classification: ProgrammingExerciseKeyClassification
  readonly canonicalExerciseId: string
}

export type ProgrammingExerciseMapIssue =
  | { code: 'DUPLICATE_SOURCE_KEY'; exerciseKey: ExerciseKey }
  | { code: 'UNKNOWN_CANONICAL_TARGET'; exerciseKey: ExerciseKey; canonicalExerciseId: string }
  | { code: 'ACTION_STYLE_CANONICAL_ID'; exerciseKey: ExerciseKey; canonicalExerciseId: string }

/**
 * Slice 2B reviewed explicit map for every formal Programming exerciseKey.
 * Context, load, and build-up variants converge on reviewed canonical IDs
 * where they do not represent a materially distinct exercise.
 */
export const programmingExerciseMappings: readonly ProgrammingExerciseMappingEntry[] = [
  { exerciseKey: '90-90-hip-rotation', classification: 'programming-context-variant', canonicalExerciseId: '90-90-hip-rotation' },
  { exerciseKey: 'ankle-dorsiflexion', classification: 'canonical', canonicalExerciseId: 'ankle-dorsiflexion' },
  { exerciseKey: 'ankle-dorsiflexion-rock', classification: 'programming-context-variant', canonicalExerciseId: 'ankle-dorsiflexion' },
  { exerciseKey: 'assisted-pull-up', classification: 'canonical', canonicalExerciseId: 'assisted-pull-up' },
  { exerciseKey: 'assisted-scapular-pull-up', classification: 'canonical', canonicalExerciseId: 'assisted-scapular-pull-up' },
  { exerciseKey: 'band-external-rotation', classification: 'canonical', canonicalExerciseId: 'band-external-rotation' },
  { exerciseKey: 'band-face-pull', classification: 'canonical', canonicalExerciseId: 'face-pull' },
  { exerciseKey: 'band-glute-bridge', classification: 'canonical', canonicalExerciseId: 'glute-bridge' },
  { exerciseKey: 'band-lateral-walk', classification: 'canonical', canonicalExerciseId: 'band-lateral-walk' },
  { exerciseKey: 'band-pull-apart', classification: 'canonical', canonicalExerciseId: 'band-pull-apart' },
  { exerciseKey: 'band-scapular-depression', classification: 'canonical', canonicalExerciseId: 'band-scapular-depression' },
  { exerciseKey: 'band-straight-arm-pulldown', classification: 'canonical', canonicalExerciseId: 'straight-arm-pulldown' },
  { exerciseKey: 'barbell-bench-press', classification: 'canonical', canonicalExerciseId: 'barbell-bench-press' },
  { exerciseKey: 'barbell-rdl', classification: 'canonical', canonicalExerciseId: 'barbell-rdl' },
  { exerciseKey: 'barbell-squat', classification: 'canonical', canonicalExerciseId: 'barbell-squat' },
  { exerciseKey: 'bear-crawl', classification: 'canonical', canonicalExerciseId: 'bear-crawl' },
  { exerciseKey: 'bear-crawl-build', classification: 'programming-context-variant', canonicalExerciseId: 'bear-crawl' },
  { exerciseKey: 'bear-crawl-shuttle', classification: 'canonical', canonicalExerciseId: 'bear-crawl' },
  { exerciseKey: 'bear-crawl-shuttle-build', classification: 'programming-context-variant', canonicalExerciseId: 'bear-crawl' },
  { exerciseKey: 'bilateral-farmer-carry', classification: 'canonical', canonicalExerciseId: 'farmer-carry' },
  { exerciseKey: 'bird-dog', classification: 'canonical', canonicalExerciseId: 'bird-dog' },
  { exerciseKey: 'bodyweight-box-squat', classification: 'programming-context-variant', canonicalExerciseId: 'box-squat' },
  { exerciseKey: 'bodyweight-split-squat', classification: 'programming-context-variant', canonicalExerciseId: 'split-squat' },
  { exerciseKey: 'bodyweight-squat', classification: 'programming-context-variant', canonicalExerciseId: 'squat' },
  { exerciseKey: 'box-squat', classification: 'canonical', canonicalExerciseId: 'box-squat' },
  { exerciseKey: 'bulgarian-split-squat', classification: 'canonical', canonicalExerciseId: 'bulgarian-split-squat' },
  { exerciseKey: 'cable-fly', classification: 'canonical', canonicalExerciseId: 'cable-fly' },
  { exerciseKey: 'cable-pull-through', classification: 'canonical', canonicalExerciseId: 'cable-pull-through' },
  { exerciseKey: 'cable-pullover', classification: 'canonical', canonicalExerciseId: 'straight-arm-pulldown' },
  { exerciseKey: 'chest-extension', classification: 'canonical', canonicalExerciseId: 'chest-extension' },
  { exerciseKey: 'chest-rotation', classification: 'canonical', canonicalExerciseId: 'thoracic-rotation' },
  { exerciseKey: 'chest-supported-row', classification: 'canonical', canonicalExerciseId: 'chest-supported-row' },
  { exerciseKey: 'chest-t-spine-rotation', classification: 'canonical', canonicalExerciseId: 'thoracic-rotation' },
  { exerciseKey: 'copenhagen-plank', classification: 'canonical', canonicalExerciseId: 'copenhagen-plank' },
  { exerciseKey: 'dead-bug', classification: 'canonical', canonicalExerciseId: 'dead-bug' },
  { exerciseKey: 'double-dumbbell-front-squat', classification: 'canonical', canonicalExerciseId: 'double-dumbbell-front-squat' },
  { exerciseKey: 'double-dumbbell-rdl', classification: 'canonical', canonicalExerciseId: 'double-dumbbell-rdl' },
  { exerciseKey: 'double-kettlebell-rdl', classification: 'canonical', canonicalExerciseId: 'double-kettlebell-rdl' },
  { exerciseKey: 'dumbbell-bench-press', classification: 'canonical', canonicalExerciseId: 'dumbbell-bench-press' },
  { exerciseKey: 'dumbbell-chest-supported-row', classification: 'canonical', canonicalExerciseId: 'dumbbell-chest-supported-row' },
  { exerciseKey: 'dumbbell-curl', classification: 'canonical', canonicalExerciseId: 'dumbbell-curl' },
  { exerciseKey: 'dumbbell-hinge-pattern', classification: 'programming-context-variant', canonicalExerciseId: 'hinge-drill' },
  { exerciseKey: 'dumbbell-rdl', classification: 'canonical', canonicalExerciseId: 'dumbbell-rdl' },
  { exerciseKey: 'dynamic-hamstring-sweep', classification: 'canonical', canonicalExerciseId: 'hamstring-sweep' },
  { exerciseKey: 'face-pull', classification: 'canonical', canonicalExerciseId: 'face-pull' },
  { exerciseKey: 'farmer-carry', classification: 'canonical', canonicalExerciseId: 'farmer-carry' },
  { exerciseKey: 'farmer-carry-build', classification: 'programming-context-variant', canonicalExerciseId: 'farmer-carry' },
  { exerciseKey: 'floor-glute-bridge', classification: 'programming-context-variant', canonicalExerciseId: 'glute-bridge' },
  { exerciseKey: 'forward-lunge', classification: 'canonical', canonicalExerciseId: 'forward-lunge' },
  { exerciseKey: 'front-foot-elevated-split-squat', classification: 'canonical', canonicalExerciseId: 'front-foot-elevated-split-squat' },
  { exerciseKey: 'front-rack-carry', classification: 'canonical', canonicalExerciseId: 'front-rack-carry' },
  { exerciseKey: 'glute-bridge', classification: 'canonical', canonicalExerciseId: 'glute-bridge' },
  { exerciseKey: 'glute-bridge-abduction', classification: 'canonical', canonicalExerciseId: 'glute-bridge-abduction' },
  { exerciseKey: 'goblet-box-squat', classification: 'canonical', canonicalExerciseId: 'goblet-box-squat' },
  { exerciseKey: 'goblet-squat', classification: 'canonical', canonicalExerciseId: 'goblet-squat' },
  { exerciseKey: 'goblet-squat-pattern', classification: 'programming-context-variant', canonicalExerciseId: 'goblet-squat' },
  { exerciseKey: 'hack-squat', classification: 'canonical', canonicalExerciseId: 'hack-squat' },
  { exerciseKey: 'half-kneeling-hip-flexor-stretch', classification: 'canonical', canonicalExerciseId: 'half-kneeling-hip-flexor-stretch' },
  { exerciseKey: 'half-kneeling-t-spine-rotation', classification: 'canonical', canonicalExerciseId: 'thoracic-rotation' },
  { exerciseKey: 'hamstring-sweep', classification: 'canonical', canonicalExerciseId: 'hamstring-sweep' },
  { exerciseKey: 'heavy-chest-supported-row', classification: 'programming-context-variant', canonicalExerciseId: 'chest-supported-row' },
  { exerciseKey: 'heavy-double-dumbbell-rdl', classification: 'programming-context-variant', canonicalExerciseId: 'double-dumbbell-rdl' },
  { exerciseKey: 'heavy-hack-squat', classification: 'programming-context-variant', canonicalExerciseId: 'hack-squat' },
  { exerciseKey: 'heavy-hip-thrust', classification: 'programming-context-variant', canonicalExerciseId: 'hip-thrust' },
  { exerciseKey: 'heavy-overload-hip-thrust', classification: 'programming-context-variant', canonicalExerciseId: 'overload-hip-thrust' },
  { exerciseKey: 'high-control-farmer-carry', classification: 'programming-context-variant', canonicalExerciseId: 'farmer-carry' },
  { exerciseKey: 'high-control-sled-push', classification: 'programming-context-variant', canonicalExerciseId: 'sled-push' },
  { exerciseKey: 'high-kettlebell-deadlift', classification: 'canonical', canonicalExerciseId: 'kettlebell-deadlift' },
  { exerciseKey: 'hinge-drill', classification: 'canonical', canonicalExerciseId: 'hinge-drill' },
  { exerciseKey: 'hip-abduction', classification: 'canonical', canonicalExerciseId: 'hip-abduction' },
  { exerciseKey: 'hip-flexor-mobility', classification: 'canonical', canonicalExerciseId: 'hip-flexor-mobility' },
  { exerciseKey: 'hip-rotation-mobility', classification: 'canonical', canonicalExerciseId: 'hip-rotation-mobility' },
  { exerciseKey: 'hip-thrust', classification: 'canonical', canonicalExerciseId: 'hip-thrust' },
  { exerciseKey: 'incline-dumbbell-curl', classification: 'canonical', canonicalExerciseId: 'incline-dumbbell-curl' },
  { exerciseKey: 'incline-dumbbell-press', classification: 'canonical', canonicalExerciseId: 'incline-dumbbell-press' },
  { exerciseKey: 'incline-push-up', classification: 'canonical', canonicalExerciseId: 'incline-push-up' },
  { exerciseKey: 'incline-push-up-pattern', classification: 'programming-context-variant', canonicalExerciseId: 'incline-push-up' },
  { exerciseKey: 'kb-deadlift', classification: 'canonical', canonicalExerciseId: 'kettlebell-deadlift' },
  { exerciseKey: 'kb-deadlift-build', classification: 'programming-context-variant', canonicalExerciseId: 'kettlebell-deadlift' },
  { exerciseKey: 'kb-rdl', classification: 'canonical', canonicalExerciseId: 'kettlebell-rdl' },
  { exerciseKey: 'kb-rdl-build', classification: 'programming-context-variant', canonicalExerciseId: 'kettlebell-rdl' },
  { exerciseKey: 'kb-swing', classification: 'canonical', canonicalExerciseId: 'kettlebell-swing' },
  { exerciseKey: 'kb-swing-build', classification: 'programming-context-variant', canonicalExerciseId: 'kettlebell-swing' },
  { exerciseKey: 'kettlebell-deadlift', classification: 'canonical', canonicalExerciseId: 'kettlebell-deadlift' },
  { exerciseKey: 'kettlebell-hinge-pattern', classification: 'programming-context-variant', canonicalExerciseId: 'hinge-drill' },
  { exerciseKey: 'kettlebell-rdl', classification: 'canonical', canonicalExerciseId: 'kettlebell-rdl' },
  { exerciseKey: 'kettlebell-swing-stance', classification: 'programming-context-variant', canonicalExerciseId: 'kettlebell-swing' },
  { exerciseKey: 'lat-pulldown', classification: 'canonical', canonicalExerciseId: 'lat-pulldown' },
  { exerciseKey: 'lateral-bear-crawl', classification: 'canonical', canonicalExerciseId: 'lateral-bear-crawl' },
  { exerciseKey: 'lateral-bear-crawl-build', classification: 'programming-context-variant', canonicalExerciseId: 'lateral-bear-crawl' },
  { exerciseKey: 'lateral-lunge', classification: 'canonical', canonicalExerciseId: 'lateral-lunge' },
  { exerciseKey: 'lateral-lunge-build', classification: 'programming-context-variant', canonicalExerciseId: 'lateral-lunge' },
  { exerciseKey: 'lateral-raise', classification: 'canonical', canonicalExerciseId: 'lateral-raise' },
  { exerciseKey: 'leg-curl', classification: 'canonical', canonicalExerciseId: 'leg-curl' },
  { exerciseKey: 'leg-extension', classification: 'canonical', canonicalExerciseId: 'leg-extension' },
  { exerciseKey: 'light-farmer-carry', classification: 'programming-context-variant', canonicalExerciseId: 'farmer-carry' },
  { exerciseKey: 'light-kettlebell-halo', classification: 'programming-context-variant', canonicalExerciseId: 'light-kettlebell-halo' },
  { exerciseKey: 'light-sled-push', classification: 'programming-context-variant', canonicalExerciseId: 'sled-push' },
  { exerciseKey: 'low-assistance-pull-up', classification: 'programming-context-variant', canonicalExerciseId: 'assisted-pull-up' },
  { exerciseKey: 'low-box-step-up', classification: 'canonical', canonicalExerciseId: 'low-box-step-up' },
  { exerciseKey: 'machine-chest-press', classification: 'canonical', canonicalExerciseId: 'machine-chest-press' },
  { exerciseKey: 'machine-lateral-raise', classification: 'canonical', canonicalExerciseId: 'machine-lateral-raise' },
  { exerciseKey: 'medicine-ball-rotational-throw-stance', classification: 'programming-context-variant', canonicalExerciseId: 'medicine-ball-rotational-throw' },
  { exerciseKey: 'medicine-ball-slam', classification: 'canonical', canonicalExerciseId: 'medicine-ball-slam' },
  { exerciseKey: 'medicine-ball-slam-build', classification: 'programming-context-variant', canonicalExerciseId: 'medicine-ball-slam' },
  { exerciseKey: 'medicine-ball-slam-target-build', classification: 'programming-context-variant', canonicalExerciseId: 'medicine-ball-slam' },
  { exerciseKey: 'medicine-ball-slam-technique', classification: 'programming-context-variant', canonicalExerciseId: 'medicine-ball-slam' },
  { exerciseKey: 'mini-band-lateral-walk', classification: 'canonical', canonicalExerciseId: 'band-lateral-walk' },
  { exerciseKey: 'moderate-farmer-carry', classification: 'programming-context-variant', canonicalExerciseId: 'farmer-carry' },
  { exerciseKey: 'moderate-high-farmer-carry', classification: 'programming-context-variant', canonicalExerciseId: 'farmer-carry' },
  { exerciseKey: 'moderate-high-sled-push', classification: 'programming-context-variant', canonicalExerciseId: 'sled-push' },
  { exerciseKey: 'moderate-sled-push', classification: 'programming-context-variant', canonicalExerciseId: 'sled-push' },
  { exerciseKey: 'multidirectional-lunge', classification: 'canonical', canonicalExerciseId: 'multidirectional-lunge' },
  { exerciseKey: 'multidirectional-lunge-build', classification: 'programming-context-variant', canonicalExerciseId: 'multidirectional-lunge' },
  { exerciseKey: 'neutral-grip-lat-pulldown', classification: 'canonical', canonicalExerciseId: 'lat-pulldown' },
  { exerciseKey: 'overload-hip-thrust', classification: 'canonical', canonicalExerciseId: 'overload-hip-thrust' },
  { exerciseKey: 'pallof-press', classification: 'canonical', canonicalExerciseId: 'pallof-press' },
  { exerciseKey: 'pec-deck', classification: 'canonical', canonicalExerciseId: 'pec-deck' },
  { exerciseKey: 'plank', classification: 'canonical', canonicalExerciseId: 'plank' },
  { exerciseKey: 'quadruped-t-spine-rotation', classification: 'canonical', canonicalExerciseId: 'thoracic-rotation' },
  { exerciseKey: 'rear-delt-fly', classification: 'canonical', canonicalExerciseId: 'rear-delt-fly' },
  { exerciseKey: 'reverse-lunge', classification: 'canonical', canonicalExerciseId: 'reverse-lunge' },
  { exerciseKey: 'reverse-lunge-pattern', classification: 'programming-context-variant', canonicalExerciseId: 'reverse-lunge' },
  { exerciseKey: 'rope-triceps-pressdown', classification: 'canonical', canonicalExerciseId: 'rope-triceps-pressdown' },
  { exerciseKey: 'rotational-throw', classification: 'canonical', canonicalExerciseId: 'medicine-ball-rotational-throw' },
  { exerciseKey: 'rotational-throw-build', classification: 'programming-context-variant', canonicalExerciseId: 'medicine-ball-rotational-throw' },
  { exerciseKey: 'row-erg', classification: 'canonical', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-control', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-easy', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-easy-long', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-moderate', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-recovery', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-recovery-final', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-recovery-short', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-target', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-target-final', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-target-long', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-build-target-short', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-long-stroke', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-rhythm', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-target-pace', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'row-erg-technique', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'rower-easy', classification: 'programming-context-variant', canonicalExerciseId: 'row-erg' },
  { exerciseKey: 'scapular-push-up', classification: 'canonical', canonicalExerciseId: 'scapular-push-up' },
  { exerciseKey: 'seated-dumbbell-shoulder-press', classification: 'canonical', canonicalExerciseId: 'seated-dumbbell-shoulder-press' },
  { exerciseKey: 'seated-hip-adduction', classification: 'canonical', canonicalExerciseId: 'seated-hip-adduction' },
  { exerciseKey: 'seated-lat-pulldown', classification: 'canonical', canonicalExerciseId: 'lat-pulldown' },
  { exerciseKey: 'seated-leg-curl', classification: 'canonical', canonicalExerciseId: 'seated-leg-curl' },
  { exerciseKey: 'seated-row', classification: 'canonical', canonicalExerciseId: 'seated-row' },
  { exerciseKey: 'side-lying-open-book', classification: 'canonical', canonicalExerciseId: 'side-lying-open-book' },
  { exerciseKey: 'single-arm-cable-row', classification: 'programming-context-variant', canonicalExerciseId: 'single-arm-cable-row' },
  { exerciseKey: 'single-arm-lat-pulldown', classification: 'programming-context-variant', canonicalExerciseId: 'single-arm-lat-pulldown' },
  { exerciseKey: 'single-leg-rdl', classification: 'programming-context-variant', canonicalExerciseId: 'single-leg-rdl' },
  { exerciseKey: 'ski-erg-easy', classification: 'programming-context-variant', canonicalExerciseId: 'skierg' },
  { exerciseKey: 'skierg', classification: 'canonical', canonicalExerciseId: 'skierg' },
  { exerciseKey: 'skierg-build', classification: 'programming-context-variant', canonicalExerciseId: 'skierg' },
  { exerciseKey: 'sled-push', classification: 'canonical', canonicalExerciseId: 'sled-push' },
  { exerciseKey: 'sled-push-build', classification: 'programming-context-variant', canonicalExerciseId: 'sled-push' },
  { exerciseKey: 'split-squat-pattern', classification: 'programming-context-variant', canonicalExerciseId: 'split-squat' },
  { exerciseKey: 'step-up-knee-drive', classification: 'canonical', canonicalExerciseId: 'step-up-knee-drive' },
  { exerciseKey: 'step-up-knee-drive-build', classification: 'programming-context-variant', canonicalExerciseId: 'step-up-knee-drive' },
  { exerciseKey: 'straight-arm-pulldown', classification: 'canonical', canonicalExerciseId: 'straight-arm-pulldown' },
  { exerciseKey: 'suitcase-carry', classification: 'canonical', canonicalExerciseId: 'suitcase-carry' },
  { exerciseKey: 'supine-open-book', classification: 'canonical', canonicalExerciseId: 'supine-open-book' },
  { exerciseKey: 'supported-bulgarian-split-squat', classification: 'programming-context-variant', canonicalExerciseId: 'bulgarian-split-squat' },
  { exerciseKey: 'supported-front-foot-elevated-split-squat', classification: 'programming-context-variant', canonicalExerciseId: 'front-foot-elevated-split-squat' },
  { exerciseKey: 'supported-low-box-step-up', classification: 'programming-context-variant', canonicalExerciseId: 'low-box-step-up' },
  { exerciseKey: 'supported-reverse-lunge', classification: 'programming-context-variant', canonicalExerciseId: 'reverse-lunge' },
  { exerciseKey: 'supported-single-leg-stand', classification: 'programming-context-variant', canonicalExerciseId: 'single-leg-stand' },
  { exerciseKey: 'supported-split-squat', classification: 'programming-context-variant', canonicalExerciseId: 'split-squat' },
  { exerciseKey: 'thoracic-rotation', classification: 'canonical', canonicalExerciseId: 'thoracic-rotation' },
  { exerciseKey: 'wall-ankle-knee-to-wall', classification: 'canonical', canonicalExerciseId: 'ankle-dorsiflexion' },
  { exerciseKey: 'wall-assisted-hip-hinge', classification: 'canonical', canonicalExerciseId: 'hinge-drill' },
  { exerciseKey: 'wall-hip-hinge', classification: 'canonical', canonicalExerciseId: 'hinge-drill' },
  { exerciseKey: 'wall-slide', classification: 'canonical', canonicalExerciseId: 'wall-slide' },
]

export type ProgrammingIdentityDecision = {
  readonly family: string
  readonly decision: 'same-canonical-exercise' | 'distinct-canonical-exercise-variant'
  readonly exerciseKeys: readonly ExerciseKey[]
  readonly canonicalExerciseIds: readonly string[]
  readonly rationale: string
}

/**
 * Slice 2A identity reconciliation record. These decisions are explicit
 * design metadata; mappings above remain the executable source of truth.
 */
export const programmingIdentityDecisions: readonly ProgrammingIdentityDecision[] = [
  {
    family: 'kettlebell-deadlift-abbreviation',
    decision: 'same-canonical-exercise',
    exerciseKeys: ["kb-deadlift","kettlebell-deadlift","kb-deadlift-build","high-kettlebell-deadlift"],
    canonicalExerciseIds: ["kettlebell-deadlift"],
    rationale: 'kb and kettlebell spellings plus load/build descriptors identify one kettlebell deadlift.',
  },
  {
    family: 'kettlebell-rdl-abbreviation',
    decision: 'same-canonical-exercise',
    exerciseKeys: ["kb-rdl","kettlebell-rdl","kb-rdl-build"],
    canonicalExerciseIds: ["kettlebell-rdl"],
    rationale: 'kb and kettlebell spellings plus the build descriptor identify one kettlebell RDL.',
  },
  {
    family: 'farmer-carry-bilateral-context',
    decision: 'same-canonical-exercise',
    exerciseKeys: ["farmer-carry","bilateral-farmer-carry","farmer-carry-build","light-farmer-carry","moderate-farmer-carry","moderate-high-farmer-carry","high-control-farmer-carry"],
    canonicalExerciseIds: ["farmer-carry"],
    rationale: 'bilateral, load, control, and build descriptors do not create a second carry identity.',
  },
  {
    family: 'face-pull-band-context',
    decision: 'same-canonical-exercise',
    exerciseKeys: ["band-face-pull","face-pull"],
    canonicalExerciseIds: ["face-pull"],
    rationale: 'the band is an execution context for the same face-pull exercise identity.',
  },
  {
    family: 'lat-pulldown-grip-seat-context',
    decision: 'same-canonical-exercise',
    exerciseKeys: ["lat-pulldown","seated-lat-pulldown","neutral-grip-lat-pulldown"],
    canonicalExerciseIds: ["lat-pulldown"],
    rationale: 'seated setup and neutral grip are execution contexts for the same vertical pulldown identity.',
  },
  {
    family: 'straight-arm-pulldown-equipment-context',
    decision: 'same-canonical-exercise',
    exerciseKeys: ["straight-arm-pulldown","band-straight-arm-pulldown","cable-pullover"],
    canonicalExerciseIds: ["straight-arm-pulldown"],
    rationale: 'band, cable, and pullover naming describe the same straight-arm shoulder-extension pattern in this programming scope.',
  },
  {
    family: 'thoracic-rotation-naming-variants',
    decision: 'same-canonical-exercise',
    exerciseKeys: ["thoracic-rotation","chest-rotation","chest-t-spine-rotation","half-kneeling-t-spine-rotation","quadruped-t-spine-rotation"],
    canonicalExerciseIds: ["thoracic-rotation"],
    rationale: 'thoracic, chest, and T-spine naming plus supported setup context refer to one reviewed thoracic rotation identity.',
  },
  {
    family: 'open-book-position',
    decision: 'distinct-canonical-exercise-variant',
    exerciseKeys: ["side-lying-open-book","supine-open-book"],
    canonicalExerciseIds: ["side-lying-open-book","supine-open-book"],
    rationale: 'side-lying and supine starting positions materially change setup and execution, so they remain distinct canonical variants.',
  },
]

const issueOrder: Record<ProgrammingExerciseMapIssue['code'], number> = {
  ACTION_STYLE_CANONICAL_ID: 0,
  DUPLICATE_SOURCE_KEY: 1,
  UNKNOWN_CANONICAL_TARGET: 2,
}

export const validateProgrammingExerciseMappings = (
  entries: readonly ProgrammingExerciseMappingEntry[],
  canonicalExerciseIds: ReadonlySet<string>,
): ProgrammingExerciseMapIssue[] => {
  const issues: ProgrammingExerciseMapIssue[] = []
  const seenKeys = new Set<ExerciseKey>()

  for (const entry of entries) {
    if (seenKeys.has(entry.exerciseKey)) {
      issues.push({ code: 'DUPLICATE_SOURCE_KEY', exerciseKey: entry.exerciseKey })
    }
    seenKeys.add(entry.exerciseKey)

    if (!entry.canonicalExerciseId) continue

    if (/^action-\d+$/.test(entry.canonicalExerciseId)) {
      issues.push({
        code: 'ACTION_STYLE_CANONICAL_ID',
        exerciseKey: entry.exerciseKey,
        canonicalExerciseId: entry.canonicalExerciseId,
      })
    }

    if (!canonicalExerciseIds.has(entry.canonicalExerciseId)) {
      issues.push({
        code: 'UNKNOWN_CANONICAL_TARGET',
        exerciseKey: entry.exerciseKey,
        canonicalExerciseId: entry.canonicalExerciseId,
      })
    }
  }

  return issues.sort((left, right) => issueOrder[left.code] - issueOrder[right.code])
}

export const createProgrammingExerciseLookup = (
  entries: readonly ProgrammingExerciseMappingEntry[],
): ReadonlyMap<ExerciseKey, string> => {
  const lookup = new Map<ExerciseKey, string>()

  for (const entry of entries) {
    if (lookup.has(entry.exerciseKey)) {
      throw new Error(`Duplicate Programming exerciseKey: ${entry.exerciseKey}`)
    }
    if (entry.canonicalExerciseId) lookup.set(entry.exerciseKey, entry.canonicalExerciseId)
  }

  return lookup
}
