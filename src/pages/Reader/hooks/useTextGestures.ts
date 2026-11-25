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

    let pointerDown = false
    let publishTimer = 0

    const publishIfSelected = () => {
      const text = selectedTextWithin(root)
      if (text) onSelection(text)
    }

    const schedulePublish = (delay: number) => {
      window.clearTimeout(publishTimer)
      publishTimer = window.setTimeout(publishIfSelected, delay)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !root.contains(event.target)) return
      pointerDown = true
      window.clearTimeout(publishTimer)
    }

    const onPointerUp = () => {
      if (!pointerDown) return
      pointerDown = false
      // Wait for the browser to finish updating the selection after release.
      schedulePublish(30)
    }

    const onSelectionChange = () => {
      // Ignore selection updates while the user is still dragging.
      if (pointerDown) return
      schedulePublish(200)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
    document.addEventListener('selectionchange', onSelectionChange)

    return () => {
      window.clearTimeout(publishTimer)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.removeEventListener('selectionchange', onSelectionChange)
    }
  }, [enabled, rootRef])
}
