# Japanese read pack

**For Nadia:** the translating is done; it just needs someone fluent to read it over.

Every Japanese line on the site, next to its English, by page. 511 lines: 18 new or changed since 17 Oct
(marked), 43 with no Japanese yet (the site shows the English there). The rest are the 6 Oct draft,
which has never had a native read either. Fix anything straight in this file or the CSV
([japanese-read.csv](japanese-read.csv), for a sheet) and Jehan puts it into `src/content/ja.ts`.

Notes for the reader: polite form (です・ます) throughout; nothing should say more than the English does; {1}, {2}
are filled in by the site (a name, a date, a number).

## Everywhere (bar, nav, letter, music, theme)

| | English | Japanese | Key |
|---|---|---|---|
|  | G&N | G&N | `meta.shortTitle` |
|  | Griffin & Nadia | グリフィン & ナディア | `meta.title` |
|  | The Super Duper Wedding Extravaganza | スーパーデューパー・ウェディング・エクストラバガンザ | `meta.eyebrow` |
|  | Griffin Suddaby and Nadia Baguley Super Duper Wedding Extravaganza | グリフィン・サダビー & ナディア・バグリー スーパーデューパー・ウェディング・エクストラバガンザ | `meta.fullTitle` |
|  | Home | ホーム | `nav.home` |
|  | The day | 当日 | `nav.day` |
|  | Travel | アクセス | `nav.travel` |
|  | FAQs | よくある質問 | `nav.faqs` |
|  | Our story | ふたりのこと | `nav.story` |
|  | RSVP | 出欠のお返事 | `nav.rsvp` |
|  | With love, G & N | 愛をこめて、G & N | `letter.signOff` |
|  | Site by Jehan Baguley | サイト制作：Jehan Baguley | `letter.credit` |
|  | Skip to the letter | 本文へ移動 | `letter.skip` |
|  | Tap to open | タップしてひらく | `letter.open` |
|  | open your invite | 招待状をひらいてね | `letter.note` |
|  | Open your invitation, {1} | 招待状をひらく（{1}さん） | `letter.openLabel` |
|  | Open on your phone | スマホでひらく | `letter.phoneTitle` |
|  | Scan to take this invite with you. | 読み取ると、この招待状をスマホで見られます。 | `letter.phoneBody` |
|  | Play music | 音楽を流す | `music.on` |
|  | Pause music | 音楽を止める | `music.off` |
|  | Evening mode | 夜のモード | `theme.label` |
|  | Can't find your invite? | 招待状が見つかりませんか？ | `notFound.title` |
|  | Your invite has its own link. Pop in your email and we'll send it again, or message Griffin or Nadia. | 招待状には専用のリンクがあります。メールアドレスを入力いただければ再送します。またはグリフィンかナディアにご連絡ください。 | `notFound.body` |
|  | Your email | メールアドレス | `notFound.emailLabel` |
|  | The one your invite went to. We'll email your link again. | 招待状が届いたアドレスです。リンクを再送します。 | `notFound.helper` |
|  | Or email Griffin & Nadia | またはグリフィン & ナディアにメールを | `notFound.message` |
|  | Send my link | リンクを送る | `notFound.send` |
|  | Sending… | 送信中… | `notFound.sending` |
|  | If that email is on our list, your link is on its way. Check your inbox (and junk folder) in a few minutes. | そのアドレスがリストにあれば、リンクをお送りしました。数分後に受信箱（と迷惑メール）をご確認ください。 | `notFound.sent` |
|  | That doesn't look like an email address. | メールアドレスの形式が正しくないようです。 | `notFound.badEmail` |
|  | We couldn't send that just now. Try again, or message Griffin or Nadia. | 今は送信できませんでした。もう一度お試しいただくか、グリフィンかナディアにご連絡ください。 | `notFound.failed` |
|  | That link doesn't look right | このリンクは正しくないようです | `unknown.title` |
|  | We couldn't find an invite for this link. Check it's the full link from your email, or message Griffin or Nadia and we'll send it again. | このリンクの招待状が見つかりませんでした。メールのリンクをすべてコピーしたか確認いただくか、グリフィンかナディアにご連絡いただければ再送します。 | `unknown.body` |
|  | Replies are paused for a moment | お返事の受付を少しお休みしています | `paused.title` |
|  | Try again later. | 時間をおいて、もう一度お試しください。 | `paused.body` |
|  | Try again | もう一度 | `paused.retry` |
|  | Replies are paused for a moment, try again later. | お返事の受付を少しお休みしています。時間をおいて、もう一度お試しください。 | `paused.line` |
|  | We couldn't open your invite | 招待状をひらけませんでした | `offline.title` |
|  | It might be your connection. Try again in a moment. | 通信環境のせいかもしれません。少し待ってからもう一度お試しください。 | `offline.body` |
|  | Try again | もう一度 | `offline.retry` |
|  | Opening your invite… | 招待状をひらいています… | `loading` |
| **changed** | “A Town With an Ocean View” (Joe Hisaishi) | 「A Town With an Ocean View」（久石譲） | `music.credit` |

## Home

| | English | Japanese | Key |
|---|---|---|---|
|  | until we see you in Kyoto | 京都でお会いできる日まで | `countdownMore.until` |
|  | Tomorrow | いよいよ明日 | `countdownMore.tomorrow` |
|  | Today's the day | 今日がその日です | `countdownMore.today` |
|  | Married | 結婚しました | `countdownMore.married` |
|  | and counting | カウントダウン中 | `countdownMore.andCounting` |
|  | That's {1} where you are | お住まいの地域では{1} | `countdownMore.localTitle` |
|  | months | か月 | `countdownMore.short.months` |
|  | days | 日 | `countdownMore.short.days` |
|  | hrs | 時間 | `countdownMore.short.hours` |
|  | mins | 分 | `countdownMore.short.mins` |
|  | secs | 秒 | `countdownMore.short.secs` |
|  | years | 年 | `countdownMore.short.years` |
|  | Replied | 返信済み | `home.pills.replied` |
|  | Replies are closed now. If something's changed, message Griffin or Nadia. | お返事の受付は終了しました。変更がある場合は、グリフィンかナディアまでご連絡ください。 | `home.rsvpClosed` |
|  | Dear {1}, | {1}へ | `home.dear` |
|  | your plus one | お連れの方 | `home.yourPlusOne` |
|  | Fri 15 Oct 2027, Kyoto | 2027年10月15日（金）、京都 | `home.label` |
|  | Fri 15 Oct 2027, Kyoto | 2027年10月15日（金）、京都 | `home.dateLine` |
|  | RSVP by Mon 15 Feb 2027 | 2027年2月15日（月）までにお返事を | `home.rsvpButton` |
|  | Your reply | お返事 | `home.yourReply` |
|  | Who's coming | 出席される方 | `home.todo.who` |
|  | Food and a song | お食事と一曲 | `home.todo.food` |
|  | Travel dates | 旅の日程 | `home.todo.dates` |
|  | once you've booked | 予約が済んでから | `home.todo.datesLater` |
|  | done | 済み | `home.todo.done` |
|  | to do | まだ | `home.todo.toDo` |
|  | we're getting married in Kyoto, where it all started, and we'd love you there. Everything you need is right here. | ふたりが出会った京都で、結婚式を挙げます。ぜひお越しください。必要なことは、すべてここにあります。 | `home.greetingLine` |
|  | {1} days to go | あと{1}日 | `home.daysToGo` |
|  | it's {1} in Kyoto | 京都は今{1} | `home.kyotoLine` |
|  | More about the day | 当日について | `home.moreLabel` |
|  | /the-day | /the-day | `home.links.0.to` |
|  | The day | 当日 | `home.links.0.label` |
|  | /travel | /travel | `home.links.1.to` |
|  | Getting there | 会場への行き方 | `home.links.1.label` |
|  | /travel#stay | /travel#stay | `home.links.2.to` |
|  | Where to stay | 宿泊について | `home.links.2.label` |
|  | RSVP by Mon 15 Feb 2027 | 2027年2月15日（月）までにお返事を | `home.rsvpBy` |
|  | Change my reply | お返事を変更する | `home.changeReply` |
|  | You can change your reply until Fri 30 Apr 2027. | 2027年4月30日（金）まで、お返事は変更できます。 | `home.changeBy` |
|  | We know that life happens, so if you need to make any changes after the 30th of April please contact us directly. | 予定が変わることもありますよね。4月30日以降に変更が必要になったら、直接ご連絡ください。 | `home.changeAfter` |
|  | Seal it again | 封筒に戻す | `home.reseal` |
|  | it's nearly here. Everything for Friday is on The day, and the easiest way there is below. We can't wait to see you. | いよいよ今週です。金曜日のことはすべて「当日」のページに、いちばん簡単な行き方は下にあります。お会いできるのを楽しみにしています。 | `home.week.greeting` |
|  | The day | 当日 | `home.week.day` |
|  | Directions in Google Maps | Googleマップで道順を見る | `home.week.directions` |
|  | Married, Fri 15 Oct 2027, Kyoto | 2027年10月15日（金）、京都にて結婚しました | `home.keepsake.badge` |
|  | thank you for coming all this way and for being part of our day. We'll add photos from the day here soon. | 遠くまで来てくださり、私たちの一日を一緒に過ごしてくださって、ありがとうございました。当日の写真は近日ここに掲載します。 | `home.keepsake.greeting` |
|  | Read our story | ふたりのことを読む | `home.keepsake.story` |

## The day

| | English | Japanese | Key |
|---|---|---|---|
|  | The day | 当日 | `day.title` |
|  | Fri 15 Oct 2027 | 2027年10月15日（金） | `day.date` |
|  | The Sodoh Higashiyama, Kyoto | ザ・ソウドウ 東山 京都 | `day.venue` |
|  | 366 Yasaka Kamimachi, Higashiyama Ward | 〒605-0827 | `day.addressLines.0` |
|  | Kyoto 605-0827, Japan | 京都府京都市東山区八坂上町366 | `day.addressLines.1` |
|  | How to get there | 会場への行き方 | `day.howToGetThere` |
|  | Counting down | カウントダウン | `day.countdownTitle` |
|  | Fri 15 Oct 2027 | 2027年10月15日（金） | `day.dateLong` |
|  | A drawn map: from Kyoto Station north to Gion-Shijo, then east up the hill to The Sodoh. | 手描きの地図：京都駅から北へ祇園四条、そこから東へ坂を上ってザ・ソウドウへ。 | `day.mapAlt` |
|  | Kyoto Station | 京都駅 | `day.mapStation` |
|  | Gion-Shijo | 祇園四条 | `day.mapGion` |
|  | The Sodoh | ザ・ソウドウ | `day.mapVenue` |
|  | Counting down | カウントダウン | `day.countdownLabel` |
|  | 11:00 | 11:00 | `day.schedule.0.time` |
|  | Ceremony | 挙式 | `day.schedule.0.label` |
|  | The Garden | 庭園 | `day.schedule.0.where` |
|  | 12:00 | 12:00 | `day.schedule.1.time` |
|  | Cocktail hour | カクテルアワー | `day.schedule.1.label` |
|  | Until 1:00 pm | 13:00まで | `day.schedule.1.where` |
|  | 13:00 | 13:00 | `day.schedule.2.time` |
|  | Reception | 披露宴 | `day.schedule.2.label` |
|  | The Terrace, until 3:30 pm | テラス、15:30まで | `day.schedule.2.where` |
|  | All times are Japan time. | 時刻はすべて日本時間です。 | `day.japanTime` |
|  | {1} {2} in {3} | {3}では{1}（{2}） | `day.localLine` |
|  | The day, in order | 当日の流れ | `day.timelineLabel` |
|  | It's {1} in Kyoto right now. | 京都は今、{1}です。 | `day.kyotoNow` |
|  | Add to calendar | カレンダーに追加 | `day.addToCalendar` |
|  | Google Calendar | Googleカレンダー | `day.googleCalendar` |
|  | Opened in a new tab. Save it there and you're set. | 新しいタブでひらきました。そちらで保存すれば完了です。 | `day.calendarOpened` |
|  | Downloaded. Open the file to add the day. | ダウンロードしました。ファイルをひらいて追加してください。 | `day.calendarSaved` |
|  | Apple or Outlook (.ics) | AppleまたはOutlook（.ics） | `day.appleCalendar` |
|  | Print the day | 当日の予定を印刷 | `day.print` |
|  | Now | 現在 | `day.now` |
|  | If it rains, the ceremony moves inside to one of the venue's chapels. | 雨の場合、挙式は会場内のチャペルで行います。 | `day.rainPlan` |
|  | The Sodoh was the home of the painter Takeuchi Seihō. Its 1.4-acre garden changes colour with the seasons. | ザ・ソウドウは、日本画家・竹内栖鳳の旧邸です。約1.4エーカーの庭園は、季節ごとに色を変えます。 | `day.venueFacts` |
|  | 行き方 | 行き方 | `day.gettingTitleJa` |
|  | Gion and Higashiyama | 祇園・東山 | `day.stay.0.label` |
|  | Walk to the venue, the prettiest streets | 会場まで徒歩圏、いちばん美しい通り | `day.stay.0.good` |
|  | Pricier, crowded, hilly stone lanes | 料金は高め、混雑、石畳の坂道 | `day.stay.0.watch` |
|  | https://www.google.com/maps/search/?api=1&query=Gion+Higashiyama+Kyoto | https://www.google.com/maps/search/?api=1&query=Gion+Higashiyama+Kyoto | `day.stay.0.maps` |
|  | Kawaramachi and Shijo | 河原町・四条 | `day.stay.1.label` |
|  | Best all-rounder: food, shops and trains | 食事、買い物、電車がそろうバランス型 | `day.stay.1.good` |
|  | Busy, so take a taxi on the night | にぎやかなので、当日の夜はタクシーで | `day.stay.1.watch` |
|  | https://www.google.com/maps/search/?api=1&query=Kawaramachi+Shijo+Kyoto | https://www.google.com/maps/search/?api=1&query=Kawaramachi+Shijo+Kyoto | `day.stay.1.maps` |
|  | Kyoto Station | 京都駅周辺 | `day.stay.2.label` |
|  | Easiest arrivals and day trips | 到着と日帰り旅行に便利 | `day.stay.2.good` |
|  | Less charm, 15 minutes by taxi | 風情は少なめ、タクシーで15分 | `day.stay.2.watch` |
|  | https://www.google.com/maps/search/?api=1&query=Kyoto+Station | https://www.google.com/maps/search/?api=1&query=Kyoto+Station | `day.stay.2.maps` |
|  | Good | 良い点 | `day.stayGood` |
|  | Keep in mind | ご注意 | `day.stayWatch` |
|  | From Kyoto Station to The Sodoh | 京都駅からザ・ソウドウまで | `trail.label` |
|  | Kyoto Station | 京都駅 | `trail.station` |
|  | Hachijo exit, taxi rank | 八条口、タクシー乗り場 | `trail.stationNote` |
|  | MK Taxi, 15 minutes | MKタクシーで15分 | `trail.taxi` |
|  | Free with a venue ticket | 会場のチケットで無料 | `trail.taxiNote` |
|  | The Sodoh | ザ・ソウドウ | `trail.venue` |
|  | Higashiyama | 東山 | `trail.venueNote` |
|  | Around the venue | 会場のまわり | `kyotoMap.title` |
|  | Tap a place to see how it fits together. | 場所をタップすると、位置関係がわかります。 | `kyotoMap.intro` |
|  | A simple map of Kyoto: Kyoto Station, Gion-Shijo Station, the Yasaka Pagoda and The Sodoh | 京都の簡単な地図：京都駅、祇園四条駅、八坂の塔、ザ・ソウドウ | `kyotoMap.label` |
|  | Not to scale | 縮尺は正確ではありません | `kyotoMap.notToScale` |
|  | Kamo River | 鴨川 | `kyotoMap.river` |
|  | Taxi from the station | 駅からタクシー | `kyotoMap.taxiRoute` |
|  | Walk from Gion-Shijo | 祇園四条から徒歩 | `kyotoMap.walkRoute` |
|  | Directions from here | ここからの道順 | `kyotoMap.directions` |
|  | station | station | `kyotoMap.places.0.id` |
|  | Kyoto Station | 京都駅 | `kyotoMap.places.0.name` |
|  | 京都駅 | 京都駅 | `kyotoMap.places.0.ja` |
|  | Where the train from the airport gets in. Taxis wait at the Hachijo exit: about 15 minutes to the venue, and free in an MK Taxi with a ticket from the venue. Bus 206 to Higashiyama Yasui works too. | 空港からの電車が着く駅です。タクシーは八条口で待っています。会場まで約15分で、会場のチケットがあればMKタクシーは無料です。206系統のバスで東山安井まで行くこともできます。 | `kyotoMap.places.0.body` |
|  | https://www.google.com/maps/dir/?api=1&origin=Kyoto+Station&destination=The+Sodoh+Higashiyama+Kyoto | https://www.google.com/maps/dir/?api=1&origin=Kyoto+Station&destination=The+Sodoh+Higashiyama+Kyoto | `kyotoMap.places.0.maps` |
|  | gion | gion | `kyotoMap.places.1.id` |
|  | Gion-Shijo Station | 祇園四条駅 | `kyotoMap.places.1.name` |
|  | 祇園四条駅 | 祇園四条駅 | `kyotoMap.places.1.ja` |
|  | The nearest station. About 10 minutes on foot along old stone lanes, with a few steps. | いちばん近い駅です。石畳の道を歩いて約10分、少し階段があります。 | `kyotoMap.places.1.body` |
|  | https://www.google.com/maps/dir/?api=1&origin=Gion-Shijo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking | https://www.google.com/maps/dir/?api=1&origin=Gion-Shijo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking | `kyotoMap.places.1.maps` |
|  | pagoda | pagoda | `kyotoMap.places.2.id` |
|  | Yasaka Pagoda | 八坂の塔 | `kyotoMap.places.2.name` |
|  | 八坂の塔 | 八坂の塔 | `kyotoMap.places.2.ja` |
|  | The five-storey pagoda on the lane by the venue. If you can see it, you're nearly there. | 会場のそばの五重塔です。塔が見えたら、もうすぐです。 | `kyotoMap.places.2.body` |
|  | https://www.google.com/maps/search/?api=1&query=Yasaka+Pagoda+Kyoto | https://www.google.com/maps/search/?api=1&query=Yasaka+Pagoda+Kyoto | `kyotoMap.places.2.maps` |
|  | venue | venue | `kyotoMap.places.3.id` |
|  | The Sodoh | ザ・ソウドウ | `kyotoMap.places.3.name` |
|  | ザ・ソウドウ | ザ・ソウドウ | `kyotoMap.places.3.ja` |
|  | The venue: 366 Yasaka Kamimachi, Higashiyama. Ceremony in the garden at 11:00 am. | 会場：東山区八坂上町366。挙式は11時から庭園で行います。 | `kyotoMap.places.3.body` |
|  | https://www.google.com/maps/dir/?api=1&destination=The+Sodoh+Higashiyama+Kyoto | https://www.google.com/maps/dir/?api=1&destination=The+Sodoh+Higashiyama+Kyoto | `kyotoMap.places.3.maps` |

## Travel

| | English | Japanese | Key |
|---|---|---|---|
|  | Taxi from Kyoto Station | 京都駅からタクシーで | `driver.label` |
|  | 15 to 20 minutes. Free in an MK Taxi with a ticket from the venue. | 15〜20分です。会場のチケットがあればMKタクシーは無料です。 | `driver.fare` |
|  | Show the driver | 運転手さんに見せる | `driver.show` |
|  | Directions in Google Maps | Googleマップで道順を見る | `driver.maps` |
|  | opens Google Maps | Googleマップがひらきます | `driver.mapsOpens` |
|  | Please take me here | Please take me here | `driver.english` |
|  | Done | 閉じる | `driver.done` |
|  | Copy address | 住所をコピー | `driver.copy` |
|  | Address copied | 住所をコピーしました | `driver.copied` |
|  | Tick things off as you go. Your ticks stay on this device. | 済んだものにチェックを。チェックはこの端末にだけ保存されます。 | `travel.tickHint` |
|  | Done | 済み | `travel.ticked` |
|  | Passport | パスポート | `travel.items.0.title` |
|  | Check your passport has at least 6 months left after the date you fly home. If you need to renew it, do it soon. It can take a while. Aussies don't need a visa for a short trip to Japan. We'll tell you if the entry rules change before the trip. | 帰国日から6か月以上の有効期限があるか確認してください。更新が必要なら、早めに。時間がかかることがあります。オーストラリア国籍の方は、短期の日本滞在にビザは不要です。入国のルールが変わった場合は、旅行の前にお知らせします。 | `travel.items.0.body` |
|  | Flights | 航空券 | `travel.items.1.title` |
|  | Book flights as early as you can. The date's locked in, so there's no chance of missing it. Stay a few days either side if you can: we'll share ideas for things to do before and after the wedding. | できるだけ早めに予約を。日程は決まっているので、乗り遅れる心配はありません。できれば前後に数日滞在してください。結婚式の前後に楽しめることをご紹介します。 | `travel.items.1.body` |
|  | Where to stay | 宿泊先 | `travel.items.2.title` |
|  | Book somewhere once your flights are sorted. Japanese hotel rooms are small and simple, so plan for that. | 航空券が取れたら、宿を予約してください。日本のホテルの部屋は小さくシンプルなので、そのつもりで。 | `travel.items.2.body` |
|  | SIM or pocket wifi | SIMまたはポケットWi-Fi | `travel.items.3.title` |
|  | Sort out a SIM, eSIM or pocket wifi before you go. Here are a few we've heard good things about. | 出発前に、SIM、eSIM、ポケットWi-Fiのいずれかを用意してください。評判の良いものをいくつか。 | `travel.items.3.body` |
|  | Sakura Mobile | Sakura Mobile | `travel.items.3.links.0.label` |
|  | https://www.sakuramobile.jp/ | https://www.sakuramobile.jp/ | `travel.items.3.links.0.href` |
|  | Ninja WiFi | Ninja WiFi | `travel.items.3.links.1.label` |
|  | https://ninjawifi.com/en/plan/sim | https://ninjawifi.com/en/plan/sim | `travel.items.3.links.1.href` |
|  | Travelkon eSIM | Travelkon eSIM | `travel.items.3.links.2.label` |
|  | https://www.travelkon.com.au/product-category/esim/esim-asia/japan-esim/ | https://www.travelkon.com.au/product-category/esim/esim-asia/japan-esim/ | `travel.items.3.links.2.href` |
|  | Getting there | 会場への行き方 | `getting.title` |
|  | {1} of {2} ticked off | {2}項目中{1}項目 完了 | `getting.ticked` |
|  | Done: {1} | 完了：{1} | `getting.tick` |
|  | From the airport to the garden, in the order you'll need it. | 空港から庭園まで、必要な順にまとめました。 | `getting.intro` |
|  | Getting there, step by step | 会場への行き方、順番に | `getting.rowsLabel` |
|  | Before you fly | 出発の前に | `getting.beforeTitle` |
|  | On this page | このページ | `getting.onThisPage` |
|  | Passport and visas | パスポートとビザ | `getting.rows.passport` |
|  | Flights and flying in | 航空券と到着 | `getting.rows.flights` |
|  | Travel insurance | 海外旅行保険 | `getting.rows.insurance` |
|  | Booking somewhere to stay | 宿の予約 | `getting.rows.booking` |
|  | Phones, money and plugs | スマホ・お金・電源 | `getting.rows.phones` |
|  | Weather and what to pack | 天気と持ち物 | `getting.rows.weather` |
|  | Medicines | お薬 | `getting.rows.medicines` |
|  | Getting around on the day | 当日の移動 | `getting.rows.onTheDay` |
|  | Get travel insurance when you book your flights, so you're covered if plans change before the trip. | 航空券を予約するときに、海外旅行保険にも入っておきましょう。出発前に予定が変わっても安心です。 | `getting.insuranceBody` |
|  | Opens in Maps | マップでひらく | `getting.stayOpens` |
|  | On the day | 当日 | `getting.onTheDayTitle` |
|  | Getting to Kyoto | 京都までの行き方 | `getting.toKyotoTitle` |
|  | Coming from Tokyo | 東京から来られる方へ | `getting.tokyoTitle` |
|  | See it on a map | 地図で見る | `getting.seeOnMap` |
|  | See where to stay | 宿泊先を見る | `getting.seeStay` |
|  | Flying in | 飛行機で | `getting.flyingTitle` |
| **changed** | Osaka (Kansai, KIX) is the easiest way in. Jetstar flies direct from Brisbane in about 9 hours; from Melbourne it's one stop. The Haruka train gets you from the airport to Kyoto Station in about 75 minutes. Visitors on a foreign passport can buy JR West's HARUKA One-way Ticket (¥2,200 to Kyoto) online before you fly; it isn't sold in Japan, and you collect it at a JR station with your passport. The limousine bus is about ¥2,800 and easier with big bags. | 大阪（関西国際空港、KIX）がいちばん便利です。ジェットスターはブリスベンから直行で約9時間、メルボルンからは1回乗り継ぎです。空港から京都駅までは特急はるかで約75分。外国のパスポートで入国する方は、JR西日本の「HARUKA One-way Ticket」（京都まで2,200円）を出発前にオンラインで購入できます。日本国内では販売されておらず、JRの駅でパスポートを見せて受け取ります。リムジンバスは約2,800円で、大きな荷物があるときは楽です。 | `getting.flyingBody` |
|  | Coming from Tokyo? The bullet train takes about 2¼ hours. Book a Nozomi a month ahead in busy weeks, and sit on the E side for Mt Fuji. | 東京から来られますか？新幹線で約2時間15分です。混み合う週は1か月前にのぞみを予約し、富士山を見るならE席側に。 | `getting.tokyoBody` |
|  | Walking in | 歩いて | `getting.walkingTitle` |
|  | 10 minutes from Gion-Shijo, along old stone lanes with a few steps. Lovely, but take a taxi in nice shoes. | 祇園四条から10分、古い石畳の小路を通り、階段が少しあります。素敵な道ですが、きれいな靴ならタクシーで。 | `getting.walkingBody` |
|  | Free taxi from the station | 駅からの無料タクシー | `getting.shuttleTitle` |
|  | The venue shuttle only runs on weekends, so instead the venue is giving us free MK Taxi tickets from Kyoto Station to The Sodoh. They only work in MK Taxis. We'll let you know how to get yours closer to the day. | 会場のシャトルは週末のみの運行のため、代わりに会場が京都駅からザ・ソウドウまでのMKタクシー無料チケットを用意してくださいます。MKタクシーでのみ使えます。受け取り方は日が近づいたらご案内します。 | `getting.shuttleBody` |
|  | Arriving early? | 早めに到着される方へ | `getting.earlyTitle` |
|  | Drop your bags at Kyoto Station (Hands Free Kyoto) and they'll be at your hotel by evening. | 京都駅で荷物を預ければ（Hands Free Kyoto）、夕方にはホテルに届きます。 | `getting.earlyBody` |
| **changed** | HARUKA One-way Ticket | HARUKA One-way Ticket | `getting.links.haruka.label` |
| **changed** | https://www.westjr.co.jp/travel-information/en/tickets-passes/oneway/haruka/ | https://www.westjr.co.jp/travel-information/en/tickets-passes/oneway/haruka/ | `getting.links.haruka.href` |
|  | Compare flights | 航空券を比較 | `getting.links.flights.label` |
|  | https://www.google.com/travel/flights?q=Flights%20to%20KIX | https://www.google.com/travel/flights?q=Flights%20to%20KIX | `getting.links.flights.href` |
|  | Train times | 電車の時刻 | `getting.links.trains.label` |
|  | https://www.jrpass.com/timetable | https://www.jrpass.com/timetable | `getting.links.trains.href` |
|  | Walking route | 徒歩ルート | `getting.links.walk.label` |
|  | https://www.google.com/maps/dir/?api=1&origin=Gion-Shijo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking | https://www.google.com/maps/dir/?api=1&origin=Gion-Shijo+Station&destination=The+Sodoh+Higashiyama+Kyoto&travelmode=walking | `getting.links.walk.href` |
|  | Check Smartraveller | Smartravellerを確認 | `getting.links.smartraveller.label` |
|  | https://www.smartraveller.gov.au/destinations/asia/japan | https://www.smartraveller.gov.au/destinations/asia/japan | `getting.links.smartraveller.href` |
|  | Mid October is about 23°C by day and 14°C at night, with some rainy days. Bring a light jacket, shoes that grip on stone and a compact umbrella. | 10月中旬は日中23度、夜14度ほどで、雨の日もあります。薄手の上着、石畳で滑らない靴、折りたたみ傘をお持ちください。 | `getting.tips.0` |
|  | Cards work in most places but carry some cash. 7-Eleven and Japan Post ATMs take foreign cards. An eSIM is the easiest way to stay online. Plugs are type A, 100V. | カードはほとんどの場所で使えますが、現金も少し。セブンイレブンとゆうちょのATMは海外のカードが使えます。eSIMがいちばん手軽にネットにつながります。コンセントはAタイプ、100Vです。 | `getting.tips.1` |
|  | Some medicines, like codeine, need a permit in Japan. Carry your scripts and a doctor's letter. | コデインなど、日本では許可が必要な薬があります。処方箋と医師の手紙をお持ちください。 | `getting.tips.2` |
|  | Where to stay | 宿泊について | `stay.title` |
|  | Book early: mid October is busy in Kyoto. Hotels here are small and tidy, and Kyoto adds a small accommodation tax per person per night. Sharing with other guests? Go for it. If you feel stuck, reach out to us! | 早めの予約を。10月中旬の京都は混み合います。ホテルは小さく整っていて、京都では1人1泊ごとに少額の宿泊税がかかります。ほかのゲストと一緒に泊まるのも大歓迎です。迷ったら、気軽にご相談ください！ | `stay.intro` |
|  | See the three areas on a map | 3つのエリアを地図で見る | `stay.mapLink` |
|  | https://www.google.com/maps/search/?api=1&query=Gion+Kawaramachi+Kyoto+Station | https://www.google.com/maps/search/?api=1&query=Gion+Kawaramachi+Kyoto+Station | `stay.mapHref` |
|  | Our picks | おすすめの宿 | `stay.picks.title` |
|  | Links go to each hotel's own site, but compare other booking sites too. Prices change. | リンク先は各ホテルの公式サイトです。ほかの予約サイトとも比べてみてください。料金は変わります。 | `stay.picks.note` |
|  | Hotels | ホテル | `stay.picks.hotelsTitle` |
|  | Airbnbs | Airbnb | `stay.picks.airbnbsTitle` |
|  | Cheaper per person when you split one. | 人数で割ると1人あたりは安くなります。 | `stay.picks.airbnbsNote` |
|  | {1} a night | 1泊{1} | `stay.picks.perNight` |
|  | Sleeps {1} | {1}名まで | `stay.picks.sleeps` |
|  | opens the hotel's site | ホテルのサイトがひらきます | `stay.picks.opensHotel` |
|  | opens Airbnb | Airbnbがひらきます | `stay.picks.opensAirbnb` |
|  | Filter by area | エリアで絞り込む | `stay.picks.filterLabel` |
|  | {1} places | {1}件 | `stay.picks.count` |
| missing | Kyoto Century Hotel |  | `stay.picks.hotels.0.name` |
|  | Kyoto Station | 京都駅 | `stay.picks.hotels.0.area` |
| missing | ~$150 AUD |  | `stay.picks.hotels.0.price` |
| missing |  |  | `stay.picks.hotels.0.note` |
| missing | https://www.kyotocenturyhotel.jp/ |  | `stay.picks.hotels.0.href` |
| missing | Mercure Kyoto Station |  | `stay.picks.hotels.1.name` |
|  | Kyoto Station | 京都駅 | `stay.picks.hotels.1.area` |
| missing | ~$150–180 AUD |  | `stay.picks.hotels.1.price` |
| missing |  |  | `stay.picks.hotels.1.note` |
| missing | https://all.accor.com/hotel/B4F4/index.en.shtml |  | `stay.picks.hotels.1.href` |
| missing | Daiwa Roynet Hotel Kyoto Ekimae PREMIER |  | `stay.picks.hotels.2.name` |
|  | Kyoto Station | 京都駅 | `stay.picks.hotels.2.area` |
| missing | ~$110 AUD |  | `stay.picks.hotels.2.price` |
| missing |  |  | `stay.picks.hotels.2.note` |
| missing | https://www.daiwaroynet.jp/en/kyoto-ekimae/ |  | `stay.picks.hotels.2.href` |
| missing | ASAI Kyoto Shijo |  | `stay.picks.hotels.3.name` |
|  | Gojo | 五条 | `stay.picks.hotels.3.area` |
|  | from ~$100 AUD | ~$100 AUD〜 | `stay.picks.hotels.3.price` |
|  | Between Kyoto Station and Gion-Shijo | 京都駅と祇園四条のあいだ | `stay.picks.hotels.3.note` |
| missing | https://www.dusit.com/asai-kyoto/ |  | `stay.picks.hotels.3.href` |
| missing | Rinn Kitagomon |  | `stay.picks.hotels.4.name` |
|  | Kiyomizu-Gojo | 清水五条 | `stay.picks.hotels.4.area` |
|  | from ~$150 AUD | ~$150 AUD〜 | `stay.picks.hotels.4.price` |
|  | Closer to the venue | 会場に近め | `stay.picks.hotels.4.note` |
| missing | https://rinn-kyomachi.com/en/list/rinn-kitagomon/ |  | `stay.picks.hotels.4.href` |
| missing | DoubleTree by Hilton Kyoto Higashiyama |  | `stay.picks.hotels.5.name` |
|  | Kiyomizu-Gojo | 清水五条 | `stay.picks.hotels.5.area` |
|  | from ~$200 AUD | ~$200 AUD〜 | `stay.picks.hotels.5.price` |
|  | Next to a station | 駅のすぐそば | `stay.picks.hotels.5.note` |
| missing | https://www.hilton.com/en/hotels/itmhadi-doubletree-kyoto-higashiyama/ |  | `stay.picks.hotels.5.href` |
|  | Kiyomizu-Gojo | 清水五条 | `stay.picks.airbnbs.0.area` |
| missing | 8 |  | `stay.picks.airbnbs.0.sleeps` |
| missing | ~$320 |  | `stay.picks.airbnbs.0.price` |
|  | Not right next to a station | 駅のすぐそばではありません | `stay.picks.airbnbs.0.note` |
| missing | https://www.airbnb.com.au/rooms/32966481 |  | `stay.picks.airbnbs.0.href` |
|  | Kiyomizu-Gojo | 清水五条 | `stay.picks.airbnbs.1.area` |
| missing | 4 |  | `stay.picks.airbnbs.1.sleeps` |
| missing | ~$400 |  | `stay.picks.airbnbs.1.price` |
| missing |  |  | `stay.picks.airbnbs.1.note` |
| missing | https://www.airbnb.com.au/rooms/1682420188495547858 |  | `stay.picks.airbnbs.1.href` |
|  | Kiyomizu-Gojo | 清水五条 | `stay.picks.airbnbs.2.area` |
| missing | 8 |  | `stay.picks.airbnbs.2.sleeps` |
| missing | ~$400 |  | `stay.picks.airbnbs.2.price` |
|  | Not right next to a station | 駅のすぐそばではありません | `stay.picks.airbnbs.2.note` |
| missing | https://www.airbnb.com.au/rooms/1541783233800920181 |  | `stay.picks.airbnbs.2.href` |
|  | Kiyomizu-Gojo | 清水五条 | `stay.picks.airbnbs.3.area` |
| missing | 4 to 5 |  | `stay.picks.airbnbs.3.sleeps` |
| missing | ~$450 |  | `stay.picks.airbnbs.3.price` |
| missing |  |  | `stay.picks.airbnbs.3.note` |
| missing | https://www.airbnb.com.au/rooms/1735167450296336070 |  | `stay.picks.airbnbs.3.href` |
|  | Higashiyama | 東山 | `stay.picks.airbnbs.4.area` |
| missing | 4 |  | `stay.picks.airbnbs.4.sleeps` |
| missing | ~$450 |  | `stay.picks.airbnbs.4.price` |
| missing |  |  | `stay.picks.airbnbs.4.note` |
| missing | https://www.airbnb.com.au/rooms/29807727 |  | `stay.picks.airbnbs.4.href` |
|  | Near The Sodoh | ザ・ソウドウの近く | `stay.picks.airbnbs.5.area` |
| missing | 6 |  | `stay.picks.airbnbs.5.sleeps` |
| missing | ~$460 |  | `stay.picks.airbnbs.5.price` |
|  | Very close to the venue, not close to a station | 会場のすぐ近く、駅からは離れています | `stay.picks.airbnbs.5.note` |
| missing | https://www.airbnb.com.au/rooms/15104813 |  | `stay.picks.airbnbs.5.href` |
|  | Sanjo | 三条 | `stay.picks.airbnbs.6.area` |
| missing | 9 |  | `stay.picks.airbnbs.6.sleeps` |
| missing | ~$660 |  | `stay.picks.airbnbs.6.price` |
| missing |  |  | `stay.picks.airbnbs.6.note` |
| missing | https://www.airbnb.com.au/rooms/1456233517873267728 |  | `stay.picks.airbnbs.6.href` |

## Our story and the map

| | English | Japanese | Key |
|---|---|---|---|
|  | Griffin and Nadia smiling on a hill above Kyoto, autumn trees behind them | 京都の丘で微笑むグリフィンとナディア。後ろには秋の木々 | `photos.couple-kyoto-view.alt` |
|  | Kyoto, where it all started | すべてが始まった京都 | `photos.couple-kyoto-view.caption` |
|  | Griffin and Nadia in a lantern-lit Kyoto lane at night | 夜の京都、提灯の灯る小路に立つグリフィンとナディア | `photos.kyoto-night.alt` |
|  | Kyoto, where it all started | すべてが始まった京都 | `photos.kyoto-night.caption` |
|  | Griffin and Nadia in a lantern-lit lane at night | 夜の提灯の灯る小路に立つグリフィンとナディア | `photos.couple-night-lane-2.alt` |
|  | Back in Kyoto | ふたたび京都へ | `photos.couple-night-lane-2.caption` |
|  | Griffin and Nadia at a market in Brisbane | ブリスベンの市場にいるグリフィンとナディア | `photos.couple-brisbane-market.alt` |
|  | Where it all started | すべてが始まった場所 | `photos.couple-brisbane-market.caption` |
|  | Griffin and Nadia with a dog in a jumper | セーターを着た犬とグリフィンとナディア | `photos.couple-dog-jumper.alt` |
|  | A fun one | お気に入りの一枚 | `photos.couple-dog-jumper.caption` |
|  | Griffin and Nadia with family in a mountain town | 山あいの町で家族とグリフィンとナディア | `photos.trio-mountain-town.alt` |
|  | A trip with family | 家族との旅 | `photos.trio-mountain-town.caption` |
|  | A red torii gate in the mist | 霧の中の赤い鳥居 | `photos.torii-mist.alt` |
|  | Misty torii on the way | 道すがらの霧の鳥居 | `photos.torii-mist.caption` |
|  | Griffin among tall cedar trees | 杉の大木の間に立つグリフィン | `photos.griffin-cedar-forest.alt` |
|  | Griffin in the cedars | 杉林のグリフィン | `photos.griffin-cedar-forest.caption` |
|  | Nadia as a little girl in the back seat of a car, in a cap, smiling | 幼い頃のナディア。帽子をかぶって車の後部座席で笑っている | `photos.kid-nadia.alt` |
|  |  |  | `photos.kid-nadia.caption` |
|  | Griffin and Nadia in front of Osaka Castle | 大阪城の前に立つグリフィンとナディア | `photos.couple-osaka-castle.alt` |
|  | If you fly into Osaka, the castle's worth a stop | 大阪に着くなら、お城も立ち寄る価値あり | `photos.couple-osaka-castle.caption` |
|  | Looking down Shijo-dori from the gate of Yasaka Shrine | 八坂神社の門から四条通を見下ろす | `photos.yasaka-gate-shijo.alt` |
|  | Looking down Shijo-dori from Yasaka Shrine, 10 minutes' walk from the venue | 八坂神社から四条通を望む。会場から徒歩10分 | `photos.yasaka-gate-shijo.caption` |
|  | A quiet street and bookshop in Higashiyama | 東山の静かな通りと本屋 | `photos.higashiyama-bookshop.alt` |
|  | Higashiyama, the venue's neighbourhood. Kiyomizu-dera is up the hill | 会場のある東山。坂を上れば清水寺 | `photos.higashiyama-bookshop.caption` |
|  | Umbrellas under red maple leaves in the rain | 雨の中、赤い紅葉の下の傘 | `photos.umbrellas-maple-rain.alt` |
|  | Pack a compact umbrella, October can be wet | 折りたたみ傘をひとつ。10月は雨の日もあります | `photos.umbrellas-maple-rain.caption` |
|  | Lanterns along Pontocho alley at night | 夜の先斗町に並ぶ提灯 | `photos.pontocho-lanterns.alt` |
|  | Pontocho, ten minutes from the venue | 先斗町、会場から10分 | `photos.pontocho-lanterns.caption` |
|  | A deer resting on moss in Nara | 奈良の苔の上で休む鹿 | `photos.nara-deer-moss.alt` |
|  | Nara is 45 minutes away. Mind your snacks | 奈良は45分ほど。おやつにご注意 | `photos.nara-deer-moss.caption` |
|  | Two deer nuzzling in Nara | 奈良で寄り添う2頭の鹿 | `photos.nara-deer-nuzzle.alt` |
|  | We can't wait to see you | お会いできるのを楽しみにしています | `photos.nara-deer-nuzzle.caption` |
|  | A stone lantern framed by maple leaves | 紅葉に囲まれた石灯籠 | `photos.stone-lantern-maple.alt` |
|  |  |  | `photos.stone-lantern-maple.caption` |
|  | Our story | ふたりのこと | `story.title` |
|  | Previous chapter | 前の章 | `story.prevChapter` |
|  | Next chapter | 次の章 | `story.nextChapter` |
|  | Chapter {1} of {2} | 第{1}章（全{2}章） | `story.page` |
|  | {1} of {2} | {2}枚中{1}枚目 | `story.slide` |
|  | Kyoto | 京都 | `story.kyoto` |
|  | Brisbane | ブリスベン | `story.brisbane` |
|  | Canada | カナダ | `story.canada` |
|  | See as a list | リストで見る | `story.seeList` |
|  | See the map | 地図で見る | `story.seeMap` |
|  | Next | 次へ | `story.next` |
|  | Done | 閉じる | `story.done` |
|  | Flying from? | どちらから来られますか？ | `flying.title` |
|  | Where are you flying from? | どちらから来られますか？ | `flying.endTitle` |
|  | Optional. We only ever show how many, never who. | 任意です。人数のみ表示し、お名前は表示しません。 | `flying.hint` |
|  | Thanks, got it. | ありがとうございます。 | `flying.thanks` |
|  | From {2} | {2}から | `flying.yours` |
|  | Change | 変更 | `flying.change` |
|  | Type to find your city | 都市名を入力して探す | `flying.placeholder` |
|  | Nothing matches. Try Somewhere else. | 見つかりません。「その他」を選んでください。 | `flying.noMatch` |
|  | Your journey | 旅の道のり | `journey.title` |
|  | A small map with your line from {1} to Kyoto | {1}から京都までのあなたの線を描いた小さな地図 | `journey.map` |
|  | Flying from | 出発地 | `journey.review` |
|  | Not saying | 未回答 | `journey.notSaying` |
|  | Your line's on the map | あなたの線が地図に加わりました | `journey.onMap` |
|  | Pick a city | 都市を選ぶ | `journey.pick` |
|  | Kyoto · 15 Oct 2027 | 京都・2027年10月15日 | `journey.kyoto` |
|  | Brisbane | ブリスベン | `journey.brisbane` |
|  | Canada | カナダ | `journey.canada` |
|  | Nadia | ナディア | `journey.legend.nadia` |
|  | Griffin | グリフィン | `journey.legend.griffin` |
|  | Guests | ゲスト | `journey.legend.guests` |
|  | Your line | あなたの線 | `journey.legend.you` |
|  | {1} of {2} lines drawn so far | {2}本中{1}本の線が描かれました | `journey.count` |
|  | See as a list | リストで見る | `journey.seeList` |
|  | See the map | 地図で見る | `journey.seeMap` |
|  | Nadia: Brisbane to Kyoto | ナディア：ブリスベンから京都へ | `journey.list.nadia` |
|  | Griffin: Canada to Kyoto | グリフィン：カナダから京都へ | `journey.list.griffin` |
|  | Your line: {1} to Kyoto | あなたの線：{1}から京都へ | `journey.list.you` |
|  | {1}: {2} lines | {1}：{2}本 | `journey.list.city` |

## FAQs

| | English | Japanese | Key |
|---|---|---|---|
|  | FAQs | よくある質問 | `qa.title` |
| **changed** | What should I wear? | 服装は？ | `qa.items.0.q` |
| **changed** | There's no dress code. Wear what makes you feel your best. The streets around the venue are cobblestone, so bring shoes you can walk in. | ドレスコードはありません。いちばん自分らしくいられる服装で。会場周辺は石畳なので、歩きやすい靴でどうぞ。 | `qa.items.0.a` |
| **changed** | Do I need a visa? | ビザは必要ですか？ | `qa.items.1.q` |
| **changed** | Aussies don't need a visa for a short trip to Japan. Check your passport has at least 6 months left after you fly home. Travel has the rest. | オーストラリア国籍の方は、短期の日本滞在にビザは不要です。帰国日から6か月以上の有効期限があるか、パスポートを確認してください。くわしくは「アクセス」のページへ。 | `qa.items.1.a` |
| **changed** | Can I bring someone? | 同伴者を連れていけますか？ | `qa.items.2.q` |
| **changed** | Your invite is for the people named on it. If there's room for a plus one, your reply will ask "Bringing someone?". Not sure? Message us, or email griffinandnadia@gmail.com. | 招待状はお名前のある方へのものです。お連れの方の枠がある場合は、お返事の中で「お連れの方はいらっしゃいますか？」とお聞きします。不明な点は、メッセージか griffinandnadia@gmail.com までどうぞ。 | `qa.items.2.a` |
| **changed** | Gifts? | ご祝儀やプレゼントは？ | `qa.items.3.q` |
| **changed** | No gifts, truly. Getting to Kyoto is a big ask already, so you being there is the present. | 本当に不要です。京都まで来ていただくこと自体が大変なので、お越しいただくことが何よりの贈り物です。 | `qa.items.3.a` |
| **changed** | What about food? | お食事は？ | `qa.items.4.q` |
| **changed** | Lunch is catered, and we'll set the menu a few months before. Tell us about any dietary needs in your reply. | 昼食をご用意します。メニューは数か月前に決めます。食事の制限やアレルギーは、お返事でお知らせください。 | `qa.items.4.a` |
|  | Is it a traditional Japanese wedding? | 日本の伝統的な結婚式ですか？ | `qa.items.5.q` |
|  | No, it's a relaxed garden wedding with a few Japanese touches. Nothing to learn, just come as you are. | いいえ、日本らしさを少し添えた、くつろいだガーデンウェディングです。覚えることは何もありません。そのままの姿でお越しください。 | `qa.items.5.a` |
| **new** | What happens to my details? | 個人情報はどうなりますか？ | `qa.items.6.q` |
| **new** | Your reply goes straight to us and no one else will see it. We'll delete it a few months after the wedding. | お返事は私たちにだけ届き、ほかの人が見ることはありません。結婚式の数か月後に削除します。 | `qa.items.6.a` |
| **new** | Who made this site? | このサイトはどなたが作ったのですか？ | `qa.items.7.q` |
| **new** | Nadia's brother Jehan designed and built it, with Nadia's drawings and our photos. Music: “A Town With an Ocean View” (Joe Hisaishi). | ナディアの兄のジェハンがデザインと制作をしました。絵はナディア、写真はわたしたちのものです。音楽：「A Town With an Ocean View」（久石譲） | `qa.items.7.a` |
|  | On the day, contact | 当日の連絡先： | `qa.onTheDay` |
|  | Any questions at all, message either of us. We're always happy to help. | ご不明な点があれば、どちらにでもお気軽にご連絡ください。 | `qa.contact` |

## Reply (RSVP), fortune

| | English | Japanese | Key |
|---|---|---|---|
|  | A little fortune for the trip | 旅のささやかなおみくじ | `fortune.title` |
|  | Draw one | ひく | `fortune.draw` |
|  | 大吉 | 大吉 | `fortune.blessing` |
|  | Great blessing | 大吉 | `fortune.blessingEn` |
|  | No. {1} of {2} | 第{1}番（全{2}番） | `fortune.number` |
|  | Save to my phone | スマホに保存 | `fortune.save` |
|  | Copied. Paste it into your notes. | コピーしました。メモに貼り付けてください。 | `fortune.copied` |
|  | Tap the box to draw one. | 箱をタップしてひいてください。 | `fortune.hint` |
|  | Tap the box, or give your phone a little shake. | 箱をタップするか、スマホを軽く振ってください。 | `fortune.hintShake` |
|  | The fortune box. Draw a fortune | おみくじの箱。おみくじをひく | `fortune.boxLabel` |
|  | Shaking the box… | 箱を振っています… | `fortune.drawing` |
|  | See your line on the map | 地図であなたの線を見る | `fortune.onMap` |
|  | Step {1} of 3 | ステップ {1}/3 | `rsvp.step` |
|  | Who's coming? | どなたが出席されますか？ | `rsvp.whoTitle` |
|  | Coming | 出席 | `rsvp.coming` |
|  | Can't make it | 欠席 | `rsvp.notComing` |
|  | Food and a song | お食事と一曲 | `rsvp.foodTitle` |
|  | Anything to tell us? | ほかに伝えておきたいことは？ | `rsvp.noteTitle` |
|  | Any dietary needs? | 食事の制限やアレルギーはありますか？ | `rsvp.dietary` |
|  | Vegetarian | ベジタリアン | `rsvp.dietaryOptions.0` |
|  | Vegan | ヴィーガン | `rsvp.dietaryOptions.1` |
|  | Gluten free | グルテンフリー | `rsvp.dietaryOptions.2` |
|  | Dairy free | 乳製品不可 | `rsvp.dietaryOptions.3` |
|  | Halal | ハラール | `rsvp.dietaryOptions.4` |
|  | Kosher | コーシャ | `rsvp.dietaryOptions.5` |
|  | Nut allergy | ナッツアレルギー | `rsvp.dietaryOptions.6` |
|  | Shellfish allergy | 甲殻類アレルギー | `rsvp.dietaryOptions.7` |
|  | Egg allergy | 卵アレルギー | `rsvp.dietaryOptions.8` |
|  | Other | その他 | `rsvp.dietaryOptions.9` |
|  | Tell us more (optional) | 詳しく教えてください（任意） | `rsvp.dietaryOther` |
|  | Choose coming or can't make it for {1}. | {1}さんの出席・欠席を選んでください。 | `rsvp.answerMissing` |
|  | Close | 閉じる | `rsvp.close` |
|  | A song for the dance floor? | ダンスでかけたい一曲は？ | `rsvp.song` |
|  | Search by song or artist, or just type it | 曲名かアーティスト名で検索するか、そのまま入力してください | `rsvp.songHint` |
|  | Searching… | 検索中… | `rsvp.searching` |
|  | Search | 検索 | `rsvp.searchSong` |
|  | Use what I typed | 入力したとおりに使う | `rsvp.useTyped` |
|  | {1} found | {1}件見つかりました | `rsvp.songResults` |
|  | {1} results | {1}件の候補 | `rsvp.listResults` |
|  | Change | 変更 | `rsvp.changeSong` |
|  | Nothing matched. Add "{1}" as you typed it | 見つかりませんでした。「{1}」をそのまま追加 | `rsvp.noMatch` |
|  | Search isn't working right now. Just type it in. | 検索が今うまく動いていません。そのまま入力してください。 | `rsvp.searchError` |
|  | Remove {1} | {1}を削除 | `rsvp.removeSong` |
|  | {1} songs added. Remove one to change it. | {1}曲追加済みです。変更するには1曲削除してください。 | `rsvp.songsFull` |
|  | Your songs | 選んだ曲 | `rsvp.songsAdded` |
|  | Edit {1} | {1}を編集 | `rsvp.edit` |
|  | No message | メッセージなし | `rsvp.noMessage` |
|  | Search for a song | 曲を検索 | `rsvp.songPlaceholder` |
|  | Arriving | 到着日 | `rsvp.arrival` |
|  | Leaving | 出発日 | `rsvp.departure` |
|  | Not booked yet? Add these later. | まだ予約していなければ、あとで追加できます。 | `rsvp.datesHint` |
|  | Pick dates between Wed 1 Sep 2027 and Tue 30 Nov 2027. | 2027年9月1日（水）から2027年11月30日（火）の間で選んでください。 | `rsvp.dateRange` |
|  | Pick a leaving date on or after your arrival. | 出発日は到着日以降を選んでください。 | `rsvp.dateOrder` |
|  | Anything else? (optional) | ほかに何かあれば（任意） | `rsvp.message` |
|  | All good? | これでよろしいですか？ | `rsvp.checkTitle` |
|  | Send our reply | お返事を送る | `rsvp.send` |
|  | Next | 次へ | `rsvp.next` |
|  | Back | 戻る | `rsvp.back` |
|  | Bringing someone? | お連れの方はいらっしゃいますか？ | `rsvp.bringing` |
|  | Their name | お名前 | `rsvp.plusOne` |
|  | Your plus one | お連れの方 | `rsvp.plusOneName` |
|  | not set | 未設定 | `rsvp.notSet` |
|  | {1} to {2} | {1}〜{2} | `rsvp.stayLine.both` |
|  | From {1}, leaving date to come | {1}から（出発日は未定） | `rsvp.stayLine.from` |
|  | Leaving {1}, arrival date to come | {1}まで（到着日は未定） | `rsvp.stayLine.until` |
|  | Songs | 曲 | `rsvp.songs` |
|  | Message | メッセージ | `rsvp.messageLabel` |
|  | Dates | 日程 | `rsvp.dates` |
|  | None yet | まだありません | `rsvp.noSongs` |
|  | You're all set | 準備はばっちりです | `rsvp.doneTitle.all` |
|  | Thanks for letting us know | ご連絡ありがとうございます | `rsvp.doneTitle.none` |
|  | Thanks, got it | 承りました | `rsvp.doneTitle.mixed` |
|  | Back to your invite | 招待状に戻る | `rsvp.backHome` |
|  | Sent. You can change your reply until Fri 30 Apr 2027. | 送信しました。2027年4月30日（金）まで、お返事は変更できます。 | `rsvp.sentLine` |
|  | Updated. You can change your reply until Fri 30 Apr 2027. | 更新しました。2027年4月30日（金）まで、お返事は変更できます。 | `rsvp.updatedLine` |
|  | Sending… | 送信中… | `rsvp.savingQuiet` |
|  | Saved on this phone. It'll send when you're back online. | この端末に保存しました。オンラインに戻ったら送信します。 | `rsvp.savedOffline` |
|  | Change my reply | お返事を変更する | `rsvp.changeReply` |
|  | Leave it blank if you're not sure yet. | まだ決まっていなければ、空欄のままで大丈夫です。 | `rsvp.plusOneHint` |
|  | You're offline. We'll send it when you're back. | オフラインです。接続が戻ったら送信します。 | `rsvp.offline` |
|  | We've emailed you a copy. | 控えをメールでお送りしました。 | `rsvp.doneBodyEmail` |
|  | Come back here any time to change it. | 変更はいつでもここからできます。 | `rsvp.doneBodyNoEmail` |
|  | Replies are closed now. Message Griffin or Nadia. | お返事の受付は終了しました。グリフィンかナディアにご連絡ください。 | `rsvp.errors.closed` |
|  | We couldn't send that just now. Your answers are still here, so try again. | 今は送信できませんでした。入力内容は残っていますので、もう一度お試しください。 | `rsvp.errors.busy` |
|  | We couldn't get through. Check your connection and try again. | 接続できませんでした。通信環境を確認して、もう一度お試しください。 | `rsvp.errors.network` |
|  | We couldn't find this invite. Message Griffin or Nadia. | この招待状が見つかりませんでした。グリフィンかナディアにご連絡ください。 | `rsvp.errors.not_found` |
|  | Replies are paused for a moment, try again later. | お返事の受付を少しお休みしています。時間をおいて、もう一度お試しください。 | `rsvp.errors.paused` |
|  | We couldn't send that. Your answers are still here, so try again, or message Griffin or Nadia. | 送信できませんでした。入力内容は残っていますので、もう一度お試しいただくか、グリフィンかナディアにご連絡ください。 | `rsvp.errors.other` |
|  | Try again | もう一度 | `rsvp.tryAgain` |
|  | Happy for photos with you in them to be shared with other guests | 自分が写った写真を、ほかのゲストと共有してもよい | `rsvp.photos` |
|  | Only Griffin and Nadia see your reply. | お返事は、グリフィンとナディアだけが見ます。 | `rsvp.privacy` |

## Placeholders

| | English | Japanese | Key |
|---|---|---|---|
| placeholder | We're still writing this part in our own words. Check back closer to the day. | この章は、わたしたちの言葉でまだ書いているところです。もう少しお待ちください。 | `placeholders.story.chapterBody` |
| placeholder | A photo of Griffin as a kid, on its way | グリフィンの子どもの頃の写真（準備中） | `placeholders.story.kidGriffin` |
| placeholder | A photo to come | 写真は準備中です | `placeholders.photo.toCome` |
| placeholder | We'll add who to call on the day closer to the time. | 当日の連絡先は、日が近づいたらここに載せます。 | `placeholders.faqs.contactDay` |

