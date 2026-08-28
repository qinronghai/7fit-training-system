import { describe, expect, it } from 'vitest'
import type {
  PPCanonicalMapping,
  PPProgressionLevel,
} from '../src/data/pp/types'
import { ppCanonicalMappingStatuses } from '../src/data/pp/types'
import { exercises } from '../src/data/exercises/exercises'
import {
  ppMethodNodeById,
  ppMethodNodes,
  ppVerificationLedger,
} from '../src/data/pp/methodNodes'
import { ppProgressionEdges } from '../src/data/pp/progressionGraph'
import { validatePPProgressionGraph } from '../src/data/pp/progressionGraph'
import {
  canonicalExerciseIds,
  validateDefaultPPMethodContract,
  validatePPMethodContract,
  validatePPVerificationLedger,
} from '../src/data/pp'

describe('PP-E3 method type contract', () => {
  it('exposes the five canonical mapping statuses', () => {
    const mappings: PPCanonicalMapping[] = [
      { status: 'mapped', exerciseId: 'plank' },
      { status: 'variant', exerciseId: 'plank', variantId: 'pp17-plank-control' },
      { status: 'method-only' },
      { status: 'add-candidate', proposedExerciseId: 'side-plank' },
      { status: 'verify', reason: 'training video required' },
    ]

    expect(ppCanonicalMappingStatuses).toEqual([
      'mapped',
      'variant',
      'method-only',
      'add-candidate',
      'verify',
    ])
    expect(mappings).toHaveLength(ppCanonicalMappingStatuses.length)
  })

  it('keeps P-Level separate from Programming L-Level', () => {
    const level: PPProgressionLevel = 'P3'

    expect(level).toBe('P3')
  })

  it('publishes the frozen 53-node PP inventory and mapping counts', () => {
    expect(ppMethodNodes).toHaveLength(53)
    expect(new Set(ppMethodNodes.map((node) => node.id)).size).toBe(53)
    expect(ppMethodNodeById.size).toBe(53)

    const counts = ppMethodNodes.reduce<Record<string, number>>((result, node) => {
      result[node.mapping.status] = (result[node.mapping.status] ?? 0) + 1
      return result
    }, {})

    expect(counts).toEqual({
      mapped: 16,
      variant: 26,
      'method-only': 8,
      'add-candidate': 1,
      verify: 2,
    })
    expect(ppMethodNodes.filter((node) => node.source?.sourceId).length).toBe(26)
    expect(ppMethodNodes.filter((node) => !node.source).length).toBe(27)
  })

  it('keeps the approved expansion inventory and the remaining deferred canonical candidate', () => {
    const expansionIds = ppMethodNodes
      .filter((node) => !node.source)
      .map((node) => node.id)
      .sort()

    expect(expansionIds).toEqual([
      'exp-assisted-sit-to-stand',
      'exp-basic-hip-abduction',
      'exp-box-squat',
      'exp-dowel-three-point-hinge',
      'exp-full-copenhagen',
      'exp-glute-bridge-march',
      'exp-half-squat-low-locomotion',
      'exp-incline-plank',
      'exp-incline-support-weight-shift',
      'exp-knee-side-plank',
      'exp-long-lever-side-lying-adduction',
      'exp-open-book',
      'exp-partial-side-plank-rotation',
      'exp-plank-march',
      'exp-quadruped-single-limb-lift',
      'exp-short-forward-step-high-plank',
      'exp-short-lever-copenhagen',
      'exp-side-lying-breathing',
      'exp-side-plank-reach',
      'exp-single-leg-glute-bridge',
      'exp-standard-side-plank',
      'exp-standing-lateral-weight-shift',
      'exp-standing-march',
      'exp-static-90-90',
      'exp-supine-90-90-breathing',
      'exp-supported-90-90',
      'exp-wall-touch-hinge',
    ])

    const addCandidateIds = ppMethodNodes
      .map((node) => node.mapping.status === 'add-candidate' ? node.mapping.proposedExerciseId : null)
      .filter((id): id is string => id !== null)

    expect([...new Set(addCandidateIds)].sort()).toEqual([
      'deadlift-to-overhead-press',
    ])
  })

  it('keeps PP17 as a method drill hosted by plank', () => {
    const pp17 = ppMethodNodeById.get('pp17')

    expect(pp17?.mapping).toEqual({ status: 'method-only' })
    expect(pp17?.hostExerciseId).toBe('plank')
    expect(pp17?.kind).toBe('drill')
  })

  it('preserves the PP verification ledger without guessing', () => {
    expect(ppMethodNodeById.get('pp03')?.mapping).toEqual({
      status: 'add-candidate',
      proposedExerciseId: 'deadlift-to-overhead-press',
    })
    expect(ppMethodNodeById.get('pp05')?.mapping).toMatchObject({ status: 'verify' })
    expect(ppMethodNodeById.get('pp15')?.mapping).toMatchObject({ status: 'verify' })
    expect(ppMethodNodeById.get('pp07')?.mapping).toEqual({ status: 'mapped', exerciseId: 'duck-walk' })
    expect(ppMethodNodeById.get('pp08')?.mapping).toEqual({ status: 'mapped', exerciseId: 'side-lying-hip-adduction' })
    expect(ppMethodNodeById.get('pp14')?.mapping).toEqual({ status: 'mapped', exerciseId: 'high-plank-step-through' })
    expect(ppMethodNodeById.get('pp23')?.mapping).toEqual({ status: 'mapped', exerciseId: 'pilates-single-leg-stretch' })
    expect(ppMethodNodeById.get('pp24')?.mapping).toEqual({ status: 'mapped', exerciseId: 'pilates-double-leg-stretch' })
    expect(ppMethodNodeById.get('pp25')?.mapping).toEqual({ status: 'mapped', exerciseId: 'pilates-criss-cross' })
    expect(ppMethodNodeById.get('exp-standard-side-plank')?.mapping).toEqual({ status: 'mapped', exerciseId: 'side-plank' })
    expect(ppMethodNodeById.get('exp-single-leg-glute-bridge')?.mapping).toEqual({ status: 'mapped', exerciseId: 'single-leg-glute-bridge' })
    expect(ppMethodNodeById.get('exp-standing-march')?.mapping).toEqual({ status: 'mapped', exerciseId: 'standing-march' })
    for (const node of ppMethodNodes) {
      if (node.mapping.status !== 'variant') continue
      expect(canonicalExerciseIds.has(node.mapping.exerciseId)).toBe(true)
    }
    expect(ppVerificationLedger).toEqual(expect.arrayContaining([
      expect.objectContaining({ nodeId: 'pp03', subject: 'display-category' }),
      expect.objectContaining({ nodeId: 'pp05', subject: 'identity' }),
      expect.objectContaining({ nodeId: 'pp15', subject: 'identity' }),
    ]))
  })

  it('uses the final 101-exercise registry and passes all PP invariants', () => {
    expect(exercises).toHaveLength(101)
    expect(canonicalExerciseIds).toEqual(new Set(exercises.map((exercise) => exercise.id)))
    expect(canonicalExerciseIds.has('side-plank')).toBe(true)
    expect(canonicalExerciseIds.has('high-plank-step-through')).toBe(true)
    expect(canonicalExerciseIds.has('side-lying-hip-adduction')).toBe(true)
    expect(canonicalExerciseIds.has('duck-walk')).toBe(true)
    expect(validatePPMethodContract(ppMethodNodes, ppProgressionEdges, canonicalExerciseIds)).toEqual([])
  })

  it('contains the required acyclic progression handoff through quadruped single-limb lift', () => {
    expect(ppProgressionEdges).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'pp20', to: 'exp-quadruped-single-limb-lift' }),
      expect.objectContaining({ from: 'exp-quadruped-single-limb-lift', to: 'pp11' }),
    ]))
  })

  it('materializes the approved progression map across every pathway', () => {
    const requiredEdges = [
      ['pp21', 'exp-supine-90-90-breathing'],
      ['exp-supine-90-90-breathing', 'pp22'],
      ['pp22', 'pp26'],
      ['pp26', 'pp23'],
      ['pp20', 'exp-quadruped-single-limb-lift'],
      ['pp20', 'exp-incline-plank'],
      ['exp-quadruped-single-limb-lift', 'pp11'],
      ['exp-incline-plank', 'pp16'],
      ['pp16', 'exp-plank-march'],
      ['exp-plank-march', 'pp15'],
      ['exp-incline-plank', 'exp-incline-support-weight-shift'],
      ['exp-incline-support-weight-shift', 'exp-short-forward-step-high-plank'],
      ['exp-short-forward-step-high-plank', 'pp14'],
      ['exp-side-lying-breathing', 'exp-knee-side-plank'],
      ['exp-knee-side-plank', 'exp-standard-side-plank'],
      ['exp-standard-side-plank', 'pp19'],
      ['exp-standard-side-plank', 'exp-side-plank-reach'],
      ['exp-side-plank-reach', 'exp-partial-side-plank-rotation'],
      ['exp-partial-side-plank-rotation', 'pp18'],
      ['exp-wall-touch-hinge', 'exp-dowel-three-point-hinge'],
      ['exp-dowel-three-point-hinge', 'pp02'],
      ['pp08', 'exp-long-lever-side-lying-adduction'],
      ['exp-long-lever-side-lying-adduction', 'exp-short-lever-copenhagen'],
      ['exp-short-lever-copenhagen', 'exp-full-copenhagen'],
      ['exp-standing-lateral-weight-shift', 'exp-basic-hip-abduction'],
      ['exp-basic-hip-abduction', 'pp09'],
      ['exp-open-book', 'pp12'],
      ['pp06', 'exp-standing-lateral-weight-shift'],
      ['exp-standing-lateral-weight-shift', 'exp-standing-march'],
      ['pp01', 'exp-half-squat-low-locomotion'],
      ['exp-half-squat-low-locomotion', 'pp07'],
    ]

    for (const [from, to] of requiredEdges) {
      expect(ppProgressionEdges).toEqual(expect.arrayContaining([
        expect.objectContaining({ from, to }),
      ]))
    }
    expect(ppProgressionEdges.length).toBeGreaterThanOrEqual(requiredEdges.length)
  })

  it('keeps frozen method metadata aligned with pathway semantics', () => {
    expect(ppMethodNodeById.get('pp06')).toMatchObject({
      primaryPathway: 'locomotion',
      secondaryPathways: ['hip-rotation'],
    })
    expect(ppMethodNodeById.get('pp07')).toMatchObject({ role: 'optional' })
    expect(ppMethodNodeById.get('pp08')).toMatchObject({
      primaryPathway: 'frontal-plane',
    })
    expect(ppMethodNodeById.get('exp-long-lever-side-lying-adduction')).toMatchObject({
      primaryPathway: 'frontal-plane',
    })
    expect(ppMethodNodeById.get('exp-open-book')).toMatchObject({
      kind: 'exercise',
      mapping: { status: 'mapped', exerciseId: 'side-lying-open-book' },
    })
    expect(ppMethodNodeById.get('pp20')).toMatchObject({
      kind: 'drill',
      mapping: { status: 'method-only' },
    })
  })

  it('validates the verification ledger against node mapping without resolving unknown identity', async () => {
    expect(validatePPVerificationLedger(ppVerificationLedger)).toEqual([])
    expect(validateDefaultPPMethodContract()).toEqual([])
  })

  it('rejects graph endpoints and cycles', () => {
    expect(validatePPProgressionGraph(ppMethodNodes, [
      {
        from: 'pp20',
        to: 'missing-node',
        type: 'progression',
        capabilityDelta: [],
        reason: 'invalid test edge',
      },
    ])).toContain('progression edge target does not exist: missing-node')

    expect(validatePPProgressionGraph(ppMethodNodes, [
      {
        from: 'pp20',
        to: 'pp21',
        type: 'progression',
        capabilityDelta: [],
        reason: 'cycle test edge',
      },
      {
        from: 'pp21',
        to: 'pp20',
        type: 'progression',
        capabilityDelta: [],
        reason: 'cycle test edge',
      },
    ])).toContain('progression graph contains a cycle at: pp20')
  })
})
