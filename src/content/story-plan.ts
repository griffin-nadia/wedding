import type { Chapter } from "@/lib/content"
import { KYOTO, PLACES } from "@/lib/journey"

/**
 * Crew preview only: Our story as the planner's Photos + story tab lays it out (16 Oct), so crew can walk the whole
 * flow before the Content tab has their words. Titles are their working titles, years and places are theirs, and
 * the lines stay empty (tagged) until they write them. Guests never see this list.
 */
export const STORY_PLAN: Chapter[] = [
  { key: "plan-1", year: "2017", title: "Became friends", place: "Kansai Gaidai, Hirakata", photo: "story-1", at: [124, 122], body: [] },
  { key: "plan-2", year: "2018", title: "Griffin in Aus (internship)", place: "Australia", photo: "story-2", at: [150, 262], body: [] },
  { key: "plan-3", year: "2018", title: "Nadia visits Canada (dating)", place: "Canada", photo: "story-3", at: PLACES.canada, body: [] },
  { key: "plan-4", year: "2018–2019", title: "Back to Japan", place: "Japan", photo: "story-4", at: PLACES.japan, body: [] },
  { key: "plan-5", year: "2020", title: "Nadia moves to Canada", place: "Canada", photo: "story-5", at: PLACES.canada, body: [] },
  { key: "plan-6", year: "2020", title: "Living in Edmonton", place: "Edmonton, Canada", photo: "story-6", at: [300, 36], body: [] },
  { key: "plan-7", year: "2024", title: "Canada visit", place: "Canada", photo: "story-7", at: PLACES.canada, body: [] },
  { key: "plan-8", year: "2025", title: "Living in Aus", place: "Australia", photo: "story-8", at: PLACES.brisbane, body: [] },
  { key: "plan-end", year: "2027", title: "And then, Kyoto", place: "Kyoto", at: KYOTO, body: ["Fri 15 Oct 2027 · The Sodoh Higashiyama"] },
]
