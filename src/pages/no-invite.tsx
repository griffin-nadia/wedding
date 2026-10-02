import { useLang } from "@/lib/lang"

export function NoInvitePage() {
  const { t } = useLang()
  return (
    <div className="mx-auto max-w-md space-y-4 py-24 text-center">
      <p className="eyebrow">{t.meta.eyebrow}</p>
      <h1 className="text-4xl">{t.notFound.title}</h1>
      <p className="text-body">{t.notFound.body}</p>
    </div>
  )
}
