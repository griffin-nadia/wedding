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
  "story.kidGriffin": {
    en: "A photo of Griffin as a kid, on its way",
    ja: "グリフィンの子どもの頃の写真（準備中）",
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
  "ask.cta": {
    en: "Still wondering? Ask Griffin & Nadia",
    ja: "ほかに気になることは？グリフィンとナディアに聞く",
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
  "ask.failed": {
    en: "We couldn't send that just now. Try again, or email us at",
    ja: "今は送れませんでした。もう一度お試しいただくか、こちらへメールしてください：",
  },
  "ask.busy": {
    en: "That's a few questions in a row. Try again in a little while.",
    ja: "続けてのご質問が多いようです。少し時間をおいてお試しください。",
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
  // A way to actually message them where the copy says to (18e journey map): the wedding address already used on the
  // no-invite page
  "contact.emailUs": {
    en: "Email Griffin & Nadia",
    ja: "グリフィンとナディアにメールする",
  },
  "faqs.contactDay": {
    en: "On the day, call Jehan or Noya. We'll add their numbers closer to the time.",
    ja: "当日は、ジェハンかノヤにご連絡ください。電話番号は日が近づいたらここに載せます。",
  },
} as const

/**
 * New Japanese lines written by us, not by a native speaker: each needs a native read before launch
 * (`npm run check:pending` lists them). The text is as it stands in ja.ts (the music credit in art.ts); a unit test
 * keeps them the same.
 * When one has been read (and corrected in ja.ts), delete it here.
 */
export const JA_TO_READ: { key: string; ja: string }[] = [
  { key: "rsvp.dietaryOther", ja: "詳しく教えてください（任意）" },
  { key: "rsvp.searchSong", ja: "検索" },
  { key: "rsvp.useTyped", ja: "入力したとおりに使う" },
  { key: "rsvp.songResults", ja: "件見つかりました" },
  { key: "rsvp.listResults", ja: "件の候補" },
  { key: "flying.placeholder", ja: "都市名を入力して探す" },
  { key: "flying.noMatch", ja: "見つかりません。「その他」を選んでください。" },
  { key: "faqs.wear.a", ja: "会場周辺は石畳なので、歩きやすい靴でどうぞ。" },
  { key: "faqs.visa.q", ja: "ビザは必要ですか？" },
  { key: "faqs.visa.a", ja: "帰国日から6か月以上の有効期限があるか、パスポートを確認してください。くわしくは「アクセス」のページへ。" },
  { key: "faqs.plusOne.a", ja: "不明な点は、メッセージか griffinandnadia@gmail.com までどうぞ。" },
  { key: "faqs.whoMade.q", ja: "このサイトはどなたが作ったのですか？" },
  { key: "faqs.whoMade.a", ja: "ナディアの兄のジェハンがデザインと制作をしました。絵はナディア、写真はわたしたちのものです。" },
  { key: "travel.flyingBody.haruka", ja: "外国のパスポートで入国する方は、JR西日本の「HARUKA One-way Ticket」（京都まで2,200円）を出発前にオンラインで購入できます。日本国内では販売されておらず、JRの駅でパスポートを見せて受け取ります。" },
  { key: "music.credit.ja", ja: "「A Town With an Ocean View」（久石譲）" },
]

/**
 * Still waiting on Griffin and Nadia but not standing in anywhere on the site yet (so not in PENDING): what's
 * needed, and where it goes once it arrives. `npm run check:pending` lists these too. Delete a line when it lands.
 */
export const WAITING: { key: string; what: string }[] = [
  { key: "fortunes.confirm", what: "The 12 fortunes (src/content/en.ts FORTUNES, or the Content tab): confirmed by Griffin and Nadia, especially the six travel tips" },
  { key: "art.mapleLeaf", what: "Nadia's maple leaf on its own (it's only on the closed envelope so far), for wherever a leaf shows alone" },
  { key: "day.arrivalTime", what: "What time guests should arrive on the day (The day and the invite email; nothing says it yet)" },
  { key: "contact.dayDetails", what: "Jehan's and Noya's numbers for the day (the Content tab's contact_day replaces the FAQs line)" },
]

export type PendingKey = keyof typeof PENDING
export const pending = (key: PendingKey, lang: "en" | "ja") => PENDING[key][lang]
