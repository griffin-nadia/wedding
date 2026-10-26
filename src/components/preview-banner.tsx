import { useEffect } from "react"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { AskUs } from "@/components/ask-us"

/**
 * Review links only (run 21): a small banner that says replies aren't saved, and Leave feedback, which opens the Ask
 * us sheet as Feedback. The Japanese review opens in Japanese the first time (unless they've picked a language).
 */
export function PreviewBanner() {
  const { household } = useHousehold()
  const { t, setLang } = useLang()
  const preview = household?.preview
  useEffect(() => {
    if (preview !== "ja") return
    try { if (!localStorage.getItem("ng-lang")) setLang("ja") } catch { /* private mode: stays as it is */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview])
  if (!preview || preview === "demo") return null // a demo link (run 28): the showcase, nothing on top of it
  return (
    <aside aria-label={t.preview.banner} className="preview-banner">
      <p>{t.preview.banner}</p>
      <AskUs feedback><button type="button" className="btn-text min-h-11 text-small">{t.preview.feedback}</button></AskUs>
    </aside>
  )
}
