import type {
  Female111NextStepInput,
  Female111ProgressionDecision,
} from './types'

export const decideFemale111NextStep = (
  input: Female111NextStepInput,
): Female111ProgressionDecision => {
  if (input.symptoms.length > 0) return 'SWAP'
  if (input.quality === 'FAILED' || input.quality === 'DEGRADED') return 'REGRESS'
  if (input.progressionAvailable !== false && (input.rir ?? 0) >= 2) return 'PROGRESS'
  return 'KEEP'
}
