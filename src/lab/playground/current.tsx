// The lab's own pages: under the lab's path when it's built into the site (vite.config.ts, LAB_PATH), else beside it
const labBase = import.meta.env.VITE_LAB_BASE || import.meta.env.BASE_URL

/**
 * The site as it is today, for the "current" experiments: the real pages (lab-frame.html, layout A) at a path, full
 * size inside the experiment's frame, so it can be compared against the alternatives at the same size and speed.
 */
export function CurrentSite({ path = "/", title }: { path?: string; title: string }) {
  return <iframe title={title} src={`${labBase}lab-frame.html?layout=A&h=sample&path=${encodeURIComponent(path)}`} style={{ display: "block", width: "100%", height: "100svh", border: 0 }} />
}
