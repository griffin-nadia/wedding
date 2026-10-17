import { CurrentSite } from "../../current"

/** Travel as guests see it today: four sections, one accordion row open at a time. */
export default function TravelCurrent() {
  return <CurrentSite path="/travel" title="Travel today" />
}
