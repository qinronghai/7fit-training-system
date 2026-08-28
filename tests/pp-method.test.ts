import { describe, expect, it } from 'vitest'
import type {
  PPCanonicalMapping,
  PPProgressionLevel,
} from '../src/data/pp/types'
import {
  ppCanonicalMappingStatuses,
  ppMethodReadinessProfileIds,
} from '../src/data/pp/types'
import { exercises } from '../src/data/exercises/exercises'
import {
  ppMethodNodeById,
  ppMethodNodes,
  ppMethodReadinessProfiles,
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

    expect(counts.mapped).toBe(19)
    expect(counts.variant).toBe(26)
    expect(counts['method-only']).toBe(8)
    expect(counts['add-candidate'] ?? 0).toBe(0)
    expect(counts.verify ?? 0).toBe(0)
    expect(ppMethodNodes.filter((node) => node.source?.sourceId).length).toBe(26)
    expect(ppMethodNodes.filter((node) => !node.source).length).toBe(27)
  })

  it('keeps the approved expansion inventory and resolves the final canonical candidates', () => {
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

    expect([...new Set(addCandidateIds)].sort()).toEqual([])
  })

  it('keeps PP17 as a method drill hosted by plank', () => {
    const pp17 = ppMethodNodeById.get('pp17')

    expect(pp17?.mapping).toEqual({ status: 'method-only' })
    expect(pp17?.hostExerciseId).toBe('plank')
    expect(pp17?.kind).toBe('drill')
  })

  it('assigns every PP node to one of the 12 reusable readiness profiles', () => {
    expect(ppMethodReadinessProfileIds).toHaveLength(12)
    expect(new Set(ppMethodNodes.map((node) => node.readinessProfile)).size).toBe(12)
    expect(Object.keys(ppMethodReadinessProfiles).sort()).toEqual(
      [...ppMethodReadinessProfileIds].sort(),
    )

    for (const methodNode of ppMethodNodes) {
      expect(ppMethodReadinessProfiles[methodNode.readinessProfile]).toBeDefined()
      expect(methodNode.qualityGate.passRule).toBe('all')
      expect(methodNode.qualityGate.criteria.length).toBeGreaterThan(0)
      expect(methodNode.commonCompensations.length).toBeGreaterThan(0)
    }
  })

  it('keeps the approved profile assignments for key method nodes', () => {
    expect(ppMethodNodeById.get('pp03')?.readinessProfile).toBe('hinge-control')
    expect(ppMethodNodeById.get('pp05')?.readinessProfile).toBe('hip-rotation-control')
    expect(ppMethodNodeById.get('pp16')?.readinessProfile).toBe('anterior-support')
    expect(ppMethodNodeById.get('pp13')?.readinessProfile).toBe('rotation-integration')
    expect(ppMethodNodeById.get('pp23')?.readinessProfile).toBe('anti-extension-core')
    expect(ppMethodNodeById.get('pp24')?.readinessProfile).toBe('anti-extension-core')
    expect(ppMethodNodeById.get('pp26')?.readinessProfile).toBe('anti-extension-core')

    const expectedAssignments: Record<string, readonly string[]> = {
      'breath-rib-pelvis-foundation': [
        'pp17', 'pp20', 'pp21', 'pp22',
        'exp-supine-90-90-breathing', 'exp-side-lying-breathing',
      ],
      'hinge-control': [
        'pp02', 'pp03', 'exp-wall-touch-hinge', 'exp-dowel-three-point-hinge',
      ],
      'squat-control': [
        'pp01', 'exp-assisted-sit-to-stand', 'exp-box-squat',
      ],
      'hip-rotation-control': [
        'pp04', 'pp05', 'exp-supported-90-90', 'exp-static-90-90',
      ],
      'hip-extension-control': [
        'pp10', 'exp-glute-bridge-march', 'exp-single-leg-glute-bridge',
      ],
      'frontal-plane-weight-shift': [
        'pp08', 'pp09', 'exp-long-lever-side-lying-adduction',
        'exp-standing-lateral-weight-shift', 'exp-basic-hip-abduction',
      ],
      'anterior-support': ['pp16', 'exp-incline-plank'],
      'dynamic-support': [
        'pp11', 'pp14', 'pp15', 'exp-quadruped-single-limb-lift',
        'exp-incline-support-weight-shift', 'exp-plank-march',
        'exp-short-forward-step-high-plank',
      ],
      'lateral-support': [
        'pp18', 'pp19', 'exp-knee-side-plank', 'exp-standard-side-plank',
        'exp-side-plank-reach', 'exp-partial-side-plank-rotation',
        'exp-short-lever-copenhagen', 'exp-full-copenhagen',
      ],
      'anti-extension-core': ['pp23', 'pp24', 'pp26'],
      'rotation-integration': ['pp12', 'pp13', 'pp25', 'exp-open-book'],
      locomotion: [
        'pp06', 'pp07', 'exp-standing-march', 'exp-half-squat-low-locomotion',
      ],
    }
    const expectedIds = Object.values(expectedAssignments).flat()
    expect(expectedIds).toHaveLength(53)
    expect(new Set(expectedIds)).toHaveLength(53)
    for (const [profileId, expectedIdsForProfile] of Object.entries(expectedAssignments)) {
      const actualIdsForProfile = ppMethodNodes
        .filter((node) => node.readinessProfile === profileId)
        .map((node) => node.id)
        .sort()
      expect(actualIdsForProfile).toEqual([...expectedIdsForProfile].sort())
    }
  })

  it('keeps the PP verification ledger empty after the three resolved mappings', () => {
    expect(ppMethodNodeById.get('pp03')?.mapping).toEqual({
      status: 'mapped',
      exerciseId: 'deadlift-to-overhead-press',
    })
    expect(ppMethodNodeById.get('pp05')?.mapping).toEqual({
      status: 'mapped',
      exerciseId: 'shin-box-hip-lift',
    })
    expect(ppMethodNodeById.get('pp15')?.mapping).toEqual({
      status: 'mapped',
      exerciseId: 'cross-body-plank-knee-drive',
    })
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
    expect(ppVerificationLedger).toEqual([])
  })

  it('uses the final 104-exercise registry and passes all PP invariants', () => {
    expect(exercises).toHaveLength(104)
    expect(canonicalExerciseIds).toEqual(new Set(exercises.map((exercise) => exercise.id)))
    expect(canonicalExerciseIds.has('deadlift-to-overhead-press')).toBe(true)
    expect(canonicalExerciseIds.has('shin-box-hip-lift')).toBe(true)
    expect(canonicalExerciseIds.has('cross-body-plank-knee-drive')).toBe(true)
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
