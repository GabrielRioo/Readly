import { useEffect, useEffectEvent, type RefObject } from 'react'
import { selectedTextWithin, wordAtPoint } from '../../../utils/text.ts'

interface TextGestureHandlers {
  onHover: (word: string) => void
  onSelection: (text: string) => void
}

export function useTextGestures(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  handlers: TextGestureHandlers,
) {
  const onHover = useEffectEvent(handlers.onHover)
  const onSelection = useEffectEvent(handlers.onSelection)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !enabled) return

    let timer = 0
    let selectionTimer = 0
    let pointerTimer = 0

    const publishSelection = () => {
      window.clearTimeout(selectionTimer)
      selectionTimer = window.setTimeout(() => {
        const text = selectedTextWithin(root)
        if (text) onSelection(text)
      }, 250)
    }

    const onPointerUp = () => {
      window.clearTimeout(pointerTimer)
      pointerTimer = window.setTimeout(() => {
        const text = selectedTextWithin(root)
        if (text) onSelection(text)
      }, 40)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.buttons !== 0) return
      window.clearTimeout(timer)
      const point = { x: event.clientX, y: event.clientY }
      timer = window.setTimeout(() => {
        const word = wordAtPoint(point.x, point.y, root)
        if (word) onHover(word)
      }, 450)
    }

    const onLeave = () => window.clearTimeout(timer)

    root.addEventListener('pointerup', onPointerUp)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerleave', onLeave)
    document.addEventListener('selectionchange', publishSelection)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(selectionTimer)
      window.clearTimeout(pointerTimer)
      root.removeEventListener('pointerup', onPointerUp)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('selectionchange', publishSelection)
    }
  }, [enabled, rootRef])
}
