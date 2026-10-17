# Guest journey map

How a guest moves through the site, from the invite email to after the wedding, and where the path stops with
nowhere to go (dead ends). Checked against the code on 18 Oct 2026 (run 18e). Words in quotes are the site's own.

```mermaid
flowchart TD
  email["Invite email<br/>(their own link, ?h=token)"] --> link{Link works?}
  link -- "no link" --> notFound["Can't find your invite?<br/>email → resend link"]
  link -- "unknown link" --> unknown["That link doesn't look right"] --> notFound
  link -- "no connection" --> offline["We couldn't open your invite<br/>Try again"] --> link
  link -- "back end paused" --> paused["Replies are paused<br/>Try again"] --> link
  notFound -- "Send my link" --> email
  notFound -- "Or email" --> mail(["Email Griffin & Nadia"])

  link -- yes --> first{First visit<br/>on this device?}
  first -- yes --> envelope["Envelope<br/>Open your invite"] --> home
  first -- "no, or reduced motion" --> home

  home["Home<br/>names, greeting, countdown"] --> mode{When is it?}
  mode -- "invite, not replied" --> rsvpBtn["RSVP by Mon 15 Feb 2027"]
  mode -- "invite, replied" --> replied["Replied · Change my reply<br/>reply chips"]
  mode -- "after Fri 30 Apr 2027" --> locked{Replied?}
  mode -- "week of the wedding" --> week["The day · Directions"]
  mode -- "after the wedding" --> keepsake["Thank-you letter<br/>Our story"]

  rsvpBtn --> sheet["Reply: 1 Who's coming → 2 Food, song, dates → 3 Check"]
  replied -- "Change my reply / a chip" --> sheet
  sheet -- "Send our reply" --> fortune["Sent letter · draw a fortune"] -- close --> replied
  replied -- "no dates" --> nextDates["Add your travel dates"] --> sheet
  replied -- "dates in" --> nextTrip["Plan your trip"] --> travel

  locked -- yes --> lockedYes["Replied · life happens, message us"] --> nextTrip
  locked -- no --> closed["Replies are closed"] --> mail

  home --- tabs((Tabs))
  tabs --> day["The day<br/>timeline · calendar · print · directions"]
  tabs --> travel["Travel<br/>getting there · stay · before you fly · on the day"]
  tabs --> story["Our story<br/>stops → journey map · see as a list"]
  tabs --> faqs["FAQs"] --> mail
  week --> day
  keepsake --> story
  travel -- "hotel picks, driver card" --> sheets["Sheets: hotel, driver card"] -- close --> travel
  day -- "How to get there" --> travel
```

## Dead ends

| Where | What happened | Status |
|---|---|---|
| Home after Fri 30 Apr, not replied | "Replies are closed now. If something's changed, message Griffin or Nadia." but no way to message them | **Fixed (18e):** an "Email Griffin & Nadia" link under it (`mailto:` the wedding address the no-invite page already uses; label in `pending.ts`) |
| End of FAQs | "Any questions at all, message either of us." with no link | **Fixed (18e):** the same email link after it |
| Home after replying | Replied, chips, then nothing pointing onwards | **Fixed (18e §8):** one next step, "Add your travel dates" or "Plan your trip" |
| No-invite pages (missing or unknown link) | After the frame went in (§5) the card lost its padding there | **Fixed (18e):** the same frame as every page |
| On the day, who to call | "call Jehan or Noya. We'll add their numbers closer to the time." | Waiting on N&G: the numbers (`contact.dayDetails` in `pending.ts` WAITING) |
| Last Travel section, last story stop | The end of the page | Fine: the tabs are always there (dock or bar) |
| Sealed envelope | Only one way on (open it) | Intended: any key, a tap, the label button or a pull all open it |
| Offline or paused | "Try again" only | Intended: nothing else would work without a connection |

Nothing found that traps a guest with no way back: the dock (phones) or the bar (laptops) is on every page past the
envelope, and every sheet closes with Escape, the close button or a tap outside.
