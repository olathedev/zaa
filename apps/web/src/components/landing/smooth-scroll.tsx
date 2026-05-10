import { useEffect, useState, type ReactNode } from 'react'

import { ReactLenis } from 'lenis/react'

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [disableSmoothScroll, setDisableSmoothScroll] = useState(true)

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const updateScrollPreference = () => {
      setDisableSmoothScroll(reducedMotionQuery.matches || mobileQuery.matches)
    }

    updateScrollPreference()
    reducedMotionQuery.addEventListener('change', updateScrollPreference)
    mobileQuery.addEventListener('change', updateScrollPreference)

    return () => {
      reducedMotionQuery.removeEventListener('change', updateScrollPreference)
      mobileQuery.removeEventListener('change', updateScrollPreference)
    }
  }, [])

  if (disableSmoothScroll) {
    return children
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        duration: 1.05,
        easing: (time) => Math.min(1, 1.001 - 2 ** (-10 * time)),
        lerp: 0.09,
        wheelMultiplier: 0.9,
      }}
    >
      {children}
    </ReactLenis>
  )
}
