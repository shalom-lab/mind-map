declare module 'simple-mind-map' {
  export type MindMapOptions = Record<string, unknown>

  export interface MindMapInstance {
    updateConfig(options: Record<string, unknown>): void
    emit(event: string, ...args: unknown[]): void
    select: { hasSelectRange(): boolean }
    renderer: {
      beingCopyData: unknown[] | null
      activeNodeList: { isRoot: boolean; isGeneralization: boolean; getStyle(key: string): unknown; getData: (key: string) => unknown }[]
      copy: () => void
      cut: () => void
      paste: () => Promise<void>
    }
    demonstrate: { enter(): void }
    miniMap: {
      calculationMiniMap(width: number,height: number): { svgHTML: string; viewBoxStyle: Record<string,string> }
      onMousedown(event: PointerEvent): void
      onMousemove(event: PointerEvent): void
      onViewBoxMousedown(event: PointerEvent): void
      onViewBoxMousemove(event: PointerEvent): void
      onMouseup(): void
    }
    search: { search(text: string): void; replace(text: string, next: boolean): void; replaceAll(text: string): void; endSearch(): void }
    richText: { formatText: (style: Record<string, unknown>) => void; removeFormat: () => void }
    painter: { startPainter(): void; onEndPainter(): void; isInPainter: boolean }
    outerFrame: {
      getActiveOuterFrame(): { node: { children: { getData(key: string): Record<string, unknown> }[] }; range: number[] } | null
      updateActiveOuterFrame(style: Record<string, unknown>): void
    }
    associativeLine: { createLineFromActiveNode: () => void }
    resize: () => void
    destroy: () => void
    getData: (withConfig?: boolean) => unknown
    setData: (data: unknown) => void
    setFullData: (data: unknown) => void
    setLayout: (layout: string, notRender?: boolean) => void
    getLayout: () => string
    setTheme: (theme: string, notRender?: boolean) => void
    getTheme: () => string
    getThemeConfig(): Record<string, unknown>
    getCustomThemeConfig(): Record<string, unknown>
    setThemeConfig: (config: unknown, notRender?: boolean) => void
    execCommand: (name: string, ...args: unknown[]) => void
    export: (
      type: string,
      isDownload?: boolean,
      fileName?: string,
      ...rest: unknown[]
    ) => Promise<unknown>
    on: (event: string, fn: (...args: unknown[]) => void) => void
    off: (event: string, fn: (...args: unknown[]) => void) => void
    view: {
      getTransformData: () => unknown
      setTransformData: (data: unknown) => void
      scale: number
      narrow: () => void
      enlarge: () => void
      fit: () => void
    }
  }

  interface MindMapConstructor {
    new (opt: MindMapOptions): MindMapInstance
    usePlugin: (plugin: unknown, opt?: unknown) => MindMapConstructor
    defineTheme: (name: string, config: unknown) => void
  }

  const MindMap: MindMapConstructor
  export default MindMap
}

declare module 'simple-mind-map/src/plugins/Painter.js'
declare module 'simple-mind-map/src/plugins/AssociativeLine.js'
declare module 'simple-mind-map/src/plugins/OuterFrame.js'

declare module 'simple-mind-map/src/plugins/Drag.js' {
  const plugin: unknown
  export default plugin
}

declare module 'simple-mind-map/src/plugins/Select.js' {
  const plugin: unknown
  export default plugin
}

declare module 'simple-mind-map/src/plugins/Export.js' {
  const plugin: unknown
  export default plugin
}

declare module 'simple-mind-map/src/plugins/ExportPDF.js' {
  const plugin: unknown
  export default plugin
}

declare module 'simple-mind-map/src/plugins/ExportXMind.js' {
  const plugin: unknown
  export default plugin
}

declare module 'simple-mind-map/src/plugins/TouchEvent.js' {
  const plugin: unknown
  export default plugin
}

declare module 'simple-mind-map/src/plugins/KeyboardNavigation.js' {
  const plugin: unknown
  export default plugin
}

declare module 'simple-mind-map-plugin-themes' {
  const Themes: {
    init: (MindMap: unknown) => void
    remove: (MindMap: unknown) => void
    darkList: unknown[]
    lightList: unknown[]
  }
  export default Themes
}

declare module 'simple-mind-map-plugin-themes/themeList' {
  export type ThemeListItem = {
    name: string
    value: string
    theme?: { backgroundColor?: string; lineColor?: string; root?: { fillColor?: string }; second?: { fillColor?: string } }
    dark?: boolean
  }
  const themeList: ThemeListItem[]
  export default themeList
}
declare module 'simple-mind-map/src/plugins/RichText.js'
declare module 'simple-mind-map/src/plugins/Formula.js'

declare module 'simple-mind-map/src/parse/xmind.js' {
  const parser: { parseXmindFile(file: File): Promise<import('./types/map').MindMapNode> }
  export default parser
}

declare module 'simple-mind-map/src/plugins/MiniMap.js'
declare module 'simple-mind-map/src/plugins/Demonstrate.js'
declare module 'simple-mind-map/src/plugins/Search.js' {
  export default class Search {
    getReplacedText(node: unknown, searchText: string, replaceText: string): string
  }
}

declare module 'simple-mind-map/src/svg/icons.js' {
  export const nodeIconList: { name: string; type: string; list: { name: string; icon: string }[] }[]
}
