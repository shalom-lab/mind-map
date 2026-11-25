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
  const [page,setPage] = useState('Emoji')
  function toggle(id: string) {
    if (icons.includes(id)) { onChange(icons.filter(v => v !== id)); return }
    const exclusive = id.match(/^(priority_|progress_)/)?.[0]
    onChange([...(exclusive ? icons.filter(v => !v.startsWith(exclusive)) : icons),id])
  }
  return <div className="node-icon-picker">
    <nav className="icon-categories" aria-label="图标类别">{Object.keys(pages).map(key =>
      <button key={key} type="button" aria-pressed={page === key} onClick={() => setPage(key)}>{key}</button>)}</nav>
    {icons.length > 0 && <div className="chosen-icons"><small>已选</small>{icons.map(id => {
      const item = lookup.get(id)
      return <button type="button" key={id} title={'移除 ' + (item?.label ?? id)} aria-label={'移除 ' + (item?.label ?? id)}
        onClick={() => toggle(id)}>{item ? <IconFace item={item} /> : id}</button>
    })}</div>}
    <div className="icon-page">{pages[page].map(group => <fieldset key={group.name}>
      <legend>{group.name}</legend><div>{group.items.map(item =>
        <button type="button" key={item.id} title={item.label} aria-label={item.label}
          aria-pressed={icons.includes(item.id)} onClick={() => toggle(item.id)}><IconFace item={item} /></button>)}</div>
    </fieldset>)}</div>
  </div>
}
