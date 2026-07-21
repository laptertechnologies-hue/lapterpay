import { useEffect, useRef, useState, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Delay in ms before the reveal animation starts, once visible */
  delay?: number
  /** Animation style */
  variant?: 'up' | 'fade' | 'left' | 'right' | 'scale'
  /** Optional element id, e.g. for anchor-link targets */
  id?: string
}

/**
 * Lightweight, dependency-free scroll-reveal wrapper.
 * Uses IntersectionObserver to animate children into view once,
 * giving pages a modern, motion-driven feel without adding a new
 * animation library to the bundle.
 */
export function Reveal({ children, className = '', delay = 0, variant = 'up', id }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Respect users who prefer reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const hiddenTransform =
    variant === 'up' ? 'translate-y-6' :
    variant === 'left' ? '-translate-x-6' :
    variant === 'right' ? 'translate-x-6' :
    variant === 'scale' ? 'scale-95' : ''

  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${hiddenTransform}`
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

export default Reveal
