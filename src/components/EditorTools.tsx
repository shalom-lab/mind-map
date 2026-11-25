import { BaseStyles } from './BaseStyles'
import { LayoutPreview } from './LayoutPreview'
import { TextToolbar } from './TextToolbar'
import { Undo2, Redo2, Paintbrush, ImagePlus, Link, StickyNote, Tags, Braces, Waypoints,
  Frame, ZoomOut, ZoomIn, Scan, ListPlus, GitBranch, Trash2, Sigma, Flag, Network, Palette, ListTree, Type,
  type LucideIcon } from 'lucide-react'
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
  const [panel, setPanel] = useState<Panel | null>(null)
  const [, setVersion] = useState(0)
  const selected = !!api?.renderer.activeNodeList.length
  const [menu, setMenu] = useState<{ x: number; y: number; node: boolean } | null>(null)
  const [outline, setOutline] = useState<MindMapNode | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!api) return
    const active = () => setVersion(v => v + 1)
    const open = (event: unknown, node: boolean) => {
      if (!(event instanceof MouseEvent)) return
      event.preventDefault()
      setMenu({ x: event.clientX, y: event.clientY, node })
    }
    const onNode = (event: unknown) => open(event, true)
    const onCanvas = (event: unknown) => open(event, false)
    active()
    api.on('data_change', active)
    api.on('node_active', active)
    api.on('node_contextmenu', onNode)
    api.on('contextmenu', onCanvas)
    return () => {
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
    <div className="map-tools" aria-label="节点工具">
      {action('撤销', () => command('BACK'), false)}{action('重做', () => command('FORWARD'), false)}
      {action('同级节点', () => command('INSERT_NODE'))}{action('子节点', () => command('INSERT_CHILD_NODE'))}
      {action('删除', () => command('REMOVE_NODE'))}
      {action('格式刷', () => { api?.painter.startPainter(); setHint('点击目标节点应用格式，点击画布结束') })}
      {action('图片', () => imageInput.current?.click())}
      <input hidden ref={imageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={e => {
        void insertImage(e.target.files?.[0]); e.target.value = ''
      }} />
      {action('超链接', () => setField('hyperlink'))}{action('备注', () => setField('note'))}{action('标签', () => setField('tag'))}
      {action('图标', () => setField('icon'))}{action('公式', () => setField('formula'))}
      {action('概要', () => command('ADD_GENERALIZATION'))}
      {action('关联线', () => { api?.associativeLine.createLineFromActiveNode(); setHint('点击目标节点连接') })}
      {action('外框', () => command('ADD_OUTER_FRAME'))}
      <span role="status">{hint}</span>
    </div>
    {api && <TextToolbar api={api} />}
    {field && api && <NodeField field={field} api={api} onClose={() => setField(null)} />}
    <nav className="map-rail" aria-label="编辑面板">{panels.map(p =>
      <button key={p} aria-pressed={panel === p} onClick={() => setPanel(panel === p ? null : p)}><ToolIcon label={p} />{p}</button>)}</nav>
    {panel && <aside className="map-panel"><header><strong>{panel}</strong>
      <button aria-label="关闭面板" onClick={() => setPanel(null)}>×</button></header>
      {panel === '结构' && <div className="layout-options">{LAYOUTS.map(l => <button key={l.value} aria-pressed={layout === l.value} onClick={() => onLayout(l.value)}><LayoutPreview id={l.value} />{l.label}</button>)}</div>}
      {panel === '主题' && THEMES.map(t => <button key={t.value} aria-pressed={theme === t.value} onClick={() => onTheme(t.value)}>{t.label}</button>)}
      {panel === '大纲' && outline && <ul><Outline node={outline} jump={id => command('GO_TARGET_NODE', id)} /></ul>}
      {panel === '基础样式' && api && <BaseStyles key={theme} api={api} onChange={onChange} />}
      {panel === '节点样式' && (selected ? <>
        {(['color', 'fillColor', 'borderColor'] as const).map((prop, i) => <label key={prop}>{['文字颜色','填充颜色','边框颜色'][i]}
          <input type="color" value={String(node()?.getData(prop) || ['#222222','#ffffff','#777777'][i])}
            onChange={e => command('SET_NODE_STYLE', node(), prop, e.target.value)} /></label>)}
        {action('加粗 / 常规', () => command('SET_NODE_STYLE', node(), 'fontWeight', node()?.getData('fontWeight') === 'bold' ? 'normal' : 'bold'))}
        {action('清除节点样式', () => command('REMOVE_CUSTOM_STYLES'))}
      </> : <p>选择一个节点以编辑样式。</p>)}
    </aside>}
    {menu && <div className="map-menu" ref={menuRef} aria-label="画布操作菜单" style={{
      left: Math.max(0, Math.min(menu.x, window.innerWidth - 198)),
      top: Math.max(0, Math.min(menu.y, window.innerHeight - Math.min(470, window.innerHeight))),
    }}>
      {menu.node && <>
        {nodeCommands.map(([label, cmd]) => action(label, () => command(cmd)))}
        {action('复制节点', () => api?.renderer.copy())}{action('剪切节点', () => api?.renderer.cut())}
        {action('粘贴节点', () => void api?.renderer.paste())}
      </>}
      {action('展开全部', () => command('EXPAND_ALL'), false)}
      {action('收起全部', () => command('UNEXPAND_ALL'), false)}
      {action('适应画布', () => api?.view.fit(), false)}
    </div>}
  </>
}
