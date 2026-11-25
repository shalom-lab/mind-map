import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  title: string
  defaultName: string
  busy?: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export function RenameModal({
  open,
  title,
  defaultName,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(defaultName)

  useEffect(() => {
    if (open) setName(defaultName)
  }, [open, defaultName])

  if (!open) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy) return
    onSubmit(trimmed)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal narrow" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="关闭"
            disabled={busy}
          >
            ×
          </button>
        </header>
        <form onSubmit={submit}>
          <label className="field">
            <span>标题</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="未命名导图"
              disabled={busy}
            />
          </label>
          <footer className="modal-footer">
            <div className="spacer" />
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              取消
            </button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? '保存中…' : '确定'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
