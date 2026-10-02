// All the words on the site, in Nadia and Griffin's own wording (from the planner's Inv details tab).
// Edit here (or later, the Content tab in the data sheet) rather than inside components.
// Japanese lives in ja.ts with the same shape. Anything missing there falls back to English.

export const en = {
  meta: {
    shortTitle: "N&G",
    title: "Nadia & Griffin",
    eyebrow: "The Super Duper Wedding Extravaganza",
    fullTitle: "Nadia Baguley and Griffin Suddaby Super Duper Wedding Extravaganza",
  },
  nav: { home: "Home", day: "The day", travel: "Travel", qa: "Q&A" },
  home: {
    greeting: (names: string) => `Hi ${names}`,
    intro:
      "To celebrate our love and start the next chapter of our story, we wanted to bring friends and families together to the place where it all started.",
    intro2:
      "We understand that the destination is a bit farther than the venue down the road, so we want to make the trip fun, easy, and memorable for all of you.",
    rsvpLabel: "Your RSVP",
    rsvpNotDone: "Not done yet",
    rsvpDue: "Please RSVP by 15 February 2027",
    rsvpButton: "RSVP for your household",
    rsvpDone: "You're all set",
    rsvpChange: "Change my RSVP",
    countdown: { days: "days", hours: "hours", mins: "mins" },
    nextUp: "Next up",
  },
  day: {
    title: "The day",
    date: "Friday 15 October 2027",
    venue: "The Sodoh Higashiyama, Kyoto",
    address: "366 Yasaka Kamimachi, Higashiyama Ward, Kyoto 605-0827, Japan",
    schedule: [
      { time: "11:00", label: "Ceremony", where: "The Garden" },
      { time: "12:00", label: "Cocktail hour", where: "Until 1:00" },
      { time: "1:00", label: "Reception", where: "The Terrace, until 3:30" },
    ],
    japanTime: "All times are Japan time.",
    addToCalendar: "Add to calendar",
    openMap: "Open the map",
  },
  travel: {
    title: "Before you fly",
    lead: "Check your travel information is all up to date!",
    items: [
      { title: "Passport", body: "Please ensure your passport is valid for at least 6 months past your return date. If you need to renew your passport, please do so soon! Aussies don't need a visa for a short trip to Japan." },
      { title: "Flights", body: "Please book flights as early as you can. The date of the wedding is locked in, so no chance of missing it! If you can, please take the opportunity to enjoy Japan while you are here. We will have suggestions for activities for several days leading up to the wedding, and encourage you to stick around for a few days after if you are able." },
      { title: "Where to stay", body: "Please book accommodation once you have your flights booked. We will collect some recommendations for hotels or Airbnbs near the venue. Please keep in mind Japanese hotels tend to be quite small and perfunctory, so factor that into your decision-making. If you would like to coordinate with other guests and share accommodation, please do so!" },
      { title: "SIM or pocket wifi", body: "Look into buying a SIM card or pocket wifi for travel! We will provide some recommendations.", links: [
        { label: "Sakura Mobile", href: "https://www.sakuramobile.jp/" },
        { label: "Ninja WiFi", href: "https://ninjawifi.com/en/plan/sim" },
        { label: "Travelkon eSIM", href: "https://www.travelkon.com.au/product-category/esim/esim-asia/japan-esim/" },
      ] },
      { title: "Getting to the venue", body: "From Kyoto Station it's about a 15 minute taxi (around ¥2,000) or bus 206." },
    ],
  },
  qa: {
    title: "Q&A",
    items: [
      { q: "Gifts?", a: "NO GIFTS! We understand the travel is a big ask in itself, so your presence is the present!" },
      { q: "What should I wear?", a: "No specific dress code, wear something that makes you feel like your best self!" },
      { q: "What about food?", a: "The wedding lunch will be catered and the menu will be determined several months before the wedding. Please let us know your dietary requirements in your RSVP!" },
      { q: "Is it a traditional Japanese wedding?", a: "No, it's a relaxed garden wedding with a few Japanese touches. Nothing to learn, just come as you are." },
    ],
    contact: "If you have ANY questions at all please feel free to reach out to either of us at any time - we are always happy to assist whenever we can!",
  },
  rsvp: {
    step: (n: number) => `Step ${n} of 3`,
    whoTitle: "Who's coming?",
    coming: "Coming",
    notComing: "Can't make it",
    foodTitle: "Food and a song",
    dietary: "Any dietary needs?",
    dietaryOptions: ["None", "Vegetarian", "Vegan", "Gluten free", "Allergy (tell us below)"],
    song: "A song for the dance floor?",
    songHint: "Paste a Spotify or YouTube link, or just type it. Song search is coming soon.",
    arrival: "Arriving",
    departure: "Leaving",
    datesHint: "Not booked yet? Add these later.",
    message: "Anything else? (optional)",
    checkTitle: "All good?",
    send: "Send our RSVP",
    next: "Next",
    back: "Back",
    editUntil: "You can change this until the cut-off.",
    done: "Done! See you in Kyoto.",
    doneBody: "We've saved your RSVP and emailed you a copy.",
    error: "Something went wrong saving that. Please try again, or message Nadia.",
  },
  notFound: {
    title: "Can't find your invite?",
    body: "Your invite has its own link. If you've lost it, message Nadia or Griffin and we'll send it again.",
  },
}

export type Content = typeof en
