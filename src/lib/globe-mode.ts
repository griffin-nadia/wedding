/** Globe or flat map: no WebGL, a low-end phone, or reduced data starts flat */
export function startsFlat() {
  try {
    if (!document.createElement("canvas").getContext("webgl2")) return true
    const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    // Under 4 cores (some browsers report 4 whatever the phone, and CI runners have 4): only truly small devices
    return (n.hardwareConcurrency ?? 8) < 4 || (n.deviceMemory ?? 8) <= 2 || Boolean(n.connection?.saveData)
  } catch { return true }
}
