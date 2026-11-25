import { useEffect, useEffectEvent, type RefObject } from 'react'
import { selectedTextWithin } from '../../../utils/text.ts'

interface TextGestureHandlers {
  onSelection: (text: string) => void
}

export function useTextGestures(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  handlers: TextGestureHandlers,
) {
  const onSelection = useEffectEvent(handlers.onSelection)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !enabled) return

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

    root.addEventListener('pointerup', onPointerUp)
    document.addEventListener('selectionchange', publishSelection)

    return () => {
      window.clearTimeout(selectionTimer)
      window.clearTimeout(pointerTimer)
      root.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('selectionchange', publishSelection)
    }
  }, [enabled, rootRef])
}
