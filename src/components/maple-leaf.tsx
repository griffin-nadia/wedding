import { useState } from "react"
import { cn } from "@/lib/utils"

const KEY = "ng-leaf"

/** One momiji leaf that drifts down once per visit and settles. Still under reduced motion. */
export function MapleLeaf() {
  const [fall] = useState(() => {
    try {
      const first = !sessionStorage.getItem(KEY)
      sessionStorage.setItem(KEY, "1")
      return first
    } catch {
      return false // private mode: just show it still
    }
  })
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("mt-1 size-7 shrink-0 text-primary md:size-10", fall && "leaf-fall")} fill="currentColor">
      <path d="M12 2l1.6 4.2 3.2-2.1-.7 4 4-.6-2.3 3.3 3.6 1.4-3.9 1.6 1.6 3.1-3.9-.8L13 20.4V23h-2v-2.6l-2.2-4.3-3.9.8 1.6-3.1-3.9-1.6 3.6-1.4-2.3-3.3 4 .6-.7-4 3.2 2.1z" />
    </svg>
  )
}
