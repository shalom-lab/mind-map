import type { MindMapInstance } from 'simple-mind-map'

// Node drags normally belong to the layout engine. In hand mode drag the view
// instead, while leaving native click/double-click events on their original target.
export function bindCanvasPan(el: HTMLElement, api: MindMapInstance) {
  let space = false
  let drag: { x: number; y: number; moved: boolean } | null = null
  let swallowClick = false
  const editing = (target: EventTarget | null) => target instanceof Element &&
    !!target.closest('input,textarea,select,[contenteditable="true"],dialog[open]')
  const reset = () => {
    drag = null
    space = false
    swallowClick = false
    el.classList.remove('pan-ready','pan-active')
  }
  const keyDown = (e: KeyboardEvent) => {
    if (e.code !== 'Space' || e.ctrlKey || e.metaKey || e.altKey || editing(e.target) ||
      document.querySelector('dialog[open]') || !el.matches(':hover')) return
    if (e.target instanceof Element && e.target.closest('button,a') && e.target.matches(':focus-visible')) return
    e.preventDefault()
    e.stopImmediatePropagation()
    space = true
    el.classList.add('pan-ready')
  }
  const keyUp = (e: KeyboardEvent) => {
    if (e.code !== 'Space' || !space) return
    e.preventDefault()
    e.stopImmediatePropagation()
    space = false
    el.classList.remove('pan-ready')
  }
  const down = (e: MouseEvent) => {
    swallowClick = false
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || editing(e.target)) return
    if (!space && (api.getConfig('useLeftKeySelectionRightKeyDrag') || api.painter.isInPainter)) return
    if (!space && e.target instanceof Element && e.target.closest('a,button,input,.smm-node-img-adjust')) return
    drag = { x: e.clientX, y: e.clientY, moved: false }
    e.preventDefault()
    e.stopImmediatePropagation()
  }
  const move = (e: MouseEvent) => {
    if (!drag) return
    if (!(e.buttons & 1)) { reset(); return }
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(dx,dy) < 4) return
    drag = { x: e.clientX, y: e.clientY, moved: true }
    el.classList.add('pan-active')
    e.preventDefault()
    e.stopImmediatePropagation()
    api.view.translateXY(dx,dy)
  }
  const up = (e: MouseEvent) => {
    if (!drag || e.button !== 0) return
    swallowClick = drag.moved
    drag = null
    el.classList.remove('pan-active')
    if (swallowClick) e.stopImmediatePropagation()
  }
  const click = (e: MouseEvent) => {
    if (!swallowClick) return
    swallowClick = false
    e.preventDefault()
    e.stopImmediatePropagation()
  }
  el.addEventListener('mousedown', down, true)
  el.addEventListener('click', click, true)
  window.addEventListener('mousemove', move, true)
  window.addEventListener('mouseup', up, true)
  window.addEventListener('keydown', keyDown, true)
  window.addEventListener('keyup', keyUp, true)
  window.addEventListener('blur', reset)
  return () => {
    reset()
    el.removeEventListener('mousedown', down, true)
    el.removeEventListener('click', click, true)
    window.removeEventListener('mousemove', move, true)
    window.removeEventListener('mouseup', up, true)
    window.removeEventListener('keydown', keyDown, true)
    window.removeEventListener('keyup', keyUp, true)
    window.removeEventListener('blur', reset)
  }
}
