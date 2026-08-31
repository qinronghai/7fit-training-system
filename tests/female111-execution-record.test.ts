import { beforeEach, describe, expect, it } from 'vitest'
import {
  decideFemale111NextStep,
  getFemale111SessionResult,
  listFemale111SessionResults,
  saveFemale111SessionResult,
  copyFemale111SessionResult,
} from '../src/data/female111'
import type { Female111SessionResult } from '../src/data/female111'

const result: Female111SessionResult = {
  id: 'female111-result-1',
  sessionId: 'female111-session-1',
  recordedAt: '2026-08-30T10:00:00.000Z',
  coachId: 'coach-1',
  readiness: 'GREEN',
  primary: {
    methodNodeId: 'pp01',
    exerciseId: 'barbell-back-squat',
    loadKg: 40,
    sets: 3,
    reps: 8,
    rir: 2,
    quality: 'GOOD',
    symptoms: [],
    nextStep: 'PROGRESS',
  },
  support: {
    methodNodeId: 'exp-incline-plank',
    version: '膝支撑斜板',
    reps: 10,
    durationSeconds: 30,
    quality: 'GOOD',
    symptoms: [],
    decision: 'KEEP',
  },
  core: {
    methodNodeId: 'pp26',
    version: '死虫式基础版',
    reps: 8,
    durationSeconds: 0,
    quality: 'DEGRADED',
    symptoms: [],
    decision: 'REGRESS',
  },
  notes: '动作质量稳定，核心控制需要回退。',
}

describe('PP-F111 Stage 6 execution record and persistence', () => {
  beforeEach(() => localStorage.clear())

  it('derives the next step from quality, symptoms, and reserve', () => {
    expect(decideFemale111NextStep({ quality: 'GOOD', rir: 3, symptoms: [] })).toBe('PROGRESS')
    expect(decideFemale111NextStep({ quality: 'GOOD', rir: 1, symptoms: [] })).toBe('KEEP')
    expect(decideFemale111NextStep({ quality: 'DEGRADED', rir: 2, symptoms: [] })).toBe('REGRESS')
    expect(decideFemale111NextStep({ quality: 'GOOD', rir: 2, symptoms: ['膝前不适'] })).toBe('SWAP')
  })

  it('stores the full primary/support/core execution evidence and reads it back', () => {
    saveFemale111SessionResult(result)

    expect(getFemale111SessionResult(result.id)).toEqual(result)
    expect(listFemale111SessionResults()).toEqual([result])
  })

  it('returns newest records first and copies a record with a new identity', () => {
    saveFemale111SessionResult(result)
    saveFemale111SessionResult({ ...result, id: 'female111-result-2', recordedAt: '2026-08-30T11:00:00.000Z' })

    const copied = copyFemale111SessionResult(result.id, {
      id: 'female111-result-copy',
      recordedAt: '2026-08-31T10:00:00.000Z',
    })

    expect(copied).toEqual(expect.objectContaining({
      id: 'female111-result-copy',
      sessionId: result.sessionId,
      primary: result.primary,
    }))
    expect(listFemale111SessionResults().map((item) => item.id)).toEqual([
      'female111-result-copy',
      'female111-result-2',
      'female111-result-1',
    ])
  })

  it('fails safe when persisted data is malformed', () => {
    localStorage.setItem('7fit-female111-v2-session-results', '{bad json')
    expect(listFemale111SessionResults()).toEqual([])
    expect(getFemale111SessionResult('missing')).toBeUndefined()
  })
})
