import { useEffect, useRef, useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'

const fields = { note: '备注', tag: '标签', hyperlink: '超链接', formula: '公式', icon: '优先级图标' }
export type NodeFieldKey = keyof typeof fields
type Props = { api: MindMapInstance; field: NodeFieldKey; onClose: () => void }

export function NodeField({ api, field, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [target] = useState(() => api.renderer.activeNodeList[0])
  const [value, setValue] = useState<string>(() => {
    const raw = target?.getData(field)
    if (field === 'icon') return Array.isArray(raw) ? raw.find(v => String(v).startsWith('priority_')) ?? '' : ''
    return Array.isArray(raw) ? raw.join('，') : String(raw ?? '')
  })
  const [error, setError] = useState('')
  useEffect(() => { ref.current?.showModal() }, [])
  const save = () => {
    const text = value.trim()
    if (field === 'hyperlink' && text) {
      try {
        if (!['http:', 'https:'].includes(new URL(text).protocol)) throw Error()
      } catch { setError('请输入完整的 http 或 https 地址。'); return }
    }
    const cmd = (name: string, ...args: unknown[]) => api.execCommand(name, ...args)
    if (field === 'tag') cmd('SET_NODE_TAG', target, text.split(/[,，]/).map(s => s.trim()).filter(Boolean))
    if (field === 'note') cmd('SET_NODE_NOTE', target, text)
    if (field === 'hyperlink') cmd('SET_NODE_HYPERLINK', target, text)
    if (field === 'formula') cmd('INSERT_FORMULA', text, [target])
    if (field === 'icon') {
      const icons = target?.getData('icon')
      const rest = Array.isArray(icons) ? icons.filter(v => !String(v).startsWith('priority_')) : []
      cmd('SET_NODE_ICON', target, text ? [...rest, text] : rest)
    }
    onClose()
  }
  return <dialog ref={ref} className="modal import-dialog" onCancel={onClose} onKeyDown={e => e.stopPropagation()}>
    <form onSubmit={e => { e.preventDefault(); save() }}>
      <header className="modal-header"><h2>{fields[field]}</h2></header>
      <label className="field"><span>{{note:'备注内容', tag:'多个标签用逗号分隔', hyperlink:'链接地址', formula:'LaTeX 表达式', icon:'优先级'}[field]}</span>
        {field === 'icon' ? <select autoFocus value={value} onChange={e => setValue(e.target.value)}>
          <option value="">无</option>{[1,2,3,4,5].map(n => <option key={n} value={'priority_' + n}>{n}</option>)}</select>
        : <textarea rows={field === 'note' ? 6 : 2} autoFocus value={value} onChange={e => setValue(e.target.value)} />}
      </label>
      {error && <p role="alert">{error}</p>}
      <footer className="modal-footer"><button type="button" className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={field === 'formula' && !value.trim()}>确定</button></footer>
    </form>
  </dialog>
}
