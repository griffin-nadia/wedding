import { toast } from "@/components/toast"
import { copyText } from "@/lib/copy"
import type { useLang } from "@/lib/lang"

export const drawnKey = (token: string) => `ng-fortune-${token}`

/** Android lets a page read a shake without asking; iPhones need a permission prompt, so there it's tap only. */
export const canShake = () => typeof window !== "undefined" && "DeviceMotionEvent" in window
  && typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission !== "function"
  && window.matchMedia("(pointer: coarse)").matches

/** Save to my phone: the share sheet where there is one, otherwise copied for their notes. */
export async function saveFortune(t: ReturnType<typeof useLang>["t"], text: string) {
  const words = `${t.fortune.blessing} ${t.fortune.blessingEn}. ${text}`
  try {
    if (navigator.share) await navigator.share({ title: t.fortune.title, text: words })
    else if (await copyText(words)) toast(t.fortune.copied)
  } catch { /* cancelled */ }
}
