import { useState } from 'react'
import { testConnection } from '../github/client'
import {
  clearSettings,
  isValidSettings,
  saveSettings,
} from '../github/storage'
import {
  DEFAULT_REPO_HINT,
  DEFAULT_SETTINGS,
  friendlyGithubError,
  parseRepo,
  type GithubSettings,
} from '../github/types'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  initial: GithubSettings
  onClose: () => void
  onSaved: (settings: GithubSettings) => void
}

export function SettingsModal({ initial, onClose, onSaved }: Props) {
  const [tokenInput, setTokenInput] = useState('')
  const [repoInput, setRepoInput] = useState(initial.repo)
  const [saved, setSaved] = useState<GithubSettings>(initial)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const handleSave = async () => {
    const next: GithubSettings = {
      token: tokenInput.trim() || saved.token,
      repo: repoInput.trim(),
    }
    if (!next.token.trim()) {
      setErr('请填写 GitHub 访问令牌。')
      setMsg(null)
      return
    }
    if (!parseRepo(next.repo)) {
      setErr('仓库格式应为「用户名/仓库名」。')
      setMsg(null)
      return
    }
    if (!isValidSettings(next)) {
      setErr('请检查仓库名和访问令牌。')
      setMsg(null)
      return
    }

    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      const name = await testConnection(next)
      const ok = saveSettings(next)
      if (!ok) {
        setErr('保存失败：校验未通过或浏览器拒绝写入，原有设置未被覆盖')
        return
      }
      setSaved(next)
      setTokenInput('')
      onSaved(next)
      setMsg(`已保存并连接成功：${name}`)
    } catch (e) {
      setErr(friendlyGithubError(e))
    } finally {
      setBusy(false)
    }
  }

  const doClear = () => {
    setClearConfirmOpen(false)
    clearSettings()
    const empty = { ...DEFAULT_SETTINGS }
    setSaved(empty)
    setTokenInput('')
    setRepoInput('')
    onSaved(empty)
    setMsg('已清除本地设置')
    setErr(null)
  }

  return (
    <div className="modal-backdrop" onClick={() => { if (!busy) onClose() }}>
      <form className="modal settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape' && !busy) onClose() }} onSubmit={e => { e.preventDefault(); if (!busy) void handleSave() }}>
        <header className="modal-header">
          <h2 id="settings-title"><span aria-hidden="true">⚙️</span> GitHub 同步</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="关闭" disabled={busy}
          >
            ×
          </button>
        </header>

        <label className="field">
          <span><i className="ui-emoji" aria-hidden="true">📁</i>数据仓库</span>
          <input autoFocus disabled={busy}
            placeholder={DEFAULT_REPO_HINT}
            spellCheck={false}
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value.trim())}
          />
        </label>

        <label className="field">
          <span><i className="ui-emoji" aria-hidden="true">🔑</i>访问令牌</span>
          <input type="password" disabled={busy} autoComplete="off" spellCheck={false}
            placeholder={saved.token ? '已保存 · 输入新令牌可替换' : '输入 GitHub 个人访问令牌'}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
        </label>

        <details className="settings-help"><summary>令牌权限与存储</summary>
          <p>为数据仓库授予 Contents 读写权限。令牌仅保存在此浏览器，导图保存在仓库的 maps/ 目录。</p>
        </details>
        {msg && <div className="banner success" role="status">{msg}</div>}
        {err && <div className="banner error" role="alert">{err}</div>}

        <footer className="modal-footer">
          <button
            type="button"
            className="btn ghost danger-text"
            onClick={() => setClearConfirmOpen(true)}
            disabled={busy || (!saved.repo && !saved.token)}
          >
            清除配置
          </button>
          <div className="spacer" />
          <button
            type="submit"
            className="btn primary"
            disabled={busy}
          >
            {busy ? '保存中…' : '保存'}
          </button>
        </footer>
      </form>

      <ConfirmDialog
        open={clearConfirmOpen}
        title="确认清除"
        danger
        confirmLabel="清除"
        onCancel={() => setClearConfirmOpen(false)}
        onConfirm={doClear}
      >
        <p>确定清除本地 PAT 与仓库设置？此操作不会影响 GitHub 上的文件，也不会删除本机草稿。</p>
      </ConfirmDialog>
    </div>
  )
}
