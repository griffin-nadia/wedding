# The sheets (Site-Data)

Every tab in the site data sheet, in its tidy order, and what each column holds. Owned by the wedding Gmail; only
Griffin, Nadia and Jehan can open it. Columns are found by their heading: never rename a column or a tab (moving a
column is fine everywhere except Questions, which the site fills left to right). Guests' own words are stored with a
leading `'` so they stay plain text. [data-model.md](data-model.md) has the older, shorter version; the menu is in
[apps-script/README.md](../apps-script/README.md).

## Tidy the sheets

Two menu items under **Wedding site**:

- **Tidy the sheets (report)** changes nothing. It lists every change the tidy would make, tab by tab, and every row
  and column that would move to Archive, by row number.
- **Tidy the sheets: do it** asks first, then makes exactly those changes (worked out again at that moment, under the
  same lock replies save under). Safe to run again: the second time it only refreshes the To look at box.

What it does:

- **Tab order:** Summary, Guests, RSVPs, Questions, Songs, Content, How to update, any others (Emails), then Crew, Log
  and Archive at the end.
- **Every data tab** (Guests, RSVPs, Questions, Songs, Content, Emails, Crew, Log): the header row frozen and bold,
  the filter on, light grey banding, column widths that fit what's in them, and dates that read like
  `3 Oct 2026, 9:41 am` in the time columns (Time, Responded at, Added at, First opened, Last opened, Started RSVP,
  Invite sent, Sent, Seen at). Arriving and Leaving stay as the `2027-10-12` the site saved, as text.
- **Seen tickboxes** at the end of RSVPs and Questions.
- **Questions:** the Status dropdown (new, answered, published) and a honey colour on rows still new.
- **RSVPs:** a honey "Changed" highlight on a reply the household saved again after you ticked Seen.
- **Empty rows:** a tickbox column made the old way held an unticked box on all 1,000 rows, so the next new row landed
  at row 1001 (Questions). The tidy clears those boxes on empty rows (the tickboxes stay) and moves any rows below the
  gap up, in order, so new rows land straight under the others.
- **Archive:** Log rows from before the first real invite went out (the test era) and stale helper columns (an empty
  column under a heading the site doesn't use, or a column with something in it but no heading) are copied to the
  Archive tab exactly as they are, checked, and only then taken out of their tab. A column with something in it under
  a heading of its own is left alone and listed, in case it's someone's notes. Nothing is ever deleted.
- **Summary:** the To look at box at the top (below).
- **How to update:** "Your weekly 5 minutes" at the top (below).

## Your weekly 5 minutes

1. Open Summary. The To look at box at the top has everything new (it refreshes when you open the sheet).
2. Work through it. Each line is a link: click it to jump to that row.
3. Tick Seen on each reply and question you've read. If a household changes their reply after that, its row lights
   up (Changed) and it's back in the box.
4. Answer questions: type the Answer (and Answer (ja) if you can) and set Status to answered.
5. Tick Publish to put the answer in the FAQs. The household gets it by email and Status turns to published.

## Summary

Your counts and the funnel, typed by hand (the tidy never changes them). Once the tidy has run, the first 13 rows are
the **To look at** box, rewritten every time the sheet opens (or with "Refresh the To look at box"):

| Column | Lists | Links to |
| --- | --- | --- |
| New questions | Questions still new (Status new or empty) and not ticked Seen | Their Questions row |
| New or changed replies | "New:" replies not ticked Seen; "Changed:" replies saved again since Seen was ticked | Their RSVPs row |
| Not replied yet | Households with a link and no RSVPs row | Their first Guests row |
| Dietary needs | Everyone coming with a dietary need: name, household, need | Their Guests row |

Up to 10 lines each; a longer list ends "and N more in <tab>". Don't type in those 13 rows: they're rewritten.

## Guests (one row per person, typed by us; the site fills the answers)

| Column | Notes |
| --- | --- |
| Household | How the household is greeted. The same for everyone in it |
| Guest ID | Unique per person (g001) |
| First name | `Guest` for an unnamed plus one; the household can name them |
| Last name, Phone | Optional |
| Email | Invites and confirmations. Anyone in the household can have one |
| Token, Link | Filled by "Make tokens + links". The same for the whole household |
| Attending | yes / no, from the site |
| Dietary | From the site; cleared when someone isn't coming |
| Notes | Ours. "Possible duplicate: <household>" is added when a plus one's name matches someone else |
| Invite sent | Filled by "Send invites" |
| First opened, Last opened, Opens, Started RSVP | Visits, counted only here (opens within 10 minutes count once) |
| Stamps | The stamp book, from the site |
| Flying from, Flying id, Flying region, Flying country, Flying lat, Flying lon | The city they picked, for the journey map (counts only, never names) |

## RSVPs (one row per household, written by the site)

| Column | Notes |
| --- | --- |
| Token, Household | Who |
| Arriving, Leaving | Their travel dates, as text (2027-10-12) |
| Message | Their message to you |
| Responded at | The last time they saved |
| Photos OK | yes / no |
| Seen | Tick when you've read it |
| Seen at | Filled in when you tick Seen (cleared when you untick). A later Responded at lights the row up: Changed |

## Questions (Ask us, written by the site)

| Column | Notes |
| --- | --- |
| Time, Household, Token, Email, Question | Who asked what. No Token for "can't find your invite" questions |
| Status | new / answered / published (published is set when the answer's sent) |
| Answer, Answer (ja) | Yours |
| Publish | Tick to show it in the FAQs' "You asked" and email it to them |
| Sent | When the answer was emailed |
| Seen | Tick when you've read it |

## Songs (one row per pick, at most 3 per household)

Token, Household, Song, Added at.

## Content (made by the menu, edited by Nadia)

Key, Text, Notes. Fortunes (`fortune_1`…), Our story (`story_1_title`, `story_1_year`, `story_1_body`… up to 6),
`mode` (invite, week-of, keepsake) and `contact_day`. Edit Text only; changes show on the site straight away.

## How to update

Plain notes for Griffin and Nadia: "Your weekly 5 minutes" at the top, then the older notes (what the visit columns
mean, and anything else typed there).

## Emails (made by the menu)

Key, Text, Notes. Edit Text to change the invite, reminder and final numbers wording.

## Crew (made by "Make crew links")

Name, Role, Token, Kit link, Lab link. Four people, no guest data.

## Log (every save and send, written by the site)

| Column | Notes |
| --- | --- |
| Time, Household, Kind | When, who, and what kind (First reply, Changed reply, Invite sent, Reminder sent…) |
| Coming, Not coming, Dietary, Songs, Dates, Message | The reply as it stood after the save |
| Flag | Needs a look (honey row): now can't make it, possible duplicate. Sage row: they wrote a message |
| What changed | In words: "Sam: coming → can't make it" |
| Token, Payload | The household and the cleaned data that was saved |

## Archive (made by the tidy)

Blocks, newest at the bottom, each under a bold line saying what it is, where from and when it moved: the moved rows
with their tab's header row above them, or a moved column with its heading on top. Copy anything back by hand if it
ever needs to go back.
