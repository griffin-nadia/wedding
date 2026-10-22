const KANJI = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
/** 1 → 一, 12 → 十二, 25 → 二十五: an omikuji slip's number (第七番), 1 to 99 */
export const kanjiNumber = (n: number) => `${n >= 20 ? KANJI[Math.floor(n / 10)] : ""}${n >= 10 ? "十" : ""}${KANJI[n % 10]}`
