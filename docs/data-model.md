# Data model (site data sheet)

Owned by the wedding Gmail. Only Nadia, Griffin and Jehan have access. Delete guest data about
3 months after the wedding. Columns are found by header name: never rename them or the tabs.

## Guests (one row per person, typed by us)

| Column | Example | Notes |
| --- | --- | --- |
| Household | Sam & Alex | How the household is greeted. Same value for everyone in it |
| Guest ID | g001 | Unique per person |
| First name | Sam | Write `Guest` for an unnamed plus one. The household can name them on the RSVP |
| Last name | | Optional |
| Email | | Invite and confirmation emails. Any person in the household can have one |
| Phone | | Optional |
| Token | k7x2mq9p4r | Filled by the menu. Same for the whole household |
| Link | https://griffin-nadia.github.io/wedding/?h=k7x2mq9p4r | Filled by the menu |
| Attending | yes / no | Written by the site |
| Dietary | Vegetarian | Written by the site. Cleared when someone isn't coming |
| Notes | | Ours |
| Invite sent | 15/10/2026 | Filled by "Send invites" |
| First opened, Last opened, Opens, Started RSVP | | Visits, added automatically at the end. Only in this sheet: no cookies, IPs or trackers. Opens within 10 minutes count once |

## RSVPs (one row per household, written by the site)

Token, Household, Arriving, Leaving, Message, Responded at

## Songs (one row per pick, written by the site, max 3 per household)

Token, Household, Song, Added at

## Log (every save and send, written by the site)

Time, Household, What changed, Token, Payload

"What changed" reads like "First reply: Alex coming (Vegan), Sam can't make it" or
"Sam: coming → can't make it". Payload is the cleaned data that was saved.

## Emails (made by the menu)

Key, Text, Notes. Edit Text to change the invite and reminder wording.

## Funnel

Invited (Invite sent) → opened (First opened) → started (Started RSVP) → replied (RSVPs, Responded at).
