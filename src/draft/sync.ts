import { deleteFile, getFile, listMaps, mapPath, putFile } from '../github/client'
import { isConfigured } from '../github/storage'
import { friendlyGithubError, type GithubSettings } from '../github/types'
import { createDocument, type LocalMapRecord, type MapDocument, type MindMapFullData } from '../types/map'
import {
  loadAllLocal,
  loadLocal,
  parseMapDocument,
  removeLocal,
  serializeDocument,
  upsertLocal,
} from './storage'

export { loadLocal }

export type SyncResult = {
  maps: LocalMapRecord[]
  warnings: string[]
}

export async function listVisibleMaps(): Promise<LocalMapRecord[]> {
  const all = await loadAllLocal()
  return all.filter((m) => !m.deleted)
}

export async function createLocalMap(title = '未命名导图', data?: MindMapFullData): Promise<LocalMapRecord> {
  const doc = createDocument(title)
  if (data) doc.mindMap = data
  const record: LocalMapRecord = {
    ...doc,
    path: null,
    sha: null,
    dirty: true,
    deleted: false,
  }
  await upsertLocal(record)
  return record
}

export async function saveMapLocal(
  doc: MapDocument,
  meta?: Partial<Pick<LocalMapRecord, 'path' | 'sha' | 'dirty' | 'deleted'>>,
): Promise<LocalMapRecord> {
  const prev = await loadLocal(doc.id)
  const record: LocalMapRecord = {
    ...doc,
    path: meta?.path !== undefined ? meta.path : (prev?.path ?? null),
    sha: meta?.sha !== undefined ? meta.sha : (prev?.sha ?? null),
    dirty: meta?.dirty ?? true,
    deleted: meta?.deleted ?? false,
  }
  await upsertLocal(record)
  return record
}

/** Write local first; if token is configured, also put to the data repo. */
export async function saveMap(
  doc: MapDocument,
  settings: GithubSettings,
): Promise<{ record: LocalMapRecord; localOnly: boolean }> {
  const updated: MapDocument = {
    ...doc,
    updatedAt: new Date().toISOString(),
  }
  const prev = await loadLocal(doc.id)
  const path = prev?.path || mapPath(updated.id)
  const local = await saveMapLocal(updated, {
    path,
    sha: prev?.sha ?? null,
    dirty: true,
    deleted: false,
  })

  if (!isConfigured(settings)) {
    return { record: local, localOnly: true }
  }

  const result = await putFile(
    settings,
    path,
    serializeDocument(updated),
    prev?.path ? `Update mind map: ${updated.title}` : `Add mind map: ${updated.title}`,
    prev?.sha ?? undefined,
  )
  const record = await saveMapLocal(updated, {
    path: result.path,
    sha: result.sha,
    dirty: false,
    deleted: false,
  })
  return { record, localOnly: false }
}

/**
 * Local delete takes effect immediately. If a token is present, also
 * delete the remote file; otherwise keep a deleted flag for later sync.
 */
export async function deleteMap(
  id: string,
  settings: GithubSettings,
): Promise<{ remoteDeleted: boolean; warning?: string }> {
  const prev = await loadLocal(id)
  if (!prev) return { remoteDeleted: false }

  if (!prev.path) {
    await removeLocal(id)
    return { remoteDeleted: false }
  }

  const marked: LocalMapRecord = { ...prev, deleted: true, dirty: false }
  await upsertLocal(marked)

  if (!isConfigured(settings)) {
    return { remoteDeleted: false }
  }

  try {
    let sha = prev.sha
    if (!sha) {
      const file = await getFile(settings, prev.path)
      sha = file.sha
    }
    await deleteFile(
      settings,
      prev.path,
      sha,
      `Delete mind map: ${prev.title}`,
    )
    await removeLocal(id)
    return { remoteDeleted: true }
  } catch (err) {
    return { remoteDeleted: false, warning: friendlyGithubError(err) }
  }
}

/** Pull remote maps, merge with local-first records, and flush pending deletes. */
export async function refreshMaps(
  settings: GithubSettings,
): Promise<SyncResult> {
  const warnings: string[] = []

  if (!isConfigured(settings)) {
    return { maps: await listVisibleMaps(), warnings }
  }

  const local = await loadAllLocal()

  for (const rec of local.filter((m) => m.deleted && m.path)) {
    try {
      let sha = rec.sha
      if (!sha) {
        const file = await getFile(settings, rec.path!)
        sha = file.sha
      }
      await deleteFile(
        settings,
        rec.path!,
        sha,
        `Delete mind map: ${rec.title}`,
      )
      await removeLocal(rec.id)
    } catch (err) {
      warnings.push(`${rec.title || rec.id}：${friendlyGithubError(err)}`)
    }
  }

  let remote
  try {
    remote = await listMaps(settings)
  } catch (err) {
    warnings.push(friendlyGithubError(err))
    return { maps: await listVisibleMaps(), warnings }
  }

  const remaining = await loadAllLocal()
  const byPath = new Map(
    remaining.filter((m) => m.path).map((m) => [m.path as string, m]),
  )
  const byId = new Map(remaining.map((m) => [m.id, m]))
  const remotePaths = new Set(remote.map((item) => item.path))

  for (const item of remote) {
    const existing =
      byPath.get(item.path) || byId.get(item.name.replace(/\.json$/i, ''))
    if (existing?.deleted) continue
    if (existing && existing.dirty) continue
    if (existing && existing.sha === item.sha) continue
    try {
      const file = await getFile(settings, item.path)
      const doc = parseMapDocument(file.text, {
        path: file.path,
        name: item.name,
      })
      const collision = byId.get(doc.id)
      if (collision && collision.path && collision.path !== file.path && collision.dirty) {
        // Another local dirty map already owns this id; keep local.
        continue
      }
      await upsertLocal({
        ...doc,
        path: file.path,
        sha: file.sha,
        dirty: false,
        deleted: false,
      })
    } catch (err) {
      warnings.push(`${item.name}：${friendlyGithubError(err)}`)
    }
  }

  const after = await loadAllLocal()
  for (const rec of after) {
    if (rec.deleted) continue
    if (rec.dirty) continue
    if (rec.path && !remotePaths.has(rec.path)) {
      await removeLocal(rec.id)
    }
  }

  return { maps: await listVisibleMaps(), warnings }
}

export async function renameMap(
  id: string,
  title: string,
  settings: GithubSettings,
): Promise<LocalMapRecord> {
  const prev = await loadLocal(id)
  if (!prev || prev.deleted) {
    throw new Error('找不到要重命名的导图')
  }
  const next: MapDocument = {
    version: 1,
    id: prev.id,
    title: title.trim() || '未命名导图',
    updatedAt: new Date().toISOString(),
    mindMap: prev.mindMap,
  }
  const { record } = await saveMap(next, settings)
  return record
}
