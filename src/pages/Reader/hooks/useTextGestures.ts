import { useEffect, useEffectEvent, type RefObject } from 'react'
import { selectedTextWithin } from '../../../utils/text.ts'

interface TextGestureHandlers {
  onSelection: (text: string) => void
}

/** Wait until selection stops changing before opening translation. */
const SELECTION_STABLE_MS = 450

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
    let activePointerType: string | null = null

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
      activePointerType = event.pointerType
      window.clearTimeout(publishTimer)
    }

    const finishPointer = (cancelled: boolean) => {
      if (!pointerDown) return
      pointerDown = false
      const touchLike = activePointerType === 'touch' || activePointerType === 'pen'
      activePointerType = null

      // On touch, browsers often cancel the pointer when long-press selection starts.
      // Publishing immediately would lock the first word and block expanding the phrase.
      if (cancelled && touchLike) {
        schedulePublish(SELECTION_STABLE_MS)
        return
      }

      schedulePublish(touchLike ? SELECTION_STABLE_MS : 40)
    }

    const onPointerUp = () => finishPointer(false)
    const onPointerCancel = () => finishPointer(true)

    const onSelectionChange = () => {
      if (pointerDown) return
      // Keep delaying while the user adjusts selection handles on mobile.
      schedulePublish(SELECTION_STABLE_MS)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerCancel)
    document.addEventListener('selectionchange', onSelectionChange)

    return () => {
      window.clearTimeout(publishTimer)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerCancel)
      document.removeEventListener('selectionchange', onSelectionChange)
    }
  }, [enabled, rootRef])
}
