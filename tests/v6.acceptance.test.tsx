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

  it('uses resolved conditioning source data instead of historical CON content', () => {
    const con1L1 = templates.find((template) => template.id === 'con1')!.levels.l1
    const con3L3 = templates.find((template) => template.id === 'con3')!.levels.l3
    const con3L4 = templates.find((template) => template.id === 'con3')!.levels.l4

    expect(con1L1.warmup[0]).toMatchObject({ name: 'RowErg', tag: 'Raise' })
    expect(con1L1.warmup.some((item) => item.tag === 'Specific Build-up')).toBe(true)
    expect(con1L1.exercises.map((exercise) => exercise.name)).toEqual(['RowErg'])
    expect(con3L3.exercises.map((exercise) => exercise.name)).toContain('药球下砸')
    expect(con3L3.exercises.map((exercise) => exercise.name)).not.toContain('划船机')
    expect(con3L4.exercises.map((exercise) => exercise.name)).toContain('药球下砸')
  })

  it('keeps CON05 L3 App-facing runtime at the standard three rounds', () => {
    const con5L3 = templates.find((template) => template.id === 'con5')!.levels.l3
    expect(con5L3.metrics).toContainEqual({ label: '轮数', value: '3 轮' })
    expect(con5L3.exercises).toHaveLength(4)
  })

  it('keeps every template level App-compatible after the Programming adapter', () => {
    expect(templates.filter((template) => template.system === '3c')).toHaveLength(6)
    expect(templates.filter((template) => template.system === 'body')).toHaveLength(5)
    for (const template of templates) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        expect(template.levels[level].warmup.length).toBeGreaterThan(0)
        expect(template.levels[level].exercises.length).toBeGreaterThan(0)
      }
    }
  })

  it('uses the resolved BODY default rather than the historical compound BODY content', () => {
    const body05L4 = templates.find((template) => template.id === 'body5')!.levels.l4
    expect(body05L4.exercises).toHaveLength(5)
    expect(body05L4.exercises.map((exercise) => exercise.name)).toContain('哑铃弯举')
    expect(body05L4.exercises.map((exercise) => exercise.name)).not.toContain('侧平举 + 后束飞鸟 + 三头')
  })

  it('keeps PP01–PP26 extracted coach-card text and the 34 bidirectional pattern edges', () => {
    expect(postpartumMovements).toHaveLength(26)
    expect(postpartumMovements.every((movement) => movement.cardContent.overview && movement.cardContent.coachingPoints.length > 0)).toBe(true)
    expect(postpartumMovements.some((movement) => 'frontCard' in movement || 'backCard' in movement)).toBe(false)
    expect(postpartumMovements.flatMap((movement) => movement.movementPatterns).length).toBe(34)
  })

  it('indexes migrated warmup and main-training actions for direct library lookup', () => {
    const warmupId = getLibraryActionId('SkiErg', '背部 · 垂直拉')
    const mainId = getLibraryActionId('哈克深蹲', '下肢 · 蹲')
    expect(warmupId).toBeTruthy()
    expect(mainId).toBeTruthy()
    expect(libraryActions.length).toBeGreaterThan(40)
    expect(getLibraryAction(warmupId!)).toMatchObject({ name: 'SkiErg' })
    expect(getLibraryAction(mainId!)).toMatchObject({ name: '哈克深蹲' })
  })

  it('builds a complete copyable training brief', () => {
    const template = templates.find((item) => item.id === '3c1')!
    const text = buildTemplateCopyText(template, template.levels.l3)
    expect(text).toContain('3C 代谢力量')
    expect(text).toContain('热身与动作准备')
    expect(text).toContain('滑雪机轻拉')
    expect(text).toContain('Strength Block + 3C Circuit')
    expect(text).toContain('哈克深蹲')
    expect(text).toContain('RIR 2')
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
    expect(screen.getByRole('link', { name: '查看动作详情：哈克深蹲' })).toHaveAttribute('href', expect.stringMatching(/#\/library\/action\/action-/))
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
