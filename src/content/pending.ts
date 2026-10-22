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
  // "Where are you flying from?": the field under the quick chips (final run)
  "flying.orType": {
    en: "Or type your city",
    ja: "または都市名を入力",
  },
  // The journey stop's toggle (final run)
  "journey.mapMode": {
    en: "Map",
    ja: "地図",
  },
  "journey.globe": {
    en: "Globe",
    ja: "地球儀",
  },
  "journey.flat": {
    en: "Flat map",
    ja: "平面の地図",
  },
  // A way to actually message them where the copy says to (18e journey map): the wedding address already used on the
  // no-invite page
  "contact.emailUs": {
    en: "Email Griffin & Nadia",
    ja: "グリフィンとナディアにメールする",
  },
  // The FAQ answers (run 19): shorter, in their voice, for Griffin and Nadia to tweak (the questions are in en.ts)
  "faqs.bring.a": {
    en: "Your invite is for the people named on it. If there's room for a plus one, your reply will ask “Bringing someone?”. Not sure? Ask us below.",
    ja: "招待状はお名前のある方へのものです。お連れの方の枠があれば、お返事で「お連れの方はいらっしゃいますか？」とお聞きします。わからないときは、下からお気軽にどうぞ。",
  },
  "faqs.style.a": {
    en: "Not really. It's a relaxed garden wedding with a few Japanese touches. Nothing to learn, just come as you are.",
    ja: "いいえ、日本らしさを少し添えた、気楽なガーデンウェディングです。覚えることは何もないので、そのままお越しください。",
  },
  "faqs.visa.a": {
    en: "Not for Aussies on a short trip. Just check your passport has 6 months left after you fly home. Travel has the rest.",
    ja: "オーストラリア国籍の方は、短期の滞在ならビザは不要です。帰国日から6か月以上の有効期限があるか、パスポートだけご確認ください。くわしくは「アクセス」へ。",
  },
  "faqs.details.a": {
    en: "Your reply comes straight to us and no one else sees it. We'll delete it a few months after the wedding.",
    ja: "お返事は私たちにだけ届き、ほかの人が見ることはありません。結婚式の数か月後に削除します。",
  },
  "faqs.whoMade.a": {
    en: "Nadia's brother Jehan designed and built it, and Nadia drew everything you see.",
    ja: "ナディアの兄のジェハンがデザインと制作を、ナディアがすべての絵を描きました。",
  },
  // {song} is the music credit (src/lib/art.ts), said here only
  "faqs.whoMade.song": {
    en: "The song is {song}, played on piano.",
    ja: "曲は{song}のピアノ版です。",
  },
  // Their Time (Inv details, column E, 22 Oct): the planner still has to confirm it
  "day.arrival": {
    en: "Arrival time: to be confirmed by the wedding planner",
    ja: "受付開始の時間：ウェディングプランナーが確定しだいお知らせします",
  },
  "faqs.contactDay": {
    en: "On the day, call Jehan or Noya. We'll add their numbers closer to the time.",
    ja: "当日は、ジェハンかノヤにご連絡ください。電話番号は日が近づいたらここに載せます。",
  },
} as const

/**
 * New Japanese lines written by us, not by a native speaker: each needs a native read before launch
 * (`npm run check:pending` lists them). The text is as it stands in ja.ts, PENDING above or art.ts (the music credit); a unit test
 * keeps them the same.
 * When one has been read (and corrected in ja.ts), delete it here.
 */
export const JA_TO_READ: { key: string; ja: string }[] = [
  { key: "trouble.title", ja: "ただいま少し不具合が起きています" },
  { key: "trouble.body", ja: "数分おいて、もう一度お試しください。" },
  { key: "notFound.sent", ja: "そのアドレスがリストにあれば、リンクをお送りしました。迷惑メールもご確認ください。" },
  { key: "home.todo.food", ja: "お食事" },
  { key: "home.todo.song", ja: "一曲" },
  { key: "rsvp.dietaryOther", ja: "詳しく教えてください（任意）" },
  { key: "rsvp.searchSong", ja: "検索" },
  { key: "rsvp.useTyped", ja: "入力したとおりに使う" },
  { key: "rsvp.songResults", ja: "件見つかりました" },
  { key: "rsvp.listResults", ja: "件の候補" },
  { key: "flying.placeholder", ja: "都市名を入力して探す" },
  { key: "flying.noMatch", ja: "見つかりません。「その他」を選んでください。" },
  { key: "ask.button", ja: "質問する" },
  { key: "faqs.bring.a", ja: "招待状はお名前のある方へのものです。お連れの方の枠があれば、お返事で「お連れの方はいらっしゃいますか？」とお聞きします。わからないときは、下からお気軽にどうぞ。" },
  { key: "faqs.style.a", ja: "いいえ、日本らしさを少し添えた、気楽なガーデンウェディングです。覚えることは何もないので、そのままお越しください。" },
  { key: "faqs.visa.q", ja: "ビザは必要ですか？" },
  { key: "faqs.visa.a", ja: "オーストラリア国籍の方は、短期の滞在ならビザは不要です。帰国日から6か月以上の有効期限があるか、パスポートだけご確認ください。くわしくは「アクセス」へ。" },
  { key: "faqs.whoMade.q", ja: "このサイトはどなたが作ったのですか？" },
  { key: "faqs.whoMade.a", ja: "ナディアの兄のジェハンがデザインと制作を、ナディアがすべての絵を描きました。" },
  { key: "faqs.whoMade.song", ja: "曲は{song}のピアノ版です。" },
  { key: "travel.flyingBody.haruka", ja: "外国のパスポートで入国する方は、JR西日本の「HARUKA One-way Ticket」（京都まで2,200円）を出発前にオンラインで購入できます。日本国内では販売されておらず、JRの駅でパスポートを見せて受け取ります。" },
  { key: "home.pills.replied", ja: "お返事ありがとうございます" },
  { key: "photos.kid-griffin.alt", ja: "小学校の初日、玄関の前に立つ幼い頃のグリフィン" },
  // Their final wording (22 Oct), translated by us
  { key: "changeBy", ja: "2027年4月30日まで、お返事はいつでも変更できます。航空券を予約したら、旅の日程も追加してください。" },
  { key: "home.intro.0", ja: "ふたりの愛を祝い、物語の次の章を始めるために、すべてが始まった場所に友人と家族を招きます。" },
  { key: "home.intro.1", ja: "京都は近所の会場よりも少し遠いので、旅が楽しく、楽で、思い出に残るものになるようにしたいと思っています。計画に必要なことはこの下にすべてあり、これからも追加していきます。" },
  { key: "travel.items.passport", ja: "旅の情報が最新か確認してください！パスポートは、帰国日から6か月以上の有効期限が必要です。更新が必要な方は、お早めにどうぞ！" },
  { key: "travel.items.flights", ja: "航空券は、できる範囲でなるべく早めに予約してください。結婚式の日程は確定しているので、変わる心配はありません！せっかくなので、日本を楽しんでいってください。結婚式の前の数日に楽しめることをご紹介しますし、できれば式のあとも数日ゆっくりしていってください。" },
  { key: "travel.items.stay", ja: "航空券を予約したら、次は宿の予約です！会場の近くのホテルやAirbnbのおすすめをまとめます。日本のホテルは小さく必要最低限なことが多いので、選ぶときの参考にしてください。ほかのゲストと相談して一緒に泊まるのも大歓迎です！迷ったら、気軽にご相談ください！" },
  { key: "travel.items.sim", ja: "出発前に、eSIMかポケットWi-Fiを用意しておきましょう。おすすめはこちら：" },
  { key: "stay.intro", ja: "早めの予約を。10月中旬の京都は混み合います。日本のホテルは小さく必要最低限なことが多いので、選ぶときの参考にしてください。京都では1人1泊ごとに少額の宿泊税がかかります。ほかのゲストと相談して一緒に泊まるのも大歓迎です！迷ったら、気軽にご相談ください！" },
  { key: "faqs.wear.a", ja: "ドレスコードはありません。いちばん自分らしくいられる服装でどうぞ。会場のまわりは石畳の道なので、歩きやすい靴でお越しください。" },
  { key: "faqs.food.a", ja: "食事の制限やアレルギーを教えてください！結婚式の昼食はケータリングで、メニューは式の数か月前に決まります。" },
  { key: "faqs.gifts.a", ja: "プレゼントは不要です！遠くまで来てくださるだけで十分なので、来てくださることが何よりの贈り物です！" },
  { key: "qa.contact", ja: "どんなことでも、ご質問があればいつでもどちらかにお気軽にご連絡ください。いつでも喜んでお手伝いします！" },
  { key: "day.arrival", ja: "受付開始の時間：ウェディングプランナーが確定しだいお知らせします" },
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
