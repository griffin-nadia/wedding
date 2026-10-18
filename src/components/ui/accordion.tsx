import * as React from "react"
import { cn } from "@/lib/utils"
import { LAND_GAP, loop, still, stuckBottom } from "@/lib/frame"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-border first:border-t", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex min-h-14 flex-1 items-center justify-between gap-4 py-3 text-left text-body font-medium text-foreground outline-2 outline-offset-2 outline-transparent transition-colors focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon data-slot="accordion-trigger-icon" className="pointer-events-none size-5 shrink-0 transition-transform duration-(--duration-base) ease-(--ease-paper) group-aria-expanded/accordion-trigger:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="accordion-content overflow-hidden"
      {...props}
    >
      <div
        className={cn(
          "flex flex-col gap-4 pt-0 pb-6",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

/** How much of an opened row's content must show under its header (or all of it, when it's shorter) */
const REVEAL = 120
/** The fade at the card's bottom edge (.letter-scroll's mask) */
const FADE = 16

/**
 * The site's accordion: one open at a time everywhere (Jehan, 6 Oct). Opening a row closes the open one, and when
 * that one is above it the page would pull the tapped row up as it closes; the page scrolls with it instead, so the
 * row you tapped stays exactly under your finger.
 * Run 19: and if the opened row's header and the top of its content wouldn't be on screen (a row low on the card, or
 * tucked under Travel's stuck tab row), the card glides just far enough to show them, and no further; at once under
 * reduced motion. Rows already in view don't move. FAQs, Travel and the sheets all use this.
 */
export function Disclosure({ label, children, onValueChange, ...props }: { label: string; children: React.ReactNode; onValueChange?: (v: string) => void } & Omit<React.ComponentProps<typeof AccordionPrimitive.Root>, "type" | "children" | "onValueChange">) {
  const tapped = React.useRef<HTMLElement | null>(null)
  const change = (v: string) => {
    const el = tapped.current
    if (v && el) {
      const box = el.closest<HTMLElement>(".letter-scroll, .sheet-body")
      const scroll = (d: number) => (box ?? window).scrollBy({ top: d, behavior: "instant" })
      const top = el.getBoundingClientRect().top, start = performance.now(), glide = still() ? 0 : 300, until = start + 450
      let goal: number | null = null // where the header ends up on screen, once its content is there to measure
      loop((now) => {
        if (goal === null) {
          const inner = el.closest("[data-slot=accordion-item]")?.querySelector<HTMLElement>("[data-slot=accordion-content] > div")
          if (inner) {
            const r = box?.getBoundingClientRect(), viewTop = (r ? r.top + stuckBottom(box!) : 0) + LAND_GAP, viewBottom = (r ? r.bottom : innerHeight) - FADE
            const need = el.offsetHeight + Math.min(inner.offsetHeight, REVEAL)
            goal = top < viewTop ? viewTop : top + need > viewBottom ? Math.max(viewTop, viewBottom - need) : top
          }
        }
        // The header follows a short ease from where it was to its goal, held there while the row above closes
        const k = goal === null || !glide ? 1 : Math.min(1, (now - start) / glide), ease = 1 - (1 - k) ** 3
        const want = top + ((goal ?? top) - top) * ease
        const d = el.getBoundingClientRect().top - want
        if (Math.abs(d) >= 1) scroll(d)
        return now < until || k < 1
      })
    }
    onValueChange?.(v)
  }
  return (
    <Accordion type="single" collapsible aria-label={label} onValueChange={change} {...(props as object)}
      onClickCapture={(e: React.MouseEvent) => { tapped.current = (e.target as HTMLElement).closest<HTMLElement>("[data-slot=accordion-trigger]") }}>
      {children}
    </Accordion>
  )
}
