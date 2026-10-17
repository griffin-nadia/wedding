import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * True once the content has scrolled under a sticky header. A zero-height sentinel sits where the header starts;
 * when it leaves the visible area (above the header's sticky line) the content is under the header. No scroll listener.
 * root: the scrolling box (a sheet's body); none = the page.
 */
export function useUnder(root?: React.RefObject<HTMLElement | null>) {
  const sentinel = useRef<HTMLSpanElement>(null)
  const [under, setUnder] = useState(false)
  useEffect(() => {
    const s = sentinel.current
    if (!s) return
    // The page's header sticks under the top bar
    const top = root ? 0 : Math.round(document.querySelector(".site-bar")?.getBoundingClientRect().height ?? 0)
    // Gone above the top edge of the box it scrolls in (the window's, or the card's or a sheet's own top)
    const io = new IntersectionObserver(([e]) => setUnder(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0) + 1), { root: root?.current ?? null, rootMargin: `-${top}px 0px 0px 0px` })
    io.observe(s)
    return () => io.disconnect()
  }, [root])
  return { sentinel, under }
}

/**
 * The one page header (every tab, and every sheet through SheetHead): the title with its moss rule, then anything
 * that belongs with it (Travel's jump links). It scrolls away with the page (18e: the top bar is the only thing that
 * stays put; Travel's jump links stay as one slim row at the top of the card).
 */
export function PageHeader({ title, children, className, as: H = "h1" }: { title: ReactNode; children?: ReactNode; className?: string; as?: "h1" | "h2" }) {
  return (
    <header className={cn("page-header", className)}>
      <H className="heading">{title}</H>
      {children}
    </header>
  )
}
