import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { exercises } from '../src/data/exercises'
import { buildFemale111CoachProduct } from '../src/data/female111'
import { postpartumMovements } from '../src/data/postpartumPresentationData'
import { ppMethodNodes } from '../src/data/pp'

const female111Sources = import.meta.glob('../src/data/female111/*.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

afterEach(() => {
  cleanup()
  window.location.hash = '#/home'
})

describe('PP-F111 Stage 8 boundary audit', () => {
  it('keeps the domain independent from App, router, React, and legacy UI storage imports', () => {
    const forbiddenImport = /from\s+['"][^'"]*(?:\/App|\/router|\/components\/|\/styles|\/lib\/storage|react)[^'"]*['"]/
    expect(Object.keys(female111Sources).length).toBeGreaterThan(0)
    for (const [file, source] of Object.entries(female111Sources)) {
      expect(source, file).not.toMatch(forbiddenImport)
    }
  })

  it('does not mutate frozen PP Method, Exercise, or legacy presentation identity while building a product', () => {
    const before = JSON.stringify({ ppMethodNodes, exercises, postpartumMovements })

    const product = buildFemale111CoachProduct({
      id: 'female111-boundary-audit',
      target: '力量基础',
      stage: 'L4',
      population: 'GENERAL',
      readiness: 'GREEN',
      coachConfirmed: true,
      venueConfirmed: true,
      availableEquipment: ['barbell', 'box', 'mini-band'],
    })

    expect(product.session).toBeDefined()
    expect(JSON.stringify({ ppMethodNodes, exercises, postpartumMovements })).toBe(before)
  })

  it('keeps the independent Female111 route separate from legacy Female and PP detail routes', () => {
    window.location.hash = '#/female/fit-f01'
    render(createElement(App))
    expect(screen.getByRole('heading', { level: 2, name: 'HIP' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'SUPPORT' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'CORE' })).toBeInTheDocument()

    cleanup()
    window.location.hash = '#/postpartum/pp01'
    render(createElement(App))
    expect(screen.getByText('教练卡内容（文字版）')).toBeInTheDocument()
    expect(screen.getByTitle('PP01 主视频')).toBeInTheDocument()

    cleanup()
    window.location.hash = '#/female111'
    render(createElement(App))
    expect(screen.getByRole('heading', { level: 1, name: 'Female111 · 今日训练工作台' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'HIP' })).not.toBeInTheDocument()
  })
})
