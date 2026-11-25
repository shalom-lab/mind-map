import { useEffect, useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'
import { Shrink, Expand, Minus, Plus, Presentation, Map as MapIcon, Search, Scan } from 'lucide-react'

function Miniature({ api }: { api: MindMapInstance }) {
  const [preview, setPreview] = useState<{ url: string; box: Record<string,string> } | null>(null)
  useEffect(() => {
    let frame = 0
    const render = () => {
      const result = api.miniMap.calculationMiniMap(200,120)
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(result.svgHTML)
      setPreview({ url, box: result.viewBoxStyle })
    }
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render) }
    update()
    const events = ['node_tree_render_end','view_data_change','resize']
    events.forEach(event => api.on(event,update))
    return () => { cancelAnimationFrame(frame); events.forEach(event => api.off(event,update)); api.miniMap.onMouseup() }
  },[api])
  return <div className="map-mini" aria-label="小地图" onPointerDown={e => {
    e.currentTarget.setPointerCapture(e.pointerId)
    if ((e.target as HTMLElement).classList.contains('mini-view')) api.miniMap.onViewBoxMousedown(e.nativeEvent)
    else api.miniMap.onMousedown(e.nativeEvent)
  }} onPointerMove={e => { api.miniMap.onMousemove(e.nativeEvent); api.miniMap.onViewBoxMousemove(e.nativeEvent) }}
    onLostPointerCapture={() => api.miniMap.onMouseup()}>
    {preview && <><img src={preview.url} draggable={false} alt="" /><div className="mini-view" style={preview.box} /></>}
  </div>
}

export function CanvasNavigation({ api }: { api: MindMapInstance }) {
  const [scale, setScale] = useState(api.view.scale)
  const [mini,setMini] = useState(false)
  const [find,setFind] = useState(false)
  const [query,setQuery] = useState('')
  const [replacement,setReplacement] = useState('')
  const [info,setInfo] = useState({currentIndex:-1,total:0})
  const [searched,setSearched] = useState('')
  const [full,setFull] = useState(false)
  const [error,setError] = useState('')
  useEffect(() => {
    const zoom = (v: unknown) => setScale(Number(v))
    const results = (data: unknown) => setInfo(data as typeof info)
    const fullscreen = () => setFull(!!document.fullscreenElement)
    api.on('scale',zoom); api.on('search_info_change',results)
    document.addEventListener('fullscreenchange',fullscreen)
    return () => { api.off('scale',zoom); api.off('search_info_change',results); document.removeEventListener('fullscreenchange',fullscreen) }
  },[api])
  const toggleFind = () => { setFind(!find); api.search.endSearch(); setSearched('') }
  return <footer className="editor-footer canvas-navigation">
    {mini && <Miniature api={api} />}
    {find && <form className="canvas-search" onKeyDown={e => { e.stopPropagation(); if(e.key === 'Escape') toggleFind() }}
      onSubmit={e => { e.preventDefault(); if(query) { api.search.search(query); setSearched(query) } }}>
      <label>查找<input autoFocus value={query} onChange={e => { setQuery(e.target.value); setSearched(''); api.search.endSearch() }} /></label>
      <button className="btn" disabled={!query}>查找下一个</button>
      <output>{searched && (info.total ? `${info.currentIndex+1} / ${info.total}` : '没有匹配节点')}</output>
      <label>替换为<input value={replacement} onChange={e => setReplacement(e.target.value)} /></label>
      <button type="button" className="btn" disabled={!searched || !info.total} onClick={() => api.search.replace(replacement,true)}>替换</button>
      <button type="button" className="btn" disabled={!searched || !info.total} onClick={() => api.search.replaceAll(replacement)}>全部替换</button>
    </form>}
    <button onClick={() => api.view.narrow()} aria-label="缩小"><Minus /></button><output>{Math.round(scale*100)}%</output>
    <button onClick={() => api.view.enlarge()} aria-label="放大"><Plus /></button>
    <button onClick={() => api.view.fit()}><Scan />适应画布</button>
    <button aria-pressed={mini} onClick={() => setMini(!mini)}><MapIcon />小地图</button>
    <button aria-pressed={find} onClick={toggleFind}><Search />查找替换</button>
    <button onClick={() => { const task = full ? document.exitFullscreen() : document.querySelector('.editor')!.requestFullscreen()
      void task.catch(() => setError('浏览器未允许全屏')) }}>{full ? <Shrink /> : <Expand />}{full ? '退出全屏' : '全屏'}</button>
    <button onClick={() => api.demonstrate.enter()}><Presentation />演示</button>
    {error && <span role="status">{error}</span>}
  </footer>
}
