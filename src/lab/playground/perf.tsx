/**
 * The performance badge (lab run 19): measured by scripts/lab-perf.mjs, a Playwright trace of each experiment on a
 * throttled phone (Pixel 7 profile, CPU 4× slower, a fast 3G-ish network), against the lab build. fps over the
 * experiment's own motion, long tasks over 50 ms, and the extra code it loads on demand (gzip, beyond the lab's frame).
 */
import perf from "../perf.json"

export type Perf = { fps: number; longTasks: number; longestMs: number; kb: number; note?: string }
const PERF = perf as { measured?: string; profile?: string; entries?: Record<string, Perf> }
export const perfOf = (id: string) => PERF.entries?.[id]

export function PerfBadge({ id }: { id: string }) {
  const p = perfOf(id)
  if (!p) return <p className="lab-perf text-small text-muted-foreground">Not measured yet (node scripts/lab-perf.mjs).</p>
  const ok = p.fps >= 55 && p.longTasks === 0 && p.kb < 2048
  return (
    <p className="lab-perf text-small" data-ok={ok || undefined} title={`${PERF.profile ?? "throttled phone"}, ${PERF.measured ?? ""}`}>
      <span className="numerals">{p.fps} fps</span>
      <span className="numerals">{p.longTasks} long {p.longTasks === 1 ? "task" : "tasks"}{p.longTasks ? ` (${p.longestMs} ms)` : ""}</span>
      <span className="numerals">{p.kb} KB</span>
      <span className="sr-only">{ok ? "Within the budget" : "Over the budget"}</span>
    </p>
  )
}
