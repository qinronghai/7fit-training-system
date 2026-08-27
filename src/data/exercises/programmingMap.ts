import type { ExerciseKey } from '../programming/types'

export type ProgrammingExerciseKeyClassification = 'canonical' | 'programming-context-variant'

export type ProgrammingExerciseMappingEntry = {
  readonly exerciseKey: ExerciseKey
  readonly classification: ProgrammingExerciseKeyClassification
  readonly canonicalExerciseId?: string
}

export type ProgrammingExerciseMapIssue =
  | { code: 'DUPLICATE_SOURCE_KEY'; exerciseKey: ExerciseKey }
  | { code: 'UNKNOWN_CANONICAL_TARGET'; exerciseKey: ExerciseKey; canonicalExerciseId: string }
  | { code: 'ACTION_STYLE_CANONICAL_ID'; exerciseKey: ExerciseKey; canonicalExerciseId: string }

/**
 * Explicit Slice 1 inventory for every formal Programming exerciseKey.
 *
 * An omitted canonicalExerciseId is intentional until the canonical registry
 * record is reviewed and added in a later Exercise Database slice.
 * No displayName, slug, array position, or action id is used to infer a link.
 */
export const programmingExerciseMappings: readonly ProgrammingExerciseMappingEntry[] = [
  { exerciseKey: '90-90-hip-rotation', classification: 'programming-context-variant' },
  { exerciseKey: 'ankle-dorsiflexion', classification: 'canonical' },
  { exerciseKey: 'ankle-dorsiflexion-rock', classification: 'programming-context-variant' },
  { exerciseKey: 'assisted-pull-up', classification: 'canonical' },
  { exerciseKey: 'assisted-scapular-pull-up', classification: 'canonical' },
  { exerciseKey: 'band-external-rotation', classification: 'canonical' },
  { exerciseKey: 'band-face-pull', classification: 'canonical' },
  { exerciseKey: 'band-glute-bridge', classification: 'canonical' },
  { exerciseKey: 'band-lateral-walk', classification: 'canonical' },
  { exerciseKey: 'band-pull-apart', classification: 'canonical' },
  { exerciseKey: 'band-scapular-depression', classification: 'canonical' },
  { exerciseKey: 'band-straight-arm-pulldown', classification: 'canonical' },
  { exerciseKey: 'barbell-bench-press', classification: 'canonical' },
  { exerciseKey: 'barbell-rdl', classification: 'canonical' },
  { exerciseKey: 'barbell-squat', classification: 'canonical' },
  { exerciseKey: 'bear-crawl', classification: 'canonical' },
  { exerciseKey: 'bear-crawl-build', classification: 'programming-context-variant' },
  { exerciseKey: 'bear-crawl-shuttle', classification: 'canonical' },
  { exerciseKey: 'bear-crawl-shuttle-build', classification: 'programming-context-variant' },
  { exerciseKey: 'bilateral-farmer-carry', classification: 'canonical' },
  { exerciseKey: 'bird-dog', classification: 'canonical' },
  { exerciseKey: 'bodyweight-box-squat', classification: 'programming-context-variant' },
  { exerciseKey: 'bodyweight-split-squat', classification: 'programming-context-variant' },
  { exerciseKey: 'bodyweight-squat', classification: 'programming-context-variant' },
  { exerciseKey: 'box-squat', classification: 'canonical' },
  { exerciseKey: 'bulgarian-split-squat', classification: 'canonical' },
  { exerciseKey: 'cable-fly', classification: 'canonical' },
  { exerciseKey: 'cable-pull-through', classification: 'canonical' },
  { exerciseKey: 'cable-pullover', classification: 'canonical' },
  { exerciseKey: 'chest-extension', classification: 'canonical' },
  { exerciseKey: 'chest-rotation', classification: 'canonical' },
  { exerciseKey: 'chest-supported-row', classification: 'canonical' },
  { exerciseKey: 'chest-t-spine-rotation', classification: 'canonical' },
  { exerciseKey: 'copenhagen-plank', classification: 'canonical' },
  { exerciseKey: 'dead-bug', classification: 'canonical' },
  { exerciseKey: 'double-dumbbell-front-squat', classification: 'canonical' },
  { exerciseKey: 'double-dumbbell-rdl', classification: 'canonical' },
  { exerciseKey: 'double-kettlebell-rdl', classification: 'canonical' },
  { exerciseKey: 'dumbbell-bench-press', classification: 'canonical' },
  { exerciseKey: 'dumbbell-chest-supported-row', classification: 'canonical' },
  { exerciseKey: 'dumbbell-curl', classification: 'canonical' },
  { exerciseKey: 'dumbbell-hinge-pattern', classification: 'programming-context-variant' },
  { exerciseKey: 'dumbbell-rdl', classification: 'canonical' },
  { exerciseKey: 'dynamic-hamstring-sweep', classification: 'canonical' },
  { exerciseKey: 'face-pull', classification: 'canonical' },
  { exerciseKey: 'farmer-carry', classification: 'canonical' },
  { exerciseKey: 'farmer-carry-build', classification: 'programming-context-variant' },
  { exerciseKey: 'floor-glute-bridge', classification: 'programming-context-variant', canonicalExerciseId: 'glute-bridge' },
  { exerciseKey: 'forward-lunge', classification: 'canonical' },
  { exerciseKey: 'front-foot-elevated-split-squat', classification: 'canonical' },
  { exerciseKey: 'front-rack-carry', classification: 'canonical' },
  { exerciseKey: 'glute-bridge', classification: 'canonical', canonicalExerciseId: 'glute-bridge' },
  { exerciseKey: 'glute-bridge-abduction', classification: 'canonical' },
  { exerciseKey: 'goblet-box-squat', classification: 'canonical' },
  { exerciseKey: 'goblet-squat', classification: 'canonical' },
  { exerciseKey: 'goblet-squat-pattern', classification: 'programming-context-variant' },
  { exerciseKey: 'hack-squat', classification: 'canonical', canonicalExerciseId: 'hack-squat' },
  { exerciseKey: 'half-kneeling-hip-flexor-stretch', classification: 'canonical' },
  { exerciseKey: 'half-kneeling-t-spine-rotation', classification: 'canonical' },
  { exerciseKey: 'hamstring-sweep', classification: 'canonical' },
  { exerciseKey: 'heavy-chest-supported-row', classification: 'programming-context-variant' },
  { exerciseKey: 'heavy-double-dumbbell-rdl', classification: 'programming-context-variant' },
  { exerciseKey: 'heavy-hack-squat', classification: 'programming-context-variant', canonicalExerciseId: 'hack-squat' },
  { exerciseKey: 'heavy-hip-thrust', classification: 'programming-context-variant' },
  { exerciseKey: 'heavy-overload-hip-thrust', classification: 'programming-context-variant' },
  { exerciseKey: 'high-control-farmer-carry', classification: 'programming-context-variant' },
  { exerciseKey: 'high-control-sled-push', classification: 'programming-context-variant' },
  { exerciseKey: 'high-kettlebell-deadlift', classification: 'canonical' },
  { exerciseKey: 'hinge-drill', classification: 'canonical' },
  { exerciseKey: 'hip-abduction', classification: 'canonical' },
  { exerciseKey: 'hip-flexor-mobility', classification: 'canonical' },
  { exerciseKey: 'hip-rotation-mobility', classification: 'canonical' },
  { exerciseKey: 'hip-thrust', classification: 'canonical' },
  { exerciseKey: 'incline-dumbbell-curl', classification: 'canonical' },
  { exerciseKey: 'incline-dumbbell-press', classification: 'canonical' },
  { exerciseKey: 'incline-push-up', classification: 'canonical' },
  { exerciseKey: 'incline-push-up-pattern', classification: 'programming-context-variant' },
  { exerciseKey: 'kb-deadlift', classification: 'canonical' },
  { exerciseKey: 'kb-deadlift-build', classification: 'programming-context-variant' },
  { exerciseKey: 'kb-rdl', classification: 'canonical' },
  { exerciseKey: 'kb-rdl-build', classification: 'programming-context-variant' },
  { exerciseKey: 'kb-swing', classification: 'canonical' },
  { exerciseKey: 'kb-swing-build', classification: 'programming-context-variant' },
  { exerciseKey: 'kettlebell-deadlift', classification: 'canonical' },
  { exerciseKey: 'kettlebell-hinge-pattern', classification: 'programming-context-variant' },
  { exerciseKey: 'kettlebell-rdl', classification: 'canonical' },
  { exerciseKey: 'kettlebell-swing-stance', classification: 'programming-context-variant' },
  { exerciseKey: 'lat-pulldown', classification: 'canonical' },
  { exerciseKey: 'lateral-bear-crawl', classification: 'canonical' },
  { exerciseKey: 'lateral-bear-crawl-build', classification: 'programming-context-variant' },
  { exerciseKey: 'lateral-lunge', classification: 'canonical' },
  { exerciseKey: 'lateral-lunge-build', classification: 'programming-context-variant' },
  { exerciseKey: 'lateral-raise', classification: 'canonical' },
  { exerciseKey: 'leg-curl', classification: 'canonical' },
  { exerciseKey: 'leg-extension', classification: 'canonical' },
  { exerciseKey: 'light-farmer-carry', classification: 'programming-context-variant' },
  { exerciseKey: 'light-kettlebell-halo', classification: 'programming-context-variant' },
  { exerciseKey: 'light-sled-push', classification: 'programming-context-variant' },
  { exerciseKey: 'low-assistance-pull-up', classification: 'programming-context-variant' },
  { exerciseKey: 'low-box-step-up', classification: 'canonical' },
  { exerciseKey: 'machine-chest-press', classification: 'canonical' },
  { exerciseKey: 'machine-lateral-raise', classification: 'canonical' },
  { exerciseKey: 'medicine-ball-rotational-throw-stance', classification: 'programming-context-variant' },
  { exerciseKey: 'medicine-ball-slam', classification: 'canonical' },
  { exerciseKey: 'medicine-ball-slam-build', classification: 'programming-context-variant' },
  { exerciseKey: 'medicine-ball-slam-target-build', classification: 'programming-context-variant' },
  { exerciseKey: 'medicine-ball-slam-technique', classification: 'programming-context-variant' },
  { exerciseKey: 'mini-band-lateral-walk', classification: 'canonical' },
  { exerciseKey: 'moderate-farmer-carry', classification: 'programming-context-variant' },
  { exerciseKey: 'moderate-high-farmer-carry', classification: 'programming-context-variant' },
  { exerciseKey: 'moderate-high-sled-push', classification: 'programming-context-variant' },
  { exerciseKey: 'moderate-sled-push', classification: 'programming-context-variant' },
  { exerciseKey: 'multidirectional-lunge', classification: 'canonical' },
  { exerciseKey: 'multidirectional-lunge-build', classification: 'programming-context-variant' },
  { exerciseKey: 'neutral-grip-lat-pulldown', classification: 'canonical' },
  { exerciseKey: 'overload-hip-thrust', classification: 'canonical' },
  { exerciseKey: 'pallof-press', classification: 'canonical' },
  { exerciseKey: 'pec-deck', classification: 'canonical' },
  { exerciseKey: 'plank', classification: 'canonical' },
  { exerciseKey: 'quadruped-t-spine-rotation', classification: 'canonical' },
  { exerciseKey: 'rear-delt-fly', classification: 'canonical' },
  { exerciseKey: 'reverse-lunge', classification: 'canonical' },
  { exerciseKey: 'reverse-lunge-pattern', classification: 'programming-context-variant' },
  { exerciseKey: 'rope-triceps-pressdown', classification: 'canonical' },
  { exerciseKey: 'rotational-throw', classification: 'canonical' },
  { exerciseKey: 'rotational-throw-build', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg', classification: 'canonical' },
  { exerciseKey: 'row-erg-build', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-control', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-easy', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-easy-long', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-moderate', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-recovery', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-recovery-final', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-recovery-short', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-target', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-target-final', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-target-long', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-build-target-short', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-long-stroke', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-rhythm', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-target-pace', classification: 'programming-context-variant' },
  { exerciseKey: 'row-erg-technique', classification: 'programming-context-variant' },
  { exerciseKey: 'rower-easy', classification: 'programming-context-variant' },
  { exerciseKey: 'scapular-push-up', classification: 'canonical' },
  { exerciseKey: 'seated-dumbbell-shoulder-press', classification: 'canonical' },
  { exerciseKey: 'seated-hip-adduction', classification: 'canonical' },
  { exerciseKey: 'seated-lat-pulldown', classification: 'canonical' },
  { exerciseKey: 'seated-leg-curl', classification: 'canonical' },
  { exerciseKey: 'seated-row', classification: 'canonical' },
  { exerciseKey: 'side-lying-open-book', classification: 'canonical' },
  { exerciseKey: 'single-arm-cable-row', classification: 'programming-context-variant' },
  { exerciseKey: 'single-arm-lat-pulldown', classification: 'programming-context-variant' },
  { exerciseKey: 'single-leg-rdl', classification: 'programming-context-variant' },
  { exerciseKey: 'ski-erg-easy', classification: 'programming-context-variant' },
  { exerciseKey: 'skierg', classification: 'canonical' },
  { exerciseKey: 'skierg-build', classification: 'programming-context-variant' },
  { exerciseKey: 'sled-push', classification: 'canonical' },
  { exerciseKey: 'sled-push-build', classification: 'programming-context-variant' },
  { exerciseKey: 'split-squat-pattern', classification: 'programming-context-variant' },
  { exerciseKey: 'step-up-knee-drive', classification: 'canonical' },
  { exerciseKey: 'step-up-knee-drive-build', classification: 'programming-context-variant' },
  { exerciseKey: 'straight-arm-pulldown', classification: 'canonical' },
  { exerciseKey: 'suitcase-carry', classification: 'canonical' },
  { exerciseKey: 'supine-open-book', classification: 'canonical' },
  { exerciseKey: 'supported-bulgarian-split-squat', classification: 'programming-context-variant' },
  { exerciseKey: 'supported-front-foot-elevated-split-squat', classification: 'programming-context-variant' },
  { exerciseKey: 'supported-low-box-step-up', classification: 'programming-context-variant' },
  { exerciseKey: 'supported-reverse-lunge', classification: 'programming-context-variant' },
  { exerciseKey: 'supported-single-leg-stand', classification: 'programming-context-variant' },
  { exerciseKey: 'supported-split-squat', classification: 'programming-context-variant' },
  { exerciseKey: 'thoracic-rotation', classification: 'canonical' },
  { exerciseKey: 'wall-ankle-knee-to-wall', classification: 'canonical' },
  { exerciseKey: 'wall-assisted-hip-hinge', classification: 'canonical' },
  { exerciseKey: 'wall-hip-hinge', classification: 'canonical' },
  { exerciseKey: 'wall-slide', classification: 'canonical' },
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
