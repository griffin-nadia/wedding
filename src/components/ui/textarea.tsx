import * as React from "react"
import { cn } from "@/lib/utils"

// Browsers without field-sizing (iOS Safari before 26) grow the box here instead
const sizes = typeof CSS !== "undefined" && CSS.supports("field-sizing", "content")

/** Grows with what's typed up to --input-textarea-max, then scrolls inside; the line being typed stays in view. */
function Textarea({ className, onInput, ...props }: React.ComponentProps<"textarea">) {
  const fit = (el: HTMLTextAreaElement) => {
    if (!sizes) { el.style.height = "auto"; el.style.height = `${el.scrollHeight + 2}px` }
    el.scrollIntoView({ block: "nearest" })
  }
  return (
    <textarea
      data-slot="textarea"
      className={cn("state field field-textarea flex", className)}
      ref={(el) => { if (el && !sizes) fit(el) }}
      onInput={(e) => { fit(e.currentTarget); onInput?.(e) }}
      {...props}
    />
  )
}

export { Textarea }
