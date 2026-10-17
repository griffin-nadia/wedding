import { CurrentSite } from "../../current"

/** The site as it is today: the dock on phones, the top bar from 768, a sliding sage marker. */
export default function NavCurrent() {
  return <CurrentSite path="/" title="The site today" />
}
