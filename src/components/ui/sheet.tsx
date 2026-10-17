import * as React from "react"
import { Dialog } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"

/**
 * The one sheet (Open UI: dialog). Every dialog on the site is this: the reply, the journey map and the driver card.
 * A sheet of letter paper over a dim overlay, rising from the bottom on phones and from below the bar on laptops,
 * with a fixed head, a body that scrolls, and an X. Focus is trapped, Esc closes, focus goes back to the opener.
 * tone "bright" is the brightest paper in both modes (the driver card), like the envelope.
 */
const Sheet = Dialog.Root
const SheetTrigger = Dialog.Trigger
const SheetClose = Dialog.Close

function SheetContent({ className, children, tone = "letter", closeLabel, ...props }:
  React.ComponentProps<typeof Dialog.Content> & { tone?: "letter" | "bright"; closeLabel?: string }) {
  const { t } = useLang()
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="sheet-overlay" />
      <Dialog.Content className={cn(tone === "letter" ? "letter paper sheet" : "paper sheet sheet-bright", className)} {...props}>
        <Dialog.Close className="sheet-close press" aria-label={closeLabel ?? t.rsvp.close}><X className="size-5" aria-hidden /></Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

const SheetTitle = Dialog.Title
const SheetDescription = Dialog.Description

/** The fixed top of a sheet (title, step label) and the part that scrolls. */
const SheetHead = ({ className, ...p }: React.ComponentProps<"header">) => <header className={cn("sheet-head", className)} {...p} />
const SheetBody = ({ className, ...p }: React.ComponentProps<"div">) => <div className={cn("sheet-body", className)} {...p} />

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription, SheetHead, SheetBody }
