/** Copies text, with an old-school fallback for browsers that block the clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch { /* try the fallback */ }
  try {
    const el = document.createElement("textarea")
    el.value = text; el.setAttribute("readonly", ""); el.style.position = "fixed"; el.style.opacity = "0"
    document.body.appendChild(el); el.select()
    const ok = document.execCommand("copy")
    el.remove()
    return ok
  } catch {
    return false
  }
}
