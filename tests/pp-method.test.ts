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

  it('gives exactly the 12 targeted nodes distinct semantic readiness overrides', () => {
    const targetedExpectations: Record<string, RegExp> = {
      pp03: /overhead|推举/i,
      pp05: /hip-extension|髋伸展/i,
      pp11: /contralateral|对侧/i,
      pp13: /force-transfer|力量传递/i,
      pp15: /hip-flexion|髋屈曲/i,
      pp16: /duration|rib|pelvis|持续|肋骨|骨盆/i,
      pp18: /rotation|force-transfer|旋转|力量传递/i,
      pp19: /abduction|pelvis|外展|骨盆/i,
      pp23: /contralateral|breath|对侧|呼吸/i,
      pp24: /bilateral|extension|双侧|伸展/i,
      pp25: /rotation|lumbar|旋转|腰椎/i,
      pp26: /rib|pelvis|repeat|肋骨|骨盆|重复/i,
    }

    expect(Object.keys(targetedExpectations)).toHaveLength(12)
    const targetedIds = new Set(Object.keys(targetedExpectations))
    for (const [id, marker] of Object.entries(targetedExpectations)) {
      const methodNode = ppMethodNodeById.get(id)
      const profile = ppMethodReadinessProfiles[methodNode!.readinessProfile]
      const nodeText = [
        ...methodNode!.qualityGate.criteria.map((item) => `${item.code} ${item.requirement}`),
        ...methodNode!.commonCompensations,
      ].join(' ')
      const profileText = [
        ...profile.qualityGate.criteria.map((item) => `${item.code} ${item.requirement}`),
        ...profile.commonCompensations,
      ].join(' ')

      expect(nodeText).toMatch(marker)
      expect(nodeText).not.toBe(profileText)
    }

    for (const methodNode of ppMethodNodes) {
      if (targetedIds.has(methodNode.id)) continue
      const profile = ppMethodReadinessProfiles[methodNode.readinessProfile]
      expect(methodNode.qualityGate).toEqual(profile.qualityGate)
      expect(methodNode.commonCompensations).toEqual(profile.commonCompensations)
    }

    const pp03Codes = ppMethodNodeById.get('pp03')!.qualityGate.criteria.map((item) => item.code)
    expect(pp03Codes).toEqual(expect.arrayContaining(['BREATH', 'CONTROL', 'COORDINATION', 'TOLERANCE']))
    const pp16 = ppMethodNodeById.get('pp16')!
    expect(pp16.qualityGate.criteria.map((item) => item.code))
      .toEqual(expect.arrayContaining(['POSITION', 'DURATION']))
    expect(pp16.qualityGate.criteria.some((item) =>
      item.domain === 'position' && /rib|pelvis|肋骨|骨盆/i.test(item.requirement),
    )).toBe(true)
  })

  it('keeps the exact cross-cutting breathing mode contract', () => {
    const idsByBreathingMode = (mode: 'continuous' | 'phase-cued' | 'reset') =>
      ppMethodNodes
        .filter((node) => node.breathing.mode === mode)
        .map((node) => node.id)
        .sort()

    expect(idsByBreathingMode('phase-cued')).toEqual([
      'pp03', 'pp10', 'pp16', 'pp18', 'pp19',
      'pp22', 'pp23', 'pp24', 'pp25', 'pp26',
    ])
    expect(idsByBreathingMode('reset')).toEqual([
      'exp-side-lying-breathing',
      'exp-standing-lateral-weight-shift',
      'exp-supine-90-90-breathing',
      'pp06', 'pp17', 'pp20', 'pp21',
    ])
    expect(idsByBreathingMode('continuous')).toHaveLength(36)
    expect(idsByBreathingMode('phase-cued')).toHaveLength(10)
    expect(idsByBreathingMode('reset')).toHaveLength(7)
    expect(ppMethodNodeById.get('pp06')?.kind).toBe('drill')
    expect(ppMethodNodeById.get('pp17')?.kind).toBe('drill')
    expect(ppMethodNodeById.get('pp20')?.kind).toBe('drill')
    expect(ppMethodNodeById.get('pp21')?.kind).toBe('breathing')
    expect(ppMethodNodeById.get('pp22')?.kind).toBe('breathing')
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

  it('resolves PP05 connectivity, PP03 root semantics and the pp06 branch', () => {
    const pp05Edges = ppProgressionEdges.filter((edge) =>
      edge.from === 'pp05' || edge.to === 'pp05',
    )
    expect(pp05Edges).toHaveLength(1)
    expect(pp05Edges[0]).toMatchObject({
      from: 'pp04',
      to: 'pp05',
      type: 'progression',
      capabilityDelta: ['hip-extension'],
    })
    expect(ppMethodNodeById.get('pp04')).toMatchObject({
      progressionLevel: 'P1',
      capabilities: expect.arrayContaining(['hip-rotation', 'pelvic-control']),
    })
    expect(ppMethodNodeById.get('pp05')).toMatchObject({
      progressionLevel: 'P2',
      capabilities: expect.arrayContaining(['hip-rotation', 'hip-extension', 'pelvic-control']),
    })
    expect(ppProgressionEdges).toHaveLength(45)

    const pp03 = ppMethodNodeById.get('pp03')!
    expect(pp03).toMatchObject({
      progressionLevel: 'P4',
      role: 'integration',
      primaryPathway: 'integration',
      secondaryPathways: ['hinge', 'support'],
      readinessProfile: 'hinge-control',
    })
    expect(ppProgressionEdges.filter((edge) => edge.to === 'pp03')).toEqual([])
    expect(ppProgressionEdges.some((edge) => edge.from === 'pp02' && edge.to === 'pp03')).toBe(false)
    expect(pp03.coachNotes?.some((note) => note.includes('外部') && note.includes('推举'))).toBe(true)

    const pp06Edge = ppProgressionEdges.find((edge) =>
      edge.from === 'pp06' && edge.to === 'exp-standing-lateral-weight-shift',
    )
    expect(pp06Edge).toMatchObject({
      type: 'branch',
      capabilityDelta: ['weight-shift', 'locomotion'],
    })
    expect(pp06Edge?.reason).toContain('分支')
    expect(ppMethodNodeById.get('pp06')?.progressionLevel).toBe('P1')
    expect(ppMethodNodeById.get('exp-standing-lateral-weight-shift')?.progressionLevel).toBe('P0')
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
