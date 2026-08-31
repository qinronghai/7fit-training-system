import { describe, expect, it } from 'vitest'
import {
  buildFemale111PrescriptionProgression,
  compareFemale111Prescription,
  type Female111Prescription,
} from '../src/data/female111/prescription'

const base: Female111Prescription = {
  exerciseId: 'box-squat',
  sets: 3,
  reps: 8,
  loadKg: 20,
  rir: 3,
  restSeconds: 90,
  rom: 'targeted',
  tempo: '3-1-1',
  leverLength: 'short',
  support: 'supported',
  laterality: 'bilateral',
  complexity: 'stable',
  integration: 'isolated',
  density: 'normal',
  breathingDemand: 'continuous',
  coordinationDemand: 'low',
}

describe('PP-F111 dual progression', () => {
  it('accepts same-exercise prescription progression', () => {
    const next = { ...base, reps: 10 }
    const comparison = compareFemale111Prescription(base, next)
    expect(comparison.valid).toBe(true)
    expect(comparison.changedVariables).toEqual(['reps'])

    const progressed = buildFemale111PrescriptionProgression(base, { reps: 10 })
    expect(progressed.exerciseId).toBe(base.exerciseId)
    expect(progressed.reps).toBe(10)
  })

  it('allows at most two primary prescription changes without an override', () => {
    const next = { ...base, loadKg: 22, reps: 10, sets: 4 }
    const comparison = compareFemale111Prescription(base, next)
    expect(comparison.valid).toBe(false)
    expect(comparison.reason).toContain('两项')
  })

  it('rejects an exercise swap from the prescription progression path', () => {
    const next = { ...base, exerciseId: 'goblet-squat' }
    const comparison = compareFemale111Prescription(base, next)
    expect(comparison.valid).toBe(false)
    expect(comparison.reason).toContain('动作不变')
  })
})
