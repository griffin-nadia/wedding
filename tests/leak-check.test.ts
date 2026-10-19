// Run 20: the build's leak check catches what it's for, and lets the site's own contact and /exec address through
import { test } from "node:test"
import assert from "node:assert/strict"
import { textLeaks, imageInfo } from "../scripts/leak-check.mjs"

test("emails, Google ids, test tokens and private/ paths are caught", () => {
  assert.deepEqual(textLeaks('a("someone@gmail.com") https://docs.google.com/spreadsheets/d/1abc/edit ?h=test6 "../private/x.png"').length, 4)
})
test("the site's own contact, the calendar id, the /exec address and package versions are fine", () => {
  assert.deepEqual(textLeaks("mailto:griffinandnadia@gmail.com UID:nadia-griffin-2027@griffin-nadia.github.io https://script.google.com/macros/s/AKfyc_x-1/exec react@18.3.1 /__private/song.mp3"), [])
})
test("image headers: size and metadata read without an image library", () => {
  const png = Buffer.alloc(64); png.write("\x89PNG\r\n\x1a\n", 0, "latin1"); png.writeUInt32BE(13, 8); png.write("IHDR", 12); png.writeUInt32BE(3000, 16); png.writeUInt32BE(2000, 20)
  assert.deepEqual(imageInfo(png, "png"), { w: 3000, h: 2000, meta: false })
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10]), Buffer.from("Exif\0\0", "latin1"), Buffer.alloc(8), Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x00, 0x02, 0x00])])
  assert.deepEqual(imageInfo(jpg, "jpg"), { w: 512, h: 256, meta: true })
})
