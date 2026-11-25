import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { ImportDialog } from './components/ImportDialog'
import { SettingsModal } from './components/SettingsModal'
import {
  createLocalMap,
  deleteMap,
  listVisibleMaps,
  loadLocal,
  refreshMaps,
  renameMap,
  saveMap,
  saveMapLocal,
} from './draft/sync'
import { isConfigured, loadSettings } from './github/storage'
import { friendlyGithubError, type GithubSettings } from './github/types'
const EditorPage = lazy(() => import('./pages/EditorPage').then(module => ({ default: module.EditorPage })))
import { HomePage } from './pages/HomePage'
import type { LocalMapRecord, MapDocument } from './types/map'

type Toast = { kind: 'info' | 'error'; text: string }

export default function App() {
  const [settings, setSettings] = useState<GithubSettings>(() => loadSettings())
  const [importOpen, setImportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [maps, setMaps] = useState<LocalMapRecord[]>([])
  const [active, setActive] = useState<LocalMapRecord | null>(null)
  const [bootDone, setBootDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ text, kind })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 3200)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const reloadLocal = useCallback(async () => {
    const list = await listVisibleMaps()
    setMaps(list)
    return list
  }, [])

  const syncFromRemote = useCallback(
    async (nextSettings: GithubSettings, opts?: { quiet?: boolean }) => {
      setBusy(true)
      try {
        const result = await refreshMaps(nextSettings)
        setMaps(result.maps)
        if (!opts?.quiet) {
          if (result.warnings.length) {
            showToast(result.warnings[0]!, 'error')
          } else if (isConfigured(nextSettings)) {
            showToast('已从数据仓同步列表')
          }
        } else if (result.warnings.length) {
          showToast(result.warnings[0]!, 'error')
        }
      } catch (err) {
        showToast(friendlyGithubError(err), 'error')
        await reloadLocal()
      } finally {
        setBusy(false)
      }
    },
    [reloadLocal, showToast],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const initial = loadSettings()
        if (cancelled) return
        if (isConfigured(initial)) {
          const result = await refreshMaps(initial)
          if (cancelled) return
          setMaps(result.maps)
          if (result.warnings.length) {
            showToast(result.warnings[0]!, 'error')
          }
        } else {
          const list = await listVisibleMaps()
          if (cancelled) return
          setMaps(list)
        }
      } catch {
        if (!cancelled) await reloadLocal()
      } finally {
        if (!cancelled) setBootDone(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadLocal, showToast])

  const handleNew = async () => {
    const record = await createLocalMap()
    setActive(record)
    await reloadLocal()
  }

  const handleOpen = async (id: string) => {
    const record = await loadLocal(id)
    if (!record || record.deleted) {
      showToast('找不到这张导图', 'error')
      await reloadLocal()
      return
    }
    setActive(record)
  }

  const handleRename = async (id: string, title: string) => {
    try {
      const record = await renameMap(id, title, settings)
      if (active?.id === id) setActive(record)
      await reloadLocal()
      showToast(
        isConfigured(settings) && !record.dirty
          ? '已重命名并同步'
          : '已重命名（本地）',
      )
    } catch (err) {
      showToast(friendlyGithubError(err), 'error')
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteMap(id, settings)
    if (active?.id === id) setActive(null)
    await reloadLocal()
    if (result.warning) {
      showToast(`已从本机删除。远程同步失败：${result.warning}`, 'error')
    } else if (result.remoteDeleted) {
      showToast('已删除本机与远程文件')
    } else {
      showToast(
        isConfigured(settings)
          ? '已从本机删除'
          : '已从本机删除。配置 PAT 后刷新会尝试同步删除远程文件。',
      )
    }
  }

  const handleSave = async (doc: MapDocument) => {
    setBusy(true)
    try {
      const { record, localOnly } = await saveMap(doc, settings)
      setActive(record)
      await reloadLocal()
      showToast(
        localOnly
          ? '已保存到本机草稿。配置 GitHub 后可同步到数据仓库。'
          : '已保存到数据仓库',
      )
      return !localOnly
    } catch (err) {
      showToast(friendlyGithubError(err), 'error')
      throw err
    } finally {
      setBusy(false)
    }
  }

  const handleLocalDraft = async (doc: MapDocument, dirty: boolean) => {
    await saveMapLocal(doc, { dirty, deleted: false }).then((record) => {
      setActive((prev) => (prev && prev.id === record.id ? { ...prev, ...record } : prev))
    })
  }

  const handleSavedSettings = (next: GithubSettings) => {
    setSettings(next)
    if (isConfigured(next)) {
      void syncFromRemote(next)
    }
  }

  if (!bootDone) {
    return (
      <div className="boot">
        <p>正在加载…</p>
      </div>
    )
  }

  return (
    <div className="app">
      {active ? (
        <Suspense fallback={<div className="boot">正在打开导图…</div>}>
        <EditorPage
          key={active.id}
          record={active}
          settings={settings}
          busy={busy}
          onBack={() => {
            setActive(null)
            void reloadLocal()
          }}
          onImport={() => setImportOpen(true)}
          onNew={() => void handleNew()}
          onSave={handleSave}
          onOpenSettings={() => setSettingsOpen(true)}
          onLocalDraft={handleLocalDraft}
        />
        </Suspense>
      ) : (
        <HomePage
          settings={settings}
          maps={maps}
          busy={busy}
          onImport={() => setImportOpen(true)}
          onNew={() => void handleNew()}
          onOpen={(id) => void handleOpen(id)}
          onRename={handleRename}
          onDelete={handleDelete}
          onRefresh={() => void syncFromRemote(settings)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} onImport={async (title, data) => {
        const record = await createLocalMap(title, data)
        setActive(record)
        await reloadLocal()
      }} />}

      {settingsOpen && <SettingsModal
        initial={settings}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSavedSettings}
      />}

      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}
