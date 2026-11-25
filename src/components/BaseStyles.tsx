import { ColorField, RangeField } from './StyleControls'
import { useState } from 'react'
import type { MindMapInstance } from 'simple-mind-map'

export function BaseStyles({ api, onChange }: { api: MindMapInstance; onChange: () => void }) {
  const [values,setValues] = useState(() => ({ ...api.getThemeConfig() }))
  function change(key: string, value: string | number) {
    api.setThemeConfig({ ...api.getCustomThemeConfig(), [key]: value })
    setValues({ ...values, [key]: value })
    onChange()
  }
  const range = (key: string, label: string, min: number, max: number) =>
    <RangeField label={label} value={Number(values[key] ?? min)} min={min} max={max} onChange={v => change(key,v)} />
  return <div className="style-inspector">
    <section className="property-section"><h3>画布与连线</h3>
    <ColorField label="画布背景" value={String(values.backgroundColor ?? '#ffffff')} onChange={v => change('backgroundColor',v)} />
    <ColorField label="连线颜色" value={String(values.lineColor ?? '#549688')} onChange={v => change('lineColor',v)} />
    <label className="property-row">连线风格<select value={String(values.lineStyle)} onChange={e => change('lineStyle',e.target.value)}>
      <option value="straight">折线</option><option value="curve">曲线</option><option value="direct">直连</option>
    </select></label>
    {range('lineWidth','连线宽度',1,12)}{range('lineRadius','连线圆角',0,32)}
    </section><section className="property-section"><h3>节点尺寸</h3>
    {range('paddingX','节点水平内边距',0,48)}{range('paddingY','节点垂直内边距',0,32)}
    {range('iconSize','图标大小',8,48)}{range('imgMaxWidth','图片最大宽度',40,800)}
    </section>
  </div>
}
