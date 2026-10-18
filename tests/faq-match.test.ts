// Ask us: "Is this it?" finds the FAQs a question is close to, in English and Japanese (final run)
import { test } from "node:test"
import assert from "node:assert/strict"
import { matchFaqs } from "../src/lib/faq-match.ts"

const items = [
  { q: "What should I wear?", a: "Smart casual. The garden paths are stone, so comfortable shoes." },
  { q: "Do I need a visa?", a: "Australians don't need one for a short visit. Check your passport has six months left." },
  { q: "Can I bring someone?", a: "Your invite says who's invited. If there's a plus one, it shows in your reply." },
  { q: "どの服装がいいですか？", a: "スマートカジュアルでどうぞ。会場周辺は石畳なので、歩きやすい靴で。" },
]
test("finds what it's close to, typos and all", () => {
  assert.deepEqual(matchFaqs(items, "what shoes should I wear")[0], 0)
  assert.deepEqual(matchFaqs(items, "do i need a vissa")[0], 1)
  assert.deepEqual(matchFaqs(items, "passport")[0], 1)
  assert.deepEqual(matchFaqs(items, "bring my partner")[0], 2)
})
test("Japanese, and nothing for nothing", () => {
  assert.deepEqual(matchFaqs(items, "服装は？")[0], 3)
  assert.deepEqual(matchFaqs(items, "is there parking for bikes"), [])
  assert.deepEqual(matchFaqs(items, "hi"), [])
})
