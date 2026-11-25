import { useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'

export function BaseStyles({ api, onChange }: { api: MindMapInstance; onChange: () => void }) {
  const [values,setValues] = useState(() => ({ ...api.getThemeConfig() }))
  function change(key: string, value: string | number) {
    api.setThemeConfig({ ...api.getCustomThemeConfig(), [key]: value })
    setValues({ ...values, [key]: value })
    onChange()
  }
  const color = (key: string, label: string) => <label>{label}<input type="color"
    value={String(values[key] ?? '#ffffff')} onChange={e => change(key,e.target.value)} /></label>
  const range = (key: string, label: string, min: number, max: number) => <label className="style-slider">
    <span>{label}</span><output>{Number(values[key] ?? min)} px</output>
    <input type="range" min={min} max={max} value={Number(values[key] ?? min)}
      onChange={e => change(key,Number(e.target.value))} /></label>
  return <div className="base-styles">
    {color('backgroundColor','画布背景')}{color('lineColor','连线颜色')}
    <label>连线风格<select value={String(values.lineStyle)} onChange={e => change('lineStyle',e.target.value)}>
      <option value="straight">折线</option><option value="curve">曲线</option><option value="direct">直连</option>
    </select></label>
    {range('lineWidth','连线宽度',1,12)}{range('lineRadius','连线圆角',0,32)}
    {range('paddingX','节点水平内边距',0,48)}{range('paddingY','节点垂直内边距',0,32)}
    {range('iconSize','图标大小',8,48)}{range('imgMaxWidth','图片最大宽度',40,800)}
  </div>
}
