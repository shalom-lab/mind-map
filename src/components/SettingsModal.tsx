import { useEffect, useState } from 'react'
import { testConnection } from '../github/client'
import {
  clearSettings,
  isValidSettings,
  KEY_REPO,
  KEY_TOKEN,
  saveSettings,
} from '../github/storage'
import {
  DEFAULT_REPO_HINT,
  DEFAULT_SETTINGS,
  friendlyGithubError,
  maskToken,
  parseRepo,
  type GithubSettings,
} from '../github/types'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  open: boolean
  initial: GithubSettings
  onClose: () => void
  onSaved: (settings: GithubSettings) => void
}

export function SettingsModal({ open, initial, onClose, onSaved }: Props) {
  const [tokenInput, setTokenInput] = useState('')
  const [repoInput, setRepoInput] = useState('')
  const [saved, setSaved] = useState<GithubSettings>(initial)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setSaved(initial)
      setRepoInput(initial.repo)
      // Never prefill full secret into the password field
      setTokenInput('')
      setMsg(null)
      setErr(null)
      setBusy(false)
      setClearConfirmOpen(false)
    }
  }, [open, initial])

  if (!open) return null

  const tokenStatus = saved.token.trim()
    ? `已保存 ${maskToken(saved.token)}`
    : '未设置'
  const repoStatus = saved.repo.trim() ? `已保存 ${saved.repo}` : '未设置'

  const handleSave = async () => {
    const next: GithubSettings = {
      token: tokenInput.trim() || saved.token,
      repo: repoInput.trim(),
    }
    if (!next.token.trim()) {
      setErr('请填写 GitHub PAT（不会把空值写入 localStorage）')
      setMsg(null)
      return
    }
    if (!parseRepo(next.repo)) {
      setErr('仓库请填写有效的 owner/repo 格式（不会把无效值写入 localStorage）')
      setMsg(null)
      return
    }
    if (!isValidSettings(next)) {
      setErr('设置未通过校验，已保留原有 localStorage，未覆盖写入')
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>GitHub 设置</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </header>

        <p className="hint">
          PAT 与数据仓库仅保存在本机 <code>localStorage</code>（
          <code>{KEY_TOKEN}</code> / <code>{KEY_REPO}</code>
          ），不会写入任何代码或提交。需要权限：
          <strong>Contents: Read and write</strong>（经典 token 勾选 <code>repo</code>
          ）。可 Settings 填写，也可事先写入 localStorage；启动会自动读。
        </p>
        <p className="hint muted">
          数据仓建议使用 <code>{DEFAULT_REPO_HINT}</code>
          ，导图文件写在 <code>maps/*.json</code>。主仓只部署网页。
        </p>

        <label className="field">
          <span>
            数据仓库 <span className="status-pill">{repoStatus}</span>
          </span>
          <input
            placeholder="owner/repo，例如 shalom-lab/mind-map-data"
            spellCheck={false}
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value.trim())}
          />
        </label>

        <label className="field">
          <span>
            GitHub PAT <span className="status-pill">{tokenStatus}</span>
          </span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              saved.token
                ? `已保存 ${maskToken(saved.token)} — 留空保持不变，或粘贴新 PAT`
                : 'ghp_… 或 github_pat_…'
            }
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
        </label>

        {msg && <div className="banner success">{msg}</div>}
        {err && <div className="banner error">{err}</div>}

        <footer className="modal-footer">
          <button
            type="button"
            className="btn danger"
            onClick={() => setClearConfirmOpen(true)}
            disabled={busy}
          >
            清除
          </button>
          <div className="spacer" />
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            关闭
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => void handleSave()}
            disabled={busy}
          >
            {busy ? '保存中…' : '保存'}
          </button>
        </footer>
      </div>

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
