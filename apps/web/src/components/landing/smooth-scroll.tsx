import { useEffect, useState, type ReactNode } from 'react'

import { ReactLenis } from 'lenis/react'

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => {
      setReducedMotion(mediaQuery.matches)
    }

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', updateMotionPreference)
    }
  }, [])

  if (reducedMotion) {
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
