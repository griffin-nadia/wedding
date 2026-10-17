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
  "faqs.contactDay": {
    en: "We'll add who to call on the day closer to the time.",
    ja: "当日の連絡先は、日が近づいたらここに載せます。",
  },
} as const

export type PendingKey = keyof typeof PENDING
export const pending = (key: PendingKey, lang: "en" | "ja") => PENDING[key][lang]
