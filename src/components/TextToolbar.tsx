import { useEffect, useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'
import { Bold, Italic, Underline, Strikethrough, Eraser } from 'lucide-react'

export function TextToolbar({ api }: { api: MindMapInstance }) {
  const [selection, setSelection] = useState<{ x: number; y: number; format: Record<string, unknown> } | null>(null)
  useEffect(() => {
    const update = (active: unknown, bounds: unknown, format: unknown) => {
      const rect = bounds as DOMRect | null
      if (!active || !rect) { setSelection(null); return }
      setSelection({ x: rect.left, y: rect.top, format: (format || {}) as Record<string, unknown> })
    }
    const hide = () => setSelection(null)
    api.on('rich_text_selection_change', update)
    api.on('hide_text_edit', hide)
    return () => { api.off('rich_text_selection_change', update); api.off('hide_text_edit', hide) }
  }, [api])
  if (!selection) return null
  const tools = [
    { key: 'bold', title: '加粗', Icon: Bold }, { key: 'italic', title: '斜体', Icon: Italic },
    { key: 'underline', title: '下划线', Icon: Underline }, { key: 'strike', title: '删除线', Icon: Strikethrough },
  ]
  return <div className="text-toolbar" role="toolbar" aria-label="文字格式" onMouseDown={e => e.preventDefault()}
    style={{ left: Math.max(4, Math.min(window.innerWidth-190, selection.x)), top: Math.max(4,selection.y-45) }}>
    {tools.map(({ key,title,Icon }) => <button key={key} title={title} aria-label={title}
      aria-pressed={!!selection.format[key]} onClick={() => {
        const value = !selection.format[key]
        api.richText.formatText({ [key]: value })
        setSelection({ ...selection, format: { ...selection.format, [key]: value } })
      }}><Icon size={16} /></button>)}
    <button title="清除文字格式" aria-label="清除文字格式" onClick={() => api.richText.removeFormat()}><Eraser size={16} /></button>
  </div>
}
