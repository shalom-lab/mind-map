import { withoutCustomBackground } from '../mindmap/themes'
import { CanvasNavigation } from '../components/CanvasNavigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'
import { EditorTools } from '../components/EditorTools'
import { MindMapCanvas } from '../components/MindMapCanvas'
import { isConfigured } from '../github/storage'
import type { GithubSettings } from '../github/types'
import { EXPORT_FORMATS, type ExportFormat } from '../mindmap/engine'
import type { LocalMapRecord, MapDocument, MindMapFullData } from '../types/map'

interface Props {
  record: LocalMapRecord
  settings: GithubSettings
  busy: boolean
  onImport: () => void
  onNew: () => void
  onBack: () => void
  onSave: (doc: MapDocument) => Promise<void>
  onOpenSettings: () => void
  onLocalDraft: (doc: MapDocument) => Promise<void>
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
  onNew,
  onImport,
  onBack,
  onSave,
  onOpenSettings,
  onLocalDraft,
}: Props) {
  const apiRef = useRef<MindMapInstance | null>(null)
  const [canvasApi, setCanvasApi] = useState<MindMapInstance | null>(null)
  const [title, setTitle] = useState(record.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(record.title)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const [layout, setLayout] = useState(record.mindMap.layout || 'mindMap')
  const [theme, setTheme] = useState(record.mindMap.theme?.template || 'default')
  const [dirty, setDirty] = useState(record.dirty)
  const [exporting, setExporting] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [filename, setFilename] = useState('')
  const [withConfig, setWithConfig] = useState(true)
  const [transparent, setTransparent] = useState(false)
  const [exportError, setExportError] = useState('')
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
    setCanvasApi(api)
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
    const api = apiRef.current
    if (api && api.getTheme() !== value) {
      api.setThemeConfig(withoutCustomBackground(api.getCustomThemeConfig()), true)
      api.setTheme(value)
    }
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

  const leaveEditor = async (next: () => void) => {
    if (dirty || draftTimerRef.current) {
      const doc = currentDoc()
      if (doc) {
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
        draftTimerRef.current = null
        try { await onLocalDraft(doc) }
        catch { window.alert('本地草稿保存失败，请先导出备份。'); return }
      }
    }
    next()
  }

  const handleExport = async () => {
    const api = apiRef.current
    if (!api) return
    setExporting(true)
    try {
      setExportError('')
      const args = format === 'json' || format === 'smm' ? [withConfig]
        : format === 'png' ? [transparent] : []
      const result = await api.export(format, true, filename.trim(), ...args)
      if (!result) throw new Error('导出失败，请重试或选择其他格式。')
      setExportOpen(false)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '导出失败，请重试。')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <div className="editor-left">
          <button type="button" className="btn ghost" onClick={() => void leaveEditor(onBack)}>
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
          <button type="button" className="btn" disabled={busy} onClick={() => void leaveEditor(onNew)}>新建</button>
          <button type="button" className="btn" disabled={busy} onClick={() => void leaveEditor(onImport)}>导入</button>
          <button type="button" className="btn" onClick={() => {
            setFilename(title.trim() || '思维导图')
            setExportError('')
            setExportOpen(true)
          }}>导出…</button>

          <button type="button" className="btn" onClick={onOpenSettings}>
            <span className="ui-emoji" aria-hidden="true">⚙️</span>设置
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
        <EditorTools onChange={scheduleDraft} api={canvasApi} layout={layout} theme={theme} onLayout={handleLayout} onTheme={handleTheme} />
        <MindMapCanvas
          sceneKey={record.id}
          data={record.mindMap}
          onReady={handleReady}
          onChange={scheduleDraft}
        />
      </div>

      {exportOpen && (
        <div className="modal-backdrop">
          <form className="modal narrow" role="dialog" aria-modal="true" aria-labelledby="export-title"
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === 'Escape' && !exporting) setExportOpen(false)
            }}
            onSubmit={e => { e.preventDefault(); if (!exporting) void handleExport() }}>
            <header className="modal-header"><h2 id="export-title">导出导图</h2></header>
            <label className="field"><span>文件名（自动添加扩展名）</span>
              <input autoFocus required value={filename} disabled={exporting} onChange={e => setFilename(e.target.value)} />
            </label>
            <label className="field"><span>格式</span>
              <select value={format} disabled={exporting} onChange={e => setFormat(e.target.value as ExportFormat)}>
                {EXPORT_FORMATS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            {(format === 'json' || format === 'smm') && (
              <label><input type="checkbox" checked={withConfig} disabled={exporting}
                onChange={e => setWithConfig(e.target.checked)} /> 包含主题、结构和视图</label>
            )}
            {format === 'png' && (
              <label><input type="checkbox" checked={transparent} disabled={exporting}
                onChange={e => setTransparent(e.target.checked)} /> 透明背景</label>
            )}
            {exportError && <p role="alert">{exportError}</p>}
            <footer className="modal-footer">
              <button type="button" className="btn" disabled={exporting} onClick={() => setExportOpen(false)}>取消</button>
              <button className="btn primary" disabled={exporting || !filename.trim()}>{exporting ? '导出中…' : '导出'}</button>
            </footer>
          </form>
        </div>
      )}

      {canvasApi && <CanvasNavigation api={canvasApi} />}
    </div>
  )
}
