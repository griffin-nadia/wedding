import { test, expect } from "@playwright/test"

test.use({ reducedMotion: "no-preference" })

// 18e: one calm "Open your invite" button under a floating envelope, which never offers its picture on a long press
test("the arrival: a real Open button, no long-press save, and the float pauses where it is on opening", async ({ page }) => {
  await page.goto("?h=sample")
  const label = page.getByRole("button", { name: "Open your invite" })
  await expect(label).toBeVisible()
  const env = await page.evaluate(() => {
    const e = document.querySelector(".envelope")!
    return {
      inLink: !!e.closest("a"),
      draggable: [...e.querySelectorAll("img")].every((i) => i.getAttribute("draggable") === "false"),
      callout: getComputedStyle(e).getPropertyValue("-webkit-touch-callout") || "none",
      select: getComputedStyle(e).userSelect,
      floating: getComputedStyle(document.querySelector(".envelope-float")!).animationName,
    }
  })
  expect(env).toEqual({ inLink: false, draggable: true, callout: "none", select: "none", floating: "envelope-float" })
  // The envelope sits below the middle of the screen, the label under it
  const [e, l, h] = await page.evaluate(() => [document.querySelector(".envelope")!.getBoundingClientRect().top, document.querySelector(".arrival-open")!.getBoundingClientRect().top, innerHeight])
  expect(e).toBeGreaterThan(h * 0.3)
  expect(l).toBeGreaterThan(e)
  await label.click()
  await expect(page.locator(".envelope-float")).toHaveCSS("animation-play-state", "paused")
  await expect(page.locator("#letter")).toBeFocused({ timeout: 3000 })
})

// 18f: in Lantern the letter rising out of the envelope is the night letter from its first frame (walnut paper,
// cream names); the "&" is the brand sage in both themes, on the envelope's letter and on Home
for (const theme of ["autumn", "lantern"] as const) test(`the envelope's letter in ${theme}: the theme's paper from the start, a sage "&"`, async ({ page }) => {
  await page.addInitScript((t) => { localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t) }, theme)
  await page.goto("?h=sample")
  await expect(page.getByRole("button", { name: "Open your invite" })).toBeVisible()
  const look = () => page.evaluate(() => {
    const css = (s: string) => getComputedStyle(document.querySelector(s)!)
    return { bg: css(".envelope-paper").backgroundColor, ink: css(".envelope-paper .names-art-ink").backgroundColor, amp: css(".envelope-paper .names-art-amp").backgroundColor }
  })
  const before = await look()
  const sage = theme === "lantern" ? "rgb(157, 176, 138)" : "oklch(0.502 0.074 123.8)" // Lantern's sage is #9db08a (polish.css)
  expect(before.amp).toBe(sage)
  if (theme === "lantern") {
    expect(before.bg).toBe("oklch(0.245 0.034 49)") // walnut, the night letter
    expect(before.ink).toBe("oklch(0.932 0.03 80.7)") // cream lettering
  }
  await page.getByRole("button", { name: "Open your invite" }).click()
  await page.waitForTimeout(150)
  expect((await look()).bg).toBe(before.bg) // the same paper while it opens: nothing swaps mid-way
  await expect(page.locator("#letter .names-art-amp").first()).toBeVisible({ timeout: 5000 })
  expect(await page.locator("#letter .names-art-amp").first().evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(sage)
})
