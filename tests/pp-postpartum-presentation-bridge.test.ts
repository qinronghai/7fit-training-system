import { describe, expect, it } from 'vitest'
import bridgeSource from '../src/data/postpartumPresentationBridge.ts?raw'
import leafSource from '../src/data/postpartumPresentationData.ts?raw'
import {
  allRoutes,
  getPostpartumMovement as getContentPostpartumMovement,
  movementPatterns,
  postpartumMovements,
} from '../src/data/content'
import {
  getPostpartumMovement as getLeafPostpartumMovement,
  postpartumMovements as leafPostpartumMovements,
} from '../src/data/postpartumPresentationData'
import { ppMethodNodeById, ppMethodNodes } from '../src/data/pp/methodNodes'
import type { PPMethodNode } from '../src/data/pp/types'
import {
  buildPostpartumPresentationBridgeCatalog,
  getPostpartumPresentationBridgeRecord,
  postpartumPresentationBridgeCatalog,
  validatePostpartumPresentationBridge,
} from '../src/data/postpartumPresentationBridge'

const cloneMethodNode = (methodNode: PPMethodNode, overrides: Partial<PPMethodNode> = {}): PPMethodNode => ({
  ...methodNode,
  ...overrides,
  source: methodNode.source ? { ...methodNode.source, ...overrides.source } : overrides.source,
  secondaryPathways: methodNode.secondaryPathways ? [...methodNode.secondaryPathways] : methodNode.secondaryPathways,
  capabilities: [...methodNode.capabilities],
  commonCompensations: [...methodNode.commonCompensations],
  coachNotes: methodNode.coachNotes ? [...methodNode.coachNotes] : methodNode.coachNotes,
})

describe('PP-G1B2B postpartum presentation bridge', () => {
  it('builds the 26-record bridge catalog with exact PP01–PP26 coverage and no expansion nodes', () => {
    expect(postpartumPresentationBridgeCatalog).toHaveLength(26)

    const presentationIds = postpartumPresentationBridgeCatalog.map((record) => record.presentation.id)
    const methodIds = postpartumPresentationBridgeCatalog.map((record) => record.methodNode.id)

    expect(presentationIds).toEqual(ppMethodNodes.filter((node) => node.source?.origin === 'postpartum-course').map((node) => node.id))
    expect(methodIds).toEqual(presentationIds)
    expect(presentationIds.every((id) => !id.startsWith('exp-'))).toBe(true)

    const mappingCounts = postpartumPresentationBridgeCatalog.reduce<Record<string, number>>((counts, record) => {
      const status = record.methodNode.mapping.status
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    }, {})

    expect(mappingCounts.mapped).toBe(12)
    expect(mappingCounts.variant).toBe(9)
    expect(mappingCounts['method-only']).toBe(5)
    expect(mappingCounts['add-candidate'] ?? 0).toBe(0)
    expect(mappingCounts.verify ?? 0).toBe(0)
  })

  it('preserves the original presentation and Method object references', () => {
    for (const record of postpartumPresentationBridgeCatalog) {
      expect(record.presentation).toBe(postpartumMovements.find((presentation) => presentation.id === record.presentation.id))
      expect(record.methodNode).toBe(ppMethodNodeById.get(record.methodNode.id))
    }
  })

  it('keeps each bridge root limited to presentation and methodNode', () => {
    for (const record of postpartumPresentationBridgeCatalog) {
      expect(Object.keys(record).sort()).toEqual(['methodNode', 'presentation'])
      expect(record).not.toHaveProperty('id')
      expect(record).not.toHaveProperty('source')
      expect(record).not.toHaveProperty('level')
    }
  })

  it('validates source metadata after the join and preserves the legacy L/P range contract', () => {
    expect(validatePostpartumPresentationBridge(postpartumPresentationBridgeCatalog)).toEqual([])

    const pp01 = getPostpartumPresentationBridgeRecord('pp01')
    const pp22 = getPostpartumPresentationBridgeRecord('pp22')
    const pp17 = getPostpartumPresentationBridgeRecord('pp17')

    expect(pp01?.presentation.level).toEqual(['l1', 'l2'])
    expect(pp01?.methodNode.progressionLevel).toBe('P1')
    expect(pp22?.presentation.level).toEqual(['l0', 'l2'])
    expect(pp22?.methodNode.progressionLevel).toBe('P1')
    expect(pp17?.presentation.level).toEqual(['l3'])
    expect(pp17?.methodNode.progressionLevel).toBe('P1')

    for (const record of postpartumPresentationBridgeCatalog) {
      expect(record.methodNode.source?.origin).toBe('postpartum-course')
      expect(record.methodNode.source?.sourceId).toBe(record.presentation.id.toUpperCase())
      expect(record.methodNode.source?.sourceName).toBe(record.presentation.name)
      expect(Array.isArray(record.presentation.level)).toBe(true)
      expect(record.presentation.level.every((level) => level.startsWith('l'))).toBe(true)
      expect(record.methodNode.progressionLevel.startsWith('P')).toBe(true)
    }
  })

  it('keeps pp06, pp17, pp20, pp21, and pp22 method-only and preserves PP17 host safety', () => {
    const methodOnlyIds = ['pp06', 'pp17', 'pp20', 'pp21', 'pp22'] as const

    for (const id of methodOnlyIds) {
      const record = getPostpartumPresentationBridgeRecord(id)
      expect(record?.methodNode.mapping.status).toBe('method-only')
    }

    const pp17 = getPostpartumPresentationBridgeRecord('pp17')
    expect(pp17?.methodNode.kind).toBe('drill')
    expect(pp17?.methodNode.hostExerciseId).toBe('plank')
    expect(pp17?.presentation.name).toBe('平板位主动收腹 / 骨盆后倾')
  })

  it('keeps presentation movement patterns separate from Method pathways and level ranges separate from progression levels', () => {
    const pp03 = getPostpartumPresentationBridgeRecord('pp03')
    const pp13 = getPostpartumPresentationBridgeRecord('pp13')
    const pp26 = getPostpartumPresentationBridgeRecord('pp26')

    expect(pp03?.presentation.movementPatterns).toEqual(['hinge', 'vpush'])
    expect(pp03?.methodNode.primaryPathway).toBe('integration')
    expect(pp03?.methodNode.secondaryPathways).toEqual(['hinge', 'support'])

    expect(pp13?.presentation.movementPatterns).toEqual(['core', 'rotation'])
    expect(pp13?.methodNode.primaryPathway).toBe('integration')
    expect(pp13?.methodNode.secondaryPathways).toEqual(['support', 'locomotion', 'thoracic-rotation'])

    expect(pp26?.presentation.level).toEqual(['l2'])
    expect(pp26?.methodNode.progressionLevel).toBe('P2')
    expect(pp26?.presentation.level).not.toEqual([pp26?.methodNode.progressionLevel])
  })

  it('looks up exact IDs and returns undefined for unknown IDs', () => {
    expect(getPostpartumPresentationBridgeRecord('pp01')).toBe(postpartumPresentationBridgeCatalog[0])
    expect(getPostpartumPresentationBridgeRecord('pp26')).toBe(postpartumPresentationBridgeCatalog.at(-1))
    expect(getPostpartumPresentationBridgeRecord('missing-id')).toBeUndefined()
    expect(Object.isFrozen(postpartumPresentationBridgeCatalog)).toBe(true)
    expect(Object.isFrozen(postpartumPresentationBridgeCatalog[0])).toBe(true)
  })

  it('keeps the content compatibility exports reference-identical to the pure Presentation leaf', () => {
    expect(postpartumMovements).toBe(leafPostpartumMovements)
    expect(getContentPostpartumMovement).toBe(getLeafPostpartumMovement)
    expect(getContentPostpartumMovement('pp01')).toBe(getLeafPostpartumMovement('pp01'))
    expect(postpartumMovements).toHaveLength(26)
    expect(movementPatterns.flatMap((pattern) => pattern.postpartumIds)).toHaveLength(34)
    expect(allRoutes).toHaveLength(66)
  })

  it('selects only original postpartum-course nodes by origin and excludes all expansion nodes', () => {
    const selectedSourceNodes = ppMethodNodes.filter((node) => node.source?.origin === 'postpartum-course')
    const expansionNodes = ppMethodNodes.filter((node) => node.id.startsWith('exp-'))

    expect(selectedSourceNodes).toHaveLength(26)
    expect(expansionNodes).toHaveLength(27)
    expect(selectedSourceNodes.some((node) => node.id.startsWith('exp-'))).toBe(false)
    expect(postpartumPresentationBridgeCatalog.some((record) => record.presentation.id.startsWith('exp-'))).toBe(false)
    expect(postpartumPresentationBridgeCatalog.some((record) => record.methodNode.id.startsWith('exp-'))).toBe(false)
  })

  it('keeps the bridge and Presentation data leaf within their import boundaries', () => {
    expect(bridgeSource).not.toMatch(/from ['"]\.\/content['"]|from ['"]\.\/exercises(?:['"]|\/)|from ['"]\.\/programming(?:['"]|\/)/)
    expect(bridgeSource).not.toMatch(/from ['"]\.\/pp\/(?!methodNodes['"]|types['"])/)
    expect(bridgeSource).not.toMatch(/from ['"][^'"]*(?:femaleProgrammingPolicy|femaleProgrammingRules|femaleProgrammingTemplates|femaleProgrammingRuntime|App|router|storage|template-copy)/)
    expect(leafSource).not.toMatch(/^\s*import\s/m)
    expect(leafSource).not.toMatch(/from ['"][^'"]*(?:programming|exercises|pp\/|App|router|storage|template-copy)/)
  })

  it.each([
    ['add-candidate', { status: 'add-candidate', proposedExerciseId: 'synthetic-candidate' }],
    ['verify', { status: 'verify', reason: 'synthetic verification case' }],
  ] as const)('rejects unsupported source mapping status %s', (_label, mapping) => {
    const malformedMethodNodes = ppMethodNodes.map((methodNode) => (
      methodNode.id === 'pp01'
        ? cloneMethodNode(methodNode, { mapping })
        : methodNode
    ))

    expect(() => buildPostpartumPresentationBridgeCatalog({
      presentations: postpartumMovements,
      methodNodes: malformedMethodNodes,
    })).toThrow(/unsupported source mapping status/)

    const issues = validatePostpartumPresentationBridge([{
      presentation: postpartumMovements[0],
      methodNode: cloneMethodNode(ppMethodNodeById.get('pp01')!, { mapping }),
    }])
    expect(issues.some((issue) => issue.code === 'UNSUPPORTED_SOURCE_MAPPING_STATUS')).toBe(true)
  })

  it('fails closed when the source catalogs are malformed', () => {
    expect(() => buildPostpartumPresentationBridgeCatalog({
      presentations: postpartumMovements.slice(0, 25),
      methodNodes: ppMethodNodes.slice(0, 26),
    })).toThrow()

    expect(() => buildPostpartumPresentationBridgeCatalog({
      presentations: postpartumMovements,
      methodNodes: [...ppMethodNodes, cloneMethodNode(ppMethodNodeById.get('pp01')!, { id: 'exp-synthetic-node' })],
    })).toThrow()
  })

  it('fails closed when a presentation counterpart is missing', () => {
    expect(() => buildPostpartumPresentationBridgeCatalog({
      presentations: postpartumMovements.filter((presentation) => presentation.id !== 'pp26'),
      methodNodes: ppMethodNodes,
    })).toThrow(/missing presentation counterpart: pp26/)
  })

  it('fails closed when a Method node ID is duplicated', () => {
    expect(() => buildPostpartumPresentationBridgeCatalog({
      presentations: postpartumMovements,
      methodNodes: [...ppMethodNodes, cloneMethodNode(ppMethodNodeById.get('pp01')!)],
    })).toThrow(/duplicate method node id: pp01/)
  })

  it('fails closed when a joined Method node source ID mismatches', () => {
    const malformedMethodNodes = ppMethodNodes.map((methodNode) => (
      methodNode.id === 'pp01'
        ? cloneMethodNode(methodNode, {
          source: { ...methodNode.source!, sourceId: 'PP00' as `PP${string}` },
        })
        : methodNode
    ))

    expect(() => buildPostpartumPresentationBridgeCatalog({
      presentations: postpartumMovements,
      methodNodes: malformedMethodNodes,
    })).toThrow(/method node source id mismatch: pp01/)
  })

  it('fails closed when a joined Method node source name mismatches', () => {
    const malformedMethodNodes = ppMethodNodes.map((methodNode) => (
      methodNode.id === 'pp01'
        ? cloneMethodNode(methodNode, {
          source: { ...methodNode.source!, sourceName: 'wrong name' },
        })
        : methodNode
    ))

    expect(() => buildPostpartumPresentationBridgeCatalog({
      presentations: postpartumMovements,
      methodNodes: malformedMethodNodes,
    })).toThrow(/method node source name mismatch: pp01/)
  })

  it.each([
    [
      'duplicate presentation ids',
      [
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp01')! },
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp02')! },
      ],
      'DUPLICATE_PRESENTATION_ID',
    ],
    [
      'missing method counterpart',
      [
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp01')! },
        { presentation: postpartumMovements[1], methodNode: undefined },
      ],
      'MISSING_METHOD_COUNTERPART',
    ],
    [
      'duplicate method source ids',
      [
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp01')! },
        {
          presentation: postpartumMovements[1],
          methodNode: cloneMethodNode(ppMethodNodeById.get('pp02')!, {
            source: { ...ppMethodNodeById.get('pp02')!.source!, sourceId: 'PP01' },
          }),
        },
      ],
      'DUPLICATE_METHOD_SOURCE_ID',
    ],
    [
      'source name mismatch',
      [
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp01')! },
        {
          presentation: postpartumMovements[1],
          methodNode: cloneMethodNode(ppMethodNodeById.get('pp02')!, {
            source: { ...ppMethodNodeById.get('pp02')!.source!, sourceName: 'wrong name' },
          }),
        },
      ],
      'SOURCE_NAME_MISMATCH',
    ],
    [
      'source origin mismatch',
      [
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp01')! },
        {
          presentation: postpartumMovements[1],
          methodNode: cloneMethodNode(ppMethodNodeById.get('pp02')!, {
            source: { ...ppMethodNodeById.get('pp02')!.source!, origin: 'wrong-origin' as 'postpartum-course' },
          }),
        },
      ],
      'SOURCE_ORIGIN_MISMATCH',
    ],
    [
      'expansion node present',
      [
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp01')! },
        {
          presentation: { ...postpartumMovements[1], id: 'exp-synthetic-presentation' },
          methodNode: cloneMethodNode(ppMethodNodeById.get('pp02')!, { id: 'exp-synthetic-node' }),
        },
      ],
      'EXPANSION_NODE_PRESENT',
    ],
    [
      'invalid source-node identity',
      [
        { presentation: postpartumMovements[0], methodNode: ppMethodNodeById.get('pp01')! },
        {
          presentation: { ...postpartumMovements[1] },
          methodNode: { ...ppMethodNodeById.get('pp02')!, source: ppMethodNodeById.get('pp02')!.source },
        },
      ],
      'INVALID_SOURCE_NODE_IDENTITY',
    ],
  ])('reports %s', (_label, records, code) => {
    const issues = validatePostpartumPresentationBridge(records as never)
    expect(issues.some((issue) => issue.code === code)).toBe(true)
  })
})
