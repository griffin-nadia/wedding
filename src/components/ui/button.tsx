import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * The one button (docs/system.md). Variants: primary (the sage action), secondary (paper with a hairline), quiet
 * (no line until hover) and link (btn-text). Sizes sm 44, md the field height (52 on phones, 48 from 768), lg 56.
 * States: hover (border only), focus-visible ring, pressed (a small spring to 0.97), disabled and loading
 * (aria-busy, a spinner, not clickable). Everything comes from the btn-primary / state / btn-text utilities.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-(--button-radius) font-label text-(length:--button-font-size) leading-6 font-medium whitespace-nowrap select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 aria-busy:cursor-progress",
  {
    variants: {
      variant: {
        primary: "btn-primary min-w-(--button-min-width)",
        secondary: "state min-w-(--button-min-width) text-foreground",
        quiet: "state border-transparent bg-transparent text-foreground",
        link: "btn-text",
      },
      size: {
        sm: "h-11 gap-2 px-4",
        md: "h-(--button-height) gap-2 px-(--button-pad)",
        lg: "h-14 gap-2 px-(--button-pad)",
        icon: "size-11",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto min-h-11 px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? children : <>{loading && <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />}{children}</>}
    </Comp>
  )
}

export { Button, buttonVariants }
