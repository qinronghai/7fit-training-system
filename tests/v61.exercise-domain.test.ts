import { describe, expect, it } from 'vitest'
import { exercises, getExercise, resolveExerciseId } from '../src/data/exercises'

describe('V6.1 exercise domain', () => {
  it('uses stable unique exercise slugs', () => {
    const ids = exercises.map((exercise) => exercise.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(id).not.toMatch(/^action-\d+$/)
    }
  })

  it('resolves canonical exercise names to stable ids', () => {
    expect(resolveExerciseId('哈克深蹲')).toBe('hack-squat')
    expect(getExercise('hack-squat')?.name).toBe('哈克深蹲')
  })

  it('resolves aliases to the same canonical exercise', () => {
    expect(resolveExerciseId('臀桥')).toBe('glute-bridge')
    expect(resolveExerciseId('徒手臀桥')).toBe('glute-bridge')
  })
})
