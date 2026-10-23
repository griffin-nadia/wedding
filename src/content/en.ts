// All the words on the site, in Griffin and Nadia's own wording (from the planner's Inv details tab).
// Edit here (or later, the Content tab in the data sheet) rather than inside components.
// Japanese lives in ja.ts with the same shape. Anything missing there falls back to English.

import { DATES } from "@/lib/wedding-dates"
import { fmtDay } from "@/lib/dates"
import { pending } from "./pending"

const DAY = fmtDay(DATES.ceremonyDay) // "Fri 15 Oct 2027"
const LOCK_LONG = new Date(`${DATES.changesLock}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) // "30 April 2027"
// The one change-by line (v3 Q7): Home under the Replied pill, the success screen and the confirmation email.
// Their final wording (Inv details, column E, 22 Oct)
const CHANGE_BY = `You can change your answers any time until ${LOCK_LONG}, and add your travel dates once flights are booked.`
// After the changes lock, in the same places (their wording, planner 7 to 11 Oct)
const CHANGE_AFTER = "We know that life happens, so if you need to make any changes after the 30th of April please contact us directly."

// The couple's names live here once. Swapping the order is this one line.
export const COUPLE = { first: "Griffin", second: "Nadia" }

// The venue for taxi drivers, in one place (Show the driver, the day sheet, Details).
export const VENUE = {
  please: "ここへお願いします",
  nameJa: "ザ・ソウドウ 東山 京都",
  addressJa: "〒605-0827 京都府京都市東山区八坂上町366",
  name: "The Sodoh Higashiyama",
}

// The first fortunes (travel tips, all 大吉): the fallback until the data sheet's Fortunes tab answers (run 23: Nadia's 25)
export const FORTUNES = [
  "Higashiyama is all hills and stone steps. Pack shoes you can walk in.",
  "Mid October days are mild and evenings cool. Bring a light layer.",
  "Many small shops and temples are cash only. Keep some yen on you.",
  "Get an IC card (ICOCA or Suica, or add one to your phone wallet) for buses and trains.",
  "Taxi doors open and close by themselves. Let them.",
  "There's no tipping in Japan. A thank you is plenty.",
  "Rain happens. Any convenience store sells a good umbrella.",
  "Send big bags ahead from the airport with a luggage delivery service.",
  "The temples near the venue are calm before 8 am.",
  "Public bins are rare. Carry a small bag for rubbish.",
  "The Haruka train runs from Kansai Airport to Kyoto Station in about 75 minutes.",
  "You will eat very well.",
]
const A = COUPLE.first
const B = COUPLE.second
// Lines about one of them (their photo, their line on the map) name that person, whatever the order
const NADIA = "Nadia"
const GRIFFIN = "Griffin"
const BOTH = `${A} & ${B}`

export const en = {
  meta: {
    shortTitle: `${A[0]}&${B[0]}`,
    title: `${BOTH}`,
    eyebrow: "The Super Duper Wedding Extravaganza",
    fullTitle: `Griffin Suddaby and Nadia Baguley Super Duper Wedding Extravaganza`,
  },
  nav: { home: "Home", day: "The day", travel: "Travel", faqs: "FAQs", story: "Our story", rsvp: "RSVP" },
  letter: {
    signOff: "With love, G & N",
    credit: "Site by Jehan Baguley",
    skip: "Skip to the letter",
    note: "Open your invite",
    openLabel: (name: string) => `Open your invitation${name ? `, ${name}` : ""}`,
    phoneTitle: "Open on your phone",
    phoneBody: "Scan to take this invite with you.",
  },
  // Photo captions and alt text (the moment, not the file). Captions are placeholders until the couple writes them.
  photos: {
    "couple-kyoto-view": { alt: `${A} and ${B} smiling on a hill above Kyoto, autumn trees behind them`, caption: "Kyoto, where it all started" },
    "kyoto-night": { alt: `${A} and ${B} in a lantern-lit Kyoto lane at night`, caption: "Kyoto, where it all started" },
    "couple-night-lane-2": { alt: `${A} and ${B} in a lantern-lit lane at night`, caption: "Back in Kyoto" },
    "couple-brisbane-market": { alt: `${A} and ${B} at a market in Brisbane`, caption: "Where it all started" },
    "couple-dog-jumper": { alt: `${A} and ${B} with a dog in a jumper`, caption: "A fun one" },
    "trio-mountain-town": { alt: `${A} and ${B} with family in a mountain town`, caption: "A trip with family" },
    "torii-mist": { alt: "A red torii gate in the mist", caption: "Misty torii on the way" },
    "griffin-cedar-forest": { alt: `${GRIFFIN} among tall cedar trees`, caption: `${GRIFFIN} in the cedars` },
    "kid-griffin-1998": { alt: "Griffin as a little boy in his 1998 school photo, in a red T-shirt, smiling", caption: "" },
    "kid-nadia-home": { alt: "Nadia as a little girl at home, her hair in bunches with clips, grinning in a Christmas tree T-shirt", caption: "" },
    "kid-griffin": { alt: "Griffin as a little boy on his first day of school, standing at the front door", caption: "" },
    "kid-nadia": { alt: "Nadia as a little girl in the back seat of a car, in a cap, smiling", caption: "" },
    "couple-osaka-castle": { alt: `${A} and ${B} in front of Osaka Castle`, caption: "If you fly into Osaka, the castle's worth a stop" },
    "yasaka-gate-shijo": { alt: "Looking down Shijo-dori from the gate of Yasaka Shrine", caption: "Looking down Shijo-dori from Yasaka Shrine, 10 minutes' walk from the venue" },
    "higashiyama-bookshop": { alt: "A quiet street and bookshop in Higashiyama", caption: "Higashiyama, the venue's neighbourhood. Kiyomizu-dera is up the hill" },
    "umbrellas-maple-rain": { alt: "Umbrellas under red maple leaves in the rain", caption: "Pack a compact umbrella, October can be wet" },
    "pontocho-lanterns": { alt: "Lanterns along Pontocho alley at night", caption: "Pontocho, ten minutes from the venue" },
    "nara-deer-moss": { alt: "A deer resting on moss in Nara", caption: "Nara is 45 minutes away. Mind your snacks" },
    "nara-deer-nuzzle": { alt: "Two deer nuzzling in Nara", caption: "We can't wait to see you" },
    "stone-lantern-maple": { alt: "A stone lantern framed by maple leaves", caption: "" },
  } as Record<string, { alt: string; caption: string }>,
  story: {
    title: "Our story",
    prevChapter: "Previous chapter", nextChapter: "Next chapter",
    page: (n: number, of: number) => `Chapter ${n} of ${of}`,
    slide: (n: number, of: number) => `${n} of ${of}`,
    kyoto: "Kyoto", brisbane: "Brisbane", canada: "Canada",
    seeList: "See as a list", seeMap: "See the map", next: "Next", done: "Done",
    keepReading: "Keep reading", keepReadingLabel: (title: string) => `Keep reading: ${title}`,
    // Run 25: the chapter and list sheets, and a photo full screen
    backToStory: "Back to the story", openPhoto: (what: string) => `Open the photo: ${what}`, closePhoto: "Close the photo",
  },
  flying: { cities: {} as Partial<Record<string, string>>, title: "Flying from?", endTitle: "Where are you flying from?", hint: "Optional. We only ever show how many, never who.", thanks: "Thanks, got it.", yours: (key: string, city: string) => (key === "Already in Japan" ? "You're already in Japan" : `From ${/^(Somewhere|Elsewhere)/.test(key) ? city.toLowerCase() : city}`), change: "Change", placeholder: "Type your city or town", noMatch: "Nothing found for that.",
    // Run 25: one search for any city or town, or a pin on the map
    dropPin: "Can't find it? Drop a pin instead", pinHint: "Tap the map where you're flying from.", pinCancel: "Cancel", searching: "Looking…" },
  music: { on: "Play music", off: "Pause music" },
  journey: {
    title: "Your journey",
    map: (city: string | null, key?: string) => (key === "Already in Japan" ? "A small map of the way to Kyoto, and you're already in Japan" : city ? `A small map with your line from ${/^(Somewhere|Elsewhere)/.test(key ?? "") ? city.toLowerCase() : city} to Kyoto` : "A small map of the way to Kyoto"),
    review: "Flying from", notSaying: "Not saying",
    onMap: "Your line's on the map", pick: "Pick a city",
    kyoto: "Kyoto · 15 Oct 2027", kyotoPin: "Kyoto, 15 Oct 2027", brisbane: "Brisbane", canada: "Canada", victoria: "Victoria",
    zoomIn: "Zoom in", zoomOut: "Zoom out", households: (n: number) => `${n} households`,
    // Run 25: the stop opens the map full screen, with Globe / Map inside; a chapter's pin goes to its stop
    open: "Full screen", openLabel: "Open the map full screen", close: "Close the map", view: "Globe or map", globe: "Globe", flat: "Map",
    pin: (n: number, title: string, place: string) => `${n ? `Chapter ${n}: ` : ""}${title}, ${place}. Go to its stop`,
    legend: { nadia: NADIA, griffin: GRIFFIN, guests: "Guests", you: "Your line" },
    count: (n: number, of: number) => `${n} of ${of} lines drawn so far`,
    seeList: "See as a list", seeMap: "See the map",
    list: { nadia: `${NADIA}: Brisbane to Kyoto`, griffin: `${GRIFFIN}: Canada to Kyoto`, you: (city: string) => `Your line: ${city} to Kyoto`, city: (city: string, n: number) => `${city}: ${n} ${n === 1 ? "line" : "lines"}` },
  },
  fortune: { title: "A little fortune for the trip", draw: "Draw one", blessing: "大吉", blessingEn: "Great blessing", number: (n: number, of: number) => `No. ${n} of ${of}`, save: "Save to my phone", copied: "Copied. Paste it into your notes.", hint: "Tap the box to draw one.", hintShake: "Tap the box, or give your phone a little shake.", boxLabel: "The fortune box. Draw a fortune", drawing: "Shaking the box…", onMap: "See your line on the map" },
  driver: { label: "Taxi from Kyoto Station", fare: "15 to 20 minutes. Free in an MK Taxi with a ticket from the venue.", show: "Show the driver", maps: "Directions in Google Maps", mapsOpens: "opens Google Maps", english: "Please take me here", done: "Done", copy: "Copy address", copied: "Address copied" },
  countdownMore: {
    until: "until we see you in Kyoto", tomorrow: "Tomorrow", today: "Today's the day", married: "Married",
    andCounting: "and counting", localTitle: (t: string) => `That's ${t} where you are`,
    short: { months: "months", days: "days", hours: "hrs", mins: "mins", secs: "secs", years: "years" },
  },
  theme: { label: "Evening mode" },
  // Review links (run 21): a made-up household for a Japanese reader and for designer friends; nothing is saved
  preview: {
    banner: "Preview: replies aren't saved",
    feedback: "Leave feedback",
    feedbackTitle: "Feedback",
    feedbackLabel: "What reads oddly or looks off?",
    feedbackHelp: "Up to 1,000 characters. The page, theme, screen size and language go with it.",
    feedbackSent: "Thanks, noted.",
  },
  home: {
    pills: { replied: "Replied, thank you" },
    rsvpClosed: `Replies are closed now. If something's changed, message ${A} or ${B}.`,
    dear: (name: string) => `Dear ${name},`,
    /** The greeting's names in this language: "Sam, Alex and your plus one" */
    dearNames: (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] ?? ""),
    yourPlusOne: "your plus one",
    label: `${DAY}, Kyoto`,
    dateLine: `${DAY}, Kyoto`,
    rsvpButton: `RSVP by ${fmtDay(DATES.rsvpBy)}`,
    yourReply: "Your reply",
    todo: { who: "Who's coming", food: "Food", song: "A song", dates: "Travel dates", datesLater: "once you've booked", done: "done", toDo: "not yet" },
    // Their Intro (Inv details, column E, 22 Oct), under "Dear …," as its own paragraphs
    intro: [
      "To celebrate our love and start the next chapter of our story, we're bringing our friends and family together in the place where it all started.",
      "We know Kyoto is a little further than the venue down the road, so we want to make the trip fun, easy and memorable for you. Below is everything you'll need to plan, and we'll keep adding to it.",
    ],
    daysToGo: (n: number) => `${n} days to go`,
    kyotoLine: (time: string) => `it's ${time} in Kyoto`,
    moreLabel: "More about the day",
    links: [
      { to: "/the-day", label: "The day" },
      { to: "/travel", label: "Getting there" },
      { to: "/travel#stay", label: "Where to stay" },
    ],
    rsvpBy: `RSVP by ${fmtDay(DATES.rsvpBy)}`,
    changeReply: "Change my reply",
    changeBy: CHANGE_BY,
    changeAfter: CHANGE_AFTER,
    reseal: "Seal it again",
    week: { greeting: "it's nearly here. Everything for Friday is on The day, and the easiest way there is below. We can't wait to see you.", day: "The day", directions: "Directions in Google Maps" },
    keepsake: { badge: "Married, Fri 15 Oct 2027, Kyoto", greeting: "thank you for coming all this way and for being part of our day. We'll add photos from the day here soon.", story: "Read our story" },
  },
  day: {
    title: "The day",
    date: DAY,
    venue: "The Sodoh Higashiyama, Kyoto",
    addressLines: ["366 Yasaka Kamimachi, Higashiyama Ward", "Kyoto 605-0827, Japan"],
    howToGetThere: "How to get there",
    countdownTitle: "Counting down",
    dateLong: DAY,
    mapAlt: "A drawn map: from Kyoto Station north to Gion-Shijo, then east up the hill to The Sodoh.",
    mapStation: "Kyoto Station", mapGion: "Gion-Shijo", mapVenue: "The Sodoh",
    countdownLabel: "Counting down",
    schedule: [
      { time: "11:00", label: "Ceremony", where: "The Garden" },
      { time: "12:00", label: "Cocktail hour", where: "Until 1:00 pm" },
      { time: "13:00", label: "Reception", where: "The Terrace, until 3:30 pm" },
    ],
    japanTime: "All times are Japan time.",
    localLine: (time: string, day: string, city: string) => `${time} ${day} ${city ? `in ${city}` : "your time"}`,
    timelineLabel: "The day, in order",
    kyotoNow: (time: string) => `It's ${time} in Kyoto right now.`,
    addToCalendar: "Add to calendar",
    googleCalendar: "Google Calendar",
    calendarOpened: "Opened in a new tab. Save it there and you're set.",
    calendarSaved: "Downloaded. Open the file to add the day.",
    appleCalendar: "Apple or Outlook (.ics)",
    print: "Print the day",
    now: "Now",
    rainPlan: "If it rains, the ceremony moves inside to one of the venue's chapels.",
    venueFacts: "The Sodoh was the home of the painter Takeuchi Seihō. Its 1.4-acre garden changes colour with the seasons.",
    gettingTitleJa: "行き方",
    stay: [
      { label: "Gion and Higashiyama", good: "Walk to the venue, the prettiest streets", watch: "Pricier, crowded, hilly stone lanes", maps: "https://www.google.com/maps/search/?api=1&query=Gion+Higashiyama+Kyoto" },
      { label: "Kawaramachi and Shijo", good: "Best all-rounder: food, shops and trains", watch: "Busy, so take a taxi on the night", maps: "https://www.google.com/maps/search/?api=1&query=Kawaramachi+Shijo+Kyoto" },
      { label: "Kyoto Station", good: "Easiest arrivals and day trips", watch: "Less charm, 15 minutes by taxi", maps: "https://www.google.com/maps/search/?api=1&query=Kyoto+Station" },
    ],
    stayGood: "Good",
    stayWatch: "Keep in mind",
  },
  travel: {
    tickHint: "Tick things off as you go. Your ticks stay on this device.",
    ticked: "Done",
    items: [
      // Their final wording (Inv details, column E, 22 Oct): Before you fly, Flights, Accommodation, SIM / wifi
      { title: "Passport", body: "Check your travel information is all up to date! Please ensure your passport is valid for at least 6 months past your return date. If you need to renew your passport, please do so soon!" },
      { title: "Flights", body: "Please book flights as early as you are reasonably able to. The date of the wedding is locked in, so there's no chance of it moving! If you can, please take the opportunity to enjoy Japan while you are here. We will have suggestions for activities for several days leading up to the wedding, and encourage you to stick around for a few days after if you are able." },
      { title: "Where to stay", body: "Once you have your flights booked, you'll need to book somewhere to stay! We will collect some recommendations for hotels and Air BnBs near the venue. Please keep in mind Japanese hotels tend to be quite small and perfunctory, so factor that into your decision-making. If you would like to coordinate with other guests and share accommodation, please do so! If you feel stuck, reach out to us!" },
      { title: "SIM or pocket wifi", body: "Grab an eSIM or pocket wifi before you go. A few we like:", links: [
        { label: "Sakura Mobile", href: "https://www.sakuramobile.jp/" },
        { label: "Ninja WiFi", href: "https://ninjawifi.com/en/plan/sim" },
        { label: "TravelKon eSIM", href: "https://www.travelkon.com.au/product-category/esim/esim-asia/japan-esim/" },
      ] },
    ],
  },
  trail: {
    label: "From Kyoto Station to The Sodoh",
    station: "Kyoto Station", stationNote: "Hachijo exit, taxi rank",
    taxi: "MK Taxi, 15 minutes", taxiNote: "Free with a venue ticket",
    venue: "The Sodoh", venueNote: "Higashiyama",
  },
  kyotoMap: {
    title: "Around the venue",
    intro: "Tap a place to see how it fits together.",
    label: "A simple map of Kyoto: Kyoto Station, Gion-Shijo Station, the Yasaka Pagoda and The Sodoh",
    notToScale: "Not to scale",
    river: "Kamo River",
    taxiRoute: "Taxi from the station",
    walkRoute: "Walk from Gion-Shijo",
    directions: "Directions from here",
    places: [
      { id: "station", name: "Kyoto Station", ja: "京都駅", body: "Where the train from the airport gets in. Taxis wait at the Hachijo exit: about 15 minutes to the venue, and free in an MK Taxi with a ticket from the venue. Bus 206 to Higashiyama Yasui works too.", maps: "https://www.google.com/maps/dir/?api=1&origin=Kyoto+Station&destination=The+Sodoh+Higashiyama+Kyoto" },
      { id: "gion", name: "Gion-Shijo Station", ja: "祇園四条駅", body: "The nearest station. About 10 minutes on foot along old stone lanes, with a few steps.", maps: "https://www.google.com/maps/dir/?api=1&origin=Gion-Shijo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking" },
      { id: "pagoda", name: "Yasaka Pagoda", ja: "八坂の塔", body: "The five-storey pagoda on the lane by the venue. If you can see it, you're nearly there.", maps: "https://www.google.com/maps/search/?api=1&query=Yasaka+Pagoda+Kyoto" },
      { id: "venue", name: "The Sodoh", ja: "ザ・ソウドウ", body: "The venue: 366 Yasaka Kamimachi, Higashiyama. Ceremony in the garden at 11:00 am.", maps: "https://www.google.com/maps/dir/?api=1&destination=The+Sodoh+Higashiyama+Kyoto" },
    ],
  },
  // Nadia's painted map (run 22, behind config.venueMap). Each place's dot on her art, as % of its width and height
  // (measured on venue-map-v2, .brief/tools/r22-hotspots.mjs), and a short note. The labels on her map are English
  // only, so the list under it carries the Japanese too.
  venueMap: {
    title: "Around the venue",
    intro: "Tap a place to see where it is and how to get there.",
    alt: "Nadia's painted map of Higashiyama, Kyoto. Kyoto Station is at the bottom left on the JR line. The Kamo River and the Keihan line run north past Tofukuji, Shichijo, Kiyomizu Gojo, Gion Shijo and Sanjo stations, with Kawaramachi Shopping Street to the west. To the east are Yasaka Shrine, the Yasaka Pagoda, The Sodoh and, up the hill, Kiyomizu-dera.",
    listTitle: "The places on the map",
    // Run 25: the same map full screen, from Travel (under the map) and The day (beside How to get there)
    open: "Open the map", close: "Close the map",
    zoomHint: "Pinch to zoom",
    directions: "Directions in Google Maps",
    places: [
      { id: "venue", name: "The Sodoh", ja: "ザ・ソウドウ", at: [69.7, 44.6], chip: "low", body: "The venue: 366 Yasaka Kamimachi, Higashiyama. Ceremony in the garden at 11:00 am.", maps: "https://www.google.com/maps/dir/?api=1&destination=The+Sodoh+Higashiyama+Kyoto" },
      { id: "station", name: "Kyoto Station", ja: "京都駅", at: [27.1, 77.4], chip: "right", body: "Where the train from the airport gets in. Taxis wait at the Hachijo exit: about 15 minutes to the venue, free in an MK Taxi with a ticket from the venue.", maps: "https://www.google.com/maps/dir/?api=1&origin=Kyoto+Station&destination=The+Sodoh+Higashiyama+Kyoto" },
      { id: "gojo", name: "Kiyomizu Gojo Station", ja: "清水五条駅", at: [48.1, 46.3], chip: "right", body: "On the Keihan line. The venue is about 20 minutes on foot from here, uphill.", maps: "https://www.google.com/maps/dir/?api=1&origin=Kiyomizu-Gojo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking" },
      { id: "gion", name: "Gion Shijo Station", ja: "祇園四条駅", at: [55.8, 20.7], chip: "right", body: "On the Keihan line, at the bottom of Shijo-dori. About 10 minutes on foot to the venue along old stone lanes, with a few steps.", maps: "https://www.google.com/maps/dir/?api=1&origin=Gion-Shijo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking" },
      { id: "sanjo", name: "Sanjo Station", ja: "三条駅", at: [55.8, 6.9], chip: "left", body: "On the Keihan line, the top of the map: close to Kawaramachi's shops and restaurants.", maps: "https://www.google.com/maps/search/?api=1&query=Sanjo+Station+Kyoto" },
      { id: "shichijo", name: "Shichijo Station", ja: "七条駅", at: [48.1, 64.2], chip: "right", body: "On the Keihan line, one stop south of Kiyomizu Gojo.", maps: "https://www.google.com/maps/search/?api=1&query=Shichijo+Station+Kyoto" },
      { id: "tofukuji", name: "Tofukuji Station", ja: "東福寺駅", at: [50.8, 90.3], chip: "left", body: "Where the JR Nara line from Kyoto Station meets the Keihan line. Tofuku-ji temple, known for its autumn maples, is a short walk away.", maps: "https://www.google.com/maps/search/?api=1&query=Tofukuji+Station+Kyoto" },
      { id: "kawaramachi", name: "Kawaramachi Shopping Street", ja: "河原町", at: [50, 13.1], chip: "right", body: "Kyoto's main shopping street, with covered arcades running off it. Good for food and a wander.", maps: "https://www.google.com/maps/search/?api=1&query=Kawaramachi+Kyoto" },
      { id: "shrine", name: "Yasaka Shrine", ja: "八坂神社", at: [68, 25.2], chip: "right", body: "At the top of Shijo-dori, open day and night. About 10 minutes on foot from the venue.", maps: "https://www.google.com/maps/search/?api=1&query=Yasaka+Shrine+Kyoto" },
      { id: "pagoda", name: "Yasaka Pagoda", ja: "八坂の塔", at: [66.9, 49.9], chip: "right", body: "The five-storey pagoda on the lane by the venue. If you can see it, you're nearly there.", maps: "https://www.google.com/maps/search/?api=1&query=Yasaka+Pagoda+Kyoto" },
      { id: "kiyomizu", name: "Kiyomizu-dera", ja: "清水寺", at: [85.7, 64.7], chip: "above", body: "The temple on the hill above the venue, with its big wooden stage over the trees.", maps: "https://www.google.com/maps/search/?api=1&query=Kiyomizu-dera+Kyoto" },
    ] as { id: string; name: string; ja: string; at: [number, number]; chip: "left" | "right" | "above" | "low"; body: string; maps: string }[],
  },
  getting: {
    title: "Getting there",
    ticked: (n: number, of: number) => `${n} of ${of} ticked off`,
    tick: (what: string) => `Done: ${what}`,
    intro: "From the airport to the garden, in the order you'll need it.",
    rowsLabel: "Getting there, step by step",
    beforeTitle: "Before you fly",
    onThisPage: "On this page",
    rows: { passport: "Passport and visas", flights: "Flights and flying in", insurance: "Travel insurance", booking: "Booking somewhere to stay", phones: "Phones, money and plugs", weather: "Weather and what to pack", medicines: "Medicines", onTheDay: "Getting around on the day" },
    insuranceBody: "Get travel insurance when you book your flights, so you're covered if plans change before the trip.",
    stayOpens: "Opens in Maps",
    onTheDayTitle: "On the day",
    toKyotoTitle: "Getting to Kyoto",
    tokyoTitle: "Coming from Tokyo",
    seeOnMap: "See it on a map",
    seeStay: "See where to stay",
    flyingTitle: "Flying in",
    flyingBody: "Osaka (Kansai, KIX) is the easiest way in. Jetstar flies direct from Brisbane in about 9 hours; from Melbourne it's one stop. The Haruka train gets you from the airport to Kyoto Station in about 75 minutes. Visitors on a foreign passport can buy JR West's HARUKA One-way Ticket (¥2,200 to Kyoto) online before you fly; it isn't sold in Japan, and you collect it at a JR station with your passport. The limousine bus is about ¥2,800 and easier with big bags.",
    tokyoBody: "Coming from Tokyo? The bullet train takes about 2¼ hours. Book a Nozomi a month ahead in busy weeks, and sit on the E side for Mt Fuji.",
    walkingTitle: "Walking in",
    walkingBody: "10 minutes from Gion-Shijo, along old stone lanes with a few steps. Lovely, but take a taxi in nice shoes.",
    shuttleTitle: "Free taxi from the station",
    shuttleBody: "The venue shuttle only runs on weekends, so instead the venue is giving us free MK Taxi tickets from Kyoto Station to The Sodoh. They only work in MK Taxis. We'll let you know how to get yours closer to the day.",
    earlyTitle: "Arriving early?",
    earlyBody: "Drop your bags at Kyoto Station (Hands Free Kyoto) and they'll be at your hotel by evening.",
    links: {
      haruka: { label: "HARUKA One-way Ticket", href: "https://www.westjr.co.jp/travel-information/en/tickets-passes/oneway/haruka/" },
      flights: { label: "Compare flights", href: "https://www.google.com/travel/flights?q=Flights%20to%20KIX" },
      trains: { label: "Train times and routes (NAVITIME)", href: "https://japantravel.navitime.com/en/" },
      walk: { label: "Walking route", href: "https://www.google.com/maps/dir/?api=1&origin=Gion-Shijo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking" },
      smartraveller: { label: "Check Smartraveller", href: "https://www.smartraveller.gov.au/destinations/asia/japan" },
    },
    tips: [
      "Mid October is about 23°C by day and 14°C at night, with some rainy days. Bring a light jacket, shoes that grip on stone and a compact umbrella.",
      "Cards work in most places but carry some cash. 7-Eleven and Japan Post ATMs take foreign cards. An eSIM is the easiest way to stay online. Plugs are type A, 100V.",
      "Some medicines, like codeine, need a permit in Japan. Carry your scripts and a doctor's letter.",
    ],
  },
  stay: {
    title: "Where to stay",
    // The first sentence is the summary line at the top of Travel. The rest is their Accommodation wording (column E,
    // 22 Oct), with the accommodation tax kept in
    intro: "Book early: mid October is busy in Kyoto. Please keep in mind Japanese hotels tend to be quite small and perfunctory, so factor that into your decision-making. Kyoto adds a small accommodation tax per person per night. If you would like to coordinate with other guests and share accommodation, please do so! If you feel stuck, reach out to us!",
    mapLink: "See the three areas on a map",
    mapHref: "https://www.google.com/maps/search/?api=1&query=Gion+Kawaramachi+Kyoto+Station",
    // Their picks (planner, 7 to 11 Oct): rough prices per night
    picks: {
      title: "Our picks",
      note: "Links go to each hotel's own site, but we encourage you to compare other booking sites. Prices may change, and some hotels may not make rooms available until 6 months before. It will most likely be cheaper per person to book for larger groups: even 4 people is better than 2.",
      hotelsTitle: "Hotels",
      airbnbsTitle: "Airbnbs",
      airbnbsNote: "Cheaper per person when you split one.",
      perNight: (price: string) => `${price} a night`,
      sleeps: (n: string) => `Sleeps ${n}`,
      opensHotel: "opens the hotel's site",
      opensAirbnb: "opens Airbnb",
      filterLabel: "Filter by area",
      count: (n: number) => (n === 1 ? "1 place" : `${n} places`),
      hotels: [
        { name: "Kyoto Century Hotel", area: "Kyoto Station", price: "~$150 AUD", note: "", href: "https://www.kyotocenturyhotel.jp/" },
        { name: "Mercure Kyoto Station", area: "Kyoto Station", price: "~$150–180 AUD", note: "", href: "https://all.accor.com/hotel/B4F4/index.en.shtml" },
        { name: "Daiwa Roynet Hotel Kyoto Ekimae PREMIER", area: "Kyoto Station", price: "~$110 AUD", note: "", href: "https://www.daiwaroynet.jp/en/kyoto-ekimae/" },
        { name: "ASAI Kyoto Shijo", area: "Gojo", price: "from ~$100 AUD", note: "Between Kyoto Station and Gion-Shijo", href: "https://www.dusit.com/asai-kyoto/" },
        { name: "Rinn Kitagomon", area: "Kiyomizu-Gojo", price: "from ~$150 AUD", note: "Closer to the venue", href: "https://rinn-kyomachi.com/en/list/rinn-kitagomon/" },
        { name: "DoubleTree by Hilton Kyoto Higashiyama", area: "Kiyomizu-Gojo", price: "from ~$200 AUD", note: "Next to a station", href: "https://www.hilton.com/en/hotels/itmhadi-doubletree-kyoto-higashiyama/" },
      ],
      airbnbs: [
        { area: "Kiyomizu-Gojo", sleeps: "8", price: "~$320", note: "Not right next to a station, but achievable", href: "https://www.airbnb.com.au/rooms/32966481" },
        { area: "Kiyomizu-Gojo", sleeps: "4", price: "~$400", note: "", href: "https://www.airbnb.com.au/rooms/1682420188495547858" },
        { area: "Kiyomizu-Gojo", sleeps: "8", price: "~$400", note: "Not right next to a station, but achievable", href: "https://www.airbnb.com.au/rooms/1541783233800920181" },
        { area: "Kiyomizu-Gojo", sleeps: "4 to 5", price: "~$450", note: "4 might be better", href: "https://www.airbnb.com.au/rooms/1735167450296336070" },
        { area: "Higashiyama", sleeps: "4", price: "~$450", note: "", href: "https://www.airbnb.com.au/rooms/29807727" },
        { area: "Near The Sodoh", sleeps: "6", price: "~$460", note: "One bedroom is the living room. Very close to the venue, but not close to a station", href: "https://www.airbnb.com.au/rooms/15104813" },
        { area: "Sanjo", sleeps: "9", price: "~$660", note: "", href: "https://www.airbnb.com.au/rooms/1456233517873267728" },
      ],
    },
  },
  qa: {
    title: "FAQs",
    // In the order guests wonder (run 19): the invite, the day, the trip, then the site. Answers are pending.ts, for
    // Griffin and Nadia to tweak. The music credit is said here only.
    items: [
      { q: "Can I bring someone?", a: pending("faqs.bring.a", "en") },
      { q: "Is it a traditional Japanese wedding?", a: pending("faqs.style.a", "en") },
      // Their Dress code, Dietary and Gifts (column E, 22 Oct; "foorwear" fixed to "footwear")
      { q: "What should I wear?", a: "No dress code. Wear whatever makes you feel like your best self. Please keep in mind that the area around the venue has cobble stone streets so please bring appropriate footwear." },
      { q: "What about food?", a: "Please provide your dietary requirements! The wedding lunch will be catered and the menu will be determined several months before the wedding." },
      { q: "Gifts?", a: "NO GIFTS! We understand the travel is a big ask in itself, so your presence is the present!" },
      { q: "Do I need a visa?", a: pending("faqs.visa.a", "en") },
      { q: "What happens to my details?", a: pending("faqs.details.a", "en") },
      // Run 26: Jehan's wording, as written. The song title (ART.music.title) is the link to the track
      { q: "Who made this site?", a: "A proper family effort. Griffin wrote the words, Nadia drew everything you can see, and Jehan built the whole site. The music is A Town With an Ocean View by Joe Hisaishi, played on piano by Piano ZeroL." },
    ],
    onTheDay: "On the day, contact",
    // Their Questions (column E, 22 Oct): the line above Ask us at the end of FAQs
    contact: "If you have ANY questions at all please feel free to reach out to either of us at any time - we are always happy to assist whenever we can!",
  },
  rsvp: {
    step: (n: number, of = 3) => `Step ${n} of ${of}`,
    whoTitle: "Who's coming?",
    coming: "Coming",
    notComing: "Can't make it",
    foodTitle: "Food and a song",
    noteTitle: "Anything to tell us?",
    dietary: "Any dietary needs?",
    dietaryOptions: ["Vegetarian", "Vegan", "Gluten free", "Dairy free", "Halal", "Kosher", "Nut allergy", "Shellfish allergy", "Egg allergy", "Other"],
    dietaryOther: "Tell us more (optional)",
    answerMissing: (name: string) => `Choose coming or can't make it for ${name}.`,
    close: "Close",
    song: "A song for the dance floor?",
    songHint: "Search by song or artist, or just type it",
    searching: "Searching…",
    searchSong: "Search",
    useTyped: "Use what I typed",
    songResults: (n: number) => `${n} found`,
    listResults: (n: number) => `${n} ${n === 1 ? "result" : "results"}`,
    changeSong: "Change",
    noMatch: (q: string) => `Nothing matched. Add "${q}" as you typed it`,
    searchError: "Search isn't working right now. Just type it in.",
    removeSong: (s: string) => `Remove ${s}`,
    songsFull: (n: number) => `${n} songs added. Remove one to change it.`,
    songsAdded: "Your songs",
    edit: (what: string) => `Edit ${what}`,
    editShort: "Edit",
    noMessage: "No message",
    songPlaceholder: "Search for a song",
    arrival: "Arriving",
    departure: "Leaving",
    datesHint: "Not booked yet? Add these later.",
    dateRange: `Pick dates between ${fmtDay(DATES.travelFrom)} and ${fmtDay(DATES.travelTo)}.`,
    dateOrder: "Pick a leaving date on or after your arrival.",
    message: "Anything else? (optional)",
    checkTitle: "All good?",
    send: "Send our reply",
    next: "Next",
    back: "Back",
    bringing: "Bringing someone?",
    plusOne: "Their name",
    plusOneName: "Your plus one",
    notSet: "not set",
    stayLine: { both: (a: string, d: string) => `${a} to ${d}`, from: (a: string) => `From ${a}, leaving date to come`, until: (d: string) => `Leaving ${d}, arrival date to come` },
    songs: "Songs",
    messageLabel: "Message",
    dates: "Dates",
    noSongs: "None yet",
    doneTitle: { all: "You're all set", none: "Thanks for letting us know", mixed: "Thanks, got it" },
    backHome: "Back to your invite",
    sentLine: `Sent. ${CHANGE_BY}`,
    updatedLine: `Updated. ${CHANGE_BY}`,
    savingQuiet: "Sending…",
    savedOffline: "Saved on this phone. It'll send when you're back online.",
    changeReply: "Change my reply",
    plusOneHint: "Leave it blank if you're not sure yet.",
    offline: "You're offline. We'll send it when you're back.",
    doneBodyEmail: "We've emailed you a copy.",
    doneBodyNoEmail: "Come back here any time to change it.",
    errors: {
      closed: `Replies are closed now. Message ${A} or ${B}.`,
      busy: "We couldn't send that just now. Your answers are still here, so try again.",
      network: "We couldn't get through. Check your connection and try again.",
      not_found: `We couldn't find this invite. Message ${A} or ${B}.`,
      paused: "Replies are paused for a moment, try again later.",
      other: `We couldn't send that. Your answers are still here, so try again, or message ${A} or ${B}.`,
    },
    tryAgain: "Try again",
    photos: "Happy for photos with you in them to be shared with other guests",
    privacy: `Only ${A} and ${B} see your reply.`,
  },
  notFound: {
    title: "Can't find your invite?",
    body: `Your invite has its own link. Pop in your email and we'll send it again, or message ${A} or ${B}.`,
    emailLabel: "Your email",
    helper: "The one your invite went to. We'll email your link again.",
    message: `Or email ${BOTH}`,
    send: "Send my link",
    sending: "Sending…",
    sent: "If that email's on our list, your link is on its way. Check junk too.",
    badEmail: "That doesn't look like an email address.",
    failed: `We couldn't send that just now. Try again, or message ${A} or ${B}.`,
  },
  unknown: {
    title: "That link doesn't look right",
    body: `We couldn't find an invite for this link. Check it's the full link from your email, or message ${A} or ${B} and we'll send it again.`,
  },
  // The back end is locked or suspended by Google (a calm note, not an error): docs/if-google-locks-it.md
  paused: { title: "Replies are paused for a moment", body: "Try again later.", retry: "Try again", line: "Replies are paused for a moment, try again later." },
  // The back end itself is having trouble (19 Oct 2026): never "that link doesn't look right" for our outage
  trouble: { title: "We're having a little trouble", body: "Try again in a few minutes.", retry: "Try again" },
  offline: {
    title: "We couldn't open your invite",
    body: "It might be your connection. Try again in a moment.",
    retry: "Try again",
  },
  loading: "Opening your invite…",
}

export type Content = typeof en
