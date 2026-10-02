import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/layout"
import { HouseholdProvider, useHousehold } from "@/lib/household"
import { LangProvider } from "@/lib/lang"
import { ThemeProvider } from "@/lib/theme"
import { Toaster } from "@/components/toast"
import { HomePage } from "@/pages/home"
import { NoInvitePage } from "@/pages/no-invite"

// Pages beyond Home load when first visited, so the greeting paints sooner.
const DayPage = lazy(() => import("@/pages/day").then((m) => ({ default: m.DayPage })))
const TravelPage = lazy(() => import("@/pages/travel").then((m) => ({ default: m.TravelPage })))
const QaPage = lazy(() => import("@/pages/qa").then((m) => ({ default: m.QaPage })))
// Hidden living reference of every component (not linked anywhere)
const KitPage = lazy(() => import("@/pages/kit").then((m) => ({ default: m.KitPage })))

function Gate() {
  const { status } = useHousehold()
  if (window.location.pathname.replace(/\/$/, "").endsWith("/kit")) return <Suspense><KitPage /></Suspense>
  // While the invite loads, the pages render straight away (the hero paints first);
  // only Home's greeting and RSVP card wait for the household.
  if (status !== "ready" && status !== "loading") return <main><NoInvitePage reason={status} /></main>
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
    <ThemeProvider>
    <LangProvider>
      <HouseholdProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Gate />
        </BrowserRouter>
        <Toaster />
      </HouseholdProvider>
    </LangProvider>
    </ThemeProvider>
  )
}
