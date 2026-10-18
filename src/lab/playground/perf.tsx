/**
 * The performance badge (lab run 19): measured by scripts/lab-perf.mjs, a Playwright trace of each experiment on a
 * throttled phone (Pixel 7 profile, CPU 4× slower, Lighthouse's mobile network (1.6 Mbps, 150 ms)), against the lab build. fps over the
 * experiment's own motion, long tasks over 50 ms, and the extra code it loads on demand (gzip, beyond the lab's frame).
 */
import perf from "../perf.json"

export type Perf = { fps: number; longTasks: number; longestMs: number; kb?: number }
const PERF = perf as { measured?: string; profile?: string; entries?: Record<string, Perf>; baselines?: Record<string, Perf> }
export const perfOf = (id: string) => PERF.entries?.[id]
/** What a number means against its baseline (perf.json's baselines, measured the same way) */
const NOTE: Record<string, (b: Record<string, Perf>) => string> = {
  "journey-globe-styles": (b) => `The test browser draws WebGL in software, so any globe is slow here: the site's own globe measures ${b["site-globe"]?.fps ?? "?"} fps the same way. See-through watercolour draws the sphere twice.`,
  "arrival-framing": () => "The long task is the live site starting up in each of the four frames, not the experiment.",
  "paper-light": (b) => `The long task is the theme change itself: with the sweep off it's ${b["sweep-off"]?.longestMs ?? "?"} ms too. The sweep adds nothing measurable.`,
}

export function PerfBadge({ id }: { id: string }) {
  const p = perfOf(id)
  if (!p) return <p className="lab-perf text-small text-muted-foreground">Not measured yet (node scripts/lab-perf.mjs).</p>
  const ok = p.fps >= 55 && p.longTasks === 0 && (p.kb ?? 0) < 2048
  return (
    <p className="lab-perf text-small" data-ok={ok || undefined} title={`${PERF.profile ?? "throttled phone"}, ${PERF.measured ?? ""}`}>
      <span className="numerals">{p.fps} fps</span>
      <span className="numerals">{p.longTasks} long {p.longTasks === 1 ? "task" : "tasks"}{p.longTasks ? ` (${p.longestMs} ms)` : ""}</span>
      <span className="numerals">{p.kb} KB</span>
      <span className="sr-only">{ok ? "Within the budget" : "Over the budget"}</span>
      {NOTE[id] && <small className="basis-full text-muted-foreground">{NOTE[id](PERF.baselines ?? {})}</small>}
    </p>
  )
}
