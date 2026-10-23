import { test, expect } from "@playwright/test"

// 18f: Travel's sub-tab strip never cuts a link at a hard edge, and on "Around the venue" no label sits on the river,
// a route, a leaf or another label
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
})

test("the jump links: the active one in full, soft fades where more links are past the edge", async ({ page }) => {
  await page.goto("travel?h=sample#before")
  await page.waitForTimeout(800)
  const strip = page.locator(".jump-links ul")
  const r = await strip.evaluate((ul) => {
    const a = ul.querySelector("[aria-current]")!.getBoundingClientRect(), u = ul.getBoundingClientRect()
    const css = getComputedStyle(ul)
    return { inside: a.left >= u.left - 1 && a.right <= u.right + 1, mask: css.maskImage || css.webkitMaskImage, overflow: ul.scrollWidth > ul.clientWidth, left: ul.hasAttribute("data-more-left"), right: ul.hasAttribute("data-more-right"), scrolled: ul.scrollLeft }
  })
  expect(r.inside).toBe(true)
  expect(r.mask).toContain("linear-gradient")
  if (r.overflow) expect(r.left || r.right).toBe(true)
  expect(r.left).toBe(r.scrolled > 2)
})

test("around the venue: no label overlaps the river, a route, a leaf or another label", async ({ page }) => {
  await page.goto("travel?h=sample#around")
  // The old drawn map only shows with Nadia's map switched off (config.venueMap, on since run 26)
  await page.waitForLoadState("networkidle")
  test.skip(await page.locator(".vmap").count() > 0, "Nadia's venue map is on")
  const map = page.locator(".kmap")
  await map.scrollIntoViewIfNeeded()
  for (const name of ["The Sodoh", "Kyoto Station", "Gion-Shijo Station", "Yasaka Pagoda"]) {
    await map.getByRole("button", { name: new RegExp(name) }).click()
    const hits = await page.evaluate(() => {
      const box = (e: Element) => e.getBoundingClientRect()
      const over = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1
      const tags = [...document.querySelectorAll(".kmap-tag")].map(box).filter((r) => r.width > 2)
      const things = [...document.querySelectorAll(".kmap-leaf, .kmap-river-label")].map(box)
      // The river and the routes, sampled along their length
      const paths = [...document.querySelectorAll<SVGPathElement>(".kmap-river, .kmap-route")].flatMap((p) => {
        const m = p.getScreenCTM()!, n = p.getTotalLength(), pts: DOMRect[] = []
        for (let i = 0; i <= 60; i++) { const q = p.getPointAtLength((n * i) / 60).matrixTransform(m); pts.push(new DOMRect(q.x - 1, q.y - 1, 2, 2)) }
        return pts
      })
      let n = 0
      tags.forEach((t, i) => { n += [...things, ...paths].filter((b) => over(t, b)).length; n += tags.filter((u, j) => j > i && over(t, u)).length })
      return n
    })
    expect(hits, name).toBe(0)
  }
})

// Run 19: a tapped sub-tab lands its section just under the stuck tab row (8px of air), the tab in the strip's view;
// a row opened low on the card glides up just far enough to show its header and the top of its answer (FAQs too)
test("taps land in the right place: sections under the tab row, opened rows on screen", async ({ page }) => {
  await page.goto("travel?h=sample"); await page.locator(".jump-link").first().waitFor()
  for (const id of ["on-the-day", "stay", "before", "to-kyoto"]) {
    await page.locator(`.jump-link[href="#${id}"]`).click()
    await expect.poll(() => page.evaluate((id) => {
      const row = document.querySelector(".jump-links")!.getBoundingClientRect(), sec = document.getElementById(id)!.getBoundingClientRect()
      const ul = document.querySelector(".jump-links ul")!.getBoundingClientRect(), a = document.querySelector(`.jump-link[href="#${id}"]`)!
      const ar = a.getBoundingClientRect()
      return { gap: Math.round(sec.top - row.bottom), current: a.hasAttribute("aria-current"), inView: ar.left >= ul.left - 1 && ar.right <= ul.right + 1 }
    }, id), id).toEqual({ gap: 8, current: true, inView: true })
  }
  for (const [url, sel] of [["travel?h=sample", "#medicines"], ["faqs?h=sample", "#q6"]]) {
    await page.goto(url)
    const trigger = page.locator(`${sel} [data-slot=accordion-trigger]`)
    await trigger.waitFor()
    // The row's header right at the bottom of the card
    await trigger.evaluate((t) => { const s = t.closest(".letter-scroll")!; s.scrollTop += t.getBoundingClientRect().bottom - s.getBoundingClientRect().bottom + 4 })
    await trigger.click()
    await expect.poll(() => trigger.evaluate((t) => {
      const s = t.closest(".letter-scroll")!.getBoundingClientRect(), r = t.getBoundingClientRect()
      const c = t.closest("[data-slot=accordion-item]")!.querySelector("[data-slot=accordion-content]")!.getBoundingClientRect()
      const top = document.querySelector(".jump-links[data-stuck]")?.getBoundingClientRect().bottom ?? s.top
      return r.top >= top && s.bottom - c.top >= Math.min(c.height, 120)
    }), sel).toBe(true)
  }
})
