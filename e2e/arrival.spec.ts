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
