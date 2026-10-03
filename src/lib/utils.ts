import { clsx, type ClassValue } from "clsx"

// Plain join (tailwind-merge cost 8 kB on the first screen). Call sites never pass a class that
// conflicts with a component's own; where one must win, it uses Tailwind's `!` (e.g. `min-w-40!`).
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
