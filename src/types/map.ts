export type MindMapNode = {
  data: {
    text: string
    expand?: boolean
    [key: string]: unknown
  }
  children?: MindMapNode[]
}

export type MindMapFullData = {
  root: MindMapNode
  layout?: string
  theme?: {
    template?: string
    config?: Record<string, unknown>
  }
  view?: Record<string, unknown> | null
}

/** JSON file stored in the data repo (one file per map). */
export type MapDocument = {
  version: 1
  id: string
  title: string
  updatedAt: string
  mindMap: MindMapFullData
}

/** Local-first record in IndexedDB (not a secret). */
export type LocalMapRecord = MapDocument & {
  sha: string | null
  path: string | null
  dirty: boolean
  deleted: boolean
}

export function emptyRoot(title = '中心主题'): MindMapNode {
  return {
    data: { text: title, expand: true },
    children: [],
  }
}

export function emptyFullData(title = '中心主题'): MindMapFullData {
  return {
    root: emptyRoot(title),
    layout: 'mindMap',
    theme: { template: 'default', config: {} },
    view: null,
  }
}

export function createDocument(title = '未命名导图'): MapDocument {
  return {
    version: 1,
    id: crypto.randomUUID(),
    title,
    updatedAt: new Date().toISOString(),
    mindMap: emptyFullData(title === '未命名导图' ? '中心主题' : title),
  }
}

export function titleFromNode(node: MindMapNode | undefined): string {
  const text = node?.data?.text
  if (typeof text !== 'string') return ''
  const plain = text.replace(/<[^>]+>/g, '').trim()
  return plain
}

function isNode(value: unknown): value is MindMapNode {
  if (!value || typeof value !== 'object') return false
  const data = (value as MindMapNode).data
  return Boolean(data && typeof data === 'object')
}

export function normalizeFullData(raw: unknown): MindMapFullData {
  if (!raw || typeof raw !== 'object') {
    return emptyFullData()
  }
  const obj = raw as Partial<MindMapFullData> & { data?: unknown }
  const root = isNode(obj.root)
    ? obj.root
    : isNode(obj)
      ? (obj as MindMapNode)
      : emptyRoot()
  const theme = obj.theme && typeof obj.theme === 'object' ? obj.theme : {}
  return {
    root,
    layout: typeof obj.layout === 'string' ? obj.layout : 'mindMap',
    theme: {
      template:
        typeof theme.template === 'string' ? theme.template : 'default',
      config:
        theme.config && typeof theme.config === 'object'
          ? (theme.config as Record<string, unknown>)
          : {},
    },
    view:
      obj.view && typeof obj.view === 'object'
        ? (obj.view as Record<string, unknown>)
        : null,
  }
}

export function idFromPath(path: string | undefined | null): string | null {
  if (!path) return null
  const base = path.split('/').pop() ?? ''
  const id = base.replace(/\.json$/i, '').trim()
  return id || null
}
