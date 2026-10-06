// The first listed value of every option is what ships, and OPTION_DEFAULTS must say the same,
// or the lab switch silently does nothing (the faq and tilt bug fixed in #22).
import { test } from "node:test"
import assert from "node:assert/strict"
import { OPTIONS } from "../src/tune/options.ts"
import { OPTION_DEFAULTS } from "../src/tune/store.ts"

test("every option's stored default is its first listed value", () => {
  for (const o of OPTIONS) assert.equal(OPTION_DEFAULTS[o.key], o.values[0][0], `${o.key}: default "${OPTION_DEFAULTS[o.key]}", first value "${o.values[0][0]}"`)
})
