import { describe, expect, it } from 'vitest'
import {
  ppFemaleProgrammingPolicy,
  ppFemaleEligibilityCounts,
  ppFemaleSlots,
} from '../src/data/pp/femaleProgrammingPolicy'
import {
  getFemaleProgrammingCandidates,
  validateFemaleProgrammingBlock,
  validateFemaleProgrammingPolicy,
} from '../src/data/pp/femaleProgrammingRules'
import {
  ppMethodNodeById,
  ppMethodNodes,
} from '../src/data/pp/methodNodes'
import { ppCapabilities } from '../src/data/pp/types'

describe('PP-F1 female programming policy contract', () => {
  it('covers all 53 frozen Method nodes exactly once with the audited A/B/C counts', () => {
    expect(ppFemaleProgrammingPolicy).toHaveLength(53)
    expect(new Set(ppFemaleProgrammingPolicy.map((entry) => entry.nodeId)).size).toBe(53)
    expect(ppFemaleEligibilityCounts).toEqual({ A_DIRECT: 17, B_CONDITIONAL: 28, C_METHOD_ONLY: 8 })
    expect(validateFemaleProgrammingPolicy()).toEqual([])
  })

  it('keeps policy identity separate from Method and Exercise metadata', () => {
    for (const entry of ppFemaleProgrammingPolicy) {
      const methodNode = ppMethodNodeById.get(entry.nodeId)
      expect(methodNode).toBeDefined()
      expect(entry).not.toHaveProperty('exerciseId')
      expect(entry).not.toHaveProperty('breathing')
      expect(entry).not.toHaveProperty('progressionLevel')
      expect(entry).not.toHaveProperty('techniqueLevel')
      expect(methodNode?.capabilities.every((capability) => ppCapabilities.includes(capability))).toBe(true)
    }
  })

  it('keeps C method-only nodes out of every programming candidate slot', () => {
    const cIds = ppFemaleProgrammingPolicy
      .filter((entry) => entry.eligibility === 'C_METHOD_ONLY')
      .map((entry) => entry.nodeId)

    expect(cIds).toEqual(expect.arrayContaining([
      'pp06', 'pp17', 'pp20', 'pp21', 'pp22',
      'exp-supine-90-90-breathing',
      'exp-side-lying-breathing',
      'exp-standing-lateral-weight-shift',
    ]))
    for (const slot of ppFemaleSlots) {
      const candidates = getFemaleProgrammingCandidates(slot, { readyConditionalNodeIds: cIds })
      expect(candidates.some((entry) => cIds.includes(entry.nodeId))).toBe(false)
    }
  })

  it('requires node-specific readiness before returning a conditional node', () => {
    expect(getFemaleProgrammingCandidates('HIP').some((entry) => entry.nodeId === 'pp03')).toBe(false)
    expect(getFemaleProgrammingCandidates('HIP', { readyConditionalNodeIds: ['pp03'] })
      .some((entry) => entry.nodeId === 'pp03')).toBe(true)
  })

  it('returns only explicit slots, roles, and non-NONE demand for selectable entries', () => {
    for (const entry of ppFemaleProgrammingPolicy.filter((item) => item.eligibility !== 'C_METHOD_ONLY')) {
      expect(entry.allowedSlots.length).toBeGreaterThan(0)
      expect(entry.allowedChallengeRoles.length).toBeGreaterThan(0)
      expect(entry.demand).not.toBe('NONE')
      expect(entry.allowedSlots.every((slot) => ppFemaleSlots.includes(slot))).toBe(true)
    }
  })

  it('allows HIGH-demand entries to be used only as the primary challenge', () => {
    const highDemandEntries = ppFemaleProgrammingPolicy.filter((entry) => entry.demand === 'HIGH')
    expect(highDemandEntries).toHaveLength(18)
    for (const entry of highDemandEntries) {
      expect(entry.allowedChallengeRoles).toEqual(['PRIMARY_CHALLENGE'])
    }
  })

  it('rejects a policy contract that allows HIGH demand as SUPPORTING', () => {
    const invalidPolicy = ppFemaleProgrammingPolicy.map((entry) => entry.demand === 'HIGH'
      ? { ...entry, allowedChallengeRoles: ['PRIMARY_CHALLENGE', 'SUPPORTING'] as const }
      : entry)

    expect(validateFemaleProgrammingPolicy(invalidPolicy).map((item) => item.code))
      .toContain('POLICY_COVERAGE')
  })

  it('allows only HIP, SUPPORT, and CORE as policy slots', () => {
    expect(ppFemaleSlots).toEqual(['HIP', 'SUPPORT', 'CORE'])
    for (const entry of ppFemaleProgrammingPolicy) {
      expect(entry.allowedSlots).not.toContain('BREATH')
      expect(new Set(entry.allowedSlots).size).toBe(entry.allowedSlots.length)
    }
  })

  it('accepts one valid 1+1+1 block with exactly one primary challenge', () => {
    expect(validateFemaleProgrammingBlock({
      HIP: { nodeId: 'pp01', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { nodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'pp26', challengeRole: 'SUPPORTING' },
    })).toEqual([])
  })

  it('rejects duplicate nodes, invalid slots, and disallowed roles', () => {
    const issues = validateFemaleProgrammingBlock({
      HIP: { nodeId: 'pp01', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { nodeId: 'pp01', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'pp17', challengeRole: 'PRIMARY_CHALLENGE' },
    })
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'DUPLICATE_NODE',
      'ELIGIBILITY_FORBIDDEN',
      'PRIMARY_CHALLENGE_COUNT',
    ]))
  })

  it('requires conditional readiness in a proposed block', () => {
    const issues = validateFemaleProgrammingBlock({
      HIP: { nodeId: 'pp03', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { nodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'pp26', challengeRole: 'SUPPORTING' },
    })
    expect(issues.map((issue) => issue.code)).toContain('CONDITIONAL_NOT_READY')
  })

  it('rejects a high-demand supporting node and more than one high-demand node', () => {
    const issues = validateFemaleProgrammingBlock({
      HIP: { nodeId: 'pp03', challengeRole: 'SUPPORTING' },
      SUPPORT: { nodeId: 'pp18', challengeRole: 'PRIMARY_CHALLENGE' },
      CORE: { nodeId: 'pp24', challengeRole: 'SUPPORTING' },
    }, { readyConditionalNodeIds: ['pp03', 'pp18', 'pp24'] })
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'CHALLENGE_ROLE_NOT_ALLOWED',
      'HIGH_DEMAND_NOT_PRIMARY',
      'HIGH_DEMAND_LIMIT',
      'DEMAND_BUDGET_EXCEEDED',
    ]))
  })

  it('rejects the known PP03 + PP18 + PP24 triple-high regression', () => {
    const issues = validateFemaleProgrammingBlock({
      HIP: { nodeId: 'pp03', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { nodeId: 'pp18', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'pp24', challengeRole: 'SUPPORTING' },
    }, { readyConditionalNodeIds: ['pp03', 'pp18', 'pp24'] })
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'HIGH_DEMAND_NOT_PRIMARY',
      'HIGH_DEMAND_LIMIT',
    ]))
  })

  it('keeps P-Level, breathing, and PP-F2 template concepts out of the policy contract', () => {
    expect(ppFemaleProgrammingPolicy.every((entry) => !('progressionLevel' in entry))).toBe(true)
    expect(ppFemaleProgrammingPolicy.every((entry) => !('breathing' in entry))).toBe(true)
    expect(ppFemaleProgrammingPolicy.every((entry) => !('sets' in entry))).toBe(true)
    expect(ppFemaleProgrammingPolicy.every((entry) => !('reps' in entry))).toBe(true)
    expect(ppMethodNodes).toHaveLength(53)
  })
})
