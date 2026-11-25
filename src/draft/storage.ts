import {
  idFromPath,
  normalizeFullData,
  titleFromNode,
  type LocalMapRecord,
  type MapDocument,
  type MindMapFullData,
} from '../types/map'

const IDB_NAME = 'mindmap-byok'
const IDB_VERSION = 1
const IDB_STORE = 'maps'

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openIdb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, mode)
        const store = tx.objectStore(IDB_STORE)
        const req = fn(store)
        req.onerror = () =>
          reject(req.error ?? new Error('indexedDB request failed'))
        req.onsuccess = () => resolve(req.result)
        tx.oncomplete = () => db.close()
        tx.onerror = () => reject(tx.error ?? new Error('indexedDB tx failed'))
      }),
  )
}

function isRecord(value: unknown): value is LocalMapRecord {
  if (!value || typeof value !== 'object') return false
  const rec = value as LocalMapRecord
  return rec.version === 1 && typeof rec.id === 'string' && Boolean(rec.mindMap)
}

export async function loadAllLocal(): Promise<LocalMapRecord[]> {
  try {
    const rows = await withStore('readonly', (store) => store.getAll())
    return (rows as unknown[])
      .filter(isRecord)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  } catch {
    return []
  }
}

export async function loadLocal(id: string): Promise<LocalMapRecord | null> {
  try {
    const row = await withStore('readonly', (store) => store.get(id))
    return isRecord(row) ? row : null
  } catch {
    return null
  }
}

export async function upsertLocal(record: LocalMapRecord): Promise<void> {
  await withStore('readwrite', (store) => store.put(record))
}

export async function removeLocal(id: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(id))
  } catch {
    // ignore
  }
}

export function parseMapDocument(
  text: string,
  fallback?: { path?: string; name?: string },
): MapDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('无法解析 JSON：文件内容不是合法 JSON')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('文件不是有效的思维导图 JSON')
  }
  const obj = parsed as Partial<MapDocument> & {
    root?: unknown
    data?: unknown
  }

  if (obj.version === 1 && obj.mindMap) {
    const mindMap = normalizeFullData(obj.mindMap)
    const id =
      (typeof obj.id === 'string' && obj.id) ||
      idFromPath(fallback?.path) ||
      crypto.randomUUID()
    const title =
      (typeof obj.title === 'string' && obj.title.trim()) ||
      titleFromNode(mindMap.root) ||
      fallback?.name?.replace(/\.json$/i, '') ||
      '未命名导图'
    return {
      version: 1,
      id,
      title,
      updatedAt:
        typeof obj.updatedAt === 'string' && obj.updatedAt
          ? obj.updatedAt
          : new Date().toISOString(),
      mindMap,
    }
  }

  // Accept raw simple-mind-map full data or a bare node tree / .smm export.
  const hasRoot = Boolean(obj.root)
  const hasNode = Boolean((obj as { data?: unknown }).data)
  if (!hasRoot && !hasNode) {
    throw new Error('文件不是有效的思维导图（缺少 mindMap / root / data）')
  }
  const mindMap: MindMapFullData = hasRoot
    ? normalizeFullData(obj)
    : normalizeFullData({ root: obj })
  return {
    version: 1,
    id: idFromPath(fallback?.path) || crypto.randomUUID(),
    title:
      titleFromNode(mindMap.root) ||
      fallback?.name?.replace(/\.json$/i, '') ||
      '未命名导图',
    updatedAt: new Date().toISOString(),
    mindMap,
  }
}

export function serializeDocument(doc: MapDocument): string {
  const payload: MapDocument = {
    version: 1,
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    mindMap: doc.mindMap,
  }
  return `${JSON.stringify(payload, null, 2)}\n`
}

export function toDocument(record: LocalMapRecord): MapDocument {
  return {
    version: 1,
    id: record.id,
    title: record.title,
    updatedAt: record.updatedAt,
    mindMap: record.mindMap,
  }
}
