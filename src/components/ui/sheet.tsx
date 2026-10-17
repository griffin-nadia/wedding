import * as React from "react"
import { Dialog } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"
import { useUnder } from "@/components/ui/page-header"

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
        <Under>{children}</Under>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

const SheetTitle = Dialog.Title
const SheetDescription = Dialog.Description

/* The head shows the page header's hairline and fill once the body has scrolled under it */
const UnderCtx = React.createContext<{ under: boolean; set: (u: boolean) => void }>({ under: false, set: () => {} })
function Under({ children }: { children: React.ReactNode }) {
  const [under, set] = React.useState(false)
  return <UnderCtx.Provider value={{ under, set }}>{children}</UnderCtx.Provider>
}

/** The fixed top of a sheet (step label, title): the same page header as every tab. */
const SheetHead = ({ className, ...p }: React.ComponentProps<"header">) => {
  const { under } = React.useContext(UnderCtx)
  return <header className={cn("page-header sheet-head", className)} data-under={under || undefined} {...p} />
}
/** The part of a sheet that scrolls. */
function SheetBody({ className, children, ref, ...p }: React.ComponentProps<"div">) {
  const box = React.useRef<HTMLDivElement | null>(null)
  const { sentinel, under } = useUnder(box)
  const { set } = React.useContext(UnderCtx)
  React.useEffect(() => set(under), [under, set])
  const both = (el: HTMLDivElement | null) => { box.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el }
  return (
    <div ref={both} className={cn("sheet-body", className)} {...p}>
      <span ref={sentinel} aria-hidden className="page-header-sentinel" />
      {children}
    </div>
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription, SheetHead, SheetBody }
