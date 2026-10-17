import { lazy } from "react"
import type { Entry } from "../../types"

/** FAQs: ways to answer a question the list doesn't */
export const entries: Entry[] = [
  {
    id: "faqs-ask-us", title: "Ask us (FAQ answer box, no AI)",
    summary: "Type a question and the closest FAQs answer it, by plain word matching. Nothing close: a short message to Griffin and Nadia instead.",
    refs: [{ label: "WAI-ARIA APG live regions", href: "https://www.w3.org/WAI/ARIA/apg/practices/structural-roles/" }],
    promote: "The answer box is a few lines and costs nothing on phones. The message needs a back-end action that emails the couple through the existing queue (and a rate limit). A chatbot that reads the planner was the other idea: not recommended, because it can say things that aren't true about their day, and the FAQs plus this box cover the questions guests actually ask. Needs N&G's yes before anything goes live.",
    Component: lazy(() => import("./faqs-ask-us")),
  },
]
