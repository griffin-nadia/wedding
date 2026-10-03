import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  // One state system (index.css: state, btn-primary, btn-text). Buttons: radius 12, 52 tall on phones, 48 from 768.
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg font-label text-[15px] font-medium whitespace-nowrap select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "btn-primary",
        outline: "state text-foreground",
        secondary: "state text-foreground",
        ghost: "state border-transparent bg-transparent text-foreground",
        destructive: "state text-destructive",
        link: "btn-text",
      },
      size: {
        default: "h-12 gap-2 px-4",
        xs: "h-8 gap-1 px-2 text-xs",
        sm: "h-11 gap-2 px-3",
        lg: "h-(--button-height) gap-2 px-6",
        icon: "size-11",
        "icon-xs": "size-8",
        "icon-sm": "size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
