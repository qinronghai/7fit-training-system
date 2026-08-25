const favoritesKey = '7fit-v6-favorites'
const recentKey = '7fit-v6-recent'

const read = (key: string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as string[] } catch { return [] }
}
const write = (key: string, value: string[]) => localStorage.setItem(key, JSON.stringify(value))

export const getFavorites = () => read(favoritesKey)
export const toggleFavorite = (id: string) => {
  const next = getFavorites().includes(id) ? getFavorites().filter((item) => item !== id) : [id, ...getFavorites()]
  write(favoritesKey, next)
  return next
}
export const getRecent = () => read(recentKey)
export const addRecent = (id: string) => {
  const next = [id, ...getRecent().filter((item) => item !== id)].slice(0, 6)
  write(recentKey, next)
  return next
}
