import { describe, expect, it } from 'vitest'
import {
  estimateFemale111TemplateMinutes,
  getFemale111Template,
  validateFemale111TemplateLevel,
} from '../src/data/female111'

describe('PP-F111 template rules', () => {
  it('returns inspectable components whose ranges add to the total', () => {
    const level = getFemale111Template('F111-03', 'l1')!.level
    const estimate = estimateFemale111TemplateMinutes(level, { includeOptional: true })
    const { components } = estimate

    expect(components.totalSeconds.min).toBe(
      Object.entries(components)
        .filter(([key]) => key.endsWith('Seconds') && key !== 'totalSeconds')
        .reduce((sum, [, value]) => sum + value.min, 0),
    )
    expect(components.totalSeconds.max).toBe(
      Object.entries(components)
        .filter(([key]) => key.endsWith('Seconds') && key !== 'totalSeconds')
        .reduce((sum, [, value]) => sum + value.max, 0),
    )
    expect(estimate.totalMinutes.max).toBeLessThanOrEqual(60)
  })

  it('rejects missing phases, missing prescription, missing role coverage, and over-budget optional work', () => {
    const source = getFemale111Template('F111-03', 'l1')!.level
    const invalid = {
      ...source,
      prep: source.prep.filter((item) => item.phase !== 'A'),
      mainSequence: source.mainSequence.slice(0, 4).map((item, index) => (
        index === 0
          ? { ...item, prescription: {} }
          : { ...item, role: 'PRIMARY' as const }
      )),
      optionalAccessory: source.optionalAccessory.map((item) => ({
        ...item,
        planningExecutionSeconds: { min: 2400, max: 2400 },
      })),
    }

    const codes = validateFemale111TemplateLevel(invalid).map((issue) => issue.code)
    expect(codes).toEqual(expect.arrayContaining([
      'MISSING_PREP_PHASE',
      'MAIN_SEQUENCE_TOO_SHORT',
      'ROLE_COVERAGE',
      'PRESCRIPTION_MISSING',
      'OPTIONAL_TIME_GATE',
    ]))
  })

  it('limits a level-to-level prescription progression to two variables', () => {
    const current = getFemale111Template('F111-03', 'l2')!.level
    const previous = getFemale111Template('F111-03', 'l1')!.level
    const variables: NonNullable<typeof current.progressionFromPrevious>['variables'] = ['load', 'volume', 'rest']
    const invalid = {
      ...current,
      progressionFromPrevious: { variables, note: 'three changes' },
    }

    expect(validateFemale111TemplateLevel(invalid, previous).map((issue) => issue.code))
      .toContain('PROGRESSION_TOO_MANY_VARIABLES')
  })
})
