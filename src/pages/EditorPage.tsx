import { useCallback, useEffect, useRef, useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'
import { MindMapCanvas } from '../components/MindMapCanvas'
import { isConfigured } from '../github/storage'
import type { GithubSettings } from '../github/types'
import { EXPORT_FORMATS, type ExportFormat } from '../mindmap/engine'
import { LAYOUTS } from '../mindmap/layouts'
import { THEMES } from '../mindmap/themes'
import type { LocalMapRecord, MapDocument, MindMapFullData } from '../types/map'

interface Props {
  record: LocalMapRecord
  settings: GithubSettings
  busy: boolean
  onBack: () => void
  onSave: (doc: MapDocument) => Promise<void>
  onOpenSettings: () => void
  onLocalDraft: (doc: MapDocument) => void
}

function readFullData(api: MindMapInstance): MindMapFullData {
  const raw = api.getData(true) as MindMapFullData
  return {
    root: raw.root,
    layout: raw.layout,
    theme: raw.theme,
    view: (raw.view as Record<string, unknown> | null) ?? null,
  }
}

export function EditorPage({
  record,
  settings,
  busy,
  onBack,
  onSave,
  onOpenSettings,
  onLocalDraft,
}: Props) {
  const apiRef = useRef<MindMapInstance | null>(null)
  const [title, setTitle] = useState(record.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(record.title)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const [layout, setLayout] = useState(record.mindMap.layout || 'mindMap')
  const [theme, setTheme] = useState(record.mindMap.theme?.template || 'default')
  const [dirty, setDirty] = useState(record.dirty)
  const [exporting, setExporting] = useState(false)
  const configured = isConfigured(settings)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metaRef = useRef({ title: record.title, dirty: record.dirty })

  useEffect(() => {
    setTitle(record.title)
    setTitleDraft(record.title)
    setLayout(record.mindMap.layout || 'mindMap')
    setTheme(record.mindMap.theme?.template || 'default')
    setDirty(record.dirty)
  }, [record.id, record.title, record.dirty, record.mindMap.layout, record.mindMap.theme?.template])

  useEffect(() => {
    metaRef.current = { title, dirty }
  }, [title, dirty])

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [editingTitle])

  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [])

  const currentDoc = useCallback((): MapDocument | null => {
    const api = apiRef.current
    if (!api) return null
    return {
      version: 1,
      id: record.id,
      title: metaRef.current.title.trim() || '未命名导图',
      updatedAt: new Date().toISOString(),
      mindMap: readFullData(api),
    }
  }, [record.id])

  const scheduleDraft = useCallback(() => {
    setDirty(true)
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      const doc = currentDoc()
      if (doc) onLocalDraft(doc)
    }, 500)
  }, [currentDoc, onLocalDraft])

  const handleReady = useCallback((api: MindMapInstance) => {
    apiRef.current = api
  }, [])

  const commitTitle = () => {
    const next = titleDraft.trim() || '未命名导图'
    if (next !== title) {
      setTitle(next)
      setDirty(true)
      scheduleDraft()
    }
    setEditingTitle(false)
  }

  const handleLayout = (value: string) => {
    setLayout(value)
    apiRef.current?.setLayout(value)
    scheduleDraft()
  }

  const handleTheme = (value: string) => {
    setTheme(value)
    apiRef.current?.setTheme(value)
    scheduleDraft()
  }

  const exec = (cmd: string) => {
    apiRef.current?.execCommand(cmd)
    scheduleDraft()
  }

  const handleSave = async () => {
    const doc = currentDoc()
    if (!doc) return
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
    await onSave(doc)
  }

  const handleExport = async (type: ExportFormat) => {
    const api = apiRef.current
    if (!api) return
    setExporting(true)
    try {
      await api.export(type, true, title.trim() || '思维导图')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <div className="editor-left">
          <button type="button" className="btn ghost" onClick={onBack}>
            ← 返回
          </button>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitTitle()
                }
                if (e.key === 'Escape') {
                  setTitleDraft(title)
                  setEditingTitle(false)
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="title-btn"
              onClick={() => {
                setTitleDraft(title)
                setEditingTitle(true)
              }}
              title="点击重命名"
            >
              {title || '未命名导图'}
            </button>
          )}
          {dirty ? (
            <span className="badge warn">未保存</span>
          ) : configured && record.path ? (
            <span className="badge ok">已同步</span>
          ) : (
            <span className="badge">本地</span>
          )}
        </div>

        <div className="editor-actions">
          <button
            type="button"
            className="btn"
            onClick={() => exec('BACK')}
            title="撤销"
          >
            撤销
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => exec('FORWARD')}
            title="重做"
          >
            重做
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => exec('INSERT_CHILD_NODE')}
            title="Tab"
          >
            子节点
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => exec('INSERT_NODE')}
            title="Enter"
          >
            同级
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => exec('REMOVE_NODE')}
            title="Delete"
          >
            删除节点
          </button>

          <label className="select-field">
            <span>布局</span>
            <select value={layout} onChange={(e) => handleLayout(e.target.value)}>
              {LAYOUTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="select-field">
            <span>主题</span>
            <select value={theme} onChange={(e) => handleTheme(e.target.value)}>
              {THEMES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="select-field">
            <span>导出</span>
            <select
              defaultValue=""
              disabled={exporting}
              onChange={(e) => {
                const value = e.target.value as ExportFormat
                e.target.value = ''
                if (value) void handleExport(value)
              }}
            >
              <option value="" disabled>
                {exporting ? '导出中…' : '选择格式'}
              </option>
              {EXPORT_FORMATS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="btn" onClick={onOpenSettings}>
            设置
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => void handleSave()}
            disabled={busy}
          >
            {busy ? '保存中…' : configured ? '保存' : '保存到本地'}
          </button>
        </div>
      </header>

      {!configured && (
        <div className="banner warn editor-banner">
          未配置数据仓库，保存只会写入本机 IndexedDB。
          <button type="button" className="linkish" onClick={onOpenSettings}>
            去设置
          </button>
        </div>
      )}

      <div className="canvas">
        <MindMapCanvas
          sceneKey={record.id}
          data={record.mindMap}
          onReady={handleReady}
          onChange={scheduleDraft}
        />
      </div>

      <footer className="editor-footer">
        <span>双击编辑节点</span>
        <span>Tab 子节点</span>
        <span>Enter 同级</span>
        <span>Del 删除</span>
        <span>Ctrl+C / Ctrl+V 复制粘贴</span>
        <span>滚轮缩放，拖动画布</span>
      </footer>
    </div>
  )
}
