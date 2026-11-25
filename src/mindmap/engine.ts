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

let pluginsReady = false

export function ensurePlugins(): void {
  if (pluginsReady) return
  Themes.init(MindMap)
  const register = MindMap.usePlugin.bind(MindMap)
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
  return new MindMap({
    el,
    data: data.root,
    layout: data.layout || 'mindMap',
    theme: data.theme?.template || 'default',
    themeConfig: data.theme?.config || {},
    viewData: data.view || undefined,
    readonly: false,
  })
}

export const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG 图片' },
  { value: 'jpg', label: 'JPG 图片' },
  { value: 'svg', label: 'SVG 矢量图' },
  { value: 'pdf', label: 'PDF' },
  { value: 'json', label: 'JSON' },
  { value: 'smm', label: 'SMM（完整数据）' },
  { value: 'md', label: 'Markdown' },
  { value: 'xmind', label: 'XMind' },
] as const

export type ExportFormat = (typeof EXPORT_FORMATS)[number]['value']
