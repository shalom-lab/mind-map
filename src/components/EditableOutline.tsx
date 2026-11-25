import { useEffect, useMemo, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import Quill from 'quill'
import type { MindMapInstance } from 'simple-mind-map'
import type { MindMapNode } from '../types/map'

type Props = { api: MindMapInstance; node: MindMapNode }

function InlineEditor({ initial, rich, finish }: {
  initial: string; rich: boolean; finish: (value?: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const plain = useRef<HTMLTextAreaElement>(null)
  const editor = useRef<Quill | null>(null)
  const done = useRef(false)
  const original = useRef('')
  useEffect(() => {
    if (!rich) { plain.current?.focus(); plain.current?.select(); return }
    const container = host.current!
    const quill = new Quill(container, { modules: { toolbar: false } })
    editor.current = quill
    quill.clipboard.dangerouslyPasteHTML(initial, 'silent')
    original.current = quill.root.innerHTML
    quill.root.setAttribute('aria-label', '节点文字')
    quill.setSelection(0, Math.max(0, quill.getLength() - 1), 'silent')
    quill.focus()
    return () => { editor.current = null; container.replaceChildren() }
  }, [initial, rich])
  function close(cancel = false) {
    if (done.current) return
    done.current = true
    const value = rich ? editor.current?.root.innerHTML : plain.current?.value
    finish(cancel || value === (rich ? original.current : initial) ? undefined : value)
  }
  return <div className="outline-edit" onBlur={e => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close()
  }} onKeyDownCapture={e => {
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return
    if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault(); e.stopPropagation(); close(e.key === 'Escape')
    }
  }} onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()}>
    {rich ? <div ref={host} /> : <textarea ref={plain} aria-label="节点文字" rows={2} defaultValue={initial} />}
  </div>
}

export function EditableOutline({ api, node }: Props) {
  const [editing, setEditing] = useState<{ initial: string; rich: boolean } | null>(null)
  const { text, richText, uid } = node.data
  const label = useMemo(() => {
    if (!richText) return text
    const template = document.createElement('template')
    template.innerHTML = text
    return template.content.textContent || ''
  }, [text, richText])
  function begin() { setEditing({ initial: text, rich: !!richText }) }
  function finish(value?: string) {
    if (editing && value !== undefined) {
      const rich = editing.rich
      api.execCommand('GO_TARGET_NODE', uid, (target: unknown) => {
        api.execCommand('SET_NODE_TEXT', target, value, rich)
      })
    }
    setEditing(null)
  }
  return <li>
    {editing ? <InlineEditor {...editing} finish={finish} /> : <div className="outline-row">
      <button className="outline-title" title={label} onClick={() => api.execCommand('GO_TARGET_NODE', uid)}
        onDoubleClick={begin}>{label || '空白节点'}</button>
      <button className="outline-pencil" aria-label={'编辑节点文字：' + label} title="编辑节点文字" onClick={begin}><Pencil size={13} /></button>
    </div>}
    {!!node.children?.length && <ul>{node.children.map((child,i) =>
      <EditableOutline key={String(child.data.uid ?? i)} api={api} node={child} />)}</ul>}
  </li>
}
