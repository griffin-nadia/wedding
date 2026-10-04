// 日本語版 · DRAFT (v3 S). Same shape as en.ts; any line not here falls back to English.
// Drafted for a first look; every line is checked by a native speaker before guests can switch to it
// (the switch is in the crew Options panel only until then). Polite form throughout (です・ます).
import type { Content } from "./en"

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (...a: never[]) => unknown ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] }

const DAY = "2027年10月15日（金）"
const RSVP_BY = "2027年2月15日（月）"
const LOCK = "2027年4月30日（金）"
const CHANGE_BY = `${LOCK}まで、お返事は変更できます。`

export const ja: DeepPartial<Content> = {
  meta: { title: "ナディア & グリフィン" },
  nav: { home: "ホーム", day: "当日", travel: "アクセス", faqs: "よくある質問", story: "ふたりのこと", rsvp: "出欠のお返事" },
  letter: { signOff: "愛をこめて、N & G", skip: "本文へ移動", open: "タップしてひらく", note: "招待状をひらいてね", phoneTitle: "スマホでひらく", phoneBody: "読み取ると、この招待状をスマホで見られます。", comingSoon: "近日公開" },
  theme: { label: "夜のモード" },
  countdownMore: { until: "京都でお会いできる日まで", tomorrow: "いよいよ明日", today: "今日がその日です", married: "結婚しました", short: { months: "か月", days: "日", hours: "時間", mins: "分", secs: "秒", years: "年" } },
  home: {
    pills: { replied: "返信済み" },
    rsvpClosed: "お返事の受付は終了しました。変更がある場合は、ナディアかグリフィンまでご連絡ください。",
    dear: (name: string) => `${name}へ`,
    dearNames: (names: string[]) => names.map((n) => (n === "お連れの方" ? n : `${n}さん`)).join("、"),
    yourPlusOne: "お連れの方",
    label: `${DAY}、京都`,
    dateLine: `${DAY}、京都`,
    rsvpButton: `${RSVP_BY}までにお返事を`,
    rsvpBy: `${RSVP_BY}までにお返事を`,
    todo: { who: "出席される方", food: "お食事と一曲", dates: "旅の日程", datesLater: "予約が済んでから", done: "済み", toDo: "まだ" },
    greetingLine: "ふたりが出会った京都で、結婚式を挙げます。ぜひお越しください。必要なことは、すべてここにあります。",
    changeReply: "お返事を変更する",
    changeBy: CHANGE_BY,
    reseal: "封筒に戻す",
  },
  day: {
    title: "当日",
    howToGetThere: "会場への行き方",
    dateLong: DAY,
    venueFacts: "ザ・ソウドウは、日本画家・竹内栖鳳の旧邸です。約1.4エーカーの庭園は、季節ごとに色を変えます。",
    japanTime: "時刻はすべて日本時間です。",
    localLine: (time: string, day: string, city: string) => `${time}（${day}）${city ? `、現地時間（${city}）` : "、お住まいの地域の時間"}`,
    print: "当日の予定を印刷",
    rainPlan: "雨の場合、挙式は会場内のチャペルで行います。",
    schedule: [
      { time: "11:00", label: "挙式", where: "庭園" },
      { time: "12:00", label: "カクテルアワー", where: "13:00まで" },
      { time: "13:00", label: "披露宴", where: "テラス、15:30まで" },
    ],
  },
  driver: { label: "京都駅からタクシーで", fare: "約2,000円、15〜20分です。", show: "運転手さんに見せる", maps: "Googleマップで道順を見る", mapsOpens: "Googleマップがひらきます", english: "Please take me here", done: "閉じる", copy: "住所をコピー", copied: "住所をコピーしました" },
  getting: {
    title: "会場への行き方",
    intro: "空港から庭園まで、必要な順にまとめました。当日いちばん簡単なのは、京都駅からのタクシーです（約15分、2,000円ほど）。",
    beforeTitle: "出発の前に",
    ticked: (n: number, of: number) => `${of}項目中 ${n}項目 完了`,
    tick: (what: string) => `完了：${what}`,
    rows: { passport: "パスポートとビザ", flights: "航空券と到着", booking: "宿の予約", phones: "スマホ・お金・電源", weather: "天気と持ち物", medicines: "お薬", onTheDay: "当日の移動" },
  },
  stay: { title: "宿泊について" },
  qa: { title: "よくある質問", contact: "ご不明な点があれば、どちらにでもお気軽にご連絡ください。", onTheDay: "当日の連絡先：" },
  story: { title: "ふたりのこと", soonBody: "ふたりの話は、まもなく公開します。" },
  rsvp: {
    whoTitle: "どなたが出席されますか？",
    coming: "出席",
    notComing: "欠席",
    dietary: "食事の制限やアレルギーはありますか？",
    song: "ダンスでかけたい一曲は？",
    songHint: "曲名かアーティスト名で検索するか、そのまま入力してください",
    songPlaceholder: "曲を検索",
    arrival: "到着日",
    departure: "出発日",
    message: "ほかに何かあれば（任意）",
    send: "お返事を送る",
    next: "次へ",
    back: "戻る",
    bringing: "お連れの方はいらっしゃいますか？",
    plusOne: "お名前",
    plusOneHint: "まだ決まっていなければ、空欄のままで大丈夫です。",
    doneTitle: { all: "準備はばっちりです", none: "ご連絡ありがとうございます", mixed: "承りました" },
    backHome: "招待状に戻る",
    sentLine: `送信しました。${CHANGE_BY}`,
    updatedLine: `更新しました。${CHANGE_BY}`,
    privacy: "お返事は、ナディアとグリフィンだけが見ます。",
  },
}
