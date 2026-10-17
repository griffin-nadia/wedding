import { CurrentSite } from "../../current"

/** Home as guests see it today: the real page in the lab's frame, for comparing against the takes beside it. */
export default function HomeCurrent() {
  return <CurrentSite path="/" title="Home today" />
}
