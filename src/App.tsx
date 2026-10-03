import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { Layout } from "@/components/layout"
import { HouseholdProvider, useHousehold } from "@/lib/household"
import { LangProvider } from "@/lib/lang"
import { ThemeProvider } from "@/lib/theme"
import { SceneDimProvider } from "@/components/letter/letter"
import { Toaster } from "@/components/toast"
import { HomePage } from "@/pages/home"
import { NoInvitePage } from "@/pages/no-invite"

// Pages beyond Home load when first visited, so the greeting paints sooner.
const DayPage = lazy(() => import("@/pages/day").then((m) => ({ default: m.DayPage })))
const TravelPage = lazy(() => import("@/pages/travel").then((m) => ({ default: m.TravelPage })))
const FaqsPage = lazy(() => import("@/pages/faqs").then((m) => ({ default: m.FaqsPage })))
const StoryPage = lazy(() => import("@/pages/our-story").then((m) => ({ default: m.StoryPage })))
// Hidden: the design system (/kit) and the options lab (/lab). Not linked anywhere.
const KitPage = lazy(() => import("@/pages/kit").then((m) => ({ default: m.KitPage })))
const LabPage = lazy(() => import("@/pages/lab").then((m) => ({ default: m.LabPage })))

// Old links to The day's tabs (#getting-there, #stay, #faq) now go to their own pages.
function OldTabs({ children }: { children: React.ReactNode }) {
  const { hash } = useLocation()
  const to = { "#getting-there": "/travel", "#stay": "/travel#stay", "#faq": "/faqs" }[hash]
  return to ? <Navigate to={to} replace /> : <>{children}</>
}

function Gate() {
  const { status } = useHousehold()
  if (/\/kit\/?$/.test(window.location.pathname)) return <Suspense><KitPage /></Suspense>
  if (/\/lab\/?$/.test(window.location.pathname)) return <Suspense><LabPage /></Suspense>
  // While the invite loads, the pages render straight away (the hero paints first);
  // only Home's greeting and RSVP card wait for the household.
  if (status !== "ready" && status !== "loading") return <NoInvitePage reason={status} />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="the-day" element={<OldTabs><Suspense><DayPage /></Suspense></OldTabs>} />
        <Route path="travel" element={<Suspense><TravelPage /></Suspense>} />
        <Route path="faqs" element={<Suspense><FaqsPage /></Suspense>} />
        <Route path="our-story" element={<Suspense><StoryPage /></Suspense>} />
        <Route path="rsvp" element={<Navigate to="/?rsvp=1" replace />} />
        <Route path="getting-there" element={<Navigate to="/travel" replace />} />
        <Route path="stay" element={<Navigate to="/travel#stay" replace />} />
        <Route path="qa" element={<Navigate to="/faqs" replace />} />
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
      <SceneDimProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Gate />
        </BrowserRouter>
        <Toaster />
      </SceneDimProvider>
      </HouseholdProvider>
    </LangProvider>
    </ThemeProvider>
  )
}
