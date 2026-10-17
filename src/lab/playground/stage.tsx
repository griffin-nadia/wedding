import type { ReactNode } from "react"
import { Scene } from "@/components/letter/scene"
import { useTheme } from "@/lib/theme"
import { sceneFor } from "@/lib/scenes"
import { cn } from "@/lib/utils"

/**
 * The room an experiment plays in: the site's paper (or their photo behind, as on the site), content centred, a short
 * caption at the top saying what to try. Full screen at any size.
 */
export function Stage({ children, photo = false, hint, className }: { children: ReactNode; photo?: boolean; hint?: ReactNode; className?: string }) {
  const { theme } = useTheme()
  return (
    <div className={cn("x-stage", photo && "is-photo")}>
      {photo && <Scene source={sceneFor(theme)} />}
      {hint && <p className="x-stage-hint">{hint}</p>}
      <div className={cn("x-stage-main", className)}>{children}</div>
    </div>
  )
}
