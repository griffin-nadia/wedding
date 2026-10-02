import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/** "Settling paper": content rises 14px and un-blurs once as it scrolls in. Nothing under reduced motion. */
export function Reveal({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return setShown(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { rootMargin: "0px 0px -10% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref} className={cn("settle", shown && "settled", className)}>{children}</Tag>
}
