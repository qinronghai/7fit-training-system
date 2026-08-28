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
      mapped: 7,
      variant: 26,
      'method-only': 8,
      'add-candidate': 10,
      verify: 2,
    })
    expect(ppMethodNodes.filter((node) => node.source?.sourceId).length).toBe(26)
    expect(ppMethodNodes.filter((node) => !node.source).length).toBe(27)
  })

  it('keeps the approved expansion inventory and ten deferred canonical candidates', () => {
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
      'duck-walk',
      'high-plank-step-through',
      'pilates-criss-cross',
      'pilates-double-leg-stretch',
      'pilates-single-leg-stretch',
      'side-lying-hip-adduction',
      'side-plank',
      'single-leg-glute-bridge',
      'standing-march',
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
    expect(ppMethodNodeById.get('pp05')?.mapping.status).toBe('verify')
    expect(ppMethodNodeById.get('pp15')?.mapping.status).toBe('verify')
    expect(ppVerificationLedger).toEqual(expect.arrayContaining([
      expect.objectContaining({ nodeId: 'pp03', subject: 'display-category' }),
      expect.objectContaining({ nodeId: 'pp05', subject: 'identity' }),
      expect.objectContaining({ nodeId: 'pp15', subject: 'identity' }),
    ]))
  })

  it('uses the final 92-exercise registry and passes all PP invariants', () => {
    expect(exercises).toHaveLength(92)
    expect(canonicalExerciseIds).toEqual(new Set(exercises.map((exercise) => exercise.id)))
    expect(validatePPMethodContract(ppMethodNodes, ppProgressionEdges, canonicalExerciseIds)).toEqual([])
  })

  it('contains the required acyclic progression handoff through quadruped single-limb lift', () => {
    expect(ppProgressionEdges).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'pp20', to: 'exp-quadruped-single-limb-lift' }),
      expect.objectContaining({ from: 'exp-quadruped-single-limb-lift', to: 'pp11' }),
    ]))
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
