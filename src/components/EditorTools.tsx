import { BaseStyles } from './BaseStyles'
import { LayoutPreview } from './LayoutPreview'
import { TextToolbar } from './TextToolbar'
import { Undo2, Redo2, Paintbrush, ImagePlus, Link, StickyNote, Tags, Braces, Waypoints,
  Frame, ZoomOut, ZoomIn, Scan, ListPlus, GitBranch, Trash2, Sigma, Flag, Network, Palette, ListTree, Type,
  ArrowUp, ArrowDown, CornerLeftUp, Eraser, UnfoldVertical, FoldVertical, Check, X, ListMinus,
  BoxSelect, Hand, Copy, ClipboardPaste, Scissors, type LucideIcon } from 'lucide-react'
import { NodeField, type NodeFieldKey } from './NodeField'
import { useEffect, useRef, useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'
import { LAYOUTS } from '../mindmap/layouts'
import { THEMES } from '../mindmap/themes'
import { titleFromNode, type MindMapNode } from '../types/map'

type Props = {
  api: MindMapInstance | null
  layout: string
  theme: string
  onChange: () => void
  onLayout: (value: string) => void
  onTheme: (value: string) => void
}

const icons: Record<string, LucideIcon> = {
  父节点: CornerLeftUp, 上移节点: ArrowUp, 下移节点: ArrowDown, 添加概要: Braces,
  删除节点: Trash2, 仅删除当前节点: ListMinus, 清除节点样式: Eraser, 复制节点: Copy,
  剪切节点: Scissors, 粘贴节点: ClipboardPaste, 展开全部: UnfoldVertical, 收起全部: FoldVertical,
  复制: Copy, 剪切: Scissors, 粘贴: ClipboardPaste,
  撤销: Undo2, 重做: Redo2, 格式刷: Paintbrush, 图片: ImagePlus, 超链接: Link, 备注: StickyNote,
  标签: Tags, 概要: Braces, 关联线: Waypoints, 外框: Frame, 缩小: ZoomOut, 放大: ZoomIn, 适应画布: Scan,
  同级节点: ListPlus, 子节点: GitBranch, 删除: Trash2, 公式: Sigma, 图标: Flag,
  结构: Network, 主题: Palette, 基础样式: Paintbrush, 节点样式: Type, 大纲: ListTree,
}
function ToolIcon({ label }: { label: string }) {
  const Icon = icons[label]
  return Icon ? <Icon size={18} strokeWidth={1.65} aria-hidden /> : null
}

const panels = ['节点样式', '基础样式', '主题', '结构', '大纲'] as const
type Panel = typeof panels[number]
const nodeCommands = [
  ['同级节点', 'INSERT_NODE'], ['子节点', 'INSERT_CHILD_NODE'], ['父节点', 'INSERT_PARENT_NODE'],
  ['上移节点', 'UP_NODE'], ['下移节点', 'DOWN_NODE'], ['添加概要', 'ADD_GENERALIZATION'],
  ['删除节点', 'REMOVE_NODE'], ['仅删除当前节点', 'REMOVE_CURRENT_NODE'],
  ['清除节点样式', 'REMOVE_CUSTOM_STYLES'],
]

function Outline({ node, jump }: { node: MindMapNode; jump: (id: string) => void }) {
  return <li>
    <button onClick={() => jump(String(node.data.uid))}>{titleFromNode(node) || '空白节点'}</button>
    {!!node.children?.length && <ul>{node.children.map((child, i) =>
      <Outline key={String(child.data.uid ?? i)} node={child} jump={jump} />)}</ul>}
  </li>
}

export function EditorTools({ api, layout, theme, onChange, onLayout, onTheme }: Props) {
  const [boxSelect, setBoxSelect] = useState(false)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [, setVersion] = useState(0)
  const selected = !!api?.renderer.activeNodeList.length
  const [menu, setMenu] = useState<{ x: number; y: number; node: boolean } | null>(null)
  const [outline, setOutline] = useState<MindMapNode | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState('')
  const [painting, setPainting] = useState(false)
  useEffect(() => {
    if (!api) return
    const start = () => { setPainting(true); setHint('点击目标节点应用格式，按 Esc 结束') }
    const end = () => { setPainting(false); setHint('') }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && api.painter.isInPainter) api.painter.onEndPainter()
    }
    api.on('painter_start', start)
    api.on('painter_end', end)
    window.addEventListener('keydown', escape)
    return () => {
      api.off('painter_start', start)
      api.off('painter_end', end)
      window.removeEventListener('keydown', escape)
    }
  }, [api])


  useEffect(() => {
    if (!api) return
    const active = () => setVersion(v => v + 1)
    const open = (event: unknown, node: boolean) => {
      if (!(event instanceof MouseEvent)) return
      event.preventDefault()
      setMenu({ x: event.clientX, y: event.clientY, node })
    }
    const onNode = (event: unknown) => open(event, true)
    const onCanvas = (event: unknown) => {
      if (!api.select.hasSelectRange()) open(event, false)
    }
    const clipboardNotice = (message: unknown) => setHint(String(message))
    active()
    api.on('clipboard_notice', clipboardNotice)
    api.on('data_change', active)
    api.on('node_active', active)
    api.on('node_contextmenu', onNode)
    api.on('contextmenu', onCanvas)
    return () => {
      api.off('clipboard_notice', clipboardNotice)
      api.off('data_change', active)
      api.off('node_active', active)
      api.off('node_contextmenu', onNode)
      api.off('contextmenu', onCanvas)
    }
  }, [api])

  useEffect(() => {
    if (!api || panel !== '大纲') return
    const refresh = () => setOutline(api.getData() as MindMapNode)
    refresh()
    api.on('data_change', refresh)
    return () => api.off('data_change', refresh)
  }, [api, panel])

  useEffect(() => {
    if (!menu) return
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(null)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [menu])

  useEffect(() => {
    if (!hint) return
    const timeout = window.setTimeout(() => setHint(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [hint])
  const switchMode = (next: boolean) => {
    api?.painter.onEndPainter()
    api?.updateConfig({ useLeftKeySelectionRightKeyDrag: next })
    setBoxSelect(next)
    setHint(next ? '在画布空白处按住左键拖动，框选多个节点' : '在画布空白处按住左键拖动，平移画布')
  }
  const copy = () => {
    api?.renderer.copy()
    setHint('已复制节点。选中目标节点后粘贴。')
  }
  useEffect(() => {
    if (!panel) return
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) setPanel(null)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [panel])
  const [field, setField] = useState<NodeFieldKey | null>(null)
  const node = () => api?.renderer.activeNodeList[0]
  const command = (name: string, ...args: unknown[]) => api?.execCommand(name, ...args)
  const insertImage = async (file?: File) => {
    const target = node()
    if (!file || !target) return
    const reader = new FileReader()
    reader.onload = async () => {
      const img = new Image()
      img.src = String(reader.result)
      try {
        await img.decode()
        if (api?.renderer.activeNodeList.includes(target)) command('SET_NODE_IMAGE', target, {
          url: img.src, title: file.name, width: img.naturalWidth, height: img.naturalHeight,
        })
      } catch { setHint('图片读取失败') }
    }
    reader.onerror = () => setHint('图片读取失败')
    reader.readAsDataURL(file)
  }
  const action = (label: string, fn: () => void, needsNode = true) =>
    <button key={label} className="btn" disabled={!api || (needsNode && !selected)}
      onClick={() => { setMenu(null); setHint(''); fn() }}><ToolIcon label={label} />{label}</button>

  return <>
    <div className="map-tools" role="toolbar" aria-label="导图编辑工具">
      <div className="tool-group mode-group" role="group" aria-label="鼠标模式">
        <button className="btn" aria-pressed={!boxSelect} disabled={!api} onClick={() => switchMode(false)} title="左键拖动画布"><Hand size={18} />拖动</button>
        <button className="btn" aria-pressed={boxSelect} disabled={!api} onClick={() => switchMode(true)} title="左键拖动框选节点"><BoxSelect size={18} />框选</button>
      </div>
      <div className="tool-group" role="group" aria-label="编辑">
      {action('撤销', () => command('BACK'), false)}{action('重做', () => command('FORWARD'), false)}
      {action('复制', copy)}{action('剪切', () => api?.renderer.cut())}{action('粘贴', () => void api?.renderer.paste())}
      </div>
      <div className="tool-group" role="group" aria-label="节点">
      {action('同级节点', () => command('INSERT_NODE'))}{action('子节点', () => command('INSERT_CHILD_NODE'))}
      {action('删除', () => command('REMOVE_NODE'))}
      </div>
      <div className="tool-group" role="group" aria-label="节点内容与样式">
      <button type="button" className="btn painter-tool" disabled={!painting && !selected} aria-pressed={painting}
        title={painting ? '退出格式刷（Esc）' : '复制选中节点的样式'}
        onClick={() => painting ? api?.painter.onEndPainter() : api?.painter.startPainter()}>
        <ToolIcon label="格式刷" />格式刷
      </button>
      {action('图片', () => imageInput.current?.click())}
      <input hidden ref={imageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={e => {
        void insertImage(e.target.files?.[0]); e.target.value = ''
      }} />
      {action('超链接', () => setField('hyperlink'))}{action('备注', () => setField('note'))}{action('标签', () => setField('tag'))}
      {action('图标', () => setField('icon'))}{action('公式', () => setField('formula'))}
      {action('概要', () => command('ADD_GENERALIZATION'))}
      {action('关联线', () => { api?.associativeLine.createLineFromActiveNode(); setHint('点击目标节点连接') })}
      {action('外框', () => command('ADD_OUTER_FRAME'))}
      </div>
    </div>
    <div className="canvas-feedback" role="status">{hint || ((api?.renderer.activeNodeList.length ?? 0) > 1 ? `已选中 ${api?.renderer.activeNodeList.length} 个节点` : '')}</div>
    {api && <TextToolbar api={api} />}
    {field && api && <NodeField field={field} api={api} onClose={() => setField(null)} />}
    <nav className="map-rail" aria-label="编辑面板">{panels.map(p =>
      <button key={p} aria-expanded={panel === p} aria-controls={panel === p ? "editor-drawer" : undefined} aria-pressed={panel === p} onClick={() => setPanel(panel === p ? null : p)}><ToolIcon label={p} />{p}</button>)}</nav>
    {panel && <aside className="map-panel" id="editor-drawer" aria-label={panel}><header><strong>{panel}</strong>
      <button aria-label="关闭面板" onClick={() => setPanel(null)}><X size={16} /></button></header>
      <div className="drawer-body" key={panel}>
      {panel === '结构' && <div className="layout-options">{LAYOUTS.map(l => <button key={l.value} aria-pressed={layout === l.value} onClick={() => onLayout(l.value)}><LayoutPreview id={l.value} />{l.label}</button>)}</div>}
      {panel === '主题' && [false, true].map(dark => <section className="theme-section" key={String(dark)}>
        <h3>{dark ? '深色' : '浅色'}</h3><div className="theme-grid">
          {THEMES.filter(t => !!t.dark === dark).map(t => <button className="theme-card" key={t.value}
            aria-pressed={theme === t.value} onClick={() => onTheme(t.value)}>
            <svg viewBox="0 0 100 44" aria-hidden="true" style={{ background: t.colors.background }}>
              <path d="M32 22 H49 V12 H70 M49 22 V32 H70" fill="none" stroke={t.colors.line} strokeWidth="2" />
              <rect x="13" y="16" width="25" height="12" rx="4" fill={t.colors.root} stroke={t.colors.line} />
              {[7,27].map(y => <rect key={y} x="65" y={y} width="22" height="10" rx="3" fill={t.colors.branch} stroke={t.colors.line} />)}
            </svg>
            <span>{t.label}{theme === t.value && <Check size={13} aria-hidden />}</span>
          </button>)}
        </div></section>)}
      {panel === '大纲' && outline && <ul><Outline node={outline} jump={id => command('GO_TARGET_NODE', id)} /></ul>}
      {panel === '基础样式' && api && <BaseStyles key={theme} api={api} onChange={onChange} />}
      {panel === '节点样式' && (selected ? <>
        {(['color', 'fillColor', 'borderColor'] as const).map((prop, i) => <label key={prop}>{['文字颜色','填充颜色','边框颜色'][i]}
          <input type="color" value={String(node()?.getData(prop) || ['#222222','#ffffff','#777777'][i])}
            onChange={e => command('SET_NODE_STYLE', node(), prop, e.target.value)} /></label>)}
        {action('加粗 / 常规', () => command('SET_NODE_STYLE', node(), 'fontWeight', node()?.getData('fontWeight') === 'bold' ? 'normal' : 'bold'))}
        {action('清除节点样式', () => command('REMOVE_CUSTOM_STYLES'))}
      </> : <p>选择一个节点以编辑样式。</p>)}
      </div>
    </aside>}
    {menu && <div className="map-menu" ref={menuRef} aria-label="画布操作菜单" style={{
      left: Math.max(0, Math.min(menu.x, window.innerWidth - 184)),
      top: Math.max(0, Math.min(menu.y, window.innerHeight - Math.min(menu.node ? 456 : 92, window.innerHeight) - 5)),
    }}>
      {menu.node && <>
        {nodeCommands.slice(0, 3).map(([label, cmd]) => action(label, () => command(cmd)))}
        <hr />
        {nodeCommands.slice(3, 6).map(([label, cmd]) => action(label, () => command(cmd)))}
        <hr />
        {action('复制节点', copy)}{action('剪切节点', () => api?.renderer.cut())}
        {action('粘贴节点', () => void api?.renderer.paste())}
        <hr />
        {nodeCommands.slice(6).map(([label, cmd]) => action(label, () => command(cmd)))}
        <hr />
      </>}
      {action('展开全部', () => command('EXPAND_ALL'), false)}
      {action('收起全部', () => command('UNEXPAND_ALL'), false)}
      {action('适应画布', () => api?.view.fit(), false)}
    </div>}
  </>
}
