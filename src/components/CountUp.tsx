import { useEffect, useRef, useState } from 'react'

type CountUpProps = {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

/**
 * Animates a number counting up from 0 to `end` once it scrolls into view.
 * Pure requestAnimationFrame implementation — no external dependency.
 */
export function CountUp({ end, duration = 1400, prefix = '', suffix = '', decimals = 0, className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setValue(end)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setValue(end * eased)
            if (progress < 1) requestAnimationFrame(tick)
            else setValue(end)
          }
          requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  )
}

export default CountUp
