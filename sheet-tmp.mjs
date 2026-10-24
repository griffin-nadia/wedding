import { chromium } from "@playwright/test"
import fs from "node:fs"
const [out, w, ...files] = process.argv.slice(2)
const html = `<body style="margin:0;background:#fff;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:6px;padding:6px;align-items:start">${files.map((f) => `<figure style="margin:0"><img src="file://${f}" style="height:${w}px;border:1px solid #ccc"><figcaption>${f.split("/").pop()}</figcaption></figure>`).join("")}</body>`
fs.writeFileSync(`${out}.html`, html)
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1800, height: 600 } })
await p.goto(`file://${out}.html`); await p.waitForTimeout(800); await p.screenshot({ path: `${out}.png`, fullPage: true }); await b.close()
