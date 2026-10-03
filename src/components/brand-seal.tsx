import { cn } from "@/lib/utils"

/**
 * The N&G seal, the brand mark (v3 E, K): a slightly irregular rust circle with N&G in Oranienbaum.
 * Drawn, not typed into a perfect circle; the same mark as public/brand/seal.svg.
 */
export function BrandSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("shrink-0", className)}>
      <path d="M32 3.5c8.6.2 15.4 3.4 20.6 9.2 5 5.6 8.1 12 7.9 19.6-.2 8.1-3.1 14.8-8.7 20-5.4 5-12.2 8.4-19.9 8.2-8-.2-14.6-3.3-19.9-8.6C6.7 46.6 3.4 40 3.6 31.8c.2-7.9 3.6-14.3 9-19.6C17.8 7 24.3 3.3 32 3.5Z" fill="var(--brand-sabi)" />
      <path d="M32 7.6c7.4.1 13.1 2.9 17.5 7.8 4.3 4.8 6.9 10.2 6.7 16.7-.2 6.9-2.6 12.6-7.4 17-4.6 4.3-10.4 7.1-17 6.9-6.8-.2-12.4-2.8-16.9-7.3-4.4-4.5-7.2-10.1-7-17.1.2-6.7 3.1-12.2 7.7-16.7C20 10.6 25.5 7.4 32 7.6Z" fill="none" stroke="var(--brand-shiro-kinari)" strokeOpacity=".55" strokeWidth="1.2" />
      <text x="32" y="40.5" textAnchor="middle" fontFamily="Oranienbaum, serif" fontSize="22" fill="var(--brand-shiro-kinari)">N&amp;G</text>
    </svg>
  )
}
