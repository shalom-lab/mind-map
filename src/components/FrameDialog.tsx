import { ColorField, RangeField } from './StyleControls'
import { useEffect, useRef, useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'

export function FrameDialog({ api, onClose }: { api: MindMapInstance; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [active] = useState(() => api.outerFrame.getActiveOuterFrame())
  const [nodes] = useState(() => [...api.renderer.activeNodeList])
  const [initial] = useState(() => active ? active.node.children[active.range[0]]?.getData('outerFrame') ?? {} : {})
  const [color, setColor] = useState(String(initial.strokeColor ?? '#0984e3'))
  const [dash, setDash] = useState(String(initial.strokeDasharray ?? '5,5'))
  const [width, setWidth] = useState(Number(initial.strokeWidth ?? 2))
  const [radius, setRadius] = useState(Number(initial.radius ?? 5))
  const [fill, setFill] = useState(String(initial.fill ?? 'rgba(9,132,227,0.05)'))
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className="modal import-dialog frame-dialog" aria-labelledby="frame-heading" onCancel={onClose} onKeyDown={e => e.stopPropagation()}>
    <form onSubmit={e => {
      e.preventDefault()
      const style = { strokeColor: color, strokeWidth: width, strokeDasharray: dash, radius, fill }
      if (active) api.outerFrame.updateActiveOuterFrame(style)
      else api.execCommand('ADD_OUTER_FRAME', nodes, style)
      onClose()
    }}>
      <header className="modal-header"><h2 id="frame-heading">外框样式</h2></header>
      <svg className="frame-preview" viewBox="0 0 260 72" aria-label="外框预览"><rect x="10" y="7" width="240" height="58"
        rx={radius} stroke={color} strokeWidth={width} strokeDasharray={dash} fill={fill} /></svg>
      <div className="property-section"><ColorField label="边框颜色" value={color} onChange={setColor} />
      <label className="property-row">线型<select value={dash} onChange={e => setDash(e.target.value)}>
        <option value="none">实线</option><option value="5,5">虚线</option><option value="2,3">点线</option></select></label>
      <RangeField label="线宽" value={width} min={1} max={10} onChange={setWidth} />
      <RangeField label="圆角" value={radius} min={0} max={24} onChange={setRadius} />
      <label className="property-row">填充<select value={fill} onChange={e => setFill(e.target.value)}>
        <option value="none">透明</option><option value="#60a5fa22">淡蓝</option><option value="#34d39922">薄荷</option><option value="#fbbf2422">琥珀</option>
        {!['none','#60a5fa22','#34d39922','#fbbf2422'].includes(fill) && <option value={fill}>当前填充</option>}</select></label>
      </div>
      <footer className="modal-footer"><button className="btn" type="button" onClick={onClose}>取消</button>
        <button className="btn primary">{active ? '应用样式' : '添加外框'}</button></footer>
    </form>
  </dialog>
}
