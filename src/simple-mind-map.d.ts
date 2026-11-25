declare module 'simple-mind-map' {
  export type MindMapOptions = Record<string, unknown>

  export interface MindMapInstance {
    resize: () => void
    destroy: () => void
    getData: (withConfig?: boolean) => unknown
    setData: (data: unknown) => void
    setFullData: (data: unknown) => void
    setLayout: (layout: string, notRender?: boolean) => void
    getLayout: () => string
    setTheme: (theme: string, notRender?: boolean) => void
    getTheme: () => string
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
    theme?: unknown
    dark?: boolean
  }
  const themeList: ThemeListItem[]
  export default themeList
}
