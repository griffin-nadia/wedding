import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/layout"
import { Toaster } from "@/components/ui/sonner"
import { HouseholdProvider, useHousehold } from "@/lib/household"
import { LangProvider, useLang } from "@/lib/lang"
import { DayPage } from "@/pages/day"
import { HomePage } from "@/pages/home"
import { NoInvitePage } from "@/pages/no-invite"
import { QaPage } from "@/pages/qa"
import { TravelPage } from "@/pages/travel"

function Gate() {
  const { status } = useHousehold()
  const { t } = useLang()
  if (status === "loading") return <p role="status" className="py-24 text-center text-muted-foreground">{t.loading}</p>
  if (status !== "ready") return <NoInvitePage reason={status} />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="the-day" element={<DayPage />} />
        <Route path="travel" element={<TravelPage />} />
        <Route path="qa" element={<QaPage />} />
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
        <Toaster position="top-center" />
      </HouseholdProvider>
    </LangProvider>
  )
}
