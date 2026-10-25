/**
 * One request to the back end, with errors sorted into codes the pages can word calmly.
 * Kept free of imports so tests can run it under plain Node (tests/paused.test.ts).
 */

/** Error codes from the back end, plus "network" when it couldn't be reached at all, and "paused" when Google
 * answers but the script doesn't (locked or suspended, as in October 2026: a Google page instead of our JSON). */
export type ErrorCode =
  | "bad_request" | "not_found" | "bad_guest" | "bad_attending" | "bad_date"
  | "closed" | "busy" | "server" | "network" | "bad_email" | "paused"

export class ApiError extends Error {
  code: ErrorCode
  constructor(code: ErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

/** Busy, a dropped connection or a hiccup are worth another try; a paused script isn't (it's out for days). */
export const isRetryable = (code: ErrorCode) => code === "busy" || code === "network" || code === "server"

const offline = () => typeof navigator !== "undefined" && navigator.onLine === false

/** Google answers, just not with our CORS JSON: an opaque no-cors request still gets a response. */
async function googleAnswers(input: string) {
  try { await fetch(input.split("?")[0], { mode: "no-cors" }); return true } catch { return false }
}

export async function call(input: string, init?: RequestInit) {
  let res: Response
  try {
    res = await fetch(input, init)
  } catch {
    // A locked script's error page has no CORS header, so the browser reports it like a dropped connection
    throw new ApiError(!offline() && (await googleAnswers(input)) ? "paused" : "network")
  }
  if (!res.ok) throw new ApiError(res.status >= 500 ? "server" : [401, 403, 404, 410, 423].includes(res.status) ? "paused" : "network")
  let data
  try {
    data = await res.json()
  } catch {
    // A 200 that isn't JSON is Google's own page (sign-in, "unavailable"), not our script
    throw new ApiError("paused")
  }
  // A link the back end no longer knows (replaced in the sheet while this page was open, as with the test links on
  // 25 Oct 2026): tell the page, which swaps to "That link doesn't look right" and its email-me-my-link form, instead
  // of every step failing one by one
  if (data && data.ok === false && data.code === "not_found" && sentToken(input, init) && typeof window !== "undefined") {
    window.dispatchEvent(new Event(LINK_GONE))
  }
  return data
}

/** The event the household listens for when the back end stops knowing this link. */
export const LINK_GONE = "ng-link-gone"

/** Whether a request carried an invite link (a token in the query or the posted body). */
function sentToken(input: string, init?: RequestInit) {
  if (/[?&]token=[^&]/.test(input)) return true
  try { return typeof init?.body === "string" && Boolean(JSON.parse(init.body).token) } catch { return false }
}
