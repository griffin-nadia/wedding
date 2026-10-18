// Dietary needs round-trip as words in English and Japanese, Other keeps what they typed, old answers still read.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { dietString, parseDiet, OTHER_MAX } from "../src/lib/diet.ts"
import { JA_TO_READ, PENDING } from "../src/content/pending.ts"

const en = ["Vegetarian", "Vegan", "Gluten free", "Dairy free", "Halal", "Kosher", "Nut allergy", "Shellfish allergy", "Egg allergy", "Other"]
const ja = ["ベジタリアン", "ヴィーガン", "グルテンフリー", "乳製品不可", "ハラール", "コーシャ", "ナッツアレルギー", "甲殻類アレルギー", "卵アレルギー", "その他"]

test("every combination of picks, with and without Other words, round-trips in both languages", () => {
  for (const options of [en, ja]) {
    const other = options[options.length - 1]
    for (const picked of [[], [other], [options[0], other], [options[6]], options.slice()]) for (const words of ["", "kiwi, no coriander"]) {
      const saved = dietString({ picked, other: words }, options)
      const back = parseDiet(saved, options)
      assert.deepEqual(back.picked, picked, saved)
      assert.equal(back.other, picked.includes(other) ? words.replace(",", "") : "", saved)
    }
  }
})
test("nothing picked saves as None; only Other with no words saves as Other", () => {
  assert.equal(dietString({ picked: [], other: "" }, en), "None")
  assert.equal(dietString({ picked: ["Other"], other: "" }, en), "Other")
  assert.equal(dietString({ picked: ["その他"], other: "キウイ" }, ja), "その他: キウイ")
})
test("older answers still read", () => {
  assert.deepEqual(parseDiet("Allergy: Peanuts / Sesame", en), { picked: ["Nut allergy", "Other"], other: "Sesame" })
  assert.deepEqual(parseDiet("Other: kiwi", en), { picked: ["Other"], other: "kiwi" })
  assert.deepEqual(parseDiet("None", en), { picked: [], other: "" })
})
test("Other words stop short of the back end's 200-character limit", () => {
  const long = "x".repeat(300)
  assert.ok(dietString({ picked: en.slice(), other: long }, en).length <= 200)
  assert.equal(parseDiet(`Other: ${long}`, en).other.length, OTHER_MAX)
})
test("every Japanese line waiting for a native read is the one on the site", () => {
  // the music credit lives with the song; run 19's FAQ answers are placeholders, so their Japanese is in PENDING
  const file = fs.readFileSync("src/content/ja.ts", "utf8") + fs.readFileSync("src/lib/art.ts", "utf8") + Object.values(PENDING).map((v) => v.ja).join("\n")
  for (const { key, ja } of JA_TO_READ) assert.ok(file.includes(ja), `${key} not found in ja.ts, art.ts or PENDING as written`)
})
