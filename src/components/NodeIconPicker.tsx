import { Search, X, Check } from 'lucide-react'
import { useState } from 'react'
import { nodeIconList } from 'simple-mind-map/src/svg/icons.js'
import { emojiGroups } from '../mindmap/nodeEmoji'

type Item = { id: string; label: string; glyph?: string; src?: string }
type Group = { name: string; items: Item[] }

const classic = nodeIconList.map(group => ({
  name: group.name,
  items: group.list.map(item => ({
    id: group.type + '_' + item.name, label: group.name + ' ' + item.name,
    src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(item.icon),
  })),
}))
const pages: Record<string, Group[]> = {
  Emoji: emojiGroups,
  任务指标: classic.filter(g => g.items.some(i => /^(priority|progress)_/.test(i.id))),
  经典图标: classic.filter(g => g.items.every(i => !/^(priority|progress)_/.test(i.id))),
}
const lookup = new Map(Object.values(pages).flatMap(groups => groups.flatMap(group => group.items.map(item => [item.id,item] as const))))

function IconFace({ item }: { item: Item }) {
  return item.src ? <img src={item.src} alt="" /> : <span className="node-emoji" aria-hidden="true">{item.glyph}</span>
}

export function NodeIconPicker({ icons, onChange }: { icons: string[]; onChange: (icons: string[]) => void }) {
  const [query,setQuery] = useState('')
  const normalize = (text: string) => text.normalize('NFKC').replace(/[\uFE0E\uFE0F]/g,'').trim().toLowerCase()
  const term = normalize(query)
  const visibleGroups = term ? Object.entries(pages).flatMap(([category,groups]) =>
    groups.map(group => ({
      ...group, items: group.items.filter(item =>
        normalize([category,group.name,item.label,item.glyph].join(' ')).includes(term)),
    })).filter(group => group.items.length > 0)) : Object.values(pages).flat()

  function toggle(id: string) {
    if (icons.includes(id)) { onChange(icons.filter(v => v !== id)); return }
    const exclusive = id.match(/^(priority_|progress_)/)?.[0]
    onChange([...(exclusive ? icons.filter(v => !v.startsWith(exclusive)) : icons),id])
  }
  return <div className="node-icon-picker">
    <div className="icon-search"><Search size={15} aria-hidden="true" />
      <input type="search" aria-label="搜索全部节点图标" placeholder="搜索名称、类别或 Emoji" value={query}
        onChange={e => setQuery(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229) e.preventDefault()
        }} />
      {query && <button type="button" aria-label="清除搜索" onClick={() => setQuery('')}><X size={14} /></button>}
    </div>
    <div className="icon-page">
    {icons.length > 0 && <div className="chosen-icons"><small>已选 {icons.length}</small>{icons.map(id => {
      const item = lookup.get(id)
      return <button type="button" key={id} title={'移除 ' + (item?.label ?? id)} aria-label={'移除 ' + (item?.label ?? id)}
        onClick={() => toggle(id)}>{item ? <IconFace item={item} /> : id}</button>
    })}</div>}
    {!visibleGroups.length && <p role="status">没有找到匹配的图标，试试「会议」或「进度」。</p>}{visibleGroups.map(group => <fieldset key={group.name}>
      <legend>{group.name}</legend><div className={group.items[0]?.glyph ? "emoji-tiles" : undefined}>{group.items.map(item =>
        <button type="button" key={item.id} title={item.label} aria-label={item.label}
          aria-pressed={icons.includes(item.id)} onClick={() => toggle(item.id)}><IconFace item={item} />
          {item.glyph && <span className="emoji-caption">{item.label}</span>}
          {icons.includes(item.id) && <Check className="icon-tick" size={11} aria-hidden="true" />}
        </button>)}</div>
    </fieldset>)}</div>
  </div>
}
