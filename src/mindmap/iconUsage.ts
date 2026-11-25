const storageKey = 'mind-map.node-icon-usage.v1'
type Entry = { id: string; count: number }
export function readIconUsage(): Entry[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(rows) ? rows.filter((row): row is Entry =>
      typeof row?.id === 'string' && Number.isSafeInteger(row.count) && row.count > 0) : []
  } catch { return [] }
}

// Newest first. Keeping the array ordered also breaks frequency ties by recency.
export function recordIconUsage(added: string[]) {
  if (!added.length) return
  const entries = readIconUsage()
  for (const id of new Set(added)) {
    const index = entries.findIndex(entry => entry.id === id)
    const previous = index < 0 ? undefined : entries.splice(index,1)[0]
    entries.unshift({ id, count: (previous?.count ?? 0) + 1 })
  }
  try { localStorage.setItem(storageKey, JSON.stringify(entries)) }
  catch { /* The icon itself is already saved even if browser storage is unavailable. */ }
}
