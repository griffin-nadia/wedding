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
    const io = new IntersectionObserver(([e]) => setUnder(!e.isIntersecting && e.boundingClientRect.top < top + 1), { root: root?.current ?? null, rootMargin: `-${top}px 0px 0px 0px` })
    io.observe(s)
    return () => io.disconnect()
  }, [root])
  return { sentinel, under }
}

/**
 * The one page header (every tab, and every sheet through SheetHead): the title with its moss rule, then anything
 * that should stay with it (Travel's jump links). Sticky; once content has scrolled under it, a hairline and a light
 * paper fill appear.
 */
export function PageHeader({ title, children, className, as: H = "h1" }: { title: ReactNode; children?: ReactNode; className?: string; as?: "h1" | "h2" }) {
  const { sentinel, under } = useUnder()
  return (
    <>
      <span ref={sentinel} aria-hidden className="page-header-sentinel" />
      <header className={cn("page-header", className)} data-under={under || undefined}>
        <H className="heading">{title}</H>
        {children}
      </header>
    </>
  )
}
