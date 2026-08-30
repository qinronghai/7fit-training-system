import { describe, expect, it } from 'vitest'
import coachViewModelSource from '../src/data/female111/coachViewModel.ts?raw'
import {
  buildFemale111CoachViewModel,
  buildFemale111SelectionEvidence,
  composeFemale111Session,
  resolveFemale111Block,
} from '../src/data/female111'

const sessionResult = composeFemale111Session({
  id: 'female111-session-view-model',
  prep: [],
  blockA: {
    id: 'block-a',
    resolution: resolveFemale111Block({
      recipeId: 'F111-01',
      selection: {
        PRIMARY: { methodNodeId: 'pp01', challengeRole: 'PRIMARY_CHALLENGE' },
        SUPPORT: { methodNodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
        CORE: { methodNodeId: 'pp26', challengeRole: 'SUPPORTING' },
      },
    }),
  },
  blockB: {
    id: 'block-b',
    resolution: resolveFemale111Block(
      {
        recipeId: 'F111-07',
        selection: {
          PRIMARY: { methodNodeId: 'exp-half-squat-low-locomotion', challengeRole: 'PRIMARY_CHALLENGE' },
          SUPPORT: { methodNodeId: 'exp-basic-hip-abduction', challengeRole: 'SUPPORTING' },
          CORE: { methodNodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
        },
      },
      { readyConditionalMethodNodeIds: ['exp-half-squat-low-locomotion'] },
    ),
  },
  recovery: { recordRequired: true },
})

const evidence = buildFemale111SelectionEvidence(sessionResult.session!, {
  populationOverlay: { allowed: true, issues: [] },
  venue: { allowed: true, issues: [] },
})

describe('PP-F111-C6 Coach UI ViewModel adapter', () => {
  it('maps C5 evidence to a UI-ready read-only model without leaking old-domain fields', () => {
    const model = buildFemale111CoachViewModel(evidence)

    expect(model.sessionId).toBe('female111-session-view-model')
    expect(model.allowed).toBe(true)
    expect(model.coachConfirmation).toBe('CONFIRMED')
    expect(model.blocks.A.id).toBe('block-a')
    expect(model.blocks.B.id).toBe('block-b')
    expect(model.blocks.A.recipe).toEqual({
      id: 'F111-01',
      name: 'Squat + Anterior Support + Anti-extension',
      rationale: 'Build a repeatable squat stimulus while support and trunk control remain low-footprint.',
    })
    expect(model.blocks.A.slots.PRIMARY).toEqual(expect.objectContaining({
      slot: 'PRIMARY',
      methodNodeId: 'pp01',
      displayName: '髋主导蹲',
      challengeRole: 'PRIMARY_CHALLENGE',
      progressionFamily: 'SQUAT',
      expectedFamily: 'SQUAT',
      demand: 'MODERATE',
      readiness: 'NOT_REQUIRED',
      population: 'CLEAR',
      venue: 'CLEAR',
      reasons: [],
    }))
    expect(model.blocks.A.slots.PRIMARY).not.toHaveProperty('progressionLevel')
    expect(model.blocks.A.slots.PRIMARY).not.toHaveProperty('breathing')
    expect(model.blocks.A.slots.PRIMARY).not.toHaveProperty('mapping')
    expect(model).not.toHaveProperty('template')
    expect(model.sessionReasons).toEqual([])
  })

  it('preserves veto, review, and coach-confirmation evidence for the future UI', () => {
    const blockedEvidence = buildFemale111SelectionEvidence(sessionResult.session!, {
      populationOverlay: {
        allowed: false,
        issues: [{
          code: 'COACH_CONFIRMATION_REQUIRED',
          message: 'Coach confirmation is required before evaluation',
        }],
      },
      venue: {
        allowed: false,
        issues: [{
          code: 'EQUIPMENT_UNAVAILABLE',
          message: 'pp01 requires unavailable equipment: barbell',
          block: 'A',
          slot: 'PRIMARY',
          methodNodeId: 'pp01',
          equipment: 'barbell',
        }],
      },
    })

    const model = buildFemale111CoachViewModel(blockedEvidence)

    expect(model.allowed).toBe(false)
    expect(model.coachConfirmation).toBe('REQUIRED')
    expect(model.blocks.A.slots.PRIMARY.venue).toBe('VETOED')
    expect(model.blocks.A.slots.PRIMARY.reasons).toEqual(['pp01 requires unavailable equipment: barbell'])
    expect(model.sessionReasons).toEqual(expect.arrayContaining([
      'Coach confirmation is required before evaluation',
      'pp01 requires unavailable equipment: barbell',
    ]))
  })

  it('keeps the adapter inside the Female111 domain boundary', () => {
    expect(coachViewModelSource).not.toMatch(/from ['"].*App/)
    expect(coachViewModelSource).not.toMatch(/from ['"].*router/)
    expect(coachViewModelSource).not.toMatch(/from ['"].*styles/)
  })
})
