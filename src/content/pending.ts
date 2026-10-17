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
  "faqs.contactDay": {
    en: "We'll add who to call on the day closer to the time.",
    ja: "当日の連絡先は、日が近づいたらここに載せます。",
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
  { key: "faqs.whoMade.q", ja: "このサイトはどなたが作ったのですか？" },
  { key: "faqs.whoMade.a", ja: "ナディアの兄のジェハンがデザインと制作をしました。絵はナディア、写真はわたしたちのものです。" },
  { key: "music.credit.ja", ja: "久石譲「A Town With an Ocean View」（ピアノ：Piano ZeroL）" },
]

export type PendingKey = keyof typeof PENDING
export const pending = (key: PendingKey, lang: "en" | "ja") => PENDING[key][lang]
