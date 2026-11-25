import { emojiIconList } from './nodeEmoji'
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js'
import Search from 'simple-mind-map/src/plugins/Search.js'
import Demonstrate from 'simple-mind-map/src/plugins/Demonstrate.js'
import MindMap, { type MindMapInstance } from 'simple-mind-map'
import Themes from 'simple-mind-map-plugin-themes'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'
import ExportXMind from 'simple-mind-map/src/plugins/ExportXMind.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import TouchEvent from 'simple-mind-map/src/plugins/TouchEvent.js'
import type { MindMapFullData } from '../types/map'

import Painter from 'simple-mind-map/src/plugins/Painter.js'
import AssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine.js'
import OuterFrame from 'simple-mind-map/src/plugins/OuterFrame.js'

import RichText from 'simple-mind-map/src/plugins/RichText.js'
import Formula from 'simple-mind-map/src/plugins/Formula.js'

class LiteralSearch extends Search {
  getReplacedText(node: unknown, search: string, replacement: string): string {
    const escaped = search.split('').map(char => /[\w\s]/u.test(char) ? char : '\\u' + char.charCodeAt(0).toString(16).padStart(4,'0')).join('')
    return super.getReplacedText(node, escaped, replacement.replaceAll('$', () => '$$'))
  }
}

let pluginsReady = false

export function ensurePlugins(): void {
  if (pluginsReady) return
  Themes.init(MindMap)
  const register = MindMap.usePlugin.bind(MindMap)
  register(RichText)
  register(Formula)
  register(MiniMap)
  register(LiteralSearch)
  register(Demonstrate)
  register(Painter)
  register(AssociativeLine)
  register(OuterFrame)
  register(Drag)
  register(Select)
  register(Export)
  register(ExportPDF)
  register(ExportXMind)
  register(TouchEvent)
  register(KeyboardNavigation)
  pluginsReady = true
}

export type CreateMindMapInput = {
  el: HTMLElement
  data: MindMapFullData
}

export function createMindMap({ el, data }: CreateMindMapInput): MindMapInstance {
  ensurePlugins()
  const api: MindMapInstance = new MindMap({
    el,
    data: data.root,
    layout: data.layout || 'mindMap',
    theme: data.theme?.template || 'default',
    themeConfig: data.theme?.config || {},
    viewData: data.view || undefined,
    readonly: false,
    iconList: emojiIconList,
    errorHandler(code: string, error: unknown) {
      if (code === 'read_clipboard_error') {
        if (api.renderer.beingCopyData?.length) {
          api.execCommand('PASTE_NODE', api.renderer.beingCopyData)
        } else {
          api.emit('clipboard_notice', '无法读取剪贴板。请允许浏览器读取，或先在导图中复制节点。')
        }
      } else console.error(code, error)
    },
  })
  return api
}

export const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG 图片' },
  { value: 'jpg', label: 'JPG 图片' },
  { value: 'svg', label: 'SVG 矢量图' },
  { value: 'pdf', label: 'PDF' },
  { value: 'json', label: 'JSON' },
  { value: 'smm', label: 'SMM' },
  { value: 'txt', label: '纯文本大纲（TXT）' },
  { value: 'md', label: 'Markdown' },
  { value: 'xmind', label: 'XMind' },
] as const

export type ExportFormat = (typeof EXPORT_FORMATS)[number]['value']
