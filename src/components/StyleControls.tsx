import { ChevronDown } from 'lucide-react'
import { useMemo } from 'react'

export function ColorField({ label, value, onChange }: {
  label: string; value: string; onChange: (value: string) => void
}) {
  const hex = useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return '#000000'
    ctx.fillStyle = value
    const color = ctx.fillStyle
    if (color.startsWith('#')) return color.slice(0,7)
    const channels = color.match(/[\d.]+/g)?.slice(0,3) ?? []
    return channels.length === 3 ? '#' + channels.map(n => Math.round(Number(n)).toString(16).padStart(2,'0')).join('') : '#000000'
  }, [value])
  const caption = value === 'transparent' || value === 'none' ? '透明' : value.startsWith('rgba') ? value : hex.toUpperCase()
  return <label className="property-row"><span>{label}</span>
    <span className="color-control" title={value}>
      <i aria-hidden style={{ backgroundColor: value === 'none' ? 'transparent' : value }} />
      <span>{caption}</span><ChevronDown size={12} aria-hidden />
      <input type="color" aria-label={label} value={hex} onChange={e => onChange(e.target.value)} />
    </span>
  </label>
}

export function RangeField({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (value: number) => void
}) {
  return <label className="range-control"><span>{label}</span><output>{value} px</output>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} />
  </label>
}
