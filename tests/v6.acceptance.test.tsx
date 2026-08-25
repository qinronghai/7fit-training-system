import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { allRoutes, getLibraryAction, getLibraryActionId, libraryActions, movementPatterns, postpartumMovements, templates } from '../src/data/content'
import { getRoute } from '../src/lib/router'
import { buildTemplateCopyText } from '../src/lib/template-copy'
import { App } from '../src/App'

describe('7Fit V6 content contract', () => {
  it('keeps the 66 migrated route pages addressable', () => {
    expect(allRoutes).toHaveLength(66)
    expect(allRoutes).toContain('#/home')
    expect(allRoutes).toContain('#/templates/3c1/l1')
    expect(allRoutes).toContain('#/patterns/squat')
    expect(allRoutes).toContain('#/library/postpartum')
    expect(allRoutes).toContain('#/postpartum/pp01')
  })

  it('keeps all 16 templates at four levels and all 12 patterns', () => {
    expect(templates).toHaveLength(16)
    expect(templates.every((template) => Object.keys(template.levels).length === 4)).toBe(true)
    expect(movementPatterns).toHaveLength(12)
  })

  it('matches the migrated V5.5 warmup and main-set counts for every template level', () => {
    const expected: Record<string, number[][]> = {
      '3c1': [[7, 5], [7, 5], [7, 5], [7, 5]], '3c2': [[7, 5], [7, 5], [7, 5], [7, 5]],
      '3c3': [[6, 5], [6, 5], [7, 5], [7, 5]], '3c4': [[7, 5], [7, 5], [7, 5], [7, 5]],
      '3c5': [[7, 5], [7, 5], [7, 5], [7, 5]], '3c6': [[7, 4], [7, 4], [7, 5], [7, 5]],
      'body1': [[7, 6], [7, 5], [7, 5], [7, 5]], 'body2': [[7, 5], [7, 5], [7, 5], [7, 5]],
      'body3': [[6, 6], [6, 6], [7, 6], [7, 6]], 'body4': [[7, 5], [7, 5], [7, 5], [7, 5]],
      'body5': [[7, 6], [7, 6], [7, 6], [7, 6]], 'con1': [[4, 1], [4, 2], [5, 2], [5, 3]],
      'con2': [[5, 2], [5, 3], [5, 3], [6, 3]], 'con3': [[5, 4], [5, 4], [5, 4], [5, 4]],
      'con4': [[5, 4], [5, 4], [5, 5], [5, 5]], 'con5': [[5, 4], [5, 5], [5, 5], [5, 5]],
    }
    for (const template of templates) {
      expect(['l1', 'l2', 'l3', 'l4'].map((level) => [template.levels[level as 'l1' | 'l2' | 'l3' | 'l4'].warmup.length, template.levels[level as 'l1' | 'l2' | 'l3' | 'l4'].exercises.length])).toEqual(expected[template.id])
    }
  })

  it('keeps PP01–PP26 extracted coach-card text and the 34 bidirectional pattern edges', () => {
    expect(postpartumMovements).toHaveLength(26)
    expect(postpartumMovements.every((movement) => movement.cardContent.overview && movement.cardContent.coachingPoints.length > 0)).toBe(true)
    expect(postpartumMovements.some((movement) => 'frontCard' in movement || 'backCard' in movement)).toBe(false)
    expect(postpartumMovements.flatMap((movement) => movement.movementPatterns).length).toBe(34)
  })

  it('indexes migrated warmup and main-training actions for direct library lookup', () => {
    const warmupId = getLibraryActionId('滑雪机轻拉', '升温')
    const mainId = getLibraryActionId('哈克深蹲', '下肢 · 蹲')
    expect(warmupId).toBeTruthy()
    expect(mainId).toBeTruthy()
    expect(libraryActions.length).toBeGreaterThan(40)
    expect(getLibraryAction(warmupId!)).toMatchObject({ name: '滑雪机轻拉' })
    expect(getLibraryAction(mainId!)).toMatchObject({ name: '哈克深蹲' })
  })

  it('builds a complete copyable training brief', () => {
    const template = templates.find((item) => item.id === '3c1')!
    const text = buildTemplateCopyText(template, template.levels.l3)
    expect(text).toContain('3C 代谢力量')
    expect(text).toContain('热身与动作准备')
    expect(text).toContain('滑雪机轻拉')
    expect(text).toContain('主训练')
    expect(text).toContain('哈克深蹲')
    expect(text).toContain('RPE 7–8')
  })
})

describe('7Fit V6 routing and shell', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
    localStorage.clear()
  })
  afterEach(() => cleanup())

  it('parses hash deep links and unknown paths safely', () => {
    expect(getRoute('#/templates/3c1/l1')).toEqual({ name: 'template-detail', system: '3c1', level: 'l1' })
    expect(getRoute('#/postpartum/pp01')).toEqual({ name: 'postpartum-detail', id: 'pp01' })
    expect(getRoute('#/library/action/action-001')).toEqual({ name: 'action-detail', id: 'action-001' })
    expect(getRoute('#/unknown')).toEqual({ name: 'home' })
  })

  it('renders a migrated template action as a library detail link', () => {
    window.location.hash = '#/templates/3c1/l3'
    render(<App />)
    expect(screen.getByRole('link', { name: /滑雪机轻拉/ })).toHaveAttribute('href', expect.stringMatching(/#\/library\/action\/action-/))
    expect(screen.getByRole('link', { name: /哈克深蹲/ })).toHaveAttribute('href', expect.stringMatching(/#\/library\/action\/action-/))
  })

  it('renders semantic navigation, search and the theme control', () => {
    render(<App />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /夜间|浅色|主题/ })).toBeInTheDocument()
    expect(screen.getByText('教练工作台')).toBeInTheDocument()
  })

  it('renders PP details as text content with an inline video and no coach-card image', () => {
    window.location.hash = '#/postpartum/pp01'
    render(<App />)
    expect(screen.getByText('教练卡内容（文字版）')).toBeInTheDocument()
    expect(screen.getByTitle('PP01 主视频')).toBeInTheDocument()
    expect(document.querySelector('.pp-detail-page img')).toBeNull()
  })
})
