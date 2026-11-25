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
    let awaitingTouchRelease = false
    let lastSelectedText = ''
    let publishTimer = 0
    const touchPointers = new Set<number>()

    const clearPublish = () => window.clearTimeout(publishTimer)

    const eventInRoot = (target: EventTarget | null) =>
      target instanceof Node && root.contains(target)

    const rememberSelection = () => {
      const text = selectedTextWithin(root)
      if (text) lastSelectedText = text
      return text
    }

    const publishCaptured = (preferred?: string) => {
      const text = preferred || selectedTextWithin(root) || lastSelectedText
      if (!text) return
      lastSelectedText = ''
      onSelection(text)
    }

    const publishAfterRelease = () => {
      mouseDown = false
      awaitingTouchRelease = false
      touchPointers.clear()
      clearPublish()

      // Mobile browsers often finalize the selection slightly after lift.
      const immediate = rememberSelection()
      publishTimer = window.setTimeout(() => {
        publishCaptured(immediate || undefined)
      }, 80)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        if (!eventInRoot(event.target)) return
        mouseDown = true
        clearPublish()
        return
      }

      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        touchPointers.add(event.pointerId)
        awaitingTouchRelease = false
        clearPublish()
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        if (!mouseDown) return
        publishAfterRelease()
        return
      }

      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        touchPointers.delete(event.pointerId)
        if (touchPointers.size === 0 || awaitingTouchRelease) {
          publishAfterRelease()
        }
      }
    }

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return
      touchPointers.delete(event.pointerId)
      // Long-press selection cancels the pointer while the finger may still be down.
      awaitingTouchRelease = true
      clearPublish()
      rememberSelection()
    }

    const onTouchStart = () => {
      awaitingTouchRelease = false
      clearPublish()
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) return
      publishAfterRelease()
    }

    const onMouseUp = () => {
      if (!awaitingTouchRelease && !mouseDown) return
      publishAfterRelease()
    }

    const onSelectionChange = () => {
      rememberSelection()

      if (mouseDown || touchPointers.size > 0) {
        clearPublish()
        return
      }

      if (awaitingTouchRelease) {
        // Finger may still be down after touchcancel; keep waiting for a real release
        // event, but if the browser never sends one, fall back after the selection settles.
        clearPublish()
        publishTimer = window.setTimeout(() => {
          if (mouseDown || touchPointers.size > 0) return
          publishAfterRelease()
        }, 900)
        return
      }

      // Keyboard selection path.
      clearPublish()
      publishTimer = window.setTimeout(() => {
        if (mouseDown || touchPointers.size > 0 || awaitingTouchRelease) return
        publishCaptured()
      }, 250)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', onPointerUp, true)
    document.addEventListener('pointercancel', onPointerCancel, true)
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
    document.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('selectionchange', onSelectionChange)

    return () => {
      clearPublish()
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', onPointerUp, true)
      document.removeEventListener('pointercancel', onPointerCancel, true)
      document.removeEventListener('touchstart', onTouchStart, true)
      document.removeEventListener('touchend', onTouchEnd, true)
      document.removeEventListener('mouseup', onMouseUp, true)
      document.removeEventListener('selectionchange', onSelectionChange)
    }
  }, [enabled, rootRef])
}
