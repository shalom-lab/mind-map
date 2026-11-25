import { useEffect, useRef, useState } from 'react'
import type { MindMapFullData } from '../types/map'

type Props = {
  onClose: () => void
  onImport: (title: string, data: MindMapFullData) => Promise<void>
}

export function ImportDialog({ onClose, onImport }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { ref.current?.showModal() }, [])
  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const { readImport } = await import('../mindmap/importMap')
      const data = await readImport(mode === 'file' ? file : null, markdown)
      await onImport(data.title, data.mindMap)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败，请检查文件。')
      setBusy(false)
    }
  }
  return <dialog ref={ref} className="modal import-dialog" aria-labelledby="import-title"
    onCancel={e => { e.preventDefault(); if (!busy) onClose() }} onKeyDown={e => e.stopPropagation()}>
    <form onSubmit={e => { e.preventDefault(); void submit() }}>
      <header className="modal-header"><h2 id="import-title">导入为新导图</h2></header>
      <fieldset disabled={busy}>
        <label><input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} />选择文件</label>
        <label><input type="radio" checked={mode === 'text'} onChange={() => { setMode('text'); setFile(null) }} />粘贴 Markdown</label>
        {mode === 'file' ? <label className="field"><span>SMM、JSON、XMind 或 Markdown</span>
          <input type="file" accept=".smm,.json,.xmind,.md,.markdown" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {file?.name.toLowerCase().endsWith('.xmind') && <small>导入第一个画布。</small>}</label> :
          <label className="field"><span>Markdown 内容</span><textarea rows={9} value={markdown}
            placeholder={'# 中心主题\n## 分支\n- 子节点'} onChange={e => setMarkdown(e.target.value)} /></label>}
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <footer className="modal-footer"><button type="button" className="btn" disabled={busy} onClick={onClose}>取消</button>
        <button className="btn primary" disabled={busy || (mode === 'file' ? !file : !markdown.trim())}>{busy ? '导入中…' : '导入'}</button></footer>
    </form>
  </dialog>
}
