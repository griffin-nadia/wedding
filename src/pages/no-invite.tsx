import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"

/** What people see without a working invite: no link, a link we don't know, or no connection. */
export function NoInvitePage({ reason }: { reason: "missing" | "unknown" | "error" }) {
  const { t } = useLang()
  const { retry } = useHousehold()
  const copy = reason === "error" ? t.offline : reason === "unknown" ? t.unknown : t.notFound
  return (
    <div className="mx-auto max-w-md space-y-4 px-5 py-24 text-center">
      <p className="eyebrow">{t.meta.eyebrow}</p>
      <h1 className="title">{copy.title}</h1>
      <p className="text-body">{copy.body}</p>
      {reason === "error" && <Button size="lg" onClick={retry}>{t.offline.retry}</Button>}
    </div>
  )
}
