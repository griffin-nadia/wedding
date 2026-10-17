import type { Chapter } from "@/lib/content"
import { KYOTO, PLACES } from "@/lib/journey"
import { onMap } from "@/lib/map-land"

/**
 * Our story as the planner's Photos + story tab lays it out (16 Oct), shown to everyone until the Content tab has
 * their words. Nadia's Figma order (17 Oct): the photos on stops 2 and 3 swapped, and on the last two photo stops
 * (Canada visit, Living in Australia); Living in Edmonton taken out. Years and titles stay in date order. Titles are their working titles, years and places are theirs; the empty lines show the placeholder
 * from pending.ts (story.chapterBody) until they write them.
 */
export const STORY_PLAN: Chapter[] = [
  { key: "plan-1", year: "2017", title: "Became friends", place: "Kansai Gaidai, Hirakata", photo: "story-1", at: onMap("JP", 34.81, 135.65), body: [] },
  { key: "plan-2", year: "2018", title: "Griffin's internship in Australia", place: "Australia", photo: "story-3", at: onMap("AU", -25.5, 134), body: [] },
  { key: "plan-3", year: "2018", title: "Nadia visits Canada", place: "Canada", photo: "story-2", at: PLACES.canada, body: [] },
  { key: "plan-4", year: "2018–2019", title: "Back to Japan", place: "Japan", photo: "story-4", at: PLACES.japan, body: [] },
  { key: "plan-5", year: "2020", title: "Nadia moves to Canada", place: "Canada", photo: "story-5", at: PLACES.canada, body: [] },
  { key: "plan-6", year: "2024", title: "Canada visit", place: "Canada", photo: "story-8", at: PLACES.canada, body: [] },
  { key: "plan-7", year: "2025", title: "Living in Australia", place: "Australia", photo: "story-7", at: PLACES.brisbane, body: [] },
  { key: "plan-end", year: "2027", title: "And then, Kyoto", place: "Kyoto", at: KYOTO, body: ["Fri 15 Oct 2027 · The Sodoh Higashiyama"] },
]
