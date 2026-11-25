import DOMPurify from 'dompurify'
import { fromMarkdown } from 'mdast-util-from-markdown'
import type { Content } from 'mdast'
import { normalizeFullData, titleFromNode, type MindMapNode } from '../types/map'

function textOf(part: Content): string {
  if ('value' in part) return part.value
  if ('children' in part) return part.children.map(textOf).join('')
  return part.type === 'image' ? part.alt ?? '' : ''
}

export function markdownTree(markdown: string, title: string): MindMapNode {
  const root: MindMapNode = { data: { text: title }, children: [] }
  const stack = [{ depth: 0, node: root }]
  function append(parent: MindMapNode, text: string) {
    const child: MindMapNode = { data: { text }, children: [] }
    parent.children!.push(child)
    return child
  }
  function addPart(parent: MindMapNode, part: Content) {
    if (part.type === 'list') {
      for (const item of part.children) {
        const [first, ...rest] = item.children
        const child = append(parent, first?.type === 'paragraph' ? textOf(first) : '')
        for (const block of first?.type === 'paragraph' ? rest : item.children) addPart(child, block)
      }
    } else if (textOf(part).trim()) append(parent, textOf(part))
  }
  for (const part of fromMarkdown(markdown).children) {
    if (part.type === 'heading') {
      while (stack.length > 1 && stack.at(-1)!.depth >= part.depth) stack.pop()
      stack.push({ depth: part.depth, node: append(stack.at(-1)!.node, textOf(part)) })
    } else addPart(stack.at(-1)!.node, part)
  }
  if (!root.children!.length) throw new Error('Markdown 中没有可导入的内容。')
  return root.children!.length === 1 ? root.children![0]! : root
}

function validateTree(value: unknown): asserts value is MindMapNode {
  if (!value || typeof value !== 'object' || !('data' in value)) throw new Error('文件缺少节点数据。')
  const { data, children } = value as MindMapNode
  if (typeof data?.text !== 'string') throw new Error('节点缺少文本。')
  if (children !== undefined && !Array.isArray(children)) throw new Error('子节点格式错误。')
  if (data.richText) data.text = DOMPurify.sanitize(data.text, {
    ALLOWED_TAGS: ['p','br','span','strong','b','i','em','u','s','sub','sup'],
    ALLOWED_ATTR: ['class','style','data-value'],
  })
  if (typeof data.hyperlink === 'string' && !/^https?:\/\//i.test(data.hyperlink)) delete data.hyperlink
  if (data.note && typeof data.note === 'string') data.note = DOMPurify.sanitize(data.note)
  for (const child of children ?? []) validateTree(child)
}

export async function readImport(file: File | null, markdown: string) {
  const name = file?.name.replace(/\.[^.]+$/, '') || '导入的导图'
  const ext = file?.name.split('.').pop()?.toLowerCase() ?? 'md'
  let raw
  let title = ''
  if (ext === 'md' || ext === 'markdown') {
    raw = markdownTree(file ? await file.text() : markdown, name)
  } else if (ext === 'xmind' && file) {
    const { default: xmind } = await import('simple-mind-map/src/parse/xmind.js')
    raw = await xmind.parseXmindFile(file)
  } else if ((ext === 'json' || ext === 'smm') && file) {
    try { raw = JSON.parse((await file.text()).replace(/^\uFEFF/, '')) }
    catch { throw new Error('文件内容不是有效的 JSON。') }
    if (raw?.mindMap) {
      title = typeof raw.title === 'string' ? raw.title : ''
      raw = raw.mindMap
    }
  } else throw new Error('请选择 SMM、JSON、XMind 或 Markdown 文件。')
  validateTree(raw?.root ?? raw)
  const mindMap = normalizeFullData(raw)
  return { title: title.trim() || titleFromNode(mindMap.root) || name, mindMap }
}
