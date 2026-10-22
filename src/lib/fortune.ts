import { toast } from "@/components/ui/toast"
import { copyText } from "@/lib/copy"
import type { useLang } from "@/lib/lang"
import type { Fortune } from "@/lib/api"

export const drawnKey = (token: string) => `ng-fortune-${token}`

/** Android lets a page read a shake without asking; iPhones need a permission prompt, so there it's tap only. */
export const canShake = () => typeof window !== "undefined" && "DeviceMotionEvent" in window
  && typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission !== "function"
  && window.matchMedia("(pointer: coarse)").matches

/** Save to my phone: the share sheet where there is one, otherwise copied for their notes. */
export async function saveFortune(t: ReturnType<typeof useLang>["t"], f: Fortune) {
  const words = `${f.tierJa} ${f.tier}. ${f.text}`
  try {
    if (navigator.share) await navigator.share({ title: t.fortune.title, text: words })
    else if (await copyText(words)) toast(t.fortune.copied)
  } catch { /* cancelled */ }
}
