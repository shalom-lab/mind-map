import { useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { RenameModal } from '../components/RenameModal'
import { isConfigured } from '../github/storage'
import {
  DEFAULT_FOLDER,
  DEFAULT_REPO_HINT,
  type GithubSettings,
} from '../github/types'
import type { LocalMapRecord } from '../types/map'

interface Props {
  settings: GithubSettings
  maps: LocalMapRecord[]
  busy: boolean
  onImport: () => void
  onNew: () => void
  onOpen: (id: string) => void
  onRename: (id: string, title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
  onOpenSettings: () => void
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso || '—'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HomePage({
  settings,
  maps,
  busy,
  onImport,
  onNew,
  onOpen,
  onRename,
  onDelete,
  onRefresh,
  onOpenSettings,
}: Props) {
  const configured = useMemo(() => isConfigured(settings), [settings])
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<LocalMapRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [renaming, setRenaming] = useState<LocalMapRecord | null>(null)
  const [renameBusy, setRenameBusy] = useState(false)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return maps
    return maps.filter((m) => m.title.toLowerCase().includes(q))
  }, [maps, query])

  const unsynced = maps.filter((m) => m.dirty || !m.path).length

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={28} height={28} />
          <div>
            <h1>思维导图</h1>
            <p className="sub">
              {configured
                ? `数据仓 ${settings.repo} · ${DEFAULT_FOLDER}/`
                : '本地草稿模式'}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={onRefresh} disabled={busy}>
            {busy ? '同步中…' : '刷新'}
          </button>
          <button type="button" className="btn" onClick={onOpenSettings}>
            <span className="ui-emoji" aria-hidden="true">⚙️</span>设置
          </button>
          <button type="button" className="btn" onClick={onImport} disabled={busy}>导入</button>
          <button type="button" className="btn primary" onClick={onNew} disabled={busy}>
            新建导图
          </button>
        </div>
      </header>

      {!configured && (
        <div className="banner warn callout">
          尚未配置 GitHub 数据仓库，仍可在本机新建和编辑（草稿保存在 IndexedDB）。
          同步到远程请先在「设置」填写 PAT 与 <code>owner/repo</code>
          （建议 <code>{DEFAULT_REPO_HINT}</code>）。
          <button type="button" className="linkish" onClick={onOpenSettings}>
            打开设置
          </button>
        </div>
      )}

      {configured && unsynced > 0 && (
        <div className="banner warn callout">
          有 {unsynced} 张导图尚未同步到远程。打开后点击「保存」即可推送到数据仓。
        </div>
      )}

      <div className="toolbar-row">
        <input
          className="search"
          placeholder="搜索标题…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="muted">
          {visible.length} / {maps.length} 张
        </span>
      </div>

      {maps.length === 0 ? (
        <div className="empty">
          <p>还没有导图。</p>
          <button type="button" className="btn primary" onClick={onNew}>
            新建第一张
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>没有匹配「{query}」的导图。</p>
        </div>
      ) : (
        <ul className="map-grid">
          {visible.map((item) => (
            <li key={item.id} className="map-card">
              <button
                type="button"
                className="map-card-main"
                onClick={() => onOpen(item.id)}
              >
                <strong className="map-title">{item.title || '未命名导图'}</strong>
                <span className="map-meta">{formatTime(item.updatedAt)}</span>
              </button>
              <div className="map-card-footer">
                {item.dirty || !item.path ? (
                  <span className="badge warn">未同步</span>
                ) : (
                  <span className="badge ok">已同步</span>
                )}
                <div className="spacer" />
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setRenaming(item)}
                >
                  重命名
                </button>
                <button
                  type="button"
                  className="btn ghost danger-text"
                  onClick={() => setPendingDelete(item)}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RenameModal
        open={Boolean(renaming)}
        title="重命名导图"
        defaultName={renaming?.title ?? ''}
        busy={renameBusy}
        onClose={() => {
          if (!renameBusy) setRenaming(null)
        }}
        onSubmit={(title) => {
          if (!renaming) return
          setRenameBusy(true)
          void onRename(renaming.id, title)
            .catch(() => {
              // parent shows toast
            })
            .finally(() => {
              setRenameBusy(false)
              setRenaming(null)
            })
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="确认删除"
        danger
        busy={deleting}
        confirmLabel="删除"
        onCancel={() => {
          if (!deleting) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete) return
          setDeleting(true)
          void onDelete(pendingDelete.id).finally(() => {
            setDeleting(false)
            setPendingDelete(null)
          })
        }}
      >
        <p>
          确定删除「{pendingDelete?.title || '未命名导图'}」？
          会先从本机列表移除
          {configured ? '，若已配置 PAT 再同步删除数据仓中的文件。' : '。配置 PAT 后刷新时会尝试同步删除远程文件。'}
        </p>
      </ConfirmDialog>
    </div>
  )
}
