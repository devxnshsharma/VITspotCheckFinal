import { useEffect, useRef } from "react"
import { motion, useSpring } from "framer-motion"

export function useMagnetic(ref: React.RefObject<HTMLElement>) {
  // Spring config: k=0.15, damping=0.75 translated to Framer Motion spring config
  // Framer Motion uses stiffness and damping
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 }
  const x = useSpring(0, springConfig)
  const y = useSpring(0, springConfig)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { height, width, left, top } = node.getBoundingClientRect()
      const middleX = left + width / 2
      const middleY = top + height / 2

      const distanceX = clientX - middleX
      const distanceY = clientY - middleY
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

      // Repulsion / Antigravity physics
      // When cursor approaches within 80px
      if (distance < 80) {
        // Push AWAY elastically
        const force = (80 - distance) / 80 // 0 to 1
        const pushX = -(distanceX / distance) * force * 30 // push up to 30px away
        const pushY = -(distanceY / distance) * force * 30

        x.set(pushX)
        y.set(pushY)
      } else {
        // Spring back
        x.set(0)
        y.set(0)
      }
    }

    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }

    window.addEventListener("mousemove", handleMouseMove)
    node.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      node.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [ref, x, y])

  return { x, y }
}
