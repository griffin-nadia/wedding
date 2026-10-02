import { cn } from "@/lib/utils"

/** The red "done" seal (済). Decorative: the words next to it carry the meaning. */
export function Hanko({ size = "md", stamp = false, className }: { size?: "sm" | "md"; stamp?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("hanko", stamp && "hanko-stamp", size === "sm" ? "size-10 text-lg" : "size-20 text-4xl", className)}>
      済
    </span>
  )
}
