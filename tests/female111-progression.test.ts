import { describe, expect, it } from 'vitest'
import {
  female111ProgressionFamilies,
  getFemale111ProgressionFamily,
  getFemale111ProgressionNode,
} from '../src/data/female111/progression'

describe('PP-F111 Stage 1 progression families', () => {
  it('defines the required primary, support, and core family matrix', () => {
    const required = {
      PRIMARY: ['SQUAT', 'HINGE', 'HIP_EXTENSION', 'SINGLE_LEG', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'INTEGRATED_COMPOUND'],
      SUPPORT: ['ANTERIOR_SUPPORT', 'QUADRUPED_SUPPORT', 'LATERAL_SUPPORT', 'DYNAMIC_SUPPORT', 'LOCOMOTION', 'FRONTAL_PLANE'],
      CORE: ['BREATHING_POSITION', 'ANTI_EXTENSION', 'ANTI_ROTATION', 'ANTI_LATERAL_FLEXION', 'ROTATION_CONTROL', 'DYNAMIC_CORE'],
    } as const

    for (const [slot, families] of Object.entries(required)) {
      for (const family of families) {
        expect(getFemale111ProgressionFamily(slot as keyof typeof required, family)).toBeDefined()
      }
    }
    expect(female111ProgressionFamilies.length).toBeGreaterThanOrEqual(21)
  })

  it('exposes branched progression and explicit regression edges with evidence', () => {
    const lateral = getFemale111ProgressionFamily('SUPPORT', 'LATERAL_SUPPORT')!
    expect(lateral.edges.some((edge) => edge.direction === 'BRANCH')).toBe(true)
    expect(lateral.edges.some((edge) => edge.direction === 'REGRESSION')).toBe(true)
    expect(lateral.edges.every((edge) => edge.rationale.trim() && edge.requiredCapabilities.length > 0)).toBe(true)
  })

  it('keeps progression nodes linked to real canonical exercise identity', () => {
    const node = getFemale111ProgressionNode('exp-box-squat')
    expect(node).toBeDefined()
    expect(node?.exerciseId).toBeTruthy()
    expect(node?.rationale).toBeTruthy()
    expect(node?.failureCondition).toBeTruthy()
  })
})
