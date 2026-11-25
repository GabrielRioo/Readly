import { useEffect, useEffectEvent, useLayoutEffect, useRef, type RefObject } from 'react'

export function useReadingScroll(
  sectionKey: string,
  getInitialRatio: () => number,
  onRatio: (ratio: number) => void,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  const readInitialRatio = useEffectEvent(getInitialRatio)
  const publishRatio = useEffectEvent(onRatio)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || !sectionKey) return
    const ratio = readInitialRatio()
    const apply = () => {
      const max = element.scrollHeight - element.clientHeight
      element.scrollTop = max > 0 ? max * ratio : 0
    }
    apply()
    const frame = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(frame)
  }, [sectionKey])

  useEffect(() => {
    const element = ref.current
    if (!element || !sectionKey) return
    let timer = 0
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const max = element.scrollHeight - element.clientHeight
        publishRatio(max <= 0 ? 1 : element.scrollTop / max)
      }, 400)
    }
    element.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      element.removeEventListener('scroll', onScroll)
    }
  }, [sectionKey])

  return ref
}
