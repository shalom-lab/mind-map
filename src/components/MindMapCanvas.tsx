import { useEffect, useRef } from 'react'
import type { MindMapInstance } from 'simple-mind-map'
import type { MindMapFullData } from '../types/map'
import { createMindMap } from '../mindmap/engine'

interface Props {
  data: MindMapFullData
  /** Remount the canvas when this changes (opening a different map). */
  sceneKey: string
  onReady: (api: MindMapInstance) => void
  onChange: () => void
}

export function MindMapCanvas({ data, sceneKey, onReady, onChange }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<MindMapInstance | null>(null)
  const onReadyRef = useRef(onReady)
  const onChangeRef = useRef(onChange)
  const dataRef = useRef(data)

  useEffect(() => {
    onReadyRef.current = onReady
    onChangeRef.current = onChange
    dataRef.current = data
  }, [onReady, onChange, data])

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const api = createMindMap({ el, data: dataRef.current })
    apiRef.current = api

    const handleChange = () => {
      onChangeRef.current()
    }
    api.on('data_change', handleChange)

    const ro = new ResizeObserver(() => {
      api.resize()
    })
    ro.observe(el)

    onReadyRef.current(api)

    return () => {
      ro.disconnect()
      api.off('data_change', handleChange)
      api.destroy()
      if (apiRef.current === api) apiRef.current = null
    }
  }, [sceneKey])

  return <div ref={elRef} className="mind-canvas" />
}
