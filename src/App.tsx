import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/layout"
import { HouseholdProvider, useHousehold } from "@/lib/household"
import { LangProvider, useLang } from "@/lib/lang"
import { HomePage } from "@/pages/home"
import { NoInvitePage } from "@/pages/no-invite"
import { InviteSkeleton } from "@/components/skeleton"

// Pages beyond Home load when first visited, so the greeting paints sooner.
const DayPage = lazy(() => import("@/pages/day").then((m) => ({ default: m.DayPage })))
const TravelPage = lazy(() => import("@/pages/travel").then((m) => ({ default: m.TravelPage })))
const QaPage = lazy(() => import("@/pages/qa").then((m) => ({ default: m.QaPage })))

function Gate() {
  const { status } = useHousehold()
  const { t } = useLang()
  if (status === "loading") return <InviteSkeleton label={t.loading} />
  if (status !== "ready") return <NoInvitePage reason={status} />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="the-day" element={<Suspense><DayPage /></Suspense>} />
        <Route path="travel" element={<Suspense><TravelPage /></Suspense>} />
        <Route path="qa" element={<Suspense><QaPage /></Suspense>} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <LangProvider>
      <HouseholdProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Gate />
        </BrowserRouter>
      </HouseholdProvider>
    </LangProvider>
  )
}
