/**
 * Copy standing in for words or photos Griffin and Nadia haven't given us yet. Each line is generic, in their voice,
 * the right length for its spot, and makes no claim about facts, dates, places or their story. Every placeholder on
 * the site reads from here, so `npm run check:pending` can list the ones still showing before launch.
 * When the real thing arrives, put it where it belongs (the Content tab, photos, en.ts) and delete its key here.
 */
export const PENDING = {
  "story.chapterBody": {
    en: "We're still writing this part in our own words. Check back closer to the day.",
    ja: "この章は、わたしたちの言葉でまだ書いているところです。もう少しお待ちください。",
  },
  "photo.toCome": {
    en: "A photo to come",
    ja: "写真は準備中です",
  },
  // Home's next step once they've replied (18e): the one thing worth doing next, as a button
  "home.nextDates": {
    en: "Add your travel dates",
    ja: "旅の日程を追加する",
  },
  "home.nextTrip": {
    en: "Plan your trip",
    ja: "旅の計画を立てる",
  },
  // The reply's dates step heading (18f, the old step 2 split into food, song, and dates)
  "rsvp.travelTitle": {
    en: "Your travel dates",
    ja: "旅の日程",
  },
  // Ask us (final run): the sheet that replaces every "email Griffin & Nadia"
  // The end of FAQs (run 19): a line in their voice, then the button
  "ask.button": {
    en: "Ask us",
    ja: "質問する",
  },
  "ask.open": {
    en: "Ask Griffin & Nadia",
    ja: "グリフィンとナディアに聞く",
  },
  "ask.title": {
    en: "Ask Griffin & Nadia",
    ja: "グリフィンとナディアに聞く",
  },
  "ask.label": {
    en: "Your question",
    ja: "ご質問",
  },
  "ask.help": {
    en: "Up to 500 characters. We'll reply as soon as we can.",
    ja: "500文字まで。なるべく早くお返事します。",
  },
  "ask.isThis": {
    en: "Is this it?",
    ja: "こちらでしょうか？",
  },
  "ask.send": {
    en: "Send",
    ja: "送る",
  },
  "ask.sent": {
    en: "Sent. We'll get back to you soon.",
    ja: "送りました。近いうちにお返事します。",
  },
  // Run 26: no email address on the site, so no fallback to one
  "ask.failed": {
    en: "Ask us isn't working right now, please try again later.",
    ja: "ただいま「質問する」がご利用いただけません。しばらくしてからもう一度お試しください。",
  },
  "ask.busy": {
    en: "That's a few questions in a row. Try again in a little while.",
    ja: "続けてのご質問が多いようです。少し時間をおいてお試しください。",
  },
  // Run 26: without an invite it's a message, not only a question
  "ask.message": {
    en: "Your message",
    ja: "メッセージ",
  },
  "ask.name": {
    en: "Your name",
    ja: "お名前",
  },
  "ask.email": {
    en: "Your email",
    ja: "メールアドレス",
  },
  "ask.emailHelp": {
    en: "So we can write back.",
    ja: "お返事のために使います。",
  },
  "ask.youAsked": {
    en: "You asked",
    ja: "いただいたご質問",
  },
  // The FAQ answers (run 19): shorter, in their voice, for Griffin and Nadia to tweak (the questions are in en.ts)
  // Run 25: their last sentence (the planner's Q&A tab, 16 Oct), pointing at Ask us rather than an email address
  "faqs.bring.a": {
    en: "Your invite is for the people named on it. If there's room for a plus one, your reply will ask “Bringing someone?”. Not sure? Send us a message with Ask us below.",
    ja: "招待状はお名前のある方へのものです。お連れの方の枠があれば、お返事で「お連れの方はいらっしゃいますか？」とお聞きします。わからないときは、下の「質問する」からメッセージをどうぞ。",
  },
  "faqs.style.a": {
    en: "Not really. It's a relaxed garden wedding with a few Japanese touches. Nothing to learn, just come as you are.",
    ja: "いいえ、日本らしさを少し添えた、気楽なガーデンウェディングです。覚えることは何もないので、そのままお越しください。",
  },
  "faqs.visa.a": {
    en: "Not for Aussies or Canadians on a short trip. Just check your passport has 6 months left after you fly home. Travel has the rest.",
    ja: "オーストラリアやカナダ国籍の方は、短期の滞在ならビザは不要です。帰国日から6か月以上の有効期限があるか、パスポートだけご確認ください。くわしくは「アクセス」へ。",
  },
  "faqs.details.a": {
    en: "Your reply goes straight to us and no one else will see it. We'll delete it a few months after the wedding.",
    ja: "お返事は私たちにだけ届き、ほかの人が見ることはありません。結婚式の数か月後に削除します。",
  },
  // Their Time (Inv details, column E, 22 Oct): the planner still has to confirm it
  "day.arrival": {
    en: "Arrival time: we're waiting on the planner for this one.",
    ja: "受付開始の時間：いまプランナーに確認中です",
  },
  "faqs.contactDay": {
    en: "On the day we'll let you know who to contact, with numbers added closer to the time.",
    ja: "当日の連絡先は改めてお知らせします。電話番号は日が近づいたらここに載せます。",
  },
} as const

/**
 * Japanese lines still waiting on a native read (`npm run check:pending` lists them; a unit test keeps each the same as
 * on the site). Empty since run 26c: Jehan, 24 Oct, the Japanese is final as it stands, nothing waits on a read.
 */
export const JA_TO_READ: { key: string; ja: string }[] = []

/**
 * Still waiting on Griffin and Nadia but not standing in anywhere on the site yet (so not in PENDING): what's
 * needed, and where it goes once it arrives. `npm run check:pending` lists these too. Delete a line when it lands.
 */
export const WAITING: { key: string; what: string }[] = [
  { key: "art.mapleLeaf", what: "Nadia's maple leaf on its own (it's only on the closed envelope so far), for wherever a leaf shows alone" },
  { key: "day.arrivalTime", what: "What time guests should arrive on the day (The day and the invite email; nothing says it yet)" },
  { key: "contact.dayDetails", what: "Who to contact on the day, and their numbers (the Content tab's contact_day replaces the FAQs line)" },
]

export type PendingKey = keyof typeof PENDING
export const pending = (key: PendingKey, lang: "en" | "ja") => PENDING[key][lang]
