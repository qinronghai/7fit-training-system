export type Route =
  | { name: 'home' }
  | { name: 'templates' }
  | { name: 'template-detail'; system: string; level: 'l1' | 'l2' | 'l3' | 'l4' }
  | { name: 'female-template-detail'; id: string }
  | { name: 'patterns' }
  | { name: 'pattern-detail'; id: string }
  | { name: 'library' }
  | { name: 'library-detail'; id: string }
  | { name: 'action-detail'; id: string }
  | { name: 'postpartum-detail'; id: string }

export type TemplateRouteLevel = 'l1' | 'l2' | 'l3' | 'l4'

const validLevels = new Set(['l1', 'l2', 'l3', 'l4'])

export const getRoute = (hash = window.location.hash): Route => {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'templates' && parts[1]) {
    return { name: 'template-detail', system: parts[1], level: (validLevels.has(parts[2]) ? parts[2] : 'l1') as TemplateRouteLevel }
  }
  if (parts[0] === 'female' && parts[1]) return { name: 'female-template-detail', id: parts[1] }
  if (parts[0] === 'patterns' && parts[1]) return { name: 'pattern-detail', id: parts[1] }
  if (parts[0] === 'library' && parts[1] === 'action' && parts[2]) return { name: 'action-detail', id: parts[2] }
  if (parts[0] === 'library' && parts[1]) return { name: 'library-detail', id: parts[1] }
  if (parts[0] === 'postpartum' && parts[1]) return { name: 'postpartum-detail', id: parts[1] }
  if (parts[0] === 'templates') return { name: 'templates' }
  if (parts[0] === 'patterns') return { name: 'patterns' }
  if (parts[0] === 'library') return { name: 'library' }
  return { name: 'home' }
}

export const navigate = (path: string) => {
  window.location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`
}
