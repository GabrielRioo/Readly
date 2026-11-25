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

    let mouseDown = false
    let activeTouches = 0
    let awaitingTouchRelease = false
    let publishTimer = 0

    const isTouchBlocking = () => activeTouches > 0 || awaitingTouchRelease

    const publishIfSelected = () => {
      if (mouseDown || isTouchBlocking()) return
      const text = selectedTextWithin(root)
      if (text) onSelection(text)
    }

    const schedulePublish = (delay: number) => {
      window.clearTimeout(publishTimer)
      publishTimer = window.setTimeout(publishIfSelected, delay)
    }

    const clearPublish = () => window.clearTimeout(publishTimer)

    const eventInRoot = (target: EventTarget | null) =>
      target instanceof Node && root.contains(target)

    const releaseTouchAndPublish = () => {
      activeTouches = 0
      awaitingTouchRelease = false
      schedulePublish(40)
    }

    const onTouchStart = (event: TouchEvent) => {
      activeTouches = event.touches.length
      awaitingTouchRelease = false
      clearPublish()
    }

    const onTouchEnd = (event: TouchEvent) => {
      activeTouches = event.touches.length
      if (activeTouches > 0) return
      releaseTouchAndPublish()
    }

    const onTouchCancel = (event: TouchEvent) => {
      // Browser may cancel the touch when long-press selection starts,
      // while the finger is still on the screen.
      activeTouches = event.touches.length
      awaitingTouchRelease = true
      clearPublish()
    }

    const onMouseUp = () => {
      // Fallback when touchcancel removed the touch point before the finger lifted.
      if (!awaitingTouchRelease) return
      releaseTouchAndPublish()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (!eventInRoot(event.target)) return
      mouseDown = true
      clearPublish()
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (!mouseDown) return
      mouseDown = false
      schedulePublish(40)
    }

    const onSelectionChange = () => {
      if (mouseDown || isTouchBlocking()) {
        clearPublish()
        return
      }
      schedulePublish(250)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchCancel, { passive: true })
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('selectionchange', onSelectionChange)

    return () => {
      clearPublish()
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchCancel)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('selectionchange', onSelectionChange)
    }
  }, [enabled, rootRef])
}
